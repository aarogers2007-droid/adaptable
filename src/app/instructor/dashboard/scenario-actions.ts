"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VALID_CRITERION_IDS } from "@/lib/scenario-rubric";

export interface Scenario {
  id: string;
  title: string;
  situation: string;
  industry: string;
  difficulty: number;
  rubric_criteria: string[];
  is_sponsored: boolean;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_context: string | null;
  badge_name: string;
  badge_icon: string;
  is_active: boolean;
  created_at: string;
  org_id: string;
}

const VALID_INDUSTRIES = new Set([
  "food",
  "retail",
  "logistics",
  "technology",
  "healthcare",
  "finance",
  "hospitality",
  "education",
  "manufacturing",
  "marketing",
  "design",
  "agriculture",
  "entertainment",
  "sports",
  "nonprofit",
  "environment",
  "custom",
]);

async function verifyOrgAdmin(): Promise<{ error: string } | { user: { id: string }; orgId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return { error: "Not authorized" as const };
  }
  if (!profile.org_id) {
    return { error: "No organization found" as const };
  }

  const orgId: string = profile.org_id;
  return { user, orgId };
}

interface ScenarioFields {
  title: string;
  situation: string;
  industry: string;
  difficulty: number;
  rubric_criteria: string[];
  badge_name: string;
  badge_icon: string;
  is_sponsored: boolean;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_context: string | null;
}

function extractScenarioFields(formData: FormData): { error: string } | { fields: ScenarioFields } {
  const title = formData.get("title") as string | null;
  const situation = formData.get("situation") as string | null;
  const industry = formData.get("industry") as string | null;
  const difficultyRaw = formData.get("difficulty") as string | null;
  const rubricRaw = formData.get("rubric_criteria") as string | null;
  const badgeName = formData.get("badge_name") as string | null;
  const badgeIcon = formData.get("badge_icon") as string | null;
  const isSponsored = formData.get("is_sponsored") === "true";
  const sponsorName = (formData.get("sponsor_name") as string | null) || null;
  const sponsorLogoUrl =
    (formData.get("sponsor_logo_url") as string | null) || null;
  const sponsorContext =
    (formData.get("sponsor_context") as string | null) || null;

  // --- Validate required fields ---
  if (!title || title.length < 5 || title.length > 200) {
    return { error: "Title must be 5-200 characters" };
  }
  if (!situation || situation.length < 20 || situation.length > 2000) {
    return { error: "Situation must be 20-2000 characters" };
  }
  if (!industry || !VALID_INDUSTRIES.has(industry)) {
    return { error: "Invalid industry" };
  }
  const difficulty = Number(difficultyRaw);
  if (![1, 2, 3].includes(difficulty)) {
    return { error: "Difficulty must be 1, 2, or 3" };
  }

  // --- Rubric criteria ---
  let rubricCriteria: string[];
  try {
    rubricCriteria = JSON.parse(rubricRaw ?? "[]");
  } catch {
    return { error: "rubric_criteria must be valid JSON" };
  }
  if (
    !Array.isArray(rubricCriteria) ||
    rubricCriteria.length < 1 ||
    rubricCriteria.length > 6
  ) {
    return { error: "rubric_criteria must contain 1-6 items" };
  }
  for (const id of rubricCriteria) {
    if (!VALID_CRITERION_IDS.has(id)) {
      return { error: `Invalid rubric criterion: ${id}` };
    }
  }

  // --- Badge ---
  if (!badgeName || badgeName.length < 3 || badgeName.length > 100) {
    return { error: "Badge name must be 3-100 characters" };
  }
  if (!badgeIcon || [...badgeIcon].length !== 1) {
    return { error: "Badge icon must be a single emoji" };
  }

  // --- Sponsor context length ---
  if (sponsorContext && sponsorContext.length > 1000) {
    return { error: "Sponsor context must be under 1000 characters" };
  }

  return {
    fields: {
      title: title!,
      situation: situation!,
      industry: industry!,
      difficulty,
      rubric_criteria: rubricCriteria,
      badge_name: badgeName!,
      badge_icon: badgeIcon!,
      is_sponsored: isSponsored,
      sponsor_name: sponsorName || null,
      sponsor_logo_url: sponsorLogoUrl || null,
      sponsor_context: sponsorContext || null,
    },
  };
}

// ---------------------------------------------------------------------------
// Action 1: getOrgScenarios
// ---------------------------------------------------------------------------

export async function getOrgScenarios(): Promise<{ scenarios: Scenario[] } | { error: string }> {
  const auth = await verifyOrgAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scenarios")
    .select(
      "id, title, situation, industry, difficulty, rubric_criteria, is_sponsored, sponsor_name, sponsor_logo_url, sponsor_context, badge_name, badge_icon, is_active, created_at, org_id"
    )
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { scenarios: data as Scenario[] };
}

// ---------------------------------------------------------------------------
// Action 2: createScenario
// ---------------------------------------------------------------------------

export async function createScenario(
  formData: FormData
): Promise<{ success: true; scenarioId: string } | { error: string }> {
  const auth = await verifyOrgAdmin();
  if ("error" in auth) return { error: auth.error };

  const parsed = extractScenarioFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scenarios")
    .insert({
      ...parsed.fields,
      org_id: auth.orgId,
      created_by: auth.user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { success: true, scenarioId: data.id };
}

// ---------------------------------------------------------------------------
// Action 3: updateScenario
// ---------------------------------------------------------------------------

export async function updateScenario(
  scenarioId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const auth = await verifyOrgAdmin();
  if ("error" in auth) return { error: auth.error };

  // Verify scenario belongs to user's org
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("scenarios")
    .select("org_id")
    .eq("id", scenarioId)
    .single();

  if (!existing) return { error: "Scenario not found" };
  if (existing.org_id !== auth.orgId) {
    return { error: "Not authorized" };
  }

  const parsed = extractScenarioFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await admin
    .from("scenarios")
    .update(parsed.fields)
    .eq("id", scenarioId);

  if (error) return { error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Action 4: deactivateScenario
// ---------------------------------------------------------------------------

export async function deactivateScenario(
  scenarioId: string
): Promise<{ success: true } | { error: string }> {
  const auth = await verifyOrgAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("scenarios")
    .select("org_id")
    .eq("id", scenarioId)
    .single();

  if (!existing) return { error: "Scenario not found" };
  if (existing.org_id !== auth.orgId) {
    return { error: "Not authorized" };
  }

  const { error } = await admin
    .from("scenarios")
    .update({ is_active: false })
    .eq("id", scenarioId);

  if (error) return { error: error.message };
  return { success: true };
}
