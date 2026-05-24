"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PlatformAnalytics {
  // Students
  totalStudents: number;
  activeLast24h: number;
  activeLast7d: number;
  activeLast30d: number;
  gradeBreakdown: Record<string, number>;

  // Orgs & Classes
  totalOrgs: number;
  totalClasses: number;

  // Lessons & Scenarios
  lessonsCompletedTotal: number;
  lessonsCompletedLast24h: number;
  scenariosCompletedTotal: number;

  // AI Usage
  totalAiExchanges: number;
  aiExchangesLast24h: number;
  totalApiCost: number;
  apiCostLast24h: number;
  avgCostPerStudent: number;
  avgCostPerExchange: number;
  modelBreakdown: Array<{
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;

  // Ratings
  ratings: {
    total: number;
    average: number;
    distribution: Record<number, number>;
  };

  // Crisis
  crisisAlerts: Array<{
    id: string;
    studentName: string;
    message: string;
    createdAt: string;
    acknowledged: boolean;
  }>;

  // At-risk
  atRiskStudents: Array<{
    firstName: string;
    risk: string;
    daysInactive: number;
    currentLesson: string | null;
  }>;

  // Engagement
  engagementStats: {
    avgResponseTimeMs: number;
    medianResponseTimeMs: number;
    avgSessionDurationS: number;
    avgExchangesPerStudent: number;
  };
}

export async function fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
  // Auth check — platform owner only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_owner")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_owner) {
    throw new Error("Not authorized");
  }

  const admin = createAdminClient();
  const now = Date.now();
  const h24 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Parallel queries
  const [
    studentsRes,
    active24Res,
    active7Res,
    active30Res,
    orgsRes,
    classesRes,
    lessonsCompleteRes,
    lessonsComplete24Res,
    scenariosRes,
    totalExchangesRes,
    exchanges24Res,
    usageAllRes,
    usage24Res,
    ratingsRes,
    crisisRes,
    gradesRes,
    responseTimesRes,
    sessionDurationsRes,
  ] = await Promise.all([
    // Total students
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    // Active 24h (distinct students with ai_usage_log)
    admin.from("ai_usage_log").select("student_id").gte("created_at", h24),
    // Active 7d
    admin.from("ai_usage_log").select("student_id").gte("created_at", d7),
    // Active 30d
    admin.from("ai_usage_log").select("student_id").gte("created_at", d30),
    // Orgs
    admin.from("organizations").select("id", { count: "exact", head: true }).eq("is_active", true),
    // Classes
    admin.from("classes").select("id", { count: "exact", head: true }),
    // Lessons completed total
    admin.from("student_progress").select("id", { count: "exact", head: true }).eq("status", "completed"),
    // Lessons completed 24h
    admin.from("student_progress").select("id", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", h24),
    // Scenarios completed
    admin.from("student_scenario_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
    // Total AI exchanges
    admin.from("ai_usage_log").select("id", { count: "exact", head: true }),
    // AI exchanges 24h
    admin.from("ai_usage_log").select("id", { count: "exact", head: true }).gte("created_at", h24),
    // Total cost
    admin.from("ai_usage_log").select("estimated_cost_usd"),
    // Cost 24h
    admin.from("ai_usage_log").select("estimated_cost_usd").gte("created_at", h24),
    // Ratings
    admin.from("lesson_ratings").select("rating"),
    // Crisis alerts (last 30 days, unacknowledged first)
    admin.from("teacher_alerts").select("id, student_id, message, created_at, acknowledged").eq("alert_type", "crisis").gte("created_at", d30).order("created_at", { ascending: false }).limit(10),
    // Grade breakdown
    admin.from("profiles").select("grade_level").eq("role", "student"),
    // Response times
    admin.from("ai_usage_log").select("student_response_time_ms").not("student_response_time_ms", "is", null).order("created_at", { ascending: false }).limit(500),
    // Session durations
    admin.from("ai_usage_log").select("session_duration_seconds").not("session_duration_seconds", "is", null).order("created_at", { ascending: false }).limit(500),
  ]);

  // Compute distinct active students
  const distinctStudents = (rows: { student_id: string }[] | null) =>
    new Set((rows ?? []).map((r) => r.student_id)).size;

  // Compute costs
  const sumCost = (rows: { estimated_cost_usd: number }[] | null) =>
    (rows ?? []).reduce((sum, r) => sum + (r.estimated_cost_usd ?? 0), 0);

  const totalStudents = studentsRes.count ?? 0;
  const totalExchanges = totalExchangesRes.count ?? 0;
  const totalCost = sumCost(usageAllRes.data as { estimated_cost_usd: number }[] | null);
  const cost24h = sumCost(usage24Res.data as { estimated_cost_usd: number }[] | null);

  // Model breakdown
  const { data: modelRows } = await admin
    .from("ai_usage_log")
    .select("model, input_tokens, output_tokens, estimated_cost_usd");

  const modelMap = new Map<string, { calls: number; inputTokens: number; outputTokens: number; cost: number }>();
  for (const r of (modelRows ?? []) as { model: string; input_tokens: number; output_tokens: number; estimated_cost_usd: number }[]) {
    const key = r.model ?? "unknown";
    const existing = modelMap.get(key) ?? { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    existing.calls++;
    existing.inputTokens += r.input_tokens ?? 0;
    existing.outputTokens += r.output_tokens ?? 0;
    existing.cost += r.estimated_cost_usd ?? 0;
    modelMap.set(key, existing);
  }
  const modelBreakdown = [...modelMap.entries()]
    .map(([model, data]) => ({ model, ...data }))
    .sort((a, b) => b.calls - a.calls);

  // Ratings
  const ratingRows = (ratingsRes.data ?? []) as { rating: number }[];
  const ratingDist: Record<number, number> = {};
  let ratingSum = 0;
  for (const r of ratingRows) {
    ratingDist[r.rating] = (ratingDist[r.rating] ?? 0) + 1;
    ratingSum += r.rating;
  }

  // Crisis alerts with student names
  const crisisAlerts: PlatformAnalytics["crisisAlerts"] = [];
  for (const a of (crisisRes.data ?? []) as { id: string; student_id: string; message: string; created_at: string; acknowledged: boolean }[]) {
    const { data: student } = await admin.from("profiles").select("full_name").eq("id", a.student_id).single();
    const firstName = student?.full_name?.split(" ")[0] ?? "Student";
    crisisAlerts.push({ id: a.id, studentName: firstName, message: a.message, createdAt: a.created_at, acknowledged: a.acknowledged });
  }

  // Grade breakdown
  const gradeBreakdown: Record<string, number> = {};
  for (const p of (gradesRes.data ?? []) as { grade_level: string }[]) {
    const grade = p.grade_level ?? "unknown";
    gradeBreakdown[grade] = (gradeBreakdown[grade] ?? 0) + 1;
  }

  // At-risk students (query the view)
  let atRiskStudents: PlatformAnalytics["atRiskStudents"] = [];
  try {
    const { data: atRisk } = await admin
      .from("at_risk_students")
      .select("first_name, risk_reason, days_since_last_activity, current_lesson_title")
      .limit(20);
    atRiskStudents = (atRisk ?? []).map((s: Record<string, unknown>) => ({
      firstName: (s.first_name as string) ?? "Student",
      risk: (s.risk_reason as string) ?? "unknown",
      daysInactive: (s.days_since_last_activity as number) ?? 0,
      currentLesson: (s.current_lesson_title as string) ?? null,
    }));
  } catch {
    // View may not exist yet
  }

  // Engagement stats
  const responseTimes = ((responseTimesRes.data ?? []) as { student_response_time_ms: number }[])
    .map((r) => r.student_response_time_ms)
    .filter((t) => t > 0 && t < 600000); // exclude outliers > 10min

  const sessionDurations = ((sessionDurationsRes.data ?? []) as { session_duration_seconds: number }[])
    .map((r) => r.session_duration_seconds)
    .filter((t) => t > 0);

  const avgRT = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
  const medianRT = responseTimes.length > 0 ? [...responseTimes].sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)] : 0;
  const avgDur = sessionDurations.length > 0 ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length : 0;

  return {
    totalStudents,
    activeLast24h: distinctStudents(active24Res.data as { student_id: string }[] | null),
    activeLast7d: distinctStudents(active7Res.data as { student_id: string }[] | null),
    activeLast30d: distinctStudents(active30Res.data as { student_id: string }[] | null),
    gradeBreakdown,
    totalOrgs: orgsRes.count ?? 0,
    totalClasses: classesRes.count ?? 0,
    lessonsCompletedTotal: lessonsCompleteRes.count ?? 0,
    lessonsCompletedLast24h: lessonsComplete24Res.count ?? 0,
    scenariosCompletedTotal: scenariosRes.count ?? 0,
    totalAiExchanges: totalExchanges,
    aiExchangesLast24h: exchanges24Res.count ?? 0,
    totalApiCost: totalCost,
    apiCostLast24h: cost24h,
    avgCostPerStudent: totalStudents > 0 ? totalCost / totalStudents : 0,
    avgCostPerExchange: totalExchanges > 0 ? totalCost / totalExchanges : 0,
    modelBreakdown,
    ratings: {
      total: ratingRows.length,
      average: ratingRows.length > 0 ? ratingSum / ratingRows.length : 0,
      distribution: ratingDist,
    },
    crisisAlerts,
    atRiskStudents,
    engagementStats: {
      avgResponseTimeMs: avgRT,
      medianResponseTimeMs: medianRT,
      avgSessionDurationS: avgDur,
      avgExchangesPerStudent: totalStudents > 0 ? totalExchanges / totalStudents : 0,
    },
  };
}
