"use server";

import { createClient } from "@/lib/supabase/server";
import { runGroupingAlgorithm, getAlgorithmPreview } from "@/lib/invention-grouping";

type AdminLevel = "platform_owner" | "instructor" | "co_admin";

/**
 * Verify the current user is an admin for this invention class.
 * Returns the permission level so actions can scope behavior.
 */
async function verifyAdmin(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase, user: null, level: null as AdminLevel | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found", supabase, user: null, level: null as AdminLevel | null };

  // Platform owners have unrestricted access to all classes
  const isPlatformOwner = (profile as Record<string, unknown>).is_platform_owner === true;

  const { data: cls } = await supabase
    .from("classes")
    .select("instructor_id, org_id, session_type, grouping_config")
    .eq("id", classId)
    .single();

  if (!cls || cls.session_type !== "invention") {
    return { error: "Class not found or not invention mode", supabase, user: null, level: null as AdminLevel | null };
  }

  const isInstructor = cls.instructor_id === user.id;
  const isOrgAdmin = profile.role === "org_admin";
  const coAdminIds = (cls.grouping_config as Record<string, unknown> | null)?.co_admin_ids as string[] ?? [];
  const isCoAdmin = coAdminIds.includes(user.id);

  if (!isPlatformOwner && !isInstructor && !isOrgAdmin && !isCoAdmin) {
    return { error: "Not authorized", supabase, user: null, level: null as AdminLevel | null };
  }

  const level: AdminLevel = isPlatformOwner ? "platform_owner"
    : (isInstructor || isOrgAdmin) ? "instructor"
    : "co_admin";

  return { supabase, user, cls, level };
}

/**
 * Load all data for the invention admin dashboard.
 */
export async function loadInventionDashboard(classId: string) {
  const auth = await verifyAdmin(classId);
  if (auth.error) return { error: auth.error };

  const { supabase, cls } = auth;

  // Get the invite code for this class
  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code, max_uses, current_uses")
    .eq("class_id", classId)
    .limit(1)
    .single();

  if (!inviteCode) return { error: "No invite code found" };
  const classCode = inviteCode.code;

  // Get all enrollments
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id")
    .eq("class_id", classId);

  const totalEnrolled = enrollments?.length ?? 0;

  // Get all invention sessions
  const { data: sessions } = await supabase
    .from("invention_sessions")
    .select("id, student_id, circle_1_category, circle_2_archetype, circle_3_chips, circle_4_scale, circle_5_voice, completed_at, group_number, generated_card")
    .eq("class_code", classCode);

  const completed = sessions?.filter((s) => s.completed_at) ?? [];
  const inProgress = sessions?.filter((s) => !s.completed_at) ?? [];

  // Circle 1 breakdown
  const circle1Counts: Record<string, number> = {};
  for (const s of completed) {
    const cat = s.circle_1_category ?? "unknown";
    circle1Counts[cat] = (circle1Counts[cat] ?? 0) + 1;
  }

  // Circle 2 breakdown
  const circle2Counts: Record<string, number> = {};
  for (const s of completed) {
    const arch = s.circle_2_archetype ?? "unknown";
    circle2Counts[arch] = (circle2Counts[arch] ?? 0) + 1;
  }

  // Get student names for display
  const studentIds = sessions?.map((s) => s.student_id) ?? [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", studentIds.length > 0 ? studentIds : ["__none__"]);

  const studentMap: Record<string, { name: string; email: string }> = {};
  for (const p of profiles ?? []) {
    studentMap[p.id] = { name: p.full_name ?? "Unknown", email: p.email ?? "" };
  }

  // Get existing groups
  const { data: groups } = await supabase
    .from("invention_groups")
    .select("group_number, student_ids, composition_log")
    .eq("class_code", classCode)
    .order("group_number");

  const config = (cls!.grouping_config as Record<string, unknown>) ?? {};

  return {
    classCode,
    adminLevel: auth.level,
    totalEnrolled,
    completedCount: completed.length,
    inProgressCount: inProgress.length,
    circle1Counts,
    circle2Counts,
    studentMap,
    groups: groups ?? [],
    groupingThreshold: config.grouping_threshold ?? 80,
    groupsRevealed: config.groups_revealed ?? false,
    inProgressStudents: inProgress.map((s) => ({
      id: s.student_id,
      name: studentMap[s.student_id]?.name ?? "Unknown",
      hasCircle1: !!s.circle_1_category,
      hasCircle2: !!s.circle_2_archetype,
      hasCircle3: !!s.circle_3_chips?.length,
      hasCircle4: !!s.circle_4_scale,
      hasCircle5: !!s.circle_5_voice?.length,
    })),
    // Card data for the Cards tab
    cardSessions: (sessions ?? []).map((s) => ({
      sessionId: s.id,
      studentId: s.student_id,
      studentName: studentMap[s.student_id]?.name ?? "Unknown",
      groupNumber: s.group_number,
      completed: !!s.completed_at,
      completedAt: s.completed_at,
      allCirclesDone: !!(s.circle_1_category && s.circle_2_archetype && s.circle_3_chips?.length && s.circle_4_scale && s.circle_5_voice?.length),
      generatedCard: s.generated_card as {
        title: string;
        description: string;
        insights: { wish: string; mind: string; lens: string; scale: string; voice: string };
        shareable_slug: string;
      } | null,
    })),
  };
}

/**
 * Trigger the grouping algorithm.
 */
export async function triggerGrouping(classId: string) {
  const auth = await verifyAdmin(classId);
  if (auth.error) return { error: auth.error };

  // Co-admins cannot run or re-run the grouping algorithm
  if (auth.level === "co_admin") {
    return { error: "Co-admins cannot run the grouping algorithm. Contact the platform administrator." };
  }

  const { supabase } = auth;

  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", classId)
    .limit(1)
    .single();

  if (!inviteCode) return { error: "No invite code found" };

  const config = (auth.cls!.grouping_config as Record<string, unknown>) ?? {};
  // Pass groupSize only if explicitly set in config (override mode).
  // Otherwise let the algorithm auto-recommend based on cohort size.
  const groupSize = config.group_size as number | undefined;

  const result = await runGroupingAlgorithm(inviteCode.code, groupSize);
  return result;
}

/**
 * Get a read-only preview of what the grouping algorithm would produce.
 */
export async function getGroupingPreview(classId: string) {
  const auth = await verifyAdmin(classId);
  if (auth.error) return { error: auth.error };

  const { data: inviteCode } = await auth.supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", classId)
    .limit(1)
    .single();

  if (!inviteCode) return { error: "No invite code found" };

  const preview = await getAlgorithmPreview(inviteCode.code);
  return { preview };
}

/**
 * Reveal groups to students.
 */
export async function revealGroups(classId: string) {
  const auth = await verifyAdmin(classId);
  if (auth.error) return { error: auth.error };

  const { supabase } = auth;
  const config = (auth.cls!.grouping_config as Record<string, unknown>) ?? {};

  await supabase
    .from("classes")
    .update({
      grouping_config: { ...config, groups_revealed: true },
    })
    .eq("id", classId);

  return { success: true };
}

/**
 * Move a student from one group to another.
 */
export async function moveStudent(classId: string, studentId: string, fromGroup: number, toGroup: number) {
  const auth = await verifyAdmin(classId);
  if (auth.error) return { error: auth.error };

  const { supabase } = auth;

  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", classId)
    .limit(1)
    .single();

  if (!inviteCode) return { error: "No invite code found" };
  const classCode = inviteCode.code;

  // Remove from old group
  const { data: oldGroup } = await supabase
    .from("invention_groups")
    .select("id, student_ids")
    .eq("class_code", classCode)
    .eq("group_number", fromGroup)
    .single();

  if (oldGroup) {
    await supabase
      .from("invention_groups")
      .update({ student_ids: oldGroup.student_ids.filter((id: string) => id !== studentId) })
      .eq("id", oldGroup.id);
  }

  // Add to new group
  const { data: newGroup } = await supabase
    .from("invention_groups")
    .select("id, student_ids")
    .eq("class_code", classCode)
    .eq("group_number", toGroup)
    .single();

  if (newGroup) {
    await supabase
      .from("invention_groups")
      .update({ student_ids: [...newGroup.student_ids, studentId] })
      .eq("id", newGroup.id);
  }

  // Update student's group_number
  await supabase
    .from("invention_sessions")
    .update({ group_number: toGroup })
    .eq("student_id", studentId)
    .eq("class_code", classCode);

  return { success: true };
}

/**
 * Remove a student from the invention class entirely.
 * Deletes their invention session, removes them from their group,
 * and deletes their class enrollment. Co-admins cannot delete.
 */
export async function removeStudent(classId: string, studentId: string) {
  const auth = await verifyAdmin(classId);
  if (auth.error) return { error: auth.error };

  if (auth.level === "co_admin") {
    return { error: "Co-admins cannot remove students. Contact the platform administrator." };
  }

  const { supabase } = auth;

  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", classId)
    .limit(1)
    .single();

  if (!inviteCode) return { error: "No invite code found" };
  const classCode = inviteCode.code;

  // Get the student's group before deleting
  const { data: session } = await supabase
    .from("invention_sessions")
    .select("group_number")
    .eq("student_id", studentId)
    .eq("class_code", classCode)
    .single();

  // Remove from group if assigned
  if (session?.group_number) {
    const { data: group } = await supabase
      .from("invention_groups")
      .select("id, student_ids")
      .eq("class_code", classCode)
      .eq("group_number", session.group_number)
      .single();

    if (group) {
      await supabase
        .from("invention_groups")
        .update({ student_ids: group.student_ids.filter((id: string) => id !== studentId) })
        .eq("id", group.id);
    }
  }

  // Delete invention session
  await supabase
    .from("invention_sessions")
    .delete()
    .eq("student_id", studentId)
    .eq("class_code", classCode);

  // Delete class enrollment
  await supabase
    .from("class_enrollments")
    .delete()
    .eq("student_id", studentId)
    .eq("class_id", classId);

  return { success: true };
}
