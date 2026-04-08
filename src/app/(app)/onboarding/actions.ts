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

  // Moderate all Ikigai entries server-side
  const { moderateContent } = await import("@/lib/content-moderation");
  const allEntries = [
    ...(draft.passions ?? []),
    ...(draft.skills ?? []),
    ...(draft.needs ?? []),
    ...(draft.monetization ? [draft.monetization] : []),
  ];
  for (const entry of allEntries) {
    if (typeof entry === "string" && entry.length > 0) {
      const check = moderateContent(entry);
      if (!check.safe) return { error: check.reason ?? "That content isn't appropriate." };
    }
  }

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

1. TEEN-EXECUTABLE TEST. Every idea must pass ALL of these. If your first idea fails any, throw it out and generate a smaller, more local version:
   - Can be started this week with under $100 of supplies
   - Does NOT require a professional license (cosmetology, food handler permit, contractor, real estate, driver's license)
   - Does NOT require commercial space, a vehicle, or business insurance
   - Does NOT involve "monthly retainers," "subscription tiers," "SaaS," "platform development," "consulting practice," or "agency"
   "Press-on nail sets for friends' prom nights" is good. "Mobile Nail Technician" is bad (requires a cosmetology license). "Local skate edits for friends" is good. "Video production agency" is bad.

2. CUSTOMER REALITY CHECK. Before finalizing any idea, name the actual person paying. If that person is an adult business owner, a stranger, or anyone the student would have to cold-email, throw the idea out. Acceptable customers are EXACTLY:
   (a) peers at the student's school
   (b) parents of those peers
   (c) neighbors on the student's block
   (d) the student's own family or family business (if mentioned in their inputs)
   "Custom Python scripts for local family businesses" is BAD — those owners are strangers. "Python tutoring for kids in my school's CS club" is GOOD. "Wedding photography for small couples" is BAD if the student is 14 — they don't know any couples. "Senior portrait photography for the junior class" is GOOD.

3. COMMIT BY PICKING ONE LANE — NEVER BY BLENDING. If inputs are CONCRETE but contain tension (loves quiet but skilled at being loud, or three unrelated valid interests), DO NOT return needs_clarification AND DO NOT blend the lanes into a fake hybrid. Pick the SINGLE more teen-executable lane, build the idea entirely inside that one lane, and write ONE sentence in why_this_fits explicitly retiring the other lane(s) ("Your DJ skills are real but they fight your love of quiet — save those for parties, not this business"). FORCED HYBRIDS ARE WORSE THAN CLARIFICATION. needs_clarification is ONLY for missing or generic information ("stuff," "helping people"), NOT for tension between real signals.

4. IDENTIFY DISTINCT THEMES FIRST. Look across all four circles. If interests point to 2-3 separate directions, treat them as separate. Pick ONE.

5. NEVER combine TWO OR MORE unrelated interests, even partially. If a student lists nails, music, and anime, do NOT produce "anime-themed nails" or "music-themed nails" — pick ONE interest and ignore the others entirely. This rule overrides rule 3: when forced to commit under tension, you commit by picking ONE clean lane, never by blending. The other interests are still part of the student's life; they just are not part of THIS business.

6. ALREADY-RUNNING DETECTION. If the student's inputs reveal they are ALREADY doing this thing for money ("I already braid for $20-40," "I have 47 sales on Depop," "I tutor 3 kids at $15/hour"), do NOT invent a new business. Level up the existing one with ONE specific, concrete improvement (better booking, repeat-customer pricing, a tighter niche within what they already do). Anchor on what they actually already have.

7. FAMILY BUSINESS DETECTION. If inputs mention a family business ("my parents' taqueria," "our farm," "my dad's auto shop"), the idea MUST grow that family entity. Do NOT pivot to competing with other shops in the same category. Examples: TikTok content for the family taqueria, farm-to-customer subscription for the family farm, before/after Instagram for the family auto shop.

8. VAGUE INPUT HANDLING. If the student's inputs are too generic to ground a real idea (e.g., "stuff," "helping people," "tech," "business," "art" with no specifics), do NOT invent specificity. Set niche to "needs_clarification" and use why_this_fits to ask ONE specific question. (See rule 3 — this is ONLY for missing information, not tension.)

9. RISKY MONETIZATION HANDLING. If the student's interests touch illegal-for-minors categories (alcohol, vapes, weed, gambling, sports betting), do NOT refuse silently. Propose ONE concrete legal pivot that uses their actual skills. Example: a teen into rolling papers and stoner aesthetics → sticker brand for that aesthetic. A teen into sports betting math → fantasy sports bracket pool with friends (no money on the line). Always pivot, never just "find another interest."

10. BE HYPER-SPECIFIC about real ideas. "Press-on Nail Sets for Prom Season" is good. "Nail Services" is bad. "Beginner Math Tutoring for 6th-8th Graders" is good. "Tutoring Services" is bad.

Return a JSON object with exactly these fields:
- niche: specific description of the business area, OR "needs_clarification" per rule 8
- category: a SHORT (1-2 words) noun phrase for the TYPE of venture this is, in title case. Examples: "Art Studio", "Tutoring", "Discord Studio", "Cake Co", "Fade Shop", "Photo Studio", "Coaching", "Print Shop". This is NOT the brand name — it's the category word that will be combined with the student's first name to make a placeholder ("Walk's Discord Studio") that the student can rename to whatever they want. Pick the most specific, evocative 1-2 word noun for what they actually do. NEVER use generic words like "Services", "Solutions", "Enterprises", "Consulting", "Agency". If nothing better fits, return "Venture".
- target_customer: specific description of who would pay, named per rule 2 (peers / parents of peers / neighbors / family).
- revenue_model: brief sentence describing how they make money. If the student named a model that doesn't fit (e.g., "monthly retainers," "subscription," "creator deals") and you swapped to a teen-executable one, name the swap explicitly: "You said X, but for now Y will get you paid faster because…"
- legal_note: a SHORT string (one sentence, can be empty "") flagging any real legal/regulatory constraint a teen needs to know about this specific idea. Examples: "Selling baked goods from home is fine in most US states under cottage food laws if you stay under the income cap and label allergens." OR "Cosmetology services on others' bodies legally require a license in most states — keep this to friends and don't advertise publicly." OR "Accepting money for fantasy sports picks crosses into unlicensed gambling in some states even between friends — keep it free and just for bragging rights." If no legal concern applies, return "".
- parent_note: a SHORT string (one sentence) telling the student to involve a parent or guardian BEFORE they take real-world action on this idea. This is REQUIRED for any idea that involves taking money from another person, meeting customers in person, going to anyone's home, sharing an address, ordering paid supplies, or any in-person service. Examples: "Before you charge anyone real money for this, walk the plan through with a parent or guardian — they need to know what you're doing and where." OR "If you're going to a stranger's house to walk their dog, a parent or guardian needs to know the address and the time, every single visit." If the idea is purely digital and zero-money (e.g. free Discord moderation), return "Even free things benefit from a parent knowing what you're spending time on — give them the heads up."
- why_this_fits: 2-3 sentences connecting their inputs in a way that feels like a discovery. Write like a 25-year-old founder talking to a 15-year-old, not like a LinkedIn post. Include one observation about their inputs they probably haven't connected themselves. FORBIDDEN PHRASES (do not use ANY of these): "perfect storm," "secret weapon," "secret sauce," "have you considered," "what most people don't realize," "leverage," "unlock," "synergy," "cracked the code," "natural arbitrage," "your superpower."`,
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

    // Vague-input fallback: model correctly returned needs_clarification.
    // Surface the clarifying question to the frontend so the wizard can re-prompt.
    if (parsed.niche === "needs_clarification") {
      return {
        idea: null,
        error: parsed.why_this_fits ?? "Your answers are too general to land on a real idea yet. Add a specific example and try again.",
      };
    }

    if (parsed.niche && parsed.target_customer && parsed.revenue_model) {
      // Append legal_note and parent_note to why_this_fits so the student sees them inline.
      const legalNote = typeof parsed.legal_note === "string" ? parsed.legal_note.trim() : "";
      const parentNote = typeof parsed.parent_note === "string" ? parsed.parent_note.trim() : "";
      const whyText = parsed.why_this_fits ?? "";
      const parts = [whyText];
      if (legalNote) parts.push(`Heads up: ${legalNote}`);
      if (parentNote) parts.push(`Talk to a parent: ${parentNote}`);
      const whyComposed = parts.filter(Boolean).join("\n\n").trim() || undefined;

      // Build the placeholder name from the AI's category word.
      // The wizard renders this in an editable input — the student can rename
      // it to whatever they want before clicking "I'm in".
      // Fallback to "Venture" if the AI omitted the category or returned junk.
      const rawCategory = typeof parsed.category === "string" ? parsed.category.trim() : "";
      // Sanitize: strip control chars, cap length, drop anything weird
      const safeCategory = rawCategory
        .replace(/[\x00-\x1F\x7F]/g, "")
        .replace(/[^A-Za-z0-9 &'\-]/g, "")
        .trim()
        .slice(0, 24);
      const category = safeCategory.length > 0 ? safeCategory : "Venture";
      const placeholderName = `${studentName}'s ${category}`;

      const idea: BusinessIdea = {
        niche: parsed.niche,
        name: placeholderName,
        target_customer: parsed.target_customer,
        revenue_model: parsed.revenue_model,
        why_this_fits: whyComposed,
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

  // Content moderation on all business idea fields (prevents prompt injection via business name)
  const { moderateContent } = await import("@/lib/content-moderation");
  for (const field of [validatedIdea.name, validatedIdea.niche, validatedIdea.target_customer, validatedIdea.revenue_model]) {
    if (field) {
      const check = moderateContent(field);
      if (!check.safe) return { error: check.reason ?? "That content isn't appropriate." };
    }
  }

  // Sanitize: strip control characters and limit length
  validatedIdea.name = validatedIdea.name.replace(/[\x00-\x1F\x7F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "").trim().slice(0, 100);
  validatedIdea.niche = validatedIdea.niche.replace(/[\x00-\x1F\x7F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "").trim().slice(0, 200);
  validatedIdea.target_customer = validatedIdea.target_customer.replace(/[\x00-\x1F\x7F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "").trim().slice(0, 200);
  validatedIdea.revenue_model = validatedIdea.revenue_model.replace(/[\x00-\x1F\x7F\u200B-\u200F\u202A-\u202E\uFEFF]/g, "").trim().slice(0, 200);

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
