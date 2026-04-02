import { createClient } from "@/lib/supabase/server";
import { streamMessage } from "@/lib/ai";
import type { Profile } from "@/lib/types";

/**
 * AI Guide streaming endpoint.
 * Route Handler (not Server Action) for streaming support.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { message, conversationId } = await request.json();

  if (!message || typeof message !== "string" || message.length > 5000) {
    return new Response("Missing or invalid message (max 5000 characters)", { status: 400 });
  }

  // Validate conversationId format if provided
  if (conversationId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
    return new Response("Invalid conversation ID", { status: 400 });
  }

  // Check daily cap (20 messages)
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("ai_usage_log")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .eq("feature", "guide")
    .gte("created_at", `${today}T00:00:00Z`);

  if ((count ?? 0) >= 20) {
    return Response.json(
      { error: "You've reached today's limit of 20 messages. Come back tomorrow!" },
      { status: 429 }
    );
  }

  // Get profile for context
  const { data: profileData } = await supabase
    .from("profiles")
    .select("business_idea, full_name")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Pick<Profile, "business_idea" | "full_name"> | null;

  // Build context
  const businessContext = profile?.business_idea
    ? `The student's business: "${profile.business_idea.name}" — ${profile.business_idea.niche} for ${profile.business_idea.target_customer}. Revenue model: ${profile.business_idea.revenue_model}.`
    : "The student hasn't created a business idea yet.";

  // Get conversation history
  let messages: { role: "user" | "assistant"; content: string }[] = [];

  if (conversationId) {
    const { data: convo } = await supabase
      .from("ai_conversations")
      .select("messages")
      .eq("id", conversationId)
      .eq("student_id", user.id)
      .single();

    if (convo?.messages) {
      messages = (convo.messages as { role: "user" | "assistant"; content: string }[]).slice(-10);
    }
  }

  messages.push({ role: "user", content: message });

  const systemPrompt = `You are an AI guide helping a student build their business. Be encouraging, specific, and practical. Keep responses concise (2-3 paragraphs max). Reference their specific business when relevant.

${businessContext}

The student's name is ${profile?.full_name || "there"}.`;

  try {
    const stream = await streamMessage({
      feature: "guide",
      systemPrompt,
      messages,
    });

    // Log usage after stream completes (we estimate tokens)
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const text = event.delta.text;
              fullResponse += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          // Save conversation
          const allMessages = [...messages, { role: "assistant" as const, content: fullResponse }];

          if (conversationId) {
            await supabase
              .from("ai_conversations")
              .update({
                messages: allMessages,
                message_count: allMessages.length,
              })
              .eq("id", conversationId)
              .eq("student_id", user.id); // ownership check
          } else {
            const { data: newConvo } = await supabase
              .from("ai_conversations")
              .insert({
                student_id: user.id,
                messages: allMessages,
                message_count: allMessages.length,
                context_snapshot: profile?.business_idea ?? null,
              })
              .select("id")
              .single();

            if (newConvo) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ conversationId: newConvo.id })}\n\n`)
              );
            }
          }

          // Log usage
          const finalMessage = await stream.finalMessage();
          await supabase.from("ai_usage_log").insert({
            student_id: user.id,
            feature: "guide",
            model: "claude-sonnet-4-20250514",
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
            estimated_cost_usd:
              (finalMessage.usage.input_tokens * 3 + finalMessage.usage.output_tokens * 15) / 1_000_000,
          });

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Something went wrong. Try again." })}\n\n`)
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
    return Response.json(
      { error: "AI guide is temporarily unavailable. Try again in a moment." },
      { status: 503 }
    );
  }
}
