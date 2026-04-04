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

  if (!progressId || typeof progressId !== "string") {
    return new Response("Missing progressId", { status: 400 });
  }

  // Validate progressId belongs to this user
  const { data: progressCheck, error: progressError } = await supabase
    .from("student_progress")
    .select("id, lesson_id")
    .eq("id", progressId)
    .eq("student_id", user.id)
    .single();

  if (progressError || !progressCheck) {
    console.error("Progress validation failed:", progressError);
    return new Response("Invalid progress record", { status: 403 });
  }

  // Combined daily cap (shared across guide + lesson chat): 40 messages/day, 10/hour
  const today = new Date().toISOString().split("T")[0];
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [dailyRes, hourlyRes] = await Promise.all([
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
  const dailyCount = dailyRes.count ?? 0;
  const hourlyCount = hourlyRes.count ?? 0;

  if ((dailyCount ?? 0) >= 40) {
    return Response.json(
      { error: "You've hit today's limit. Great work! Come back tomorrow to keep going." },
      { status: 429 }
    );
  }

  if ((hourlyCount ?? 0) >= 10) {
    return Response.json(
      { error: "Take a breather! You can continue in a few minutes." },
      { status: 429 }
    );
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

  // CROSS-LESSON MEMORY: pull key decisions from all completed lessons
  let priorContext = "";
  try {
    const { data: allProgress } = await supabase
      .from("student_progress")
      .select("artifacts")
      .eq("student_id", user.id)
      .eq("status", "completed")
      .neq("id", progressId);

    if (allProgress && allProgress.length > 0) {
      const decisions = allProgress
        .filter((p) => p.artifacts && (p.artifacts as Record<string, unknown>).conversation)
        .map((p) => {
          const conv = (p.artifacts as Record<string, unknown>).conversation as { role: string; content: string }[];
          const studentResponses = conv
            .filter((m) => m.role === "user" && m.content.length > 30)
            .sort((a, b) => b.content.length - a.content.length)
            .slice(0, 2)
            .map((m) => m.content.slice(0, 200));
          if (studentResponses.length === 0) return null;
          return studentResponses.join(" | ");
        })
        .filter(Boolean);

      if (decisions.length > 0) {
        priorContext = `\n\nPRIOR DECISIONS (from earlier lessons — reference these, catch contradictions):\n${decisions.join("\n")}`;
      }
    }
  } catch {
    // Cross-lesson memory is optional, don't block the lesson
  }
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

  const systemPrompt = `You are a conversational AI mentor in a venture studio, helping a teenager design their business venture through dialogue. They are planning and preparing to launch, not running a live business yet. You are NOT a textbook. You are a smart, encouraging co-founder who teaches by asking questions and building on what the student says. Frame everything as designing, planning, and preparing their venture for launch.

LESSON: "${plan.title}"
OBJECTIVE: ${plan.objective}
STUDENT'S BUSINESS: "${profile.business_idea!.name}" — ${profile.business_idea!.niche} for ${profile.business_idea!.target_customer}
STUDENT NAME: ${profile.full_name?.split(" ")[0] ?? "there"}

CHECKPOINT STATUS:
${checkpointStatus}

${allCheckpointsDone ? "ALL CHECKPOINTS COMPLETE. Evaluate if the student has demonstrated mastery. If yes, end with exactly this marker on its own line: [LESSON_COMPLETE]" : `NEXT CHECKPOINT TO WORK TOWARD: ${nextCheckpoint ? personalize(nextCheckpoint.question) : "none"}`}

COMPLETION CRITERIA: ${plan.completion_criteria}

CREATIVE PHILOSOPHY:
Channel Rick Rubin's mindset when it fits naturally. Strip it down, start before you're ready, constraints are the path. Don't force it, just let it inform your energy.

LANGUAGE ADAPTATION (critical):
- MIRROR the student's communication register. If they use slang, be less formal. If they write academically, match their precision. If they code-switch between languages, acknowledge both warmly.
- NEVER implicitly correct a student's dialect or register. If they say "quality dont gotta cost all that," recognize that IS a brand positioning statement. Reflect their insight using THEIR words, not business jargon.
- If a student apologizes for their English or shows ESL patterns, simplify your vocabulary, avoid idioms and metaphors, use shorter sentences. NEVER correct their grammar.
- If a student writes in a mix of English and another language, that's natural and welcome. You can acknowledge it: "love how you put that" — but don't translate it.

BREVITY vs VAGUENESS (critical):
- A short response that contains the core concept is NOT vague. "nails. 16. goes to my school." contains a target customer. Acknowledge it and move on.
- ONLY push for elaboration when the CONCEPT ITSELF is missing, not when the EXPLANATION is brief.
- If a student communicates in 2-5 words consistently, that is their style, not laziness. Match their energy. Be brief back. Ask tight yes/no or choice questions: "Targeting teens or adults?" instead of open-ended prompts.

AI-CONTENT DETECTION:
- If a response sounds like it was generated by ChatGPT (overly formal for a teenager, uses words like "burgeoning," "artisanal," "bespoke," "multifaceted," perfectly structured paragraphs), call it out directly: "That sounds like it came from ChatGPT, not from you. I need YOUR thoughts in YOUR words. What do you actually think?"
- Trust rough, authentic responses over polished, generic ones.

CONSISTENCY:
- If the student's current answer contradicts something they said in a previous lesson (see PRIOR DECISIONS below), flag it: "Wait — earlier you said X. Now you're saying Y. Totally fine to change your mind, but which one are you going with?" Do not silently accept contradictions.
- If the student starts talking about a completely different business than the one registered, redirect: "Interesting, but we're building {{business_name}} right now. Let's keep the focus there."

CULTURAL AWARENESS:
- Your default examples (Warby Parker, Airbnb, etc.) skew Silicon Valley. When possible, vary your references: Fenty Beauty for beauty businesses, a local taco truck for food businesses, a teen who grew a Depop shop for resale businesses. Meet the student where they are culturally.
- Avoid assuming all students have the same cultural reference points.
${priorContext}

RULES:
- Keep responses to 2-4 sentences. This is a conversation, not a lecture.
- Ask ONE question at a time. Wait for the student to respond.
- When the student demonstrates understanding of a checkpoint concept, note it by including [CHECKPOINT:checkpoint_id] in your response (the student won't see this).
- Reference their business by name. Make it personal.
- ONE real example per response max. Tell it like a story, don't list data.
- If all checkpoints are done AND the student has demonstrated mastery of the completion criteria, include [LESSON_COMPLETE] on its own line at the end.

LEARNING STYLE ANALYSIS:
After each response, analyze the student's communication style and include hidden tags:
[STYLE:direct|exploratory|cautious] [PACE:fast|moderate|slow] [DETAIL:concise|detailed] [MOTIVATION:validation|challenge] [REGISTER:formal|casual|slang|academic|bilingual|minimal]
Base this on their actual responses in this conversation, not assumptions.
- MOTIVATION:validation = lights up when praised, builds on encouragement
- MOTIVATION:challenge = engages more when pushed back on, bored by easy agreement
- REGISTER: formal=proper grammar and structure, casual=relaxed conversational, slang=heavy abbreviations/texting language, academic=analytical vocabulary, bilingual=code-switching between languages, minimal=very few words per response
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
          const motivationMatch = fullResponse.match(/\[MOTIVATION:(\w+)\]/);
          const registerMatch = fullResponse.match(/\[REGISTER:(\w+)\]/);

          const updatedProfile: LearningProfile = {
            ...learningProfile,
            style: (styleMatch?.[1] as LearningProfile["style"]) ?? learningProfile.style,
            pace: (paceMatch?.[1] as LearningProfile["pace"]) ?? learningProfile.pace,
            detail_preference: (detailMatch?.[1] as LearningProfile["detail_preference"]) ?? learningProfile.detail_preference,
            motivation: (motivationMatch?.[1] as LearningProfile["motivation"]) ?? learningProfile.motivation,
            register: (registerMatch?.[1] as LearningProfile["register"]) ?? learningProfile.register,
            updated_at: new Date().toISOString(),
          };

          // Clean response of hidden tags before saving
          const cleanResponse = fullResponse
            .replace(/\[CHECKPOINT:\S+\]/g, "")
            .replace(/\[LESSON_COMPLETE\]/g, "")
            .replace(/\[STYLE:\w+\]/g, "")
            .replace(/\[PACE:\w+\]/g, "")
            .replace(/\[DETAIL:\w+\]/g, "")
            .replace(/\[MOTIVATION:\w+\]/g, "")
            .replace(/\[REGISTER:\w+\]/g, "")
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
