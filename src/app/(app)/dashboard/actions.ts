"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/ai";
import type { Profile } from "@/lib/types";

/**
 * Generate an on-demand mentor check-in if the latest is >7 days old.
 */
export async function generateCheckin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if recent check-in exists
  const { data: recent } = await supabase
    .from("mentor_checkins")
    .select("created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (recent) {
    const age = Date.now() - new Date(recent.created_at).getTime();
    if (age < 7 * 24 * 60 * 60 * 1000) {
      return { error: "Check-in is still fresh" };
    }
  }

  // Get profile + progress
  const [profileRes, progressRes] = await Promise.all([
    supabase.from("profiles").select("business_idea, full_name").eq("id", user.id).single(),
    supabase.from("student_progress").select("status, lesson_id").eq("student_id", user.id),
  ]);

  const profile = profileRes.data as unknown as Pick<Profile, "business_idea" | "full_name"> | null;
  if (!profile?.business_idea) return { error: "No business idea" };

  const completedCount = (progressRes.data ?? []).filter((p) => p.status === "completed").length;
  const inProgressCount = (progressRes.data ?? []).filter((p) => p.status === "in_progress").length;

  const result = await sendMessage({
    feature: "checkin",
    systemPrompt: "You are a supportive AI mentor for a student entrepreneur. Give a brief, encouraging weekly check-in. Reference their specific business. Suggest one concrete next step. Keep it to 2-3 sentences.",
    messages: [{
      role: "user",
      content: `Student: ${profile.full_name || "Student"}. Business: "${profile.business_idea.name}" — ${profile.business_idea.niche} for ${profile.business_idea.target_customer}. Revenue model: ${profile.business_idea.revenue_model}. Progress: ${completedCount} lessons completed, ${inProgressCount} in progress. Generate a weekly check-in.`,
    }],
  });

  // Save check-in
  await supabase.from("mentor_checkins").insert({
    student_id: user.id,
    content: result.text,
  });

  // Log usage
  await supabase.from("ai_usage_log").insert({
    student_id: user.id,
    feature: "checkin",
    model: "claude-haiku-4-5-20251001",
    input_tokens: result.usage.input_tokens,
    output_tokens: result.usage.output_tokens,
    estimated_cost_usd: (result.usage.input_tokens * 0.25 + result.usage.output_tokens * 1.25) / 1_000_000,
  });

  return { content: result.text };
}

/**
 * Generate niche-specific resource recommendations.
 */
export async function generateRecommendations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_idea, niche_recommendations")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as unknown as Pick<Profile, "business_idea" | "niche_recommendations"> | null;

  // Return cached if exists
  if (typedProfile?.niche_recommendations) {
    return { recommendations: typedProfile.niche_recommendations };
  }

  if (!typedProfile?.business_idea) return { error: "No business idea" };

  const result = await sendMessage({
    feature: "recommendations",
    systemPrompt: "Generate business examples for a student entrepreneur. Return a JSON array of 3-5 objects, each with: business_name, description, pricing, customer_acquisition, key_lesson. Use real-sounding examples relevant to the niche. These are AI-generated illustrative examples for learning purposes.",
    messages: [{
      role: "user",
      content: `Generate examples for the "${typedProfile.business_idea.niche}" niche, targeting "${typedProfile.business_idea.target_customer}". Return ONLY a JSON array.`,
    }],
  });

  try {
    const recs = JSON.parse(result.text);

    // Cache on profile
    await supabase
      .from("profiles")
      .update({ niche_recommendations: recs })
      .eq("id", user.id);

    // Log usage
    await supabase.from("ai_usage_log").insert({
      student_id: user.id,
      feature: "recommendations",
      model: "claude-haiku-4-5-20251001",
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      estimated_cost_usd: (result.usage.input_tokens * 0.25 + result.usage.output_tokens * 1.25) / 1_000_000,
    });

    return { recommendations: recs };
  } catch {
    return { error: "Failed to parse recommendations" };
  }
}
