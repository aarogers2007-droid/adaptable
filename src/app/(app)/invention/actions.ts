"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/ai";

/**
 * Save the student's invention wizard progress. Called after each circle.
 * Creates the row on first call, upserts on subsequent calls.
 */
export async function saveInventionProgress(data: {
  circle_1_category?: string;
  idea_freetext?: string;
  circle_2_archetype?: string;
  circle_3_chips?: string[];
  circle_3_freetext?: string;
  circle_4_scale?: string;
  circle_5_voice?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Find the student's invention class code
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id, classes(session_type), classes!inner(invite_codes(code))")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  if (!enrollment) return { error: "Not enrolled in a class" };

  // Get the invite code for this class
  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", (enrollment as any).class_id)
    .limit(1)
    .single();

  if (!inviteCode) return { error: "No class code found" };
  const classCode = inviteCode.code;

  // Upsert the invention session
  const { error: upsertError } = await supabase
    .from("invention_sessions")
    .upsert(
      {
        student_id: user.id,
        class_code: classCode,
        ...data,
      },
      { onConflict: "student_id,class_code" }
    );

  if (upsertError) {
    console.error("[invention] save progress failed:", upsertError);
    return { error: "Failed to save progress" };
  }

  return { success: true };
}

/**
 * Load the student's current invention session (for resuming).
 */
export async function loadInventionSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("invention_sessions")
    .select("*")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  return { session };
}

/**
 * Synthesize the invention idea after all five circles are complete.
 */
export async function synthesizeInvention(circles: {
  circle_1_category: string;
  idea_freetext: string;
  circle_2_archetype: string;
  circle_3_chips: string[];
  circle_3_freetext: string;
  circle_4_scale: string;
  circle_5_voice: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const systemPrompt = `You are generating an invention concept for a middle school student based on their responses to five questions about the type of invention they want to create, how they think, what they know, how big they are thinking, and how they communicate. This is a zero-to-one invention exercise, not a business ideation exercise. The student should leave with an idea for something that does not exist yet but should. The invention must be genuinely novel, must address a real problem, must connect to what the student knows and cares about, and must be ambitious enough to be exciting even if it is not immediately buildable. The invention must not be a service business, a standard app with no novel mechanism, or an incremental improvement on something that already exists. Return the invention concept in this exact JSON format: title (the name of the invention, short and memorable), tagline (one sentence, what it does and who it helps), problem (one sentence, what broken thing it addresses), mechanism (two sentences, how it actually works), who_it_helps (one sentence, the specific person or group), why_it_matters (one sentence, the bigger significance). Return only valid JSON. No preamble. No markdown.`;

  const userMessage = `Student's responses:

CIRCLE 1 — What kind of invention: ${circles.circle_1_category}
Their idea in one sentence: ${circles.idea_freetext}

CIRCLE 2 — How they think (archetype): ${circles.circle_2_archetype}

CIRCLE 3 — What they know that most kids don't:
Selected topics: ${circles.circle_3_chips.join(", ")}
Their specific knowledge: ${circles.circle_3_freetext}

CIRCLE 4 — Scale of impact they find exciting: ${circles.circle_4_scale}

CIRCLE 5 — How they prefer to communicate: ${circles.circle_5_voice.join(", ")}

Generate ONE invention concept. Return ONLY valid JSON.`;

  try {
    const result = await sendMessage({
      feature: "invention",
      systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    // Log usage
    await supabase.from("ai_usage_log").insert({
      student_id: user.id,
      feature: "invention",
      model: "claude-sonnet-4-20250514",
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      estimated_cost_usd:
        (result.usage.input_tokens * 3 + result.usage.output_tokens * 15) / 1_000_000,
    });

    const cleanText = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanText);

    // Save the synthesized idea and mark as complete
    const { data: enrollment } = await supabase
      .from("class_enrollments")
      .select("class_id")
      .eq("student_id", user.id)
      .limit(1)
      .single();

    const { data: inviteCode } = await supabase
      .from("invite_codes")
      .select("code")
      .eq("class_id", enrollment?.class_id)
      .limit(1)
      .single();

    if (inviteCode) {
      await supabase
        .from("invention_sessions")
        .update({
          synthesized_idea: JSON.stringify(parsed),
          completed_at: new Date().toISOString(),
        })
        .eq("student_id", user.id)
        .eq("class_code", inviteCode.code);
    }

    return { idea: parsed };
  } catch (e) {
    console.error("[invention] synthesis failed:", e);
    return { error: "Synthesis failed. Please try again." };
  }
}

/**
 * Check if the student's group has been revealed.
 */
export async function getGroupAssignment() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get the student's invention session
  const { data: session } = await supabase
    .from("invention_sessions")
    .select("group_number, class_code")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  if (!session || !session.group_number) {
    return { groupNumber: null, revealed: false };
  }

  // Check if groups have been revealed for this class
  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("class_id, classes(grouping_config)")
    .eq("code", session.class_code)
    .limit(1)
    .single();

  const config = (inviteCode?.classes as unknown as { grouping_config: any })?.grouping_config;
  const revealed = config?.groups_revealed === true;

  return {
    groupNumber: revealed ? session.group_number : null,
    revealed,
  };
}
