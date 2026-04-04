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

  // Combined daily cap (shared across guide + lesson chat): 40/day, 10/hour
  const today = new Date().toISOString().split("T")[0];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [{ count }, { count: hourlyCount }] = await Promise.all([
    supabase
      .from("ai_usage_log")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id)
      .gte("created_at", `${today}T00:00:00Z`),
    supabase
      .from("ai_usage_log")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id)
      .gte("created_at", oneHourAgo),
  ]);

  if ((hourlyCount ?? 0) >= 10) {
    return Response.json(
      { error: "Take a breather! You can continue in a few minutes." },
      { status: 429 }
    );
  }

  if ((count ?? 0) >= 40) {
    return Response.json(
      { error: "You've hit today's limit. Great work! Come back tomorrow." },
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

  // Retrieve relevant knowledge base content
  let knowledgeContext = "";
  try {
    const { data: kbResults } = await supabase
      .from("knowledge_base")
      .select("title, key_principles, concrete_examples, quotes, student_friendly_summary")
      .limit(2);

    if (kbResults && kbResults.length > 0) {
      knowledgeContext = "\n\nREFERENCE KNOWLEDGE (use these real examples and principles in your answers):\n" +
        kbResults.map((kb) => {
          const principles = (kb.key_principles as { principle: string; explanation: string }[])
            .slice(0, 3)
            .map((p) => `- ${p.principle}: ${p.explanation}`)
            .join("\n");
          const examples = (kb.concrete_examples as { example: string; lesson: string }[])
            .slice(0, 2)
            .map((e) => `- ${e.example}: ${e.lesson}`)
            .join("\n");
          return `## ${kb.title}\n${principles}\n${examples}`;
        }).join("\n\n");
    }
  } catch {
    // Knowledge base not available, continue without it
  }

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

  const systemPrompt = `You are a friendly, conversational AI mentor helping a teenager design their first venture. Think of yourself as their co-founder in a venture studio. They're planning and preparing to launch a real business. Talk like a smart older friend who's been through it, not a textbook or a search engine.

CONVERSATION STYLE:
- When a student asks a broad question, ask 2-3 short clarifying questions first. Then give a focused answer.
- Keep responses SHORT. 2-4 sentences. Never more than one short paragraph unless they ask to go deeper.
- Use "you" and "your." Reference their business by name.
- One real example per response max. Tell it like a story.
- MIRROR their communication register. If they use slang, be less formal. If they write formally, match precision. If they code-switch languages, acknowledge both warmly. Never implicitly correct their dialect.
- If a response is brief but contains the core idea, acknowledge and move on. Only push for elaboration when the CONCEPT is missing, not just the explanation.
- If they apologize for their English or show ESL patterns, simplify vocabulary, avoid idioms, use shorter sentences.
- If a response sounds AI-generated (overly formal, business jargon a teen wouldn't use, "burgeoning," "artisanal"), call it out: "That sounds like ChatGPT. What do YOU actually think?"
- Vary cultural references. Not just Warby Parker and Airbnb. Use Fenty Beauty, local taco trucks, teen Depop sellers when relevant.

CREATIVE MINDSET:
You don't just teach business strategy. You inspire creative thinking. Draw from Rick Rubin's philosophy when it fits: start before you're ready, constraints are the path not the obstacle, subtract instead of add, ship imperfect work and iterate, creativity is a practice not a talent. When a student is stuck or overthinking, channel Rubin: "What if you stripped this down to the one thing that matters?" When they doubt themselves: "Rick Rubin started Def Jam from a dorm room with $5K. You don't need permission." Don't force it. Just let the creative philosophy inform your energy.

KNOWLEDGE:
You have a curated knowledge base from Harvard, Y Combinator, Rick Rubin, and real entrepreneurs. Use it to inform your thinking, but don't regurgitate it. Weave in ONE relevant example or quote naturally when it fits, like "Warby Parker had the same problem, they..." — not a bullet-pointed research report.

${businessContext}

The student's name is ${profile?.full_name || "there"}. Use their first name.${knowledgeContext}`;

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
