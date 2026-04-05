"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/ai";

interface ExerciseFeedback {
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export async function submitExercise(
  progressId: string,
  lessonId: string,
  lessonTitle: string,
  exercisePrompt: string,
  studentResponse: string,
  _businessName: string, // ignored — use server-side profile
  _niche: string // ignored — use server-side profile
): Promise<{ feedback?: ExerciseFeedback; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Rate limit
  const { data: allowed } = await supabase.rpc("reserve_ai_usage", {
    p_student_id: user.id,
    p_feature: "guide",
  });
  if (!allowed) return { error: "You've reached your message limit. Try again later." };

  // Validate inputs
  if (!studentResponse || typeof studentResponse !== "string" || studentResponse.trim().length === 0 || studentResponse.length > 5000) {
    return { error: "Invalid response" };
  }

  // Content moderation
  const { moderateContent } = await import("@/lib/content-moderation");
  const modCheck = moderateContent(studentResponse);
  if (!modCheck.safe) return { error: modCheck.reason ?? "That content isn't appropriate." };

  // Use server-side profile data to prevent prompt injection
  const { data: profileData } = await supabase.from("profiles").select("business_idea").eq("id", user.id).single();
  const businessName = (profileData?.business_idea as { name: string } | null)?.name ?? "their business";
  const niche = (profileData?.business_idea as { niche: string } | null)?.niche ?? "their niche";

  try {
    const result = await sendMessage({
      feature: "guide",
      systemPrompt: `You are a venture studio mentor evaluating a student's exercise response. The student is designing a venture called "${businessName}" in the "${niche}" space.

Your job is to evaluate whether their response meets the exercise requirements. Be encouraging but honest. A teenager wrote this, so calibrate your expectations for their age, but still require genuine effort and specificity.

PASSING CRITERIA:
- The response directly addresses the exercise prompt
- The response is specific to THEIR business (not generic)
- The response shows real thought (not one-word answers or copy-paste)
- The response is at least 2-3 sentences for each part of the exercise

FAILING CRITERIA (require revision):
- Response is too vague or generic (could apply to any business)
- Response doesn't address all parts of the exercise
- Response is clearly low-effort or placeholder text
- Response contradicts their business concept

Return a JSON object:
{
  "passed": true/false,
  "feedback": "2-3 sentence overall feedback, conversational and encouraging",
  "strengths": ["specific thing they did well", "another strength"],
  "improvements": ["specific thing to fix if they didn't pass"]
}

Be specific in your feedback. Reference their actual words. "You mentioned X, which shows you understand Y" is good. "Good job" is bad.`,
      messages: [
        {
          role: "user",
          content: `Lesson: "${lessonTitle}"

Exercise requirements:
${exercisePrompt}

Student's response:
${studentResponse}

Evaluate this response. Return ONLY a JSON object.`,
        },
      ],
    });

    // Log AI usage
    await supabase.from("ai_usage_log").insert({
      student_id: user.id,
      feature: "guide",
      model: "claude-sonnet-4-20250514",
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      estimated_cost_usd:
        (result.usage.input_tokens * 3 + result.usage.output_tokens * 15) / 1_000_000,
    });

    // Parse feedback
    const cleanText = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const feedback = JSON.parse(cleanText) as ExerciseFeedback;

    // Save response as artifact
    await supabase
      .from("student_progress")
      .update({
        artifacts: { response: studentResponse, feedback },
        ...(feedback.passed
          ? { status: "completed", completed_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", progressId)
      .eq("student_id", user.id);

    return { feedback };
  } catch (e) {
    console.error("Exercise evaluation failed:", e);
    return { error: "Couldn't evaluate your response right now. Try again in a moment." };
  }
}

// Keep the old function for backwards compatibility
export async function markLessonComplete(progressId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("student_progress")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", progressId)
    .eq("student_id", user.id);

  if (error) return { error: "Failed to update progress" };
  return { success: true };
}
