"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/ai";
import type { IkigaiDraft, BusinessIdea } from "@/lib/types";

const STEP_PROMPTS: Record<number, (draft: IkigaiDraft) => string> = {
  1: () =>
    `Generate 6-8 short suggestion chips for a student discovering what they LOVE. Mix broad categories with specific teen interests. Include things like: "Drawing", "Music production", "Cooking", "Animals", "Gaming", "Sneakers", "Hair & beauty", "Photography". Make them feel specific and real, not corporate. Return ONLY a JSON array of strings, nothing else.`,
  2: (draft) =>
    `A teenager loves: ${(draft.passions ?? []).join(", ")}. Generate 6-8 HYPER-SPECIFIC skill suggestions directly related to THEIR specific interests. NOT generic skills like "Creative eye" or "Detail-oriented." Instead, skills like "Character design" (for someone into drawing), "Mixing beats" (for music), "Decorating cakes" (for baking). Each suggestion should make the student think "yes, that's exactly what I do." Return ONLY a JSON array of strings, nothing else.`,
  3: (draft) =>
    `A teenager loves: ${(draft.passions ?? []).join(", ")} and is good at: ${(draft.skills ?? []).join(", ")}. Generate 6-8 suggestions for THINGS PEOPLE AROUND THEM WANT BUT CAN'T EASILY GET. Not "world problems" — real things their friends, family, or community wish existed. Frame as desires, not problems. Examples: "Affordable custom nails" (not "beauty inequality"), "Someone to explain math simply" (not "education gap"), "Unique vintage clothes" (not "fast fashion waste"). Plain teen language. Return ONLY a JSON array of strings, nothing else.`,
  4: (draft) =>
    `A teenager loves: ${(draft.passions ?? []).join(", ")}, is good at: ${(draft.skills ?? []).join(", ")}, and people want: ${(draft.needs ?? []).join(", ")}. Generate 6-8 suggestions for HOW THEY COULD GET PAID. Use PLAIN ENGLISH a 14-year-old would understand. NOT business jargon. Examples: "Charge per session" (not "per-session service fee"), "Sell each item" (not "per-unit pricing"), "Monthly package deal" (not "subscription model"), "Earn from ads/sponsors" (not "affiliate marketing"). Return ONLY a JSON array of strings, nothing else.`,
};

export async function generateSuggestions(
  step: number,
  draft: IkigaiDraft
): Promise<{ suggestions: string[]; error?: string }> {
  try {
    // Auth check before AI call to prevent unauthenticated API usage
    const supabaseAuth = await createClient();
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
    if (!authUser) return { suggestions: [], error: "Not authenticated" };

    const promptFn = STEP_PROMPTS[step];
    if (!promptFn) return { suggestions: [], error: "Invalid step" };

    const result = await sendMessage({
      feature: "ikigai",
      systemPrompt:
        "You help teenagers discover their business niche through the Ikigai framework. Be encouraging, specific, and age-appropriate. Always return valid JSON arrays.",
      messages: [{ role: "user", content: promptFn(draft) }],
    });

    // Log usage
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("ai_usage_log").insert({
        student_id: user.id,
        feature: "ikigai",
        model: "claude-sonnet-4-20250514",
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        estimated_cost_usd:
          (result.usage.input_tokens * 3 + result.usage.output_tokens * 15) /
          1_000_000,
      });
    }

    const parsed = JSON.parse(result.text);
    if (Array.isArray(parsed)) {
      return { suggestions: parsed.map(String).slice(0, 8) };
    }

    return { suggestions: [], error: "Unexpected response format" };
  } catch (e) {
    console.error("Failed to generate suggestions:", e);
    return {
      suggestions: [],
      error: "Couldn't generate suggestions. Try again?",
    };
  }
}

export async function saveDraft(draft: IkigaiDraft) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ ikigai_draft: draft })
    .eq("id", user.id);

  if (error) return { error: "Failed to save draft" };
  return { success: true };
}

export async function synthesizeBusinessIdea(draft: IkigaiDraft): Promise<{
  idea: BusinessIdea | null;
  error?: string;
}> {
  try {
    // Get student name for the personal business name
    const supabaseForName = await createClient();
    const { data: { user: currentUser } } = await supabaseForName.auth.getUser();
    let studentName = "Student";
    if (currentUser) {
      const { data: nameData } = await supabaseForName
        .from("profiles")
        .select("full_name")
        .eq("id", currentUser.id)
        .single();
      if (nameData?.full_name) {
        studentName = (nameData.full_name as string).split(" ")[0]; // First name only
      }
    }

    const result = await sendMessage({
      feature: "ikigai",
      systemPrompt:
        `You help teenagers discover their business niche based on their Ikigai answers.

CRITICAL RULES:
1. IDENTIFY DISTINCT THEMES FIRST. Look at the student's answers across all four circles. If their interests point to 2-3 separate directions (e.g., "nails" and "music" are two different paths), DO NOT mash them into one hybrid idea. Treat them as separate viable directions.
2. Pick the SINGLE STRONGEST direction — the one where their passions, skills, needs, and monetization align most naturally. Generate ONE concrete, specific idea for that direction.
3. If two directions are equally strong, pick the one that is more actionable for a teenager.
4. NEVER combine unrelated interests into a forced hybrid (e.g., "music-themed nail salon" or "nail art with beats"). If interests are unrelated, choose one.
5. Be hyper-specific. "Mobile Nail Technician Specializing in Prom and Event Nails" is good. "Nail Services" is bad. "Music Production Lessons for Beginners" is good. "Music Business" is bad.

Return a JSON object with exactly these fields:
- niche: specific description of the business area
- name: use the format "${studentName}'s {specific niche descriptor}" as a personal placeholder
- target_customer: specific description of who would pay
- revenue_model: brief sentence describing how they make money (not a price)
- why_this_fits: 2-3 sentences explaining WHY this specific idea emerged from their inputs. Connect their passions + skills + market need in a way that feels like a DISCOVERY, not just a summary. Include one non-obvious strategic insight or "have you considered" angle they probably haven't thought of.

Use proper Title Case for name and niche. The why_this_fits should feel like a mentor pointing out a connection the student didn't see.`,
      messages: [
        {
          role: "user",
          content: `The student's name is ${studentName}. Based on their Ikigai:
- What they LOVE: ${(draft.passions ?? []).join(", ")}
- What they're GOOD AT: ${(draft.skills ?? []).join(", ")}
- What the WORLD NEEDS: ${(draft.needs ?? []).join(", ")}
- How to get PAID: ${draft.monetization ?? "not specified"}

First, identify the distinct themes in their answers. If their interests span multiple unrelated areas (e.g., nails AND music), pick the single strongest direction where passions, skills, and needs align best. Do NOT combine unrelated interests into a forced hybrid. Generate ONE specific, concrete, actionable business idea. Return ONLY a JSON object.`,
        },
      ],
    });

    // Log usage
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("ai_usage_log").insert({
        student_id: user.id,
        feature: "ikigai",
        model: "claude-sonnet-4-20250514",
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        estimated_cost_usd:
          (result.usage.input_tokens * 3 + result.usage.output_tokens * 15) /
          1_000_000,
      });
    }

    const cleanText = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanText);
    if (parsed.niche && parsed.name && parsed.target_customer && parsed.revenue_model) {
      const titleCase = (s: string) =>
        s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
      const idea: BusinessIdea = {
        niche: titleCase(parsed.niche),
        name: titleCase(parsed.name),
        target_customer: parsed.target_customer,
        revenue_model: parsed.revenue_model,
        why_this_fits: parsed.why_this_fits ?? undefined,
      };
      return { idea };
    }

    return { idea: null, error: "Incomplete business idea generated" };
  } catch (e) {
    console.error("Failed to synthesize business idea:", e);
    return { idea: null, error: "Couldn't create your business idea. Let's try again." };
  }
}

export async function confirmBusinessIdea(
  idea: BusinessIdea,
  ikigaiResult: IkigaiDraft
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Validate input to prevent arbitrary data injection
  const { businessIdeaSchema } = await import("@/lib/schemas");
  const validation = businessIdeaSchema.safeParse(idea);
  if (!validation.success) return { error: "Invalid business idea data" };

  // Only pass validated fields to prevent extra field injection
  const validatedIdea = validation.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      business_idea: validatedIdea,
      ikigai_result: {
        passions: ikigaiResult.passions ?? [],
        skills: ikigaiResult.skills ?? [],
        needs: ikigaiResult.needs ?? [],
        monetization: ikigaiResult.monetization ?? "",
      },
      ikigai_draft: null, // Clear draft
    })
    .eq("id", user.id);

  if (error) return { error: "Failed to save business idea" };
  return { success: true };
}

export async function loadDraft(): Promise<IkigaiDraft | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("ikigai_draft")
    .eq("id", user.id)
    .single();

  return (data?.ikigai_draft as IkigaiDraft) ?? null;
}
