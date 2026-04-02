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
        `You help teenagers discover their business niche. Based on their Ikigai answers, synthesize a specific, concrete business idea. Do NOT generate generic ideas like 'Art Studio' or 'Tech Services'. Be specific to what the student actually said. Return a JSON object with exactly these fields: niche (string, specific description of the business area, e.g. 'Custom Watercolor Pet Portraits' not just 'Art'), name (string, use the format "${studentName}'s {specific niche descriptor}" as a personal placeholder, e.g. "${studentName}'s Pet Portrait Studio"), target_customer (string, specific description of who would pay, e.g. 'Pet owners who want custom artwork of their animals for gifts and home decor'), revenue_model (string, brief summary of how they make money, e.g. 'Sell custom portraits through Instagram commissions and local art fairs, with prints as a lower-cost option'). IMPORTANT: Use proper Title Case for name and niche. The revenue_model should be a sentence, not a price.`,
      messages: [
        {
          role: "user",
          content: `The student's name is ${studentName}. Based on their Ikigai:
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
    if (parsed.niche && parsed.name && parsed.target_customer && parsed.revenue_model) {
      const titleCase = (s: string) =>
        s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
      const idea: BusinessIdea = {
        niche: titleCase(parsed.niche),
        name: titleCase(parsed.name),
        target_customer: parsed.target_customer,
        revenue_model: parsed.revenue_model,
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
