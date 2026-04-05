"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/ai";
import { moderateContent } from "@/lib/content-moderation";

export async function savePitch(moduleSequence: number, pitchText: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Rate limit
  const { data: allowed } = await supabase.rpc("reserve_ai_usage", {
    p_student_id: user.id,
    p_feature: "guide",
  });
  if (!allowed) return { error: "You've reached your message limit. Try again later." };

  // Validate
  const trimmed = pitchText.trim();
  if (!trimmed) return { error: "Please write your pitch." };
  if (trimmed.length > 5000) return { error: "Keep your pitch under 5000 characters." };

  // Moderate
  const modResult = moderateContent(trimmed);
  if (!modResult.safe) return { error: modResult.reason };

  // Upsert (unique on student_id + module_sequence)
  const { data: pitch, error: upsertErr } = await supabase
    .from("business_pitches")
    .upsert(
      {
        student_id: user.id,
        module_sequence: moduleSequence,
        pitch_text: trimmed,
      },
      { onConflict: "student_id,module_sequence" }
    )
    .select("id")
    .single();

  if (upsertErr || !pitch) {
    console.error("Failed to save pitch:", upsertErr);
    return { error: "Something went wrong. Try again." };
  }

  // Get AI feedback
  try {
    const aiResult = await sendMessage({
      feature: "pitch",
      systemPrompt: `You are a warm, insightful AI mentor. A student just pitched their business to you as if you were a brand new customer.

Your response should:
1. Reflect back what you understood about their business (in your own words, like a customer would)
2. Ask ONE specific follow-up question that would help them sharpen their pitch

Be conversational. Write 3-4 sentences max. Use language a teenager would relate to.`,
      messages: [
        {
          role: "user",
          content: trimmed,
        },
      ],
    });

    // Update with AI feedback
    await supabase
      .from("business_pitches")
      .update({ ai_feedback: aiResult.text })
      .eq("id", pitch.id);

    // Log AI usage
    await supabase.from("ai_usage_log").insert({
      student_id: user.id,
      feature: "pitch",
      model: "claude-sonnet-4-20250514",
      input_tokens: aiResult.usage.input_tokens,
      output_tokens: aiResult.usage.output_tokens,
      estimated_cost_usd:
        (aiResult.usage.input_tokens * 3 +
          aiResult.usage.output_tokens * 15) /
        1_000_000,
    });

    return { aiFeedback: aiResult.text };
  } catch (e) {
    console.error("AI feedback failed for pitch:", e);
    return { aiFeedback: null };
  }
}

export async function getPitchForModule(moduleSequence: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("business_pitches")
    .select("*")
    .eq("student_id", user.id)
    .eq("module_sequence", moduleSequence)
    .single();

  return data;
}

export async function getLatestPitch(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_pitches")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}
