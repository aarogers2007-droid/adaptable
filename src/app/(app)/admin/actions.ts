"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, admin: null, userId: null, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "org_admin" && !(profile as Record<string, unknown>).is_platform_owner)) {
    return { supabase: null, admin: null, userId: null, error: "Not an admin" };
  }

  // Admin client bypasses RLS — needed for DELETE operations
  const admin = createAdminClient();

  return { supabase, admin, userId: user.id, error: null };
}

export async function resetAllProgress() {
  const { admin, userId, error } = await verifyAdmin();
  if (error || !admin || !userId) return { error: error ?? "Auth failed" };

  await admin
    .from("student_progress")
    .delete()
    .eq("student_id", userId);

  return { success: true };
}

export async function resetIkigai() {
  const { admin, userId, error } = await verifyAdmin();
  if (error || !admin || !userId) return { error: error ?? "Auth failed" };

  // Clear business idea, ikigai, draft, recommendations, and all progress
  // Uses admin client (service role) to bypass RLS — DELETE policies don't exist
  await admin
    .from("profiles")
    .update({
      business_idea: null,
      ikigai_result: null,
      ikigai_draft: null,
      niche_recommendations: null,
    })
    .eq("id", userId);

  await admin
    .from("student_progress")
    .delete()
    .eq("student_id", userId);

  await admin
    .from("ai_conversations")
    .delete()
    .eq("student_id", userId);

  await admin
    .from("mentor_checkins")
    .delete()
    .eq("student_id", userId);

  // Also clear daily checkins, lesson decisions, business pitches, achievements
  await admin.from("daily_checkins").delete().eq("student_id", userId);
  await admin.from("lesson_decisions").delete().eq("student_id", userId);
  await admin.from("business_pitches").delete().eq("student_id", userId);
  await admin.from("student_achievements").delete().eq("student_id", userId);
  await admin.from("founder_log_entries").delete().eq("student_id", userId);

  return { success: true };
}

export async function resetSingleLesson(lessonId: string) {
  const { admin, userId, error } = await verifyAdmin();
  if (error || !admin || !userId) return { error: error ?? "Auth failed" };

  await admin
    .from("student_progress")
    .delete()
    .eq("student_id", userId)
    .eq("lesson_id", lessonId);

  return { success: true };
}

/**
 * Manual org provisioning — platform owner only.
 * Creates an org row identical to the self-serve onboarding path.
 */
export async function provisionOrganizationManual(data: {
  orgName: string;
  slug: string;
  subdomain: string;
  subscriptionTier: string;
  contactEmail: string;
}): Promise<{ success?: boolean; orgId?: string; error?: string }> {
  const { admin, error } = await verifyAdmin();
  if (error || !admin) return { error: error ?? "Auth failed" };

  // Extra check: platform owner only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!(profile as Record<string, unknown> | null)?.is_platform_owner) {
    return { error: "Platform owner only" };
  }

  const { orgName, slug, subdomain, subscriptionTier, contactEmail } = data;

  if (!orgName || !slug || !subdomain) {
    return { error: "Name, slug, and subdomain are required." };
  }

  // Create org
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: orgName,
      slug,
      subdomain,
      branding_config: { platform_name: orgName },
      subscription_tier: subscriptionTier || "starter",
      is_active: true,
    })
    .select("id")
    .single();

  if (orgError) {
    if (orgError.code === "23505") {
      return { error: "Subdomain or slug already taken." };
    }
    console.error("[admin] org provision failed:", orgError);
    return { error: "Failed to create organization." };
  }

  // If contact email provided, assign them as org_admin
  if (contactEmail) {
    const { data: contactProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", contactEmail)
      .limit(1)
      .single();

    if (contactProfile) {
      await admin
        .from("profiles")
        .update({ org_id: org.id, role: "org_admin" })
        .eq("id", contactProfile.id);
    }
  }

  return { success: true, orgId: org.id };
}

export async function unlockAllLessons() {
  const { supabase, userId, error } = await verifyAdmin();
  if (error || !supabase || !userId) return { error: error ?? "Auth failed" };

  // Get all lessons
  const { data: lessons } = await supabase.from("lessons").select("id");

  if (!lessons) return { error: "No lessons found" };

  // For each lesson, create a progress record if it doesn't exist
  for (const lesson of lessons) {
    const { data: existing } = await supabase
      .from("student_progress")
      .select("id")
      .eq("student_id", userId)
      .eq("lesson_id", lesson.id)
      .single();

    if (!existing) {
      await supabase.from("student_progress").insert({
        student_id: userId,
        lesson_id: lesson.id,
        status: "in_progress",
      });
    }
  }

  return { success: true };
}
