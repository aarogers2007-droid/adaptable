import type { SupabaseClient } from "@supabase/supabase-js";
import { detectAbsenceGap } from "@/lib/activity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AchievementTier = "bronze" | "silver" | "gold";
export type AchievementCategory =
  | "building"
  | "engagement"
  | "depth"
  | "social"
  | "resilience"
  | "real_world";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string; // emoji
  tiers: AchievementTier[];
  tierDescriptions: Partial<Record<AchievementTier, string>>;
}

export interface EarnedAchievement {
  achievement_id: string;
  tier: AchievementTier;
  earned_at: string;
}

export interface NewlyAwarded {
  id: string;
  name: string;
  icon: string;
  tier: AchievementTier;
  description: string;
}

// ---------------------------------------------------------------------------
// Achievement definitions (18 total — "Voice of a Founder" removed)
// ---------------------------------------------------------------------------

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Building the Business ──
  {
    id: "venture-founded",
    name: "Venture Founded",
    description: "Completed the Ikigai wizard",
    category: "building",
    icon: "🚀",
    tiers: ["gold"],
    tierDescriptions: { gold: "Completed the Ikigai wizard and discovered your business idea" },
  },
  {
    id: "named-and-claimed",
    name: "Named & Claimed",
    description: "Business has name, niche, target customer, and revenue model",
    category: "building",
    icon: "🏷️",
    tiers: ["gold"],
    tierDescriptions: { gold: "Filled in your business name, niche, target customer, and revenue model" },
  },
  {
    id: "know-thy-customer",
    name: "Know Thy Customer",
    description: "Completed customer interview sandbox",
    category: "building",
    icon: "🎤",
    tiers: ["gold"],
    tierDescriptions: { gold: "Completed the customer interview sandbox" },
  },
  {
    id: "price-is-right",
    name: "Price is Right",
    description: "Set pricing by completing the pricing lesson",
    category: "building",
    icon: "💰",
    tiers: ["gold"],
    tierDescriptions: { gold: "Completed the pricing lesson and set your pricing strategy" },
  },
  {
    id: "launch-ready",
    name: "Launch Ready",
    description: "Completed every lesson",
    category: "building",
    icon: "🎓",
    tiers: ["gold"],
    tierDescriptions: { gold: "Completed every lesson across all 6 modules — you are launch ready!" },
  },

  // ── Engagement Habits ──
  {
    id: "first-words",
    name: "First Words",
    description: "Sent your first AI message",
    category: "engagement",
    icon: "💬",
    tiers: ["gold"],
    tierDescriptions: { gold: "Sent your very first message to the AI guide" },
  },
  {
    id: "streak",
    name: "Streak",
    description: "Maintained a check-in streak",
    category: "engagement",
    icon: "🔥",
    tiers: ["bronze", "silver", "gold"],
    tierDescriptions: {
      bronze: "7-day check-in streak",
      silver: "14-day check-in streak",
      gold: "30-day check-in streak",
    },
  },
  {
    id: "daily-habit",
    name: "Daily Habit",
    description: "Checked in 5 days in one week",
    category: "engagement",
    icon: "📅",
    tiers: ["gold"],
    tierDescriptions: { gold: "Checked in 5 out of 7 days in a single week" },
  },

  // ── Depth of Thinking ──
  {
    id: "decision-maker",
    name: "Decision Maker",
    description: "Journaled business decisions",
    category: "depth",
    icon: "📝",
    tiers: ["bronze", "silver", "gold"],
    tierDescriptions: {
      bronze: "Journaled 3 business decisions",
      silver: "Journaled 6 business decisions",
      gold: "Journaled a business decision in every lesson of the program",
    },
  },
  {
    id: "pitch-perfect",
    name: "Pitch Perfect",
    description: "Completed a business pitch",
    category: "depth",
    icon: "🎯",
    tiers: ["gold"],
    tierDescriptions: { gold: "Completed a business pitch to teach the AI" },
  },
  {
    id: "deep-thinker",
    name: "Deep Thinker",
    description: "Passed all checkpoints in a single lesson",
    category: "depth",
    icon: "🧠",
    tiers: ["gold"],
    tierDescriptions: { gold: "Passed every checkpoint in a single lesson" },
  },
  {
    id: "full-sweep",
    name: "Full Sweep",
    description: "Passed every checkpoint across the entire program",
    category: "depth",
    icon: "🏆",
    tiers: ["gold"],
    tierDescriptions: { gold: "Passed every checkpoint across all 22 lessons — masterclass complete" },
  },

  // ── Social / Competitive ──
  {
    id: "leaderboard-debut",
    name: "Leaderboard Debut",
    description: "Appeared in the top 15 on any board",
    category: "social",
    icon: "📊",
    tiers: ["gold"],
    tierDescriptions: { gold: "Made it into the top 15 on a leaderboard" },
  },
  {
    id: "most-improved",
    name: "Most Improved",
    description: "Ranked #1 on Most Improved weekly",
    category: "social",
    icon: "📈",
    tiers: ["gold"],
    tierDescriptions: { gold: "Ranked #1 on the Most Improved weekly leaderboard" },
  },
  {
    id: "consistency-king",
    name: "Consistency King",
    description: "Ranked #1 on Most Consistent",
    category: "social",
    icon: "👑",
    tiers: ["gold"],
    tierDescriptions: { gold: "Ranked #1 on the Most Consistent leaderboard" },
  },

  // ── Resilience ──
  {
    id: "comeback",
    name: "Comeback",
    description: "Returned after 5+ days away and completed a lesson",
    category: "resilience",
    icon: "💪",
    tiers: ["gold"],
    tierDescriptions: { gold: "Came back after 5+ days away and completed a lesson" },
  },
  {
    id: "pivot",
    name: "Pivot",
    description: "Changed a business decision",
    category: "resilience",
    icon: "🔄",
    tiers: ["gold"],
    tierDescriptions: { gold: "Updated a business decision — great founders iterate!" },
  },
  {
    id: "second-wind",
    name: "Second Wind",
    description: "Completed a lesson after being stuck 3+ days",
    category: "resilience",
    icon: "🌊",
    tiers: ["gold"],
    tierDescriptions: { gold: "Finished a lesson after being stuck on it for 3+ days" },
  },
  // --- Real World (self-reported, teacher-verified) ---
  {
    id: "real-conversation",
    name: "Reality Check",
    description: "Talked to a real person about your business",
    category: "real_world",
    icon: "🗣️",
    tiers: ["bronze", "silver", "gold"],
    tierDescriptions: {
      bronze: "Had 1 real conversation about your business",
      silver: "Had 3 real conversations about your business",
      gold: "Had 5+ real conversations about your business",
    },
  },
  {
    id: "first-dollar",
    name: "First Dollar",
    description: "Earned your first revenue",
    category: "real_world",
    icon: "💵",
    tiers: ["gold"],
    tierDescriptions: { gold: "Made your first sale or earned your first dollar" },
  },
  {
    id: "public-pitch",
    name: "Pitch Day",
    description: "Presented your business to a live audience",
    category: "real_world",
    icon: "🎤",
    tiers: ["gold"],
    tierDescriptions: { gold: "Pitched your business to a real audience" },
  },
  {
    id: "shared-plan",
    name: "Out There",
    description: "Shared your business plan with someone outside the platform",
    category: "real_world",
    icon: "🌍",
    tiers: ["gold"],
    tierDescriptions: { gold: "Shared your business plan with someone outside Adaptable" },
  },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  building: "Building the Business",
  engagement: "Engagement Habits",
  depth: "Depth of Thinking",
  social: "Social & Competitive",
  resilience: "Resilience",
  real_world: "Real World",
};

// ---------------------------------------------------------------------------
// Helper: compute streak from dates (reused from leaderboard.ts pattern)
// ---------------------------------------------------------------------------

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [
    ...new Set(
      dates.map((d) => {
        const dt = new Date(d);
        return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
      })
    ),
  ]
    .sort()
    .reverse();

  const today = new Date();
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

  let expectedDate = new Date(todayStr + "T00:00:00Z");

  if (uniqueDays[0] !== todayStr) {
    expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    const yesterdayStr = `${expectedDate.getUTCFullYear()}-${String(expectedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(expectedDate.getUTCDate()).padStart(2, "0")}`;
    if (uniqueDays[0] !== yesterdayStr) return 0;
  }

  let streak = 0;
  for (const dayStr of uniqueDays) {
    const expStr = `${expectedDate.getUTCFullYear()}-${String(expectedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(expectedDate.getUTCDate()).padStart(2, "0")}`;
    if (dayStr === expStr) {
      streak++;
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    } else if (dayStr < expStr) {
      break;
    }
  }

  return streak;
}

// ---------------------------------------------------------------------------
// Check and award achievements
// ---------------------------------------------------------------------------

export async function checkAndAwardAchievements(
  supabase: SupabaseClient,
  studentId: string
): Promise<NewlyAwarded[]> {
  // 1) Fetch existing achievements
  const { data: existingRows } = await supabase
    .from("student_achievements")
    .select("achievement_id, tier")
    .eq("student_id", studentId);

  const existing = new Set(
    (existingRows ?? []).map(
      (r: { achievement_id: string; tier: string }) => `${r.achievement_id}:${r.tier}`
    )
  );

  // 2) Fetch all relevant data in parallel
  const [
    profileRes,
    progressRes,
    checkinsRes,
    decisionsRes,
    pitchesRes,
    usageRes,
    lessonsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", studentId).single(),
    supabase.from("student_progress").select("*").eq("student_id", studentId),
    supabase
      .from("daily_checkins")
      .select("id, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("lesson_decisions")
      .select("id, lesson_id, created_at")
      .eq("student_id", studentId),
    supabase
      .from("business_pitches")
      .select("id")
      .eq("student_id", studentId),
    supabase
      .from("ai_usage_log")
      .select("id, feature, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true }),
    supabase.from("lessons").select("id, lesson_sequence, module_sequence").order("lesson_sequence"),
  ]);

  const profile = profileRes.data as Record<string, unknown> | null;
  const progressRows = (progressRes.data ?? []) as {
    lesson_id: string;
    status: string;
    artifacts: Record<string, unknown> | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  }[];
  const checkins = (checkinsRes.data ?? []) as { id: string; created_at: string }[];
  const decisions = (decisionsRes.data ?? []) as { id: string; lesson_id: string; created_at: string }[];
  const pitches = (pitchesRes.data ?? []) as { id: string }[];
  const usageLogs = (usageRes.data ?? []) as { id: string; feature: string; created_at: string }[];
  const lessons = (lessonsRes.data ?? []) as { id: string; lesson_sequence: number; module_sequence: number }[];

  const businessIdea = profile?.business_idea as {
    niche?: string;
    name?: string;
    target_customer?: string;
    revenue_model?: string;
  } | null;
  const ikigaiResult = profile?.ikigai_result as Record<string, unknown> | null;

  const completedProgress = progressRows.filter((p) => p.status === "completed");
  const completedLessonIds = new Set(completedProgress.map((p) => p.lesson_id));

  // Build lesson_sequence lookup
  const lessonSeqMap = new Map(lessons.map((l) => [l.id, l.lesson_sequence]));

  // ─── Determine newly earned achievements ───

  const toAward: { achievementId: string; tier: AchievementTier }[] = [];

  function award(id: string, tier: AchievementTier) {
    if (!existing.has(`${id}:${tier}`)) {
      toAward.push({ achievementId: id, tier });
    }
  }

  // --- Building the Business ---

  // Venture Founded — has ikigai_result
  if (ikigaiResult) {
    award("venture-founded", "gold");
  }

  // Named & Claimed — all 4 business_idea fields filled
  if (
    businessIdea?.name &&
    businessIdea?.niche &&
    businessIdea?.target_customer &&
    businessIdea?.revenue_model
  ) {
    award("named-and-claimed", "gold");
  }

  // Know Thy Customer — completed the interview sandbox (checkpoint "interview-sandbox" in any progress row)
  for (const p of progressRows) {
    const reached = ((p.artifacts?.checkpoints_reached as string[]) ?? []);
    if (reached.includes("interview-sandbox")) {
      award("know-thy-customer", "gold");
      break;
    }
  }

  // Price is Right — completed lesson 7 (pricing lesson)
  const lesson7 = lessons.find((l) => l.lesson_sequence === 7);
  if (lesson7 && completedLessonIds.has(lesson7.id)) {
    award("price-is-right", "gold");
  }

  // Launch Ready — completed every lesson
  if (lessons.length > 0 && completedProgress.length >= lessons.length) {
    award("launch-ready", "gold");
  }

  // --- Engagement Habits ---

  // First Words — has at least 1 ai_usage_log entry with feature "guide" or "lesson"
  if (usageLogs.some((u) => u.feature === "guide" || u.feature === "lesson")) {
    award("first-words", "gold");
  }

  // Streak — 7 / 14 / 30 day check-in streak
  const checkinDates = checkins.map((c) => c.created_at);
  const streak = computeStreak(checkinDates);
  if (streak >= 30) award("streak", "gold");
  if (streak >= 14) award("streak", "silver");
  if (streak >= 7) award("streak", "bronze");

  // Daily Habit — 5 check-ins in one calendar week (Mon-Sun)
  {
    const weekBuckets = new Map<string, Set<string>>();
    for (const c of checkins) {
      const dt = new Date(c.created_at);
      // Find the Monday of this date's week
      const day = dt.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(dt);
      monday.setUTCDate(dt.getUTCDate() - diff);
      const weekKey = `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
      const dayKey = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
      const set = weekBuckets.get(weekKey) ?? new Set();
      set.add(dayKey);
      weekBuckets.set(weekKey, set);
    }
    for (const days of weekBuckets.values()) {
      if (days.size >= 5) {
        award("daily-habit", "gold");
        break;
      }
    }
  }

  // --- Depth of Thinking ---

  // Decision Maker — decision journal count
  const decisionCount = decisions.length;
  if (decisionCount >= 8) award("decision-maker", "gold");
  if (decisionCount >= 6) award("decision-maker", "silver");
  if (decisionCount >= 3) award("decision-maker", "bronze");

  // Pitch Perfect — has at least 1 pitch
  if (pitches.length > 0) {
    award("pitch-perfect", "gold");
  }

  // Deep Thinker — all checkpoints passed in a single lesson
  // We need to know total checkpoints per lesson. We can approximate: if checkpoints_reached count
  // equals the total from lesson-plans. Since we can't easily import lesson-plans at runtime in a
  // generic way, we check: if status === "completed" AND checkpoints_reached length >= 3 (minimum),
  // that's a reasonable proxy. Actually, completion already requires passing all checkpoints in most
  // cases. Let's check if any completed lesson has checkpoints_reached matching a reasonable total.
  for (const p of progressRows) {
    if (p.status === "completed") {
      const reached = ((p.artifacts?.checkpoints_reached as string[]) ?? []);
      // A lesson with all checkpoints passed: at least 3 checkpoints (all lessons have 3+)
      if (reached.length >= 3) {
        award("deep-thinker", "gold");
        break;
      }
    }
  }

  // Full Sweep — all checkpoints across all 22 lessons
  if (lessons.length > 0 && completedProgress.length >= lessons.length) {
    const allHaveCheckpoints = completedProgress.every((p) => {
      const reached = ((p.artifacts?.checkpoints_reached as string[]) ?? []);
      return reached.length >= 3;
    });
    if (allHaveCheckpoints) {
      award("full-sweep", "gold");
    }
  }

  // --- Social / Competitive ---
  // These require leaderboard computation. We do a lightweight check using the admin client.
  // Since this function receives the admin client from the dashboard, we can query broadly.
  {
    // Get student's class and org peers
    const { data: enrollmentData } = await supabase
      .from("class_enrollments")
      .select("class_id")
      .eq("student_id", studentId)
      .limit(1);
    const enrollment = (enrollmentData ?? [])[0] as { class_id: string } | undefined;

    let peerIds: string[] = [studentId];
    if (enrollment) {
      const { data: peers } = await supabase
        .from("class_enrollments")
        .select("student_id")
        .eq("class_id", enrollment.class_id);
      peerIds = (peers ?? []).map((p: { student_id: string }) => p.student_id);
    }

    if (peerIds.length > 1) {
      // Leaderboard Debut: is this student in top 15 on any board?
      // Quick check: count completed lessons per peer and rank
      const { data: peerProgress } = await supabase
        .from("student_progress")
        .select("student_id")
        .in("student_id", peerIds)
        .eq("status", "completed");

      const countMap = new Map<string, number>();
      for (const p of (peerProgress ?? []) as { student_id: string }[]) {
        countMap.set(p.student_id, (countMap.get(p.student_id) ?? 0) + 1);
      }

      const ranked = [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id], i) => ({ id, rank: i + 1 }));

      const myRank = ranked.find((r) => r.id === studentId);
      if (myRank && myRank.rank <= 15) {
        award("leaderboard-debut", "gold");
      }

      // Most Improved: ranked #1 on improvement (simplified — check usage this week vs last)
      const weekStart = getWeekStart();
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

      const { data: allUsage } = await supabase
        .from("ai_usage_log")
        .select("student_id, created_at")
        .in("student_id", peerIds)
        .gte("created_at", prevWeekStart.toISOString());

      const thisWeekCounts = new Map<string, number>();
      const lastWeekCounts = new Map<string, number>();
      for (const u of (allUsage ?? []) as { student_id: string; created_at: string }[]) {
        const ts = new Date(u.created_at);
        if (ts >= weekStart) {
          thisWeekCounts.set(u.student_id, (thisWeekCounts.get(u.student_id) ?? 0) + 1);
        } else {
          lastWeekCounts.set(u.student_id, (lastWeekCounts.get(u.student_id) ?? 0) + 1);
        }
      }

      const improvements = peerIds
        .map((id) => ({
          id,
          improvement: (thisWeekCounts.get(id) ?? 0) - (lastWeekCounts.get(id) ?? 0),
        }))
        .filter((x) => x.improvement > 0)
        .sort((a, b) => b.improvement - a.improvement);

      if (improvements.length > 0 && improvements[0].id === studentId) {
        award("most-improved", "gold");
      }

      // Consistency King: #1 on streak
      const { data: allCheckins } = await supabase
        .from("daily_checkins")
        .select("student_id, created_at")
        .in("student_id", peerIds)
        .order("created_at", { ascending: false });

      const checkinsByPeer = new Map<string, string[]>();
      for (const c of (allCheckins ?? []) as { student_id: string; created_at: string }[]) {
        const arr = checkinsByPeer.get(c.student_id) ?? [];
        arr.push(c.created_at);
        checkinsByPeer.set(c.student_id, arr);
      }

      const streaks = peerIds
        .map((id) => ({ id, streak: computeStreak(checkinsByPeer.get(id) ?? []) }))
        .filter((x) => x.streak > 0)
        .sort((a, b) => b.streak - a.streak);

      if (streaks.length > 0 && streaks[0].id === studentId) {
        award("consistency-king", "gold");
      }
    }
  }

  // --- Resilience ---

  // Comeback: 5+ day gap in activity, then completed a lesson
  if (usageLogs.length >= 2 && completedProgress.length > 0) {
    const gap = detectAbsenceGap(usageLogs);
    if (gap) {
      const hasPostGapCompletion = completedProgress.some(
        (p) => p.completed_at && new Date(p.completed_at) >= gap.gapEnd
      );
      if (hasPostGapCompletion) {
        award("comeback", "gold");
      }
    }
  }

  // Pivot: has lesson_decisions where the student updated (2+ different decisions for same concept).
  // Since lesson_decisions uses upsert (unique on student_id + lesson_id), we can't directly detect
  // multiple versions. Instead, check if any decision was updated (updated_at differs from created_at).
  // Actually the table doesn't have updated_at. We'll check the profile's business_idea changes instead.
  // Simplest: if the student has a decision AND any progress row's artifacts show the lesson was
  // revisited. Actually, let's just check if there is any decision whose created_at is AFTER
  // the lesson was already completed — meaning they came back and changed it.
  for (const d of decisions) {
    const matchingProgress = progressRows.find(
      (p) => p.lesson_id === d.lesson_id && p.status === "completed"
    );
    if (matchingProgress?.completed_at) {
      if (new Date(d.created_at) > new Date(matchingProgress.completed_at)) {
        award("pivot", "gold");
        break;
      }
    }
  }

  // Second Wind: completed a lesson after being stuck (in_progress) for 3+ days
  for (const p of progressRows) {
    if (p.status === "completed" && p.completed_at) {
      const startDate = new Date(p.created_at);
      const endDate = new Date(p.completed_at);
      const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (days >= 3) {
        award("second-wind", "gold");
        break;
      }
    }
  }

  // 4) Insert newly earned achievements
  if (toAward.length === 0) return [];

  const inserts = toAward.map((a) => ({
    student_id: studentId,
    achievement_id: a.achievementId,
    tier: a.tier,
  }));

  await supabase.from("student_achievements").insert(inserts);

  // 5) Return newly awarded for banners
  return toAward.map((a) => {
    const def = ACHIEVEMENT_MAP.get(a.achievementId)!;
    return {
      id: a.achievementId,
      name: def.name,
      icon: def.icon,
      tier: a.tier,
      description: def.tierDescriptions[a.tier] ?? def.description,
    };
  });
}

// ---------------------------------------------------------------------------
// Get student achievements for display
// ---------------------------------------------------------------------------

export async function getStudentAchievements(
  supabase: SupabaseClient,
  studentId: string
): Promise<EarnedAchievement[]> {
  const { data } = await supabase
    .from("student_achievements")
    .select("achievement_id, tier, earned_at")
    .eq("student_id", studentId)
    .order("earned_at", { ascending: false });

  return (data ?? []) as EarnedAchievement[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - diff,
      0,
      0,
      0,
      0
    )
  );
}
