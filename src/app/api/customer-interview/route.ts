import { createClient } from "@/lib/supabase/server";
import { streamMessage } from "@/lib/ai";
import { generatePersonas } from "@/lib/customer-personas";
import type { Profile } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { message, personaId, conversationHistory } = await request.json();

  if (!message || typeof message !== "string" || message.length > 2000) {
    return new Response("Invalid message", { status: 400 });
  }

  if (!personaId || typeof personaId !== "string") {
    return new Response("Missing personaId", { status: 400 });
  }

  // Get profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("business_idea, full_name")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Pick<Profile, "business_idea" | "full_name"> | null;
  if (!profile?.business_idea) {
    return new Response("Complete onboarding first", { status: 400 });
  }

  // Get the persona
  const personas = generatePersonas(profile.business_idea.niche, profile.business_idea.target_customer);
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) {
    return new Response("Invalid persona", { status: 400 });
  }

  // Build conversation
  const history = (conversationHistory ?? []) as { role: "user" | "assistant"; content: string }[];
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history.slice(-10),
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

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              fullResponse += event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
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
