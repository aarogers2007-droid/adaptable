"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/ai";
import type { BusinessIdea } from "@/lib/types";

export async function validateAndCreateBusinessIdea(
  ideaDescription: string
): Promise<{ idea?: BusinessIdea; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Content moderation
  const { moderateContent } = await import("@/lib/content-moderation");
  const check = moderateContent(ideaDescription);
  if (!check.safe) return { error: check.reason ?? "That content isn't appropriate." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const studentName = (profile?.full_name as string)?.split(" ")[0] ?? "Student";

  try {
    const result = await sendMessage({
      feature: "ikigai",
      systemPrompt: `You validate whether a business idea is real and legitimate. Return ONLY a JSON object, no other text.
If the idea is a real, viable business concept (even if simple), return:
{"valid": true, "niche": "Specific Niche Description In Title Case", "name": "${studentName}'s [Specific Business Descriptor]", "target_customer": "who would pay for this", "revenue_model": "how they'd make money, as a sentence"}
If the idea is fake, a joke, nonsensical, inappropriate, or not a real business, return:
{"valid": false, "reason": "brief explanation of why this isn't a valid business idea"}
Be generous with what counts as valid. A nail salon, lawn mowing, tutoring, selling art, dog walking, reselling sneakers — all valid. "asdfgh", "nothing", "idk", jokes, or inappropriate content — not valid. Use proper Title Case for niche and name.`,
      messages: [{ role: "user", content: `Is this a real business idea? "${ideaDescription.trim()}"` }],
    });

    const cleanText = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanText);

    if (parsed.valid) {
      const idea: BusinessIdea = {
        niche: parsed.niche,
        name: parsed.name,
        target_customer: parsed.target_customer,
        revenue_model: parsed.revenue_model,
      };

      // Save to profile
      const { businessIdeaSchema } = await import("@/lib/schemas");
      const validation = businessIdeaSchema.safeParse(idea);
      if (!validation.success) return { error: "Generated idea was invalid. Try again." };

      await supabase
        .from("profiles")
        .update({
          business_idea: validation.data,
          ikigai_result: {
            passions: [ideaDescription.trim()],
            skills: [],
            needs: [],
            monetization: parsed.revenue_model,
          },
          ikigai_draft: null,
        })
        .eq("id", user.id);

      // Log usage
      await supabase.from("ai_usage_log").insert({
        student_id: user.id,
        feature: "ikigai",
        model: "claude-sonnet-4-20250514",
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        estimated_cost_usd:
          (result.usage.input_tokens * 3 + result.usage.output_tokens * 15) / 1_000_000,
      });

      return { idea };
    } else {
      return { error: parsed.reason || "That doesn't seem like a real business idea. Try describing what you'd actually sell or offer." };
    }
  } catch {
    return { error: "Couldn't validate your idea right now. Try the Ikigai wizard instead." };
  }
}
