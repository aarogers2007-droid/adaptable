"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { categorizeNiche } from "@/lib/niche-categories";

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
    // Active students last 30 days (fetch IDs and deduplicate in JS)
    // TODO: Replace with a SQL view using COUNT(DISTINCT student_id) for efficiency at scale
    admin.from("ai_usage_log").select("student_id")
      .eq("org_id", orgId).gte("created_at", thirtyDaysAgo),

    // Total lessons completed (from student_progress — one row per student-lesson, no double-counting)
    // Placeholder — resolved below after orgStudentIds are fetched
    Promise.resolve({ count: null }),

    // Lessons completed last 30 days — placeholder, resolved below
    Promise.resolve({ count: null }),

    // Scenarios completed — placeholder, computed below with org filter
    Promise.resolve({ count: null }),

    // Total AI exchanges
    admin.from("ai_usage_log").select("id", { count: "exact", head: true })
      .eq("org_id", orgId),

    // Grade breakdown
    admin.from("profiles").select("grade_level")
      .eq("org_id", orgId).eq("role", "student"),
  ]);

  const activeStudents = new Set((activeStudentsRes.data ?? []).map(r => r.student_id)).size;
  const totalExchanges = totalExchangesRes.count ?? 0;
  void lessonsCompletedTotalRes; // placeholder — resolved below from student_progress
  void lessonsCompleted30Res; // placeholder — resolved below from student_progress
  void scenariosRes; // placeholder resolved above

  // Get org student IDs for cross-table queries (student_progress, scenarios)
  const { data: orgStudentIds } = await admin
    .from("profiles")
    .select("id")
    .eq("org_id", orgId)
    .eq("role", "student");
  const studentIds = (orgStudentIds ?? []).map((s) => s.id);

  // Lessons completed from student_progress (one row per student-lesson, no double-counting)
  let lessonsCompletedTotal = 0;
  let lessonsCompleted30 = 0;
  if (studentIds.length > 0) {
    const [totalRes, last30Res] = await Promise.all([
      admin.from("student_progress").select("id", { count: "exact", head: true })
        .in("student_id", studentIds).eq("status", "completed"),
      admin.from("student_progress").select("id", { count: "exact", head: true })
        .in("student_id", studentIds).eq("status", "completed").gte("completed_at", thirtyDaysAgo),
    ]);
    lessonsCompletedTotal = totalRes.count ?? 0;
    lessonsCompleted30 = last30Res.count ?? 0;
  }
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
export async function exportOrgImpactCSV(orgId: string, includeEmails = false): Promise<{ csv?: string; filename?: string; error?: string }> {
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
    .select("id, full_name, email, grade_level, business_idea")
    .eq("org_id", orgId)
    .eq("role", "student");

  if (!students || students.length === 0) {
    const headers = "Full Name,Email,Grade Level,Business Name,Niche,Lessons Completed,Scenarios Completed,Total AI Exchanges,Last Active\n";
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
    "Full Name", "Email", "Grade Level", "Business Name", "Niche",
    "Lessons Completed", "Scenarios Completed", "Total AI Exchanges", "Last Active",
  ].join(","));

  type StudentProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
    grade_level: string | null;
    business_idea: { name?: string; niche?: string } | null;
  };

  for (const s of students as StudentProfile[]) {
    const lastActive = lastActiveMap.get(s.id);
    const lastActiveStr = lastActive
      ? new Date(lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Never";

    const emailValue = includeEmails
      ? s.email
      : s.email ? s.email.replace(/^(.{1,2}).*@/, (_, start) => start + "***@") : "";

    rows.push([
      escape(s.full_name),
      escape(emailValue),
      escape(s.grade_level),
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

// ─── Lesson Health Scores ───

export interface LessonHealth {
  lessonId: string;
  title: string;
  moduleSequence: number;
  lessonSequence: number;
  healthScore: number;
  completionRate: number;
  dropOffRate: number;
  avgSessionSeconds: number;
  studentsStarted: number;
  studentsCompleted: number;
  isActive: boolean;
}

export async function getLessonHealthScores(orgId: string): Promise<LessonHealth[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!profile) return [];
  if (profile.role !== "org_admin" && !(profile as Record<string, unknown>).is_platform_owner) return [];
  if (profile.org_id !== orgId && !(profile as Record<string, unknown>).is_platform_owner) return [];

  // Determine which org's lessons to check
  const { data: org } = await supabase
    .from("organizations")
    .select("curriculum_source")
    .eq("id", orgId)
    .single();

  const lessonOrgId = org?.curriculum_source === "custom" ? orgId : "00000000-0000-0000-0000-000000000001";

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, module_sequence, lesson_sequence, is_active")
    .eq("org_id", lessonOrgId)
    .order("module_sequence")
    .order("lesson_sequence");

  if (!lessons || lessons.length === 0) return [];

  // Get org student IDs
  const { data: students } = await supabase
    .from("profiles")
    .select("id")
    .eq("org_id", orgId)
    .eq("role", "student");

  const studentIds = (students ?? []).map((s) => s.id);
  if (studentIds.length === 0) {
    return lessons.map((l) => ({
      lessonId: l.id,
      title: l.title,
      moduleSequence: l.module_sequence,
      lessonSequence: l.lesson_sequence,
      healthScore: 100,
      completionRate: 0,
      dropOffRate: 0,
      avgSessionSeconds: 0,
      studentsStarted: 0,
      studentsCompleted: 0,
      isActive: l.is_active ?? true,
    }));
  }

  // Get all progress for these students
  const { data: progress } = await supabase
    .from("student_progress")
    .select("lesson_id, status")
    .in("student_id", studentIds);

  // Get usage data per lesson
  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("lesson_id, session_duration_seconds, drop_off_flag")
    .in("student_id", studentIds)
    .not("lesson_id", "is", null);

  const progressByLesson = new Map<string, { started: number; completed: number }>();
  for (const p of progress ?? []) {
    if (!p.lesson_id) continue;
    const entry = progressByLesson.get(p.lesson_id) ?? { started: 0, completed: 0 };
    entry.started++;
    if (p.status === "completed") entry.completed++;
    progressByLesson.set(p.lesson_id, entry);
  }

  const usageByLesson = new Map<string, { totalDuration: number; count: number; dropOffs: number }>();
  for (const u of usage ?? []) {
    if (!u.lesson_id) continue;
    const entry = usageByLesson.get(u.lesson_id) ?? { totalDuration: 0, count: 0, dropOffs: 0 };
    entry.count++;
    entry.totalDuration += u.session_duration_seconds ?? 0;
    if (u.drop_off_flag) entry.dropOffs++;
    usageByLesson.set(u.lesson_id, entry);
  }

  return lessons.map((l) => {
    const prog = progressByLesson.get(l.id) ?? { started: 0, completed: 0 };
    const use = usageByLesson.get(l.id) ?? { totalDuration: 0, count: 0, dropOffs: 0 };

    const completionRate = prog.started > 0 ? prog.completed / prog.started : 0;
    const dropOffRate = use.count > 0 ? use.dropOffs / use.count : 0;
    const avgSessionSeconds = use.count > 0 ? use.totalDuration / use.count : 0;

    // Session duration score: 5-15 min is ideal (300-900s)
    let sessionScore = 0;
    if (avgSessionSeconds >= 300 && avgSessionSeconds <= 900) sessionScore = 1;
    else if (avgSessionSeconds > 0 && avgSessionSeconds < 300) sessionScore = avgSessionSeconds / 300;
    else if (avgSessionSeconds > 900) sessionScore = Math.max(0, 1 - (avgSessionSeconds - 900) / 1800);

    const healthScore = Math.round(
      completionRate * 40 +
      (1 - dropOffRate) * 25 +
      sessionScore * 20 +
      // Return rate placeholder (would need multi-day query, skip for now)
      (prog.started > 0 ? 0.5 : 0) * 15
    );

    return {
      lessonId: l.id,
      title: l.title,
      moduleSequence: l.module_sequence,
      lessonSequence: l.lesson_sequence,
      healthScore: Math.min(100, Math.max(0, healthScore)),
      completionRate,
      dropOffRate,
      avgSessionSeconds,
      studentsStarted: prog.started,
      studentsCompleted: prog.completed,
      isActive: l.is_active ?? true,
    };
  }).sort((a, b) => a.healthScore - b.healthScore);
}

export async function deactivateLesson(orgId: string, lessonId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role, org_id").eq("id", user.id).single();
  if (profile?.org_id !== orgId || profile?.role !== "org_admin") return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();
  // Verify lesson belongs to this org or is a default curriculum lesson
  const { data: lesson } = await admin.from("lessons").select("org_id").eq("id", lessonId).single();
  if (!lesson || (lesson.org_id !== orgId && lesson.org_id !== "00000000-0000-0000-0000-000000000001")) {
    return { success: false, error: "Lesson not found or not accessible" };
  }
  await admin.from("lessons").update({ is_active: false }).eq("id", lessonId);
  await admin.from("lesson_reviews").insert({ lesson_id: lessonId, org_id: orgId, admin_id: user.id, action: "deactivated", notes: notes ?? null });

  return { success: true };
}

export async function reactivateLesson(orgId: string, lessonId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role, org_id").eq("id", user.id).single();
  if (profile?.org_id !== orgId || profile?.role !== "org_admin") return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();
  // Verify lesson belongs to this org or is a default curriculum lesson
  const { data: lesson } = await admin.from("lessons").select("org_id").eq("id", lessonId).single();
  if (!lesson || (lesson.org_id !== orgId && lesson.org_id !== "00000000-0000-0000-0000-000000000001")) {
    return { success: false, error: "Lesson not found or not accessible" };
  }
  await admin.from("lessons").update({ is_active: true }).eq("id", lessonId);
  await admin.from("lesson_reviews").insert({ lesson_id: lessonId, org_id: orgId, admin_id: user.id, action: "reactivated" });

  return { success: true };
}

export async function flagLesson(orgId: string, lessonId: string, notes: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role, org_id").eq("id", user.id).single();
  if (profile?.org_id !== orgId || profile?.role !== "org_admin") return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();
  await admin.from("lesson_reviews").insert({ lesson_id: lessonId, org_id: orgId, admin_id: user.id, action: "flagged", notes });

  return { success: true };
}

// ─── Business Idea Distribution ───

export interface BusinessSegment {
  category: string;
  count: number;
  percentage: number;
}

export async function getBusinessIdeaDistribution(orgId: string): Promise<BusinessSegment[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!profile) return [];
  if (profile.role !== "org_admin" && !(profile as Record<string, unknown>).is_platform_owner) return [];
  if (profile.org_id !== orgId && !(profile as Record<string, unknown>).is_platform_owner) return [];

  const { data: students } = await supabase
    .from("profiles")
    .select("business_idea")
    .eq("org_id", orgId)
    .eq("role", "student")
    .not("business_idea", "is", null);

  if (!students || students.length === 0) return [];

  const counts = new Map<string, number>();
  for (const s of students) {
    const idea = s.business_idea as { niche?: string } | null;
    const niche = idea?.niche ?? "";
    const category = categorizeNiche(niche);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const total = students.length;
  return [...counts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── Student Roster ───

export interface RosterStudent {
  id: string;
  fullName: string;
  gradeTier: string;
  businessName: string | null;
  lessonsCompleted: number;
  totalLessons: number;
  lastActive: string | null;
  status: "active" | "at-risk" | "inactive";
}

export async function getStudentRoster(orgId: string): Promise<RosterStudent[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id, is_platform_owner")
    .eq("id", user.id)
    .single();

  const isPlatformOwner = (profile as Record<string, unknown>)?.is_platform_owner === true;
  if (!isPlatformOwner && (profile?.role !== "org_admin" || profile?.org_id !== orgId)) return [];

  const admin = createAdminClient();

  const { data: students } = await admin
    .from("profiles")
    .select("id, full_name, grade_tier, business_idea")
    .eq("org_id", orgId)
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (!students || students.length === 0) return [];

  const studentIds = students.map((s) => s.id);

  // Progress and last activity in parallel
  const [progressRes, lastActivityRes, atRiskRes] = await Promise.all([
    admin.from("student_progress").select("student_id, status").in("student_id", studentIds),
    admin.from("ai_usage_log").select("student_id, created_at").in("student_id", studentIds).order("created_at", { ascending: false }),
    admin.from("at_risk_students").select("student_id").eq("org_id", orgId),
  ]);

  const completedMap = new Map<string, number>();
  for (const p of progressRes.data ?? []) {
    if (p.status === "completed") {
      completedMap.set(p.student_id, (completedMap.get(p.student_id) ?? 0) + 1);
    }
  }

  const lastActiveMap = new Map<string, string>();
  for (const a of lastActivityRes.data ?? []) {
    if (!lastActiveMap.has(a.student_id)) {
      lastActiveMap.set(a.student_id, a.created_at);
    }
  }

  const atRiskSet = new Set((atRiskRes.data ?? []).map((r) => r.student_id));

  const { data: allLessons } = await admin.from("lessons").select("id");
  const totalLessons = allLessons?.length ?? 22;

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  return students.map((s) => {
    const lastActive = lastActiveMap.get(s.id) ?? null;
    const isAtRisk = atRiskSet.has(s.id);
    const isInactive = !lastActive || lastActive < threeDaysAgo;
    const biz = s.business_idea as { name?: string } | null;

    return {
      id: s.id,
      fullName: s.full_name ?? "Student",
      gradeTier: s.grade_tier ?? "unknown",
      businessName: biz?.name ?? null,
      lessonsCompleted: completedMap.get(s.id) ?? 0,
      totalLessons,
      lastActive,
      status: isAtRisk ? "at-risk" as const : isInactive ? "inactive" as const : "active" as const,
    };
  });
}
