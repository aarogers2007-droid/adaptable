import { createClient } from "@/lib/supabase/server";
import { streamMessage } from "@/lib/ai";
import { generatePersonas } from "@/lib/customer-personas";
import { moderateContent } from "@/lib/content-moderation";
import { moderateOutput } from "@/lib/output-moderation";
import type { Profile } from "@/lib/types";

export async function POST(request: Request) {
  // CSRF protection
  const { validateOrigin } = await import("@/lib/csrf");
  if (!validateOrigin(request)) {
    console.error("[customer-interview] CSRF blocked request");
    return Response.json({ error: "Request blocked. Please refresh the page and try again." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Rate limiting
  const { data: profile2 } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = (profile2 as { role: string } | null)?.role === "org_admin";
  if (!isAdmin) {
    const { data: allowed } = await supabase.rpc("reserve_ai_usage", {
      p_student_id: user.id,
      p_feature: "customer_interview",
    });
    if (!allowed) {
      return Response.json(
        { error: "You've reached your message limit. Take a break and come back later!" },
        { status: 429 }
      );
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const { message, personaId, conversationHistory } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0 || message.length > 2000) {
    return new Response("Invalid message", { status: 400 });
  }

  // Content moderation (regex)
  const modResult = moderateContent(message);
  if (!modResult.safe) {
    return Response.json({ error: modResult.reason }, { status: 400 });
  }

  // ML moderation (catches what regex misses)
  const { moderateContentML } = await import("@/lib/ml-moderation");
  const mlCheck = await moderateContentML(message);
  if (!mlCheck.safe) {
    return Response.json({ error: "That message couldn't be sent. Try rephrasing." }, { status: 400 });
  }

  // Crisis detection (non-blocking, runs in parallel with response)
  const { detectCrisisUniversal } = await import("@/lib/crisis-detection");
  detectCrisisUniversal(message).then(async (crisisCheck) => {
    if (!crisisCheck.detected) return;
    const { alertCrisis } = await import("@/lib/teacher-alerts");
    await alertCrisis(supabase, user.id, crisisCheck.type ?? "hopelessness", crisisCheck.matchedPattern ?? "", message, "customer-interview");
  }).catch(() => {});

  if (!personaId || typeof personaId !== "string") {
    return new Response("Missing personaId", { status: 400 });
  }

  // Get profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("business_idea, full_name, org_id")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Pick<Profile, "business_idea" | "full_name"> | null;
  if (!profileData?.org_id) {
    return new Response("Account not configured", { status: 403 });
  }
  if (!profile?.business_idea) {
    return new Response("Complete onboarding first", { status: 400 });
  }

  // Get the persona
  const personas = generatePersonas(profile.business_idea.niche, profile.business_idea.target_customer);
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) {
    return new Response("Invalid persona", { status: 400 });
  }

  // Validate and sanitize conversation history from client
  const rawHistory = Array.isArray(conversationHistory) ? conversationHistory : [];
  const history: { role: "user" | "assistant"; content: string }[] = [];
  for (const entry of rawHistory.slice(-10)) {
    if (
      entry &&
      typeof entry === "object" &&
      (entry.role === "user" || entry.role === "assistant") &&
      typeof entry.content === "string" &&
      entry.content.length <= 4000
    ) {
      // Moderate historical user messages to prevent injected content
      if (entry.role === "user") {
        const histCheck = moderateContent(entry.content);
        if (!histCheck.safe) continue; // skip flagged entries
      }
      history.push({ role: entry.role, content: entry.content });
    }
  }

  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history,
    { role: "user", content: message },
  ];

  try {
    const stream = await streamMessage({
      feature: "guide",
      systemPrompt: persona.systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";
    const { createStreamScrubber } = await import("@/lib/output-moderation");
    const scrubber = createStreamScrubber();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              fullResponse += event.delta.text;
              const safeChunk = scrubber.push(event.delta.text);
              if (safeChunk) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: safeChunk })}\n\n`));
              }
            }
          }
          const finalChunk = scrubber.flush();
          if (finalChunk) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: finalChunk })}\n\n`));
          }

          // Output moderation
          const outputCheck = moderateOutput(fullResponse);
          if (!outputCheck.safe) {
            console.warn("[customer-interview] Output flagged:", outputCheck.reason);
            // Fire teacher alert for flagged AI output
            import("@/lib/teacher-alerts").then(({ alertContentFlag }) =>
              alertContentFlag(supabase, user.id, `AI output flagged in interview (${outputCheck.reason}): ${outputCheck.flagged_content}`, "ai_output", "customer-interview")
            ).catch(() => {});
          }

          // Log usage with flywheel columns
          const finalMessage = await stream.finalMessage();
          try {
            await supabase.from("ai_usage_log").insert({
              student_id: user.id,
              org_id: (profileData as Record<string, unknown>)?.org_id ?? null,
              feature: "customer_interview",
              model: "claude-sonnet-4-6",
              input_tokens: finalMessage.usage.input_tokens,
              output_tokens: finalMessage.usage.output_tokens,
              estimated_cost_usd: (() => {
                  const usage = finalMessage.usage;
                  const cr = (usage as unknown as Record<string, number>).cache_read_input_tokens ?? 0;
                  const cc = (usage as unknown as Record<string, number>).cache_creation_input_tokens ?? 0;
                  const fresh = usage.input_tokens - cr - cc;
                  return (fresh * 3 + cr * 0.3 + cc * 3.75 + usage.output_tokens * 15) / 1_000_000;
                })(),
              response_length: fullResponse.length,
            });
          } catch (err: unknown) {
            console.error("[customer-interview] usage log failed:", err);
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Something went wrong." })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return Response.json({ error: "Interview unavailable right now." }, { status: 503 });
  }
}
