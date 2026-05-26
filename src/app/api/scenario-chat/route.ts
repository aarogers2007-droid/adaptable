import { createClient } from "@/lib/supabase/server";
import { streamMessage, sendMessageAuto } from "@/lib/ai";
import { RUBRIC_MAP } from "@/lib/scenario-rubric";
import { getModel } from "@/lib/model-config";
import { getMentorAdaptation } from "@/lib/grade-adaptation";
import { moderateContent } from "@/lib/content-moderation";
import { validateOrigin } from "@/lib/csrf";
import type { GradeTier } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!validateOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { message, scenarioId, sessionId, studentResponseTimeMs } = await request.json();

  if (!message || typeof message !== "string" || message.length > 5000) {
    return Response.json({ error: "Invalid message" }, { status: 400 });
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  if (!scenarioId) {
    return Response.json({ error: "Missing scenarioId" }, { status: 400 });
  }

  // Content moderation
  const modCheck = moderateContent(trimmedMessage);
  if (!modCheck.safe) {
    return Response.json({ error: modCheck.reason }, { status: 400 });
  }

  // Crisis detection (non-blocking for regex, awaits ML if regex misses)
  const { detectCrisisUniversal } = await import("@/lib/crisis-detection");
  detectCrisisUniversal(trimmedMessage).then(async (crisisCheck) => {
    if (!crisisCheck.detected) return;
    const { alertCrisis } = await import("@/lib/teacher-alerts");
    const result = await alertCrisis(supabase, user.id, crisisCheck.type ?? "hopelessness", crisisCheck.matchedPattern ?? "", trimmedMessage, "scenario-chat");
    if (!result) return;
    // Send crisis email to instructor + org admin
    const recipients: string[] = [];
    if (result.instructorId) {
      const { data: instructor } = await supabase.from("profiles").select("email").eq("id", result.instructorId).single();
      if (instructor?.email) recipients.push(instructor.email as string);
    }
    if (result.orgAdminEmail) recipients.push(result.orgAdminEmail);
    if (recipients.length > 0) {
      const { sendCrisisAlertEmail } = await import("@/lib/email");
      const { data: studentProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      await sendCrisisAlertEmail(supabase, {
        alertId: result.alertId,
        studentFirstName: (studentProfile?.full_name as string)?.split(" ")[0] ?? "A student",
        crisisType: crisisCheck.type ?? "hopelessness",
        matchedPatternHint: crisisCheck.matchedPattern ?? "",
        to: recipients,
        classId: result.classId,
        timestamp: new Date().toISOString(),
        region: result.region,
        fromEmail: result.senderEmail ?? undefined,
      }).catch(() => {});
    }
  }).catch(() => {});

  // Rate limit
  const { data: allowed, error: rpcError } = await supabase.rpc("reserve_ai_usage", {
    p_student_id: user.id,
    p_feature: "scenario",
  });
  if (rpcError || !allowed) {
    return Response.json(
      { error: "You've reached your message limit. Take a break and come back later!" },
      { status: 429 }
    );
  }

  // Load scenario
  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", scenarioId)
    .eq("is_active", true)
    .single();

  if (!scenario) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  // Load student profile for grade level
  const { data: profile } = await supabase
    .from("profiles")
    .select("grade_tier, grade_level, org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return new Response("Account not configured", { status: 403 });
  }

  const gradeTier = ((profile as Record<string, unknown>)?.grade_tier as GradeTier) ?? "high_school";

  // Load or create session
  let session: {
    id: string;
    attempt_number: number;
    criteria_satisfied: string[];
    conversation: { role: string; content: string }[];
    status: string;
  };

  if (sessionId) {
    const { data: existing } = await supabase
      .from("student_scenario_sessions")
      .select("id, attempt_number, criteria_satisfied, conversation, status")
      .eq("id", sessionId)
      .eq("student_id", user.id)
      .single();

    if (!existing || existing.status === "completed") {
      return Response.json({ error: "Invalid session" }, { status: 400 });
    }
    session = {
      ...existing,
      criteria_satisfied: existing.criteria_satisfied ?? [],
      conversation: (existing.conversation as { role: string; content: string }[]) ?? [],
    };
  } else {
    // Count previous attempts
    const { count } = await supabase
      .from("student_scenario_sessions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .eq("scenario_id", scenarioId);

    const attemptNumber = (count ?? 0) + 1;

    const { data: newSession } = await supabase
      .from("student_scenario_sessions")
      .insert({
        student_id: user.id,
        scenario_id: scenarioId,
        attempt_number: attemptNumber,
        status: "in_progress",
        criteria_satisfied: [],
        conversation: [],
      })
      .select("id, attempt_number, criteria_satisfied, conversation, status")
      .single();

    if (!newSession) {
      return Response.json({ error: "Failed to create session" }, { status: 500 });
    }
    session = {
      ...newSession,
      criteria_satisfied: [],
      conversation: [],
    };
  }

  // Load replay history (only completed sessions with approach_summary)
  let replayContext = "";
  if (session.attempt_number > 1) {
    const { data: previousSessions } = await supabase
      .from("student_scenario_sessions")
      .select("attempt_number, approach_summary")
      .eq("student_id", user.id)
      .eq("scenario_id", scenarioId)
      .eq("status", "completed")
      .not("approach_summary", "is", null)
      .order("attempt_number", { ascending: true });

    if (previousSessions && previousSessions.length > 0) {
      const summaries = previousSessions.map((s) => {
        const summary = s.approach_summary as Record<string, string>;
        return `Attempt ${s.attempt_number}:\n${Object.entries(summary).map(([k, v]) => `  ${k}: ${v}`).join("\n")}`;
      });
      replayContext = `\n\nREPLAY HISTORY — PREVIOUS APPROACHES:\nThis student has completed this scenario before. These are the approaches they used:\n${summaries.join("\n\n")}\n\nIf the student attempts the same conceptual approach for any criterion, do not accept it. Redirect them toward a different way of thinking about it.`;
    }
  }

  // Build rubric context
  const rubricCriteria = (scenario.rubric_criteria as string[]).map((id) => {
    const criterion = RUBRIC_MAP.get(id);
    return criterion ? `- ${criterion.short_label}: ${criterion.description}` : null;
  }).filter(Boolean).join("\n");

  const unsatisfiedCriteria = (scenario.rubric_criteria as string[]).filter(
    (id) => !session.criteria_satisfied.includes(id)
  );

  // Build system prompt
  const gradeAdaptation = getMentorAdaptation(gradeTier);

  // Split system prompt for Anthropic prompt caching.
  // Static prefix (cacheable): scenario context, role, rubric criteria
  // Dynamic suffix (NOT cached): criteria state changes per exchange as criteria are satisfied
  const staticPrompt = `You are a Socratic business mentor guiding a student through a specific business challenge. Your job is to help the student think their way to sound decisions — not to give them the answers.

${gradeAdaptation}

SCENARIO: ${scenario.title}
${scenario.situation}${scenario.is_sponsored && scenario.sponsor_context ? `\n\nADDITIONAL CONTEXT: ${scenario.sponsor_context}` : ""}

YOUR ROLE:
- Ask one question at a time
- Never answer your own questions
- Do not validate or praise without immediately asking a deeper question
- When the student says something vague, ask them to be more specific
- Keep responses to 2-3 sentences maximum

WHAT YOU ARE EVALUATING (do not tell the student these criteria exist):
${rubricCriteria}

You are listening for the student to demonstrate each criterion through their own reasoning. When a criterion is clearly demonstrated, note it internally but do not announce it.

DECISION POINTS:
At key junctures — when the student faces a concrete business decision — offer 3 to 4 specific options using this exact format:

[OPTIONS]
A. Option text here
B. Option text here
C. Option text here
D. Option text here
[/OPTIONS]

Rules for decision points:
- Use roughly every 3-4 exchanges. Never on the first exchange.
- Never two exchanges in a row.
- Options must be specific to this scenario, plausible, short (one sentence each).
- Include one clearly better entrepreneurial choice, one partially correct, and one or two tempting but flawed choices.
- After any MC choice, always follow up: "Walk me through why that felt right to you."
- A student can satisfy a criterion through reasoning about a wrong choice.`;

  const dynamicPrompt = `\n${unsatisfiedCriteria.length === 0 ? "All criteria have been satisfied. Bring the conversation to a natural close with a brief synthesis of what the student figured out." : `Still evaluating: ${unsatisfiedCriteria.join(", ")}`}
${replayContext}

Start by orienting the student in the scenario and asking your first question. Be direct and specific — not generic.`;

  const systemBlocks: import("@/lib/ai").CacheableTextBlock[] = [
    { type: "text", text: staticPrompt, cache_control: { type: "ephemeral" } },
    { type: "text", text: dynamicPrompt },
  ];

  // Build messages
  const messages = [
    ...session.conversation.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: trimmedMessage },
  ];

  try {
    const stream = await streamMessage({
      feature: "guide",
      systemPrompt: systemBlocks,
      messages,
      modelOverride: getModel("scenario_chat"),
    });

    const encoder = new TextEncoder();
    let fullResponse = "";
    const { createStreamScrubber, moderateOutput } = await import("@/lib/output-moderation");
    const scrubber = createStreamScrubber();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              fullResponse += event.delta.text;
              // Scrub profanity in real-time before sending to student
              const safeChunk = scrubber.push(event.delta.text);
              if (safeChunk) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: safeChunk })}\n\n`));
              }
            }
          }
          // Flush remaining buffered text
          const finalChunk = scrubber.flush();
          if (finalChunk) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: finalChunk })}\n\n`));
          }

          // Post-stream moderation — flag non-profanity issues (profanity already scrubbed)
          const outputCheck = moderateOutput(fullResponse);
          if (!outputCheck.safe && outputCheck.reason !== "profanity") {
            console.warn("[scenario-chat] Output flagged:", outputCheck.reason, outputCheck.flagged_content);
            import("@/lib/teacher-alerts").then(({ alertContentFlag }) =>
              alertContentFlag(supabase, user.id, `AI output flagged (${outputCheck.reason}): ${outputCheck.flagged_content}`, "ai_output", "scenario-chat")
            ).catch(() => {});
          }

          // Save conversation
          const updatedConversation = [
            ...session.conversation,
            { role: "user", content: trimmedMessage },
            { role: "assistant", content: fullResponse },
          ];

          await supabase
            .from("student_scenario_sessions")
            .update({ conversation: updatedConversation })
            .eq("id", session.id);

          // Log AI usage with real token counts from the stream
          const finalMsg = await stream.finalMessage();
          const scenarioModel = getModel("scenario_chat");
          const sUsage = finalMsg.usage;
          const sCacheRead = (sUsage as unknown as Record<string, number>).cache_read_input_tokens ?? 0;
          const sCacheCreate = (sUsage as unknown as Record<string, number>).cache_creation_input_tokens ?? 0;
          const sFreshInput = sUsage.input_tokens - sCacheRead - sCacheCreate;
          supabase.from("ai_usage_log").insert({
            student_id: user.id,
            org_id: (profile as Record<string, unknown>)?.org_id ?? null,
            feature: "scenario",
            model: scenarioModel,
            input_tokens: sUsage.input_tokens,
            output_tokens: sUsage.output_tokens,
            estimated_cost_usd: (sFreshInput * 3 + sCacheRead * 0.3 + sCacheCreate * 3.75 + sUsage.output_tokens * 15) / 1_000_000,
            response_length: fullResponse.length,
            prompt_length: trimmedMessage.length,
            student_response_time_ms: typeof studentResponseTimeMs === "number" ? studentResponseTimeMs : null,
          }).then(() => {}, (err: unknown) => console.error("[scenario-chat] usage log failed:", err));

          // Fire-and-forget criteria evaluation
          // Wrapped in try/catch — failures are logged, never surface to student
          evaluateCriteria(
            supabase, user.id, session.id, scenarioId,
            scenario.rubric_criteria as string[],
            session.criteria_satisfied,
            session.attempt_number,
            updatedConversation,
            (profile as Record<string, unknown>)?.org_id as string | null ?? null,
          ).then((result) => {
            if (result) {
              // Send criteria update to client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                criteria_update: result.newlySatisfied,
                all_satisfied: result.allSatisfied,
                badge_level: result.badgeLevel,
                synthesis: result.synthesis,
                sessionId: session.id,
              })}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }).catch((err) => {
            console.error("[scenario-chat] criteria eval failed (non-blocking):", err);
            // Still send DONE — student never sees the error
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sessionId: session.id })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          });

        } catch (err) {
          console.error("[scenario-chat] stream error:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
  } catch (err) {
    console.error("[scenario-chat] API error:", err);
    return Response.json({ error: "AI service error" }, { status: 500 });
  }
}

// ── Criteria evaluation (fire-and-forget) ──

async function evaluateCriteria(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  sessionId: string,
  scenarioId: string,
  allCriteria: string[],
  currentlySatisfied: string[],
  attemptNumber: number,
  conversation: { role: string; content: string }[],
  orgId: string | null,
): Promise<{
  newlySatisfied: string[];
  allSatisfied: boolean;
  badgeLevel: number | null;
  synthesis: string | null;
} | null> {
  const unsatisfied = allCriteria.filter((id) => !currentlySatisfied.includes(id));
  if (unsatisfied.length === 0) return null; // already all satisfied

  // Build evaluation prompt
  const criteriaDescriptions = unsatisfied.map((id) => {
    const c = RUBRIC_MAP.get(id);
    return c ? `${id}: ${c.description}` : id;
  }).join("\n");

  const recentMessages = conversation.slice(-6); // last 3 exchanges
  const conversationText = recentMessages
    .map((m) => `${m.role === "user" ? "Student" : "Mentor"}: ${m.content}`)
    .join("\n");

  const evalModel = getModel("scenario_eval");
  const evalResult = await sendMessageAuto({
    model: evalModel,
    maxTokens: 200,
    systemPrompt: `You are evaluating whether a student has demonstrated business thinking criteria in a conversation. Be strict — the student must clearly demonstrate the criterion through their own reasoning, not just mention it in passing.

When the student made a multiple choice selection (messages starting with "I choose:"), evaluate their REASONING in the follow-up response, not the choice itself. A student who picks a wrong option but demonstrates sound thinking in their explanation can still satisfy a criterion. A correct choice without reasoning does NOT satisfy any criterion.

UNSATISFIED CRITERIA:
${criteriaDescriptions}

Respond with ONLY valid JSON: {"newly_satisfied": ["CRITERION_ID"]} or {"newly_satisfied": []} if none are newly satisfied.`,
    messages: [{ role: "user", content: `Recent conversation:\n${conversationText}\n\nWhich criteria, if any, has the student's reasoning newly satisfied?` }],
  });

  // Log eval usage
  supabase.from("ai_usage_log").insert({
    student_id: userId,
    org_id: orgId,
    feature: "scenario_eval",
    model: evalModel,
    input_tokens: evalResult.usage?.input_tokens ?? 0,
    output_tokens: evalResult.usage?.output_tokens ?? 0,
    estimated_cost_usd: ((evalResult.usage?.input_tokens ?? 0) * 0.15 + (evalResult.usage?.output_tokens ?? 0) * 0.6) / 1_000_000,
  }).then(() => {}, (err: unknown) => console.error("[scenario-chat] eval usage log failed:", err));

  let newlySatisfied: string[] = [];
  try {
    const parsed = JSON.parse(evalResult.text);
    newlySatisfied = (parsed.newly_satisfied ?? []).filter(
      (id: string) => unsatisfied.includes(id)
    );
  } catch {
    console.warn("[scenario-chat] eval parse failed:", evalResult.text);
    return null;
  }

  if (newlySatisfied.length === 0) return null;

  // Update session
  const updatedSatisfied = [...currentlySatisfied, ...newlySatisfied];
  const allSatisfied = allCriteria.every((id) => updatedSatisfied.includes(id));

  const updatePayload: Record<string, unknown> = {
    criteria_satisfied: updatedSatisfied,
  };

  let badgeLevel: number | null = null;
  let synthesis: string | null = null;

  if (allSatisfied) {
    // Generate approach summary
    const summaryResult = await sendMessageAuto({
      model: evalModel,
      maxTokens: 300,
      systemPrompt: "Summarize how the student satisfied each criterion in one sentence per criterion. Return valid JSON: { \"CRITERION_ID\": \"one sentence summary\" }",
      messages: [{
        role: "user",
        content: `Criteria: ${allCriteria.join(", ")}\n\nFull conversation:\n${conversation.map((m) => `${m.role}: ${m.content}`).join("\n")}`,
      }],
    });

    // Log summary eval usage
    supabase.from("ai_usage_log").insert({
      student_id: userId,
      org_id: orgId,
      feature: "scenario_eval",
      model: evalModel,
      input_tokens: summaryResult.usage?.input_tokens ?? 0,
      output_tokens: summaryResult.usage?.output_tokens ?? 0,
      estimated_cost_usd: ((summaryResult.usage?.input_tokens ?? 0) * 0.15 + (summaryResult.usage?.output_tokens ?? 0) * 0.6) / 1_000_000,
    }).then(() => {}, (err: unknown) => console.error("[scenario-chat] summary eval usage log failed:", err));

    let approachSummary: Record<string, string> = {};
    try {
      approachSummary = JSON.parse(summaryResult.text);
    } catch {
      // Fallback: store raw text
      approachSummary = { raw: summaryResult.text };
    }

    // Generate synthesis paragraph for completion screen
    const synthesisResult = await sendMessageAuto({
      model: evalModel,
      maxTokens: 150,
      systemPrompt: "Write a brief paragraph (3-4 sentences) synthesizing what the student figured out in this scenario. Be specific to what they actually argued. Address them directly.",
      messages: [{
        role: "user",
        content: `Conversation:\n${conversation.slice(-10).map((m) => `${m.role}: ${m.content}`).join("\n")}`,
      }],
    });
    synthesis = synthesisResult.text;

    // Log synthesis eval usage
    supabase.from("ai_usage_log").insert({
      student_id: userId,
      org_id: orgId,
      feature: "scenario_eval",
      model: evalModel,
      input_tokens: synthesisResult.usage?.input_tokens ?? 0,
      output_tokens: synthesisResult.usage?.output_tokens ?? 0,
      estimated_cost_usd: ((synthesisResult.usage?.input_tokens ?? 0) * 0.15 + (synthesisResult.usage?.output_tokens ?? 0) * 0.6) / 1_000_000,
    }).then(() => {}, (err: unknown) => console.error("[scenario-chat] synthesis eval usage log failed:", err));

    badgeLevel = Math.min(attemptNumber, 3);

    updatePayload.status = "completed";
    updatePayload.completed_at = new Date().toISOString();
    updatePayload.approach_summary = approachSummary;
    updatePayload.badge_level_awarded = badgeLevel;

    // Upsert badge (INSERT ON CONFLICT UPDATE if higher level)
    await supabase
      .from("student_badges")
      .upsert(
        {
          student_id: userId,
          scenario_id: scenarioId,
          badge_level: badgeLevel,
          first_earned_at: new Date().toISOString(),
          last_upgraded_at: badgeLevel > 1 ? new Date().toISOString() : null,
        },
        { onConflict: "student_id,scenario_id" }
      );
  }

  await supabase
    .from("student_scenario_sessions")
    .update(updatePayload)
    .eq("id", sessionId);

  return { newlySatisfied, allSatisfied, badgeLevel, synthesis };
}
