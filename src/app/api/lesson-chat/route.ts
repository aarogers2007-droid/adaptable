import { createClient } from "@/lib/supabase/server";
import { streamMessage } from "@/lib/ai";
import { getLessonPlan } from "@/lib/lesson-plans";
import { learningProfilePrompt, type LearningProfile, DEFAULT_LEARNING_PROFILE } from "@/lib/learning-profile";
import type { Profile } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { message, lessonId, moduleSequence, lessonSequence, progressId } = await request.json();

  if (!message || typeof message !== "string" || message.length > 5000) {
    return new Response("Invalid message", { status: 400 });
  }

  // Get profile + learning profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("business_idea, full_name, ikigai_result")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Profile | null;
  if (!profile?.business_idea) {
    return new Response("Complete onboarding first", { status: 400 });
  }

  // Get lesson plan
  const plan = getLessonPlan(moduleSequence, lessonSequence);
  if (!plan) return new Response("Lesson plan not found", { status: 404 });

  // Get existing conversation from progress
  const { data: progressData } = await supabase
    .from("student_progress")
    .select("artifacts")
    .eq("id", progressId)
    .single();

  const artifacts = (progressData?.artifacts ?? {}) as Record<string, unknown>;
  const conversationHistory = (artifacts.conversation ?? []) as { role: string; content: string }[];
  const checkpointsReached = (artifacts.checkpoints_reached ?? []) as string[];
  const learningProfile = (artifacts.learning_profile ?? DEFAULT_LEARNING_PROFILE) as LearningProfile;

  // Build messages array
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...conversationHistory.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  // Personalize the plan's opener and checkpoints
  const personalize = (text: string) =>
    text
      .replace(/\{\{name\}\}/g, profile.full_name?.split(" ")[0] ?? "there")
      .replace(/\{\{niche\}\}/g, profile.business_idea!.niche)
      .replace(/\{\{business_name\}\}/g, profile.business_idea!.name)
      .replace(/\{\{target_customer\}\}/g, profile.business_idea!.target_customer);

  // Build checkpoint status for the AI
  const checkpointStatus = plan.checkpoints
    .map((cp) => {
      const reached = checkpointsReached.includes(cp.id);
      return `- [${reached ? "DONE" : "TODO"}] ${cp.concept}: ${personalize(cp.question)} (Mastery signal: ${cp.mastery_signal})`;
    })
    .join("\n");

  const nextCheckpoint = plan.checkpoints.find(
    (cp) => !checkpointsReached.includes(cp.id)
  );

  const allCheckpointsDone = plan.checkpoints.every(
    (cp) => checkpointsReached.includes(cp.id)
  );

  // Get relevant knowledge
  let knowledgeContext = "";
  try {
    const { data: kbResults } = await supabase
      .from("knowledge_base")
      .select("title, key_principles, concrete_examples, quotes, student_friendly_summary")
      .limit(1);

    if (kbResults?.[0]) {
      const kb = kbResults[0];
      const principles = (kb.key_principles as { principle: string; explanation: string }[])
        .slice(0, 2)
        .map((p) => `- ${p.principle}`)
        .join("\n");
      knowledgeContext = `\n\nKNOWLEDGE (weave in naturally, don't dump):\n${principles}`;
    }
  } catch { /* no knowledge base */ }

  const systemPrompt = `You are a conversational AI mentor teaching a teenager entrepreneurship through dialogue. You are NOT a textbook. You are a smart, encouraging friend who teaches by asking questions and building on what the student says.

LESSON: "${plan.title}"
OBJECTIVE: ${plan.objective}
STUDENT'S BUSINESS: "${profile.business_idea!.name}" — ${profile.business_idea!.niche} for ${profile.business_idea!.target_customer}
STUDENT NAME: ${profile.full_name?.split(" ")[0] ?? "there"}

CHECKPOINT STATUS:
${checkpointStatus}

${allCheckpointsDone ? "ALL CHECKPOINTS COMPLETE. Evaluate if the student has demonstrated mastery. If yes, end with exactly this marker on its own line: [LESSON_COMPLETE]" : `NEXT CHECKPOINT TO WORK TOWARD: ${nextCheckpoint ? personalize(nextCheckpoint.question) : "none"}`}

COMPLETION CRITERIA: ${plan.completion_criteria}

RULES:
- Keep responses to 2-4 sentences. This is a conversation, not a lecture.
- Ask ONE question at a time. Wait for the student to respond.
- When the student demonstrates understanding of a checkpoint concept, note it by including [CHECKPOINT:checkpoint_id] in your response (the student won't see this).
- If their response is vague, push back gently. "What do you mean by that? Give me a specific example."
- Reference their business by name. Make it personal.
- ONE real example per response max. Tell it like a story, don't list data.
- If all checkpoints are done AND the student has demonstrated mastery of the completion criteria, include [LESSON_COMPLETE] on its own line at the end.
- Adapt your tone based on how they respond. If they're brief and direct, be brief. If they're curious and exploratory, explore with them.

LEARNING STYLE ANALYSIS:
After each response, analyze the student's communication style and include a hidden tag:
[STYLE:direct|exploratory|cautious] [PACE:fast|moderate|slow] [DETAIL:concise|detailed]
Base this on their actual responses in this conversation, not assumptions.
${learningProfilePrompt(learningProfile)}${knowledgeContext}`;

  try {
    const stream = await streamMessage({
      feature: "guide",
      systemPrompt,
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

          // Parse hidden tags from response
          const newCheckpoints = [...checkpointsReached];
          const checkpointMatches = fullResponse.matchAll(/\[CHECKPOINT:(\S+)\]/g);
          for (const match of checkpointMatches) {
            if (!newCheckpoints.includes(match[1])) {
              newCheckpoints.push(match[1]);
            }
          }

          const lessonComplete = fullResponse.includes("[LESSON_COMPLETE]");

          // Parse learning style
          const styleMatch = fullResponse.match(/\[STYLE:(\w+)\]/);
          const paceMatch = fullResponse.match(/\[PACE:(\w+)\]/);
          const detailMatch = fullResponse.match(/\[DETAIL:(\w+)\]/);

          const updatedProfile: LearningProfile = {
            ...learningProfile,
            style: (styleMatch?.[1] as LearningProfile["style"]) ?? learningProfile.style,
            pace: (paceMatch?.[1] as LearningProfile["pace"]) ?? learningProfile.pace,
            detail_preference: (detailMatch?.[1] as LearningProfile["detail_preference"]) ?? learningProfile.detail_preference,
            updated_at: new Date().toISOString(),
          };

          // Clean response of hidden tags before saving
          const cleanResponse = fullResponse
            .replace(/\[CHECKPOINT:\S+\]/g, "")
            .replace(/\[LESSON_COMPLETE\]/g, "")
            .replace(/\[STYLE:\w+\]/g, "")
            .replace(/\[PACE:\w+\]/g, "")
            .replace(/\[DETAIL:\w+\]/g, "")
            .trim();

          // Save conversation + checkpoint progress
          const updatedConversation = [
            ...conversationHistory,
            { role: "user", content: message },
            { role: "assistant", content: cleanResponse },
          ];

          await supabase
            .from("student_progress")
            .update({
              artifacts: {
                ...artifacts,
                conversation: updatedConversation,
                checkpoints_reached: newCheckpoints,
                learning_profile: updatedProfile,
              },
              ...(lessonComplete
                ? { status: "completed", completed_at: new Date().toISOString() }
                : {}),
            })
            .eq("id", progressId)
            .eq("student_id", user.id);

          // Send completion and checkpoint info to client
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                meta: {
                  checkpoints_reached: newCheckpoints,
                  total_checkpoints: plan.checkpoints.length,
                  lesson_complete: lessonComplete,
                },
              })}\n\n`
            )
          );

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
    return Response.json({ error: "AI mentor unavailable right now." }, { status: 503 });
  }
}
