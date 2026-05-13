"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GradeBreakdown {
  grade_level: string;
  students_attempted: number;
  students_completed: number;
  completion_rate: number;
  avg_exchanges: number;
  avg_attempts: number;
  badge_level_distribution: { level_1: number; level_2: number; level_3: number };
}

export interface SponsorReport {
  per_grade_breakdown: GradeBreakdown[];
  totals: {
    total_students_attempted: number;
    total_students_completed: number;
    overall_completion_rate: number;
    avg_exchanges_all_grades: number;
  };
  scenario_info: {
    title: string;
    industry: string;
    difficulty: number;
    is_sponsored: boolean;
    sponsor_name: string | null;
  };
}

/**
 * Get sponsor report for a scenario. Platform owner only.
 * Returns per-grade breakdown with NO student PII.
 */
export async function getScenarioSponsorReport(scenarioId: string): Promise<SponsorReport | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Platform owner only
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!(profile as Record<string, unknown>)?.is_platform_owner) return null;

  const admin = createAdminClient();

  // Load scenario info
  const { data: scenario } = await admin
    .from("scenarios")
    .select("title, industry, difficulty, is_sponsored, sponsor_name")
    .eq("id", scenarioId)
    .single();

  if (!scenario) return null;

  // Load all sessions for this scenario with student grade_level
  const { data: sessions } = await admin
    .from("student_scenario_sessions")
    .select("student_id, status, attempt_number, badge_level_awarded")
    .eq("scenario_id", scenarioId);

  if (!sessions || sessions.length === 0) {
    return {
      per_grade_breakdown: [],
      totals: { total_students_attempted: 0, total_students_completed: 0, overall_completion_rate: 0, avg_exchanges_all_grades: 0 },
      scenario_info: scenario,
    };
  }

  // Get unique student IDs
  const studentIds = [...new Set(sessions.map((s) => s.student_id))];

  // Fetch grade levels for all students (no names, no emails)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, grade_level")
    .in("id", studentIds);

  const gradeMap = new Map((profiles ?? []).map((p) => [p.id, (p as Record<string, unknown>).grade_level as string ?? "unknown"]));

  // Aggregate by grade level
  const gradeData = new Map<string, {
    students: Set<string>;
    completed: Set<string>;
    totalAttempts: number;
    totalSessions: number;
    badges: { 1: number; 2: number; 3: number };
  }>();

  for (const s of sessions) {
    const grade = gradeMap.get(s.student_id) ?? "unknown";
    if (!gradeData.has(grade)) {
      gradeData.set(grade, { students: new Set(), completed: new Set(), totalAttempts: 0, totalSessions: 0, badges: { 1: 0, 2: 0, 3: 0 } });
    }
    const g = gradeData.get(grade)!;
    g.students.add(s.student_id);
    g.totalSessions++;
    g.totalAttempts += s.attempt_number;
    if (s.status === "completed") {
      g.completed.add(s.student_id);
      if (s.badge_level_awarded && s.badge_level_awarded >= 1 && s.badge_level_awarded <= 3) {
        g.badges[s.badge_level_awarded as 1 | 2 | 3]++;
      }
    }
  }

  const per_grade_breakdown: GradeBreakdown[] = [...gradeData.entries()].map(([grade, data]) => ({
    grade_level: grade,
    students_attempted: data.students.size,
    students_completed: data.completed.size,
    completion_rate: data.students.size > 0 ? data.completed.size / data.students.size : 0,
    avg_exchanges: data.students.size > 0 ? data.totalSessions / data.students.size : 0,
    avg_attempts: data.students.size > 0 ? data.totalAttempts / data.students.size : 0,
    badge_level_distribution: { level_1: data.badges[1], level_2: data.badges[2], level_3: data.badges[3] },
  }));

  const totalAttempted = new Set(sessions.map((s) => s.student_id)).size;
  const totalCompleted = new Set(sessions.filter((s) => s.status === "completed").map((s) => s.student_id)).size;

  return {
    per_grade_breakdown,
    totals: {
      total_students_attempted: totalAttempted,
      total_students_completed: totalCompleted,
      overall_completion_rate: totalAttempted > 0 ? totalCompleted / totalAttempted : 0,
      avg_exchanges_all_grades: totalAttempted > 0 ? sessions.length / totalAttempted : 0,
    },
    scenario_info: scenario,
  };
}
