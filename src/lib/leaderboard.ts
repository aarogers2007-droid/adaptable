import type { SupabaseClient } from "@supabase/supabase-js";

export interface LeaderboardEntry {
  studentId: string;
  displayName: string;
  rank: number;
  primaryValue: number;
  secondaryValue?: number;
  isCurrentStudent: boolean;
}

export interface LeaderboardData {
  consistency: LeaderboardEntry[];
  engagement: LeaderboardEntry[];
  depth: LeaderboardEntry[];
  improved: LeaderboardEntry[];
}

/**
 * Format full_name as "First L." (e.g., "Aisha Johnson" → "Aisha J.")
 */
function formatDisplayName(fullName: string | null): string {
  if (!fullName) return "Anonymous";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Get the start of the current week (Monday 00:00 UTC).
 */
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - diff,
    0, 0, 0, 0
  ));
  return monday;
}

/**
 * Compute check-in streak (consecutive calendar days with a check-in, going backwards from today).
 */
function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Get unique calendar dates (UTC), sorted descending
  const uniqueDays = [...new Set(dates.map(d => {
    const dt = new Date(d);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
  }))].sort().reverse();

  const today = new Date();
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

  // Start counting from today or yesterday
  let streak = 0;
  let expectedDate = new Date(todayStr + "T00:00:00Z");

  // If the most recent check-in is not today, check yesterday
  if (uniqueDays[0] !== todayStr) {
    expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    const yesterdayStr = `${expectedDate.getUTCFullYear()}-${String(expectedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(expectedDate.getUTCDate()).padStart(2, "0")}`;
    if (uniqueDays[0] !== yesterdayStr) {
      return 0; // No recent check-in, streak is broken
    }
  }

  for (const dayStr of uniqueDays) {
    const expStr = `${expectedDate.getUTCFullYear()}-${String(expectedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(expectedDate.getUTCDate()).padStart(2, "0")}`;
    if (dayStr === expStr) {
      streak++;
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    } else if (dayStr < expStr) {
      break; // gap found
    }
  }

  return streak;
}

/**
 * Rank entries by primary value (desc), then secondary value (desc).
 * Returns top entries with correct rank numbers.
 */
function rankEntries(
  items: { studentId: string; displayName: string; primaryValue: number; secondaryValue: number }[],
  currentStudentId: string
): LeaderboardEntry[] {
  const sorted = [...items].sort((a, b) => {
    if (b.primaryValue !== a.primaryValue) return b.primaryValue - a.primaryValue;
    return b.secondaryValue - a.secondaryValue;
  });

  return sorted.map((item, i) => ({
    studentId: item.studentId,
    displayName: item.displayName,
    rank: i + 1,
    primaryValue: item.primaryValue,
    secondaryValue: item.secondaryValue,
    isCurrentStudent: item.studentId === currentStudentId,
  }));
}

export async function getLeaderboardData(
  supabase: SupabaseClient,
  studentIds: string[],
  currentStudentId: string,
  timeframe: "all_time" | "this_week"
): Promise<LeaderboardData> {
  if (studentIds.length === 0) {
    return { consistency: [], engagement: [], depth: [], improved: [] };
  }

  const weekStart = timeframe === "this_week" ? getWeekStart().toISOString() : null;

  // Fetch profiles for display names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", studentIds);

  const nameMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameMap.set(p.id, formatDisplayName(p.full_name));
  }

  // --- CONSISTENCY: streak + active days ---
  let checkinQuery = supabase
    .from("daily_checkins")
    .select("student_id, created_at")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });
  if (weekStart) checkinQuery = checkinQuery.gte("created_at", weekStart);

  let usageQueryForActive = supabase
    .from("ai_usage_log")
    .select("student_id, created_at")
    .in("student_id", studentIds);
  if (weekStart) usageQueryForActive = usageQueryForActive.gte("created_at", weekStart);

  // --- ENGAGEMENT: AI messages + checkpoints ---
  let usageQueryForMessages = supabase
    .from("ai_usage_log")
    .select("student_id")
    .in("student_id", studentIds)
    .in("feature", ["guide", "lesson"]);
  if (weekStart) usageQueryForMessages = usageQueryForMessages.gte("created_at", weekStart);

  let progressQuery = supabase
    .from("student_progress")
    .select("student_id, artifacts")
    .in("student_id", studentIds)
    .not("artifacts", "is", null);
  if (weekStart) progressQuery = progressQuery.gte("created_at", weekStart);

  // --- DEPTH: avg response length + decision journal entries ---
  let decisionsQuery = supabase
    .from("lesson_decisions")
    .select("student_id")
    .in("student_id", studentIds);
  if (weekStart) decisionsQuery = decisionsQuery.gte("created_at", weekStart);

  // Execute all queries in parallel
  const [
    checkinRes,
    activeRes,
    messagesRes,
    progressRes,
    decisionsRes,
  ] = await Promise.all([
    checkinQuery,
    usageQueryForActive,
    usageQueryForMessages,
    progressQuery,
    decisionsQuery,
  ]);

  const checkins = checkinRes.data ?? [];
  const activeUsage = activeRes.data ?? [];
  const messages = messagesRes.data ?? [];
  const progressRows = progressRes.data ?? [];
  const decisions = decisionsRes.data ?? [];

  // --- Compute CONSISTENCY ---
  const checkinsByStudent = new Map<string, string[]>();
  for (const c of checkins) {
    const arr = checkinsByStudent.get(c.student_id) ?? [];
    arr.push(c.created_at);
    checkinsByStudent.set(c.student_id, arr);
  }

  const activeDaysByStudent = new Map<string, Set<string>>();
  for (const u of activeUsage) {
    if (!u.student_id) continue;
    const set = activeDaysByStudent.get(u.student_id) ?? new Set();
    const dt = new Date(u.created_at);
    set.add(`${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`);
    activeDaysByStudent.set(u.student_id, set);
  }

  const consistencyItems = studentIds.map(id => ({
    studentId: id,
    displayName: nameMap.get(id) ?? "Anonymous",
    primaryValue: timeframe === "all_time"
      ? computeStreak(checkinsByStudent.get(id) ?? [])
      : (checkinsByStudent.get(id) ?? []).length,
    secondaryValue: activeDaysByStudent.get(id)?.size ?? 0,
  }));

  // --- Compute ENGAGEMENT ---
  const messageCountByStudent = new Map<string, number>();
  for (const m of messages) {
    if (!m.student_id) continue;
    messageCountByStudent.set(m.student_id, (messageCountByStudent.get(m.student_id) ?? 0) + 1);
  }

  const checkpointsByStudent = new Map<string, Set<string>>();
  for (const p of progressRows) {
    const artifacts = p.artifacts as Record<string, unknown> | null;
    const reached = (artifacts?.checkpoints_reached ?? []) as string[];
    if (reached.length > 0) {
      const set = checkpointsByStudent.get(p.student_id) ?? new Set();
      for (const cp of reached) set.add(cp);
      checkpointsByStudent.set(p.student_id, set);
    }
  }

  const engagementItems = studentIds.map(id => ({
    studentId: id,
    displayName: nameMap.get(id) ?? "Anonymous",
    primaryValue: messageCountByStudent.get(id) ?? 0,
    secondaryValue: checkpointsByStudent.get(id)?.size ?? 0,
  }));

  // --- Compute DEPTH ---
  // Checkpoint passage rate (checkpoints reached) + decision journal entries
  // This rewards understanding, not verbosity. Fair to ESL students.
  const decisionCountByStudent = new Map<string, number>();
  for (const d of decisions) {
    decisionCountByStudent.set(d.student_id, (decisionCountByStudent.get(d.student_id) ?? 0) + 1);
  }

  const depthItems = studentIds.map(id => ({
    studentId: id,
    displayName: nameMap.get(id) ?? "Anonymous",
    primaryValue: checkpointsByStudent.get(id)?.size ?? 0,
    secondaryValue: decisionCountByStudent.get(id) ?? 0,
  }));

  // --- Compute MOST IMPROVED (weekly: this week's messages vs last week's) ---
  const weekStartDate = getWeekStart();
  const prevWeekStart = new Date(weekStartDate);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

  // Count this week and last week messages per student
  const thisWeekCounts = new Map<string, number>();
  const lastWeekCounts = new Map<string, number>();

  for (const u of activeUsage) {
    if (!u.student_id) continue;
    const ts = new Date(u.created_at);
    if (ts >= weekStartDate) {
      thisWeekCounts.set(u.student_id, (thisWeekCounts.get(u.student_id) ?? 0) + 1);
    } else if (ts >= prevWeekStart && ts < weekStartDate) {
      lastWeekCounts.set(u.student_id, (lastWeekCounts.get(u.student_id) ?? 0) + 1);
    }
  }

  const improvedItems = studentIds.map(id => {
    const thisWeek = thisWeekCounts.get(id) ?? 0;
    const lastWeek = lastWeekCounts.get(id) ?? 0;
    const improvement = thisWeek - lastWeek;
    return {
      studentId: id,
      displayName: nameMap.get(id) ?? "Anonymous",
      primaryValue: improvement > 0 ? improvement : 0,
      secondaryValue: thisWeek,
    };
  });

  return {
    consistency: rankEntries(consistencyItems, currentStudentId),
    engagement: rankEntries(engagementItems, currentStudentId),
    depth: rankEntries(depthItems, currentStudentId),
    improved: rankEntries(improvedItems, currentStudentId),
  };
}
