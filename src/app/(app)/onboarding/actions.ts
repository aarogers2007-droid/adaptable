"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/ai";
import type { IkigaiDraft, BusinessIdea } from "@/lib/types";

const STEP_PROMPTS: Record<number, (draft: IkigaiDraft) => string> = {
  1: () =>
    `Generate 6-8 short suggestion chips for a student discovering what they LOVE. These should be broad passions a teenager might have: hobbies, interests, activities. Examples: "Animals", "Music", "Technology", "Art", "Sports", "Cooking", "Gaming", "Fashion". Return ONLY a JSON array of strings, nothing else.`,
  2: (draft) =>
    `A student loves: ${(draft.passions ?? []).join(", ")}. Generate 6-8 short suggestion chips for SKILLS they might have related to these passions. Be specific and practical. Return ONLY a JSON array of strings, nothing else.`,
  3: (draft) =>
    `A student loves: ${(draft.passions ?? []).join(", ")} and is good at: ${(draft.skills ?? []).join(", ")}. Generate 6-8 short suggestion chips for PROBLEMS THE WORLD NEEDS SOLVED that connect to their passions and skills. Be concrete: real needs teenagers could address. Return ONLY a JSON array of strings, nothing else.`,
  4: (draft) =>
    `A student loves: ${(draft.passions ?? []).join(", ")}, is good at: ${(draft.skills ?? []).join(", ")}, and sees these needs: ${(draft.needs ?? []).join(", ")}. Generate 6-8 short suggestion chips for WAYS TO GET PAID. Realistic monetization for a teenager: services, products, digital offerings. Return ONLY a JSON array of strings, nothing else.`,
};

export async function generateSuggestions(
  step: number,
  draft: IkigaiDraft
): Promise<{ suggestions: string[]; error?: string }> {
  try {
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
    const result = await sendMessage({
      feature: "ikigai",
      systemPrompt:
        "You help teenagers discover their business niche. Based on their Ikigai answers, synthesize a concrete business idea. Return a JSON object with exactly these fields: niche (string), name (string, creative business name), target_customer (string, specific description), pricing (string, e.g. '$25/session'). Be creative with the name but practical with everything else.",
      messages: [
        {
          role: "user",
          content: `Based on this student's Ikigai:
- What they LOVE: ${(draft.passions ?? []).join(", ")}
- What they're GOOD AT: ${(draft.skills ?? []).join(", ")}
- What the WORLD NEEDS: ${(draft.needs ?? []).join(", ")}
- How to get PAID: ${draft.monetization ?? "not specified"}

Synthesize a specific, actionable business idea. Return ONLY a JSON object.`,
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

    const parsed = JSON.parse(result.text);
    if (parsed.niche && parsed.name && parsed.target_customer && parsed.pricing) {
      return { idea: parsed as BusinessIdea };
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

  const { error } = await supabase
    .from("profiles")
    .update({
      business_idea: idea,
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
