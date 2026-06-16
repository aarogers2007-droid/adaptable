import { createAdminClient } from "@/lib/supabase/admin";
import { streamMessage, type CacheableTextBlock } from "@/lib/ai";
import { validateOrigin } from "@/lib/csrf";
import { moderateAjInput, createAjStreamScrubber } from "@/lib/aj-moderation";
import { AJ_SYSTEM_PROMPT } from "@/lib/aj-brain";
import { redactSecrets } from "@/lib/ask-brain";
import { createHash } from "crypto";

// Public, unauthenticated AI endpoint for the founder chat at the bottom of
// /assessment. Disclosed AI stand-in for AJ; the ONLY chat permitted casual
// profanity (caged in aj-moderation.ts — slurs/hate/explicit/threats still
// blocked on input and scrubbed from output, profanity flows through).
//
// Scoped to Adaptable org #0 for usage logging. Rate-limited and secrets-
// redacted exactly like /ask. No crisis detection (adult candidates).
const ADAPTABLE_ORG_ID = "00000000-0000-0000-0000-000000000001";
const AJ_MODEL = "claude-sonnet-4-6";

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  // Kill switch — set AJ_CHAT_ENABLED=false to take the endpoint offline.
  if (process.env.AJ_CHAT_ENABLED === "false") {
    return new Response("Temporarily unavailable", { status: 503 });
  }

  // CSRF (defense-in-depth; fails closed if NEXT_PUBLIC_SITE_URL is unset).
  if (!validateOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: { message?: unknown; sessionId?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { message, sessionId, history } = body;

  if (
    !message ||
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.length > 2000
  ) {
    return new Response("Invalid message", { status: 400 });
  }
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
    return new Response("Invalid session", { status: 400 });
  }

  // Input moderation — AJ's voice allows profanity, but slurs/hate/explicit/
  // threats and prompt injection are rejected (aj-moderation.ts, isolated).
  const check = moderateAjInput(message);
  if (!check.safe) {
    return Response.json(
      { error: check.reason ?? "Let's keep it real." },
      { status: 400 }
    );
  }

  // Rate limit — atomic, fails closed. Reuses the /ask limiter (per-session,
  // per-IP, global daily caps) so this public endpoint can't be abused.
  const { headers } = await import("next/headers");
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const ipSalt =
    process.env.ASK_IP_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "ask-rate-limit";
  const ipHash = createHash("sha256").update(`${ipSalt}:ajchat:${ip}`).digest("hex");

  const admin = createAdminClient();
  const { data: gate, error: gateError } = await admin.rpc("reserve_ask_usage", {
    p_ip_hash: ipHash,
    p_session_id: sessionId,
  });
  if (gateError) {
    console.error("[aj-chat] reserve_ask_usage error:", gateError.message);
    return new Response("Service temporarily unavailable", { status: 503 }); // fail closed
  }
  if (gate !== "ok") {
    return Response.json(
      {
        error:
          "That's a lot of ground for one sitting. Finish the rest of the page and we'll talk for real soon.",
        capped: true,
      },
      { status: 429 }
    );
  }

  // Build the conversation (last 10 turns of client history + new message).
  const priorMsgs: ChatTurn[] = Array.isArray(history)
    ? (history as unknown[])
        .filter(
          (m): m is ChatTurn =>
            !!m &&
            typeof m === "object" &&
            ((m as ChatTurn).role === "user" ||
              (m as ChatTurn).role === "assistant") &&
            typeof (m as ChatTurn).content === "string"
        )
        .slice(-10)
    : [];
  const messages: ChatTurn[] = [...priorMsgs, { role: "user", content: message }];

  const systemBlocks: CacheableTextBlock[] = [
    { type: "text", text: AJ_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
  ];

  let stream;
  try {
    stream = await streamMessage({
      feature: "ajchat",
      systemPrompt: systemBlocks,
      messages,
      modelOverride: AJ_MODEL,
    });
  } catch (e) {
    console.error("[aj-chat] stream start failed:", e);
    return new Response("Service temporarily unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();
  let fullResponse = "";
  // AJ-specific scrubber: lets profanity through, scrubs slurs/hate/explicit.
  const scrubber = createAjStreamScrubber();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullResponse += event.delta.text;
            const safe = scrubber.push(event.delta.text);
            if (safe) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: redactSecrets(safe) })}\n\n`
                )
              );
            }
          }
        }
        const finalChunk = scrubber.flush();
        if (finalChunk) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: redactSecrets(finalChunk) })}\n\n`
            )
          );
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (e) {
        console.error("[aj-chat] stream error:", e);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Lost my train of thought — say that again?" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }

      // Usage logging — fire-and-forget, org #0, real token counts + cost.
      try {
        const final = await stream.finalMessage();
        const usage = final.usage as unknown as Record<string, number>;
        const cacheRead = usage.cache_read_input_tokens ?? 0;
        const cacheCreate = usage.cache_creation_input_tokens ?? 0;
        const freshInput = final.usage.input_tokens - cacheRead - cacheCreate;
        // Sonnet rates (per 1M tokens): in 3, cache-read 0.3, cache-write 3.75, out 15.
        const estimatedCost =
          (freshInput * 3 +
            cacheRead * 0.3 +
            cacheCreate * 3.75 +
            final.usage.output_tokens * 15) /
          1_000_000;
        await admin
          .from("ai_usage_log")
          .insert({
            student_id: null,
            org_id: ADAPTABLE_ORG_ID,
            feature: "ajchat",
            model: AJ_MODEL,
            input_tokens: final.usage.input_tokens,
            output_tokens: final.usage.output_tokens,
            estimated_cost_usd: estimatedCost,
            cache_read_tokens: cacheRead || null,
            cache_write_tokens: cacheCreate || null,
            response_length: fullResponse.length,
            prompt_length:
              AJ_SYSTEM_PROMPT.length +
              messages.reduce((s, m) => s + m.content.length, 0),
          })
          .then(({ error }) => {
            if (error) console.error("[aj-chat] usage log failed:", error.message);
          });
      } catch (e) {
        console.error("[aj-chat] usage log error:", e);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
