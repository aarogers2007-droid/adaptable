import { createAdminClient } from "@/lib/supabase/admin";
import { streamMessage, type CacheableTextBlock } from "@/lib/ai";
import { validateOrigin } from "@/lib/csrf";
import { moderateContent } from "@/lib/content-moderation";
import { createStreamScrubber } from "@/lib/output-moderation";
import { BRAIN_MENTOR_PROMPT, formatFramework, type FrameworkRow } from "@/lib/brain-mentor";
import { createHash } from "crypto";

// Larry's Brain lesson mentor. Adult, neutral, self-discovery. Grounded in the
// framework for the requested lesson, pulled from the org-isolated knowledge_base
// (Factual Floor — teaches only Larry's material). Preview-mode: scoped to the
// Larry's Brain org, public + rate-limited like /ask. Production will add auth +
// My Journey personalization.
const LARRY_ORG = "7857e627-6e92-4a07-b19f-dbf25e9b6ce8";
const BRAIN_MODEL = "claude-sonnet-4-6";
const TAG_RE = /^[a-z0-9-]{3,60}$/;

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  if (process.env.BRAIN_CHAT_ENABLED === "false") {
    return new Response("Temporarily unavailable", { status: 503 });
  }
  if (!validateOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: { message?: unknown; sessionId?: unknown; history?: unknown; lessonTag?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { message, sessionId, history, lessonTag } = body;

  if (!message || typeof message !== "string" || !message.trim() || message.length > 2000) {
    return new Response("Invalid message", { status: 400 });
  }
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
    return new Response("Invalid session", { status: 400 });
  }
  if (!lessonTag || typeof lessonTag !== "string" || !TAG_RE.test(lessonTag)) {
    return new Response("Invalid lesson", { status: 400 });
  }

  // Input moderation (adult audience — no crisis detection, standard moderation).
  const check = moderateContent(message);
  if (!check.safe) {
    return Response.json(
      { error: "Let's keep this on the lesson. What's on your mind about it?" },
      { status: 400 }
    );
  }

  // Rate limit — atomic, fails closed.
  const { headers } = await import("next/headers");
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipSalt =
    process.env.ASK_IP_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "ask-rate-limit";
  const ipHash = createHash("sha256").update(`${ipSalt}:brain:${ip}`).digest("hex");

  const admin = createAdminClient();
  const { data: gate, error: gateError } = await admin.rpc("reserve_ask_usage", {
    p_ip_hash: ipHash,
    p_session_id: sessionId,
  });
  if (gateError) {
    console.error("[brain-chat] reserve_ask_usage error:", gateError.message);
    return new Response("Service temporarily unavailable", { status: 503 });
  }
  if (gate !== "ok") {
    return Response.json(
      { error: "That's a lot for one sitting — come back to it when you're ready.", capped: true },
      { status: 429 }
    );
  }

  // Retrieve the framework for this lesson from the org-isolated knowledge base.
  const { data: kbRows, error: kbError } = await admin
    .from("knowledge_base")
    .select("title, topic, key_principles, quotes, student_friendly_summary, concrete_examples")
    .eq("org_id", LARRY_ORG)
    .eq("verified", true)
    .overlaps("lesson_tags", [lessonTag])
    .limit(3);
  if (kbError) {
    console.error("[brain-chat] knowledge fetch error:", kbError.message);
    return new Response("Service temporarily unavailable", { status: 503 });
  }
  const frameworkContext = formatFramework((kbRows ?? []) as FrameworkRow[]);
  if (!frameworkContext) {
    return Response.json(
      { error: "This lesson isn't ready yet." },
      { status: 404 }
    );
  }

  const priorMsgs: ChatTurn[] = Array.isArray(history)
    ? (history as unknown[])
        .filter(
          (m): m is ChatTurn =>
            !!m &&
            typeof m === "object" &&
            ((m as ChatTurn).role === "user" || (m as ChatTurn).role === "assistant") &&
            typeof (m as ChatTurn).content === "string"
        )
        .slice(-10)
    : [];
  const messages: ChatTurn[] = [...priorMsgs, { role: "user", content: message }];

  const systemBlocks: CacheableTextBlock[] = [
    { type: "text", text: BRAIN_MENTOR_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: frameworkContext, cache_control: { type: "ephemeral" } },
  ];

  let stream;
  try {
    stream = await streamMessage({
      feature: "brainchat",
      systemPrompt: systemBlocks,
      messages,
      modelOverride: BRAIN_MODEL,
    });
  } catch (e) {
    console.error("[brain-chat] stream start failed:", e);
    return new Response("Service temporarily unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();
  let fullResponse = "";
  const scrubber = createStreamScrubber();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullResponse += event.delta.text;
            const safe = scrubber.push(event.delta.text);
            if (safe) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: safe })}\n\n`));
          }
        }
        const finalChunk = scrubber.flush();
        if (finalChunk) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: finalChunk })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (e) {
        console.error("[brain-chat] stream error:", e);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Lost my train of thought — say that again?" })}\n\n`)
        );
      } finally {
        controller.close();
      }

      // Usage logging — fire-and-forget, Larry's org, real token counts + cost.
      try {
        const final = await stream.finalMessage();
        const usage = final.usage as unknown as Record<string, number>;
        const cacheRead = usage.cache_read_input_tokens ?? 0;
        const cacheCreate = usage.cache_creation_input_tokens ?? 0;
        const freshInput = final.usage.input_tokens - cacheRead - cacheCreate;
        const estimatedCost =
          (freshInput * 3 + cacheRead * 0.3 + cacheCreate * 3.75 + final.usage.output_tokens * 15) /
          1_000_000;
        await admin
          .from("ai_usage_log")
          .insert({
            student_id: null,
            org_id: LARRY_ORG,
            feature: "brainchat",
            model: BRAIN_MODEL,
            input_tokens: final.usage.input_tokens,
            output_tokens: final.usage.output_tokens,
            estimated_cost_usd: estimatedCost,
            cache_read_tokens: cacheRead || null,
            cache_write_tokens: cacheCreate || null,
            response_length: fullResponse.length,
            prompt_length:
              BRAIN_MENTOR_PROMPT.length +
              frameworkContext.length +
              messages.reduce((s, m) => s + m.content.length, 0),
          })
          .then(({ error }) => {
            if (error) console.error("[brain-chat] usage log failed:", error.message);
          });
      } catch (e) {
        console.error("[brain-chat] usage log error:", e);
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
