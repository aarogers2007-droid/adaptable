"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OrgImpactReport {
  studentsActiveLast30Days: number;
  lessonsCompletedTotal: number;
  lessonsCompletedLast30Days: number;
  avgLessonsPerActiveStudent: number;
  scenariosCompletedTotal: number;
  mostCompletedLesson: { title: string; count: number } | null;
  mostDroppedLesson: { title: string; count: number } | null;
  studentGradeBreakdown: Record<string, number>;
  totalAiExchangesAllTime: number;
}

export async function getOrgImpactReport(orgId: string): Promise<OrgImpactReport> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify caller is org_admin or platform owner for this org
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, is_platform_owner")
    .eq("id", user.id)
    .single();

  const isPlatformOwner = (profile as Record<string, unknown>)?.is_platform_owner === true;
  if (!isPlatformOwner && (profile?.role !== "org_admin" || profile?.org_id !== orgId)) {
    throw new Error("Not authorized");
  }

  const admin = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // All queries use org_id filter → uses idx_ai_usage_log_org
  const [
    activeStudentsRes,
    lessonsCompletedTotalRes,
    lessonsCompleted30Res,
    scenariosRes,
    totalExchangesRes,
    gradeRes,
  ] = await Promise.all([
    // Active students last 30 days
    admin.from("ai_usage_log").select("student_id", { count: "exact", head: true })
      .eq("org_id", orgId).gte("created_at", thirtyDaysAgo),

    // Total lessons completed (completion_flag = true)
    admin.from("ai_usage_log").select("id", { count: "exact", head: true })
      .eq("org_id", orgId).eq("completion_flag", true),

    // Lessons completed last 30 days
    admin.from("ai_usage_log").select("id", { count: "exact", head: true })
      .eq("org_id", orgId).eq("completion_flag", true).gte("created_at", thirtyDaysAgo),

    // Scenarios completed — placeholder, computed below with org filter
    Promise.resolve({ count: null }),

    // Total AI exchanges
    admin.from("ai_usage_log").select("id", { count: "exact", head: true })
      .eq("org_id", orgId),

    // Grade breakdown
    admin.from("profiles").select("grade_level")
      .eq("org_id", orgId).eq("role", "student"),
  ]);

  const activeStudents = activeStudentsRes.count ?? 0;
  const lessonsCompletedTotal = lessonsCompletedTotalRes.count ?? 0;
  const lessonsCompleted30 = lessonsCompleted30Res.count ?? 0;
  const totalExchanges = totalExchangesRes.count ?? 0;
  void scenariosRes; // placeholder resolved above

  // Scenarios completed — org-scoped via student profile join
  // student_scenario_sessions has no org_id column, so we get org students first
  const { data: orgStudentIds } = await admin
    .from("profiles")
    .select("id")
    .eq("org_id", orgId)
    .eq("role", "student");
  const studentIds = (orgStudentIds ?? []).map((s) => s.id);
  let scenariosTotal = 0;
  if (studentIds.length > 0) {
    const { count } = await admin
      .from("student_scenario_sessions")
      .select("id", { count: "exact", head: true })
      .in("student_id", studentIds)
      .eq("status", "completed");
    scenariosTotal = count ?? 0;
  }

  // Grade breakdown
  const gradeBreakdown: Record<string, number> = {};
  for (const p of (gradeRes.data ?? []) as { grade_level: string }[]) {
    const grade = p.grade_level ?? "unknown";
    gradeBreakdown[grade] = (gradeBreakdown[grade] ?? 0) + 1;
  }

  // Most completed lesson (by completion_flag count)
  const { data: topLessons } = await admin
    .from("ai_usage_log")
    .select("lesson_id")
    .eq("org_id", orgId)
    .eq("completion_flag", true)
    .not("lesson_id", "is", null);

  let mostCompleted: { title: string; count: number } | null = null;
  if (topLessons && topLessons.length > 0) {
    const counts = new Map<string, number>();
    for (const row of topLessons) {
      counts.set(row.lesson_id, (counts.get(row.lesson_id) ?? 0) + 1);
    }
    const topEntry = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topEntry) {
      const { data: lesson } = await admin.from("lessons").select("title").eq("id", topEntry[0]).single();
      mostCompleted = { title: lesson?.title ?? topEntry[0], count: topEntry[1] };
    }
  }

  // Most dropped lesson (by drop_off_flag count)
  const { data: droppedLessons } = await admin
    .from("ai_usage_log")
    .select("lesson_id")
    .eq("org_id", orgId)
    .eq("drop_off_flag", true)
    .not("lesson_id", "is", null);

  let mostDropped: { title: string; count: number } | null = null;
  if (droppedLessons && droppedLessons.length > 0) {
    const counts = new Map<string, number>();
    for (const row of droppedLessons) {
      counts.set(row.lesson_id, (counts.get(row.lesson_id) ?? 0) + 1);
    }
    const topEntry = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topEntry) {
      const { data: lesson } = await admin.from("lessons").select("title").eq("id", topEntry[0]).single();
      mostDropped = { title: lesson?.title ?? topEntry[0], count: topEntry[1] };
    }
  }

  return {
    studentsActiveLast30Days: activeStudents,
    lessonsCompletedTotal,
    lessonsCompletedLast30Days: lessonsCompleted30,
    avgLessonsPerActiveStudent: activeStudents > 0 ? Math.round((lessonsCompleted30 / activeStudents) * 10) / 10 : 0,
    scenariosCompletedTotal: scenariosTotal,
    mostCompletedLesson: mostCompleted,
    mostDroppedLesson: mostDropped,
    studentGradeBreakdown: gradeBreakdown,
    totalAiExchangesAllTime: totalExchanges,
  };
}

export interface AtRiskStudent {
  student_id: string;
  first_name: string;
  risk_reason: string;
  days_since_last_activity: number;
  current_lesson_title: string | null;
  grade_level: string | null;
}

export async function getAtRiskStudents(orgId: string): Promise<AtRiskStudent[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, is_platform_owner")
    .eq("id", user.id)
    .single();

  const isPlatformOwner = (profile as Record<string, unknown>)?.is_platform_owner === true;
  if (!isPlatformOwner && (profile?.role !== "org_admin" || profile?.org_id !== orgId)) {
    return [];
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("at_risk_students")
    .select("*")
    .eq("org_id", orgId)
    .limit(50);

  return (data ?? []) as AtRiskStudent[];
}

/**
 * Export org-wide impact data as CSV.
 * Includes per-student: name, email, grade, business idea, lessons completed,
 * scenarios completed, AI exchanges, and last active date.
 */
export async function exportOrgImpactCSV(orgId: string): Promise<{ csv?: string; filename?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, is_platform_owner")
    .eq("id", user.id)
    .single();

  const isPlatformOwner = (profile as Record<string, unknown>)?.is_platform_owner === true;
  if (!isPlatformOwner && (profile?.role !== "org_admin" || profile?.org_id !== orgId)) {
    return { error: "Not authorized" };
  }

  const admin = createAdminClient();

  // Get org name for filename
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();
  const orgName = org?.name ?? "org";

  // Get all students in the org
  const { data: students } = await admin
    .from("profiles")
    .select("id, full_name, email, grade_tier, business_idea")
    .eq("org_id", orgId)
    .eq("role", "student");

  if (!students || students.length === 0) {
    const headers = "Full Name,Email,Grade Tier,Business Name,Niche,Lessons Completed,Scenarios Completed,Total AI Exchanges,Last Active\n";
    const safeOrg = orgName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const date = new Date().toISOString().split("T")[0];
    return { csv: headers, filename: `${safeOrg}-impact-report-${date}.csv` };
  }

  const studentIds = students.map((s) => s.id);

  // Batch fetch all needed data
  const [progressRes, scenariosRes, aiUsageRes, activityRes] = await Promise.all([
    // Lessons completed
    admin.from("student_progress")
      .select("student_id, status")
      .in("student_id", studentIds)
      .eq("status", "completed"),

    // Scenarios completed
    admin.from("student_scenario_sessions")
      .select("student_id, status")
      .in("student_id", studentIds)
      .eq("status", "completed"),

    // Total AI exchanges per student
    admin.from("ai_usage_log")
      .select("student_id")
      .in("student_id", studentIds),

    // Last active (most recent ai_usage_log or student_progress timestamp)
    admin.from("ai_usage_log")
      .select("student_id, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false }),
  ]);

  const allProgress = progressRes.data ?? [];
  const allScenarios = scenariosRes.data ?? [];
  const allAiUsage = aiUsageRes.data ?? [];
  const allActivity = activityRes.data ?? [];

  // Also get last progress timestamps for last_active fallback
  const { data: progressTimestamps } = await admin
    .from("student_progress")
    .select("student_id, completed_at")
    .in("student_id", studentIds)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  // Build per-student maps
  const lessonsMap = new Map<string, number>();
  for (const p of allProgress) {
    lessonsMap.set(p.student_id, (lessonsMap.get(p.student_id) ?? 0) + 1);
  }

  const scenariosMap = new Map<string, number>();
  for (const s of allScenarios) {
    scenariosMap.set(s.student_id, (scenariosMap.get(s.student_id) ?? 0) + 1);
  }

  const aiExchangesMap = new Map<string, number>();
  for (const a of allAiUsage) {
    aiExchangesMap.set(a.student_id, (aiExchangesMap.get(a.student_id) ?? 0) + 1);
  }

  const lastActiveMap = new Map<string, string>();
  for (const log of allActivity) {
    if (!lastActiveMap.has(log.student_id)) {
      lastActiveMap.set(log.student_id, log.created_at);
    }
  }
  // Merge progress timestamps (take the more recent of the two)
  for (const p of (progressTimestamps ?? [])) {
    if (!p.completed_at) continue;
    const existing = lastActiveMap.get(p.student_id);
    if (!existing || new Date(p.completed_at) > new Date(existing)) {
      lastActiveMap.set(p.student_id, p.completed_at);
    }
  }

  // CSV helpers
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows: string[] = [];
  rows.push([
    "Full Name", "Email", "Grade Tier", "Business Name", "Niche",
    "Lessons Completed", "Scenarios Completed", "Total AI Exchanges", "Last Active",
  ].join(","));

  type StudentProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
    grade_tier: string | null;
    business_idea: { name?: string; niche?: string } | null;
  };

  for (const s of students as StudentProfile[]) {
    const lastActive = lastActiveMap.get(s.id);
    const lastActiveStr = lastActive
      ? new Date(lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Never";

    rows.push([
      escape(s.full_name),
      escape(s.email),
      escape(s.grade_tier),
      escape((s.business_idea as { name?: string })?.name),
      escape((s.business_idea as { niche?: string })?.niche),
      escape(lessonsMap.get(s.id) ?? 0),
      escape(scenariosMap.get(s.id) ?? 0),
      escape(aiExchangesMap.get(s.id) ?? 0),
      escape(lastActiveStr),
    ].join(","));
  }

  const safeOrg = orgName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const date = new Date().toISOString().split("T")[0];
  return { csv: rows.join("\n"), filename: `${safeOrg}-impact-report-${date}.csv` };
}
