"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStudentAchievements, ACHIEVEMENT_MAP } from "@/lib/achievements";
import type { AchievementTier } from "@/lib/achievements";

export interface StudentProfileData {
  displayName: string;
  businessName: string | null;
  achievements: {
    id: string;
    name: string;
    icon: string;
    tier: AchievementTier;
  }[];
}

export async function getStudentProfile(
  studentId: string
): Promise<StudentProfileData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify the requesting user is a classmate or org member of the target student
  const admin = createAdminClient();

  const { data: callerEnrollments } = await admin
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", user.id);

  const { data: targetEnrollments } = await admin
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", studentId);

  if (!callerEnrollments || !targetEnrollments) return null;

  const callerClasses = new Set(callerEnrollments.map((e) => e.class_id));
  const isClassmate = targetEnrollments.some((e) => callerClasses.has(e.class_id));

  if (!isClassmate) {
    // Not a classmate — also check org membership
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("org_id")
      .eq("id", studentId)
      .single();

    const sameOrg = callerProfile?.org_id && targetProfile?.org_id && callerProfile.org_id === targetProfile.org_id;
    if (!sameOrg) return null; // Not a classmate or org member — deny access
  }

  // Fetch profile (now verified the caller has access)
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, business_idea")
    .eq("id", studentId)
    .single();

  if (!profile) return null;

  const fullName = profile.full_name as string | null;
  const businessIdea = profile.business_idea as { name?: string } | null;

  let displayName = "Anonymous";
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    displayName =
      parts.length === 1
        ? parts[0]
        : `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }

  const earned = await getStudentAchievements(admin, studentId);

  const achievements = earned
    .map((e) => {
      const def = ACHIEVEMENT_MAP.get(e.achievement_id);
      if (!def) return null;
      return {
        id: e.achievement_id,
        name: def.name,
        icon: def.icon,
        tier: e.tier,
      };
    })
    .filter(Boolean) as StudentProfileData["achievements"];

  return {
    displayName,
    businessName: businessIdea?.name ?? null,
    achievements,
  };
}
