import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  CATEGORY_LABELS,
  getStudentAchievements,
  checkAndAwardAchievements,
} from "@/lib/achievements";
import type { AchievementCategory, AchievementTier } from "@/lib/achievements";
import type { Profile } from "@/lib/types";
import AppNav from "@/components/ui/AppNav";

const TIER_COLORS: Record<string, string> = {
  bronze: "var(--tier-bronze)",
  silver: "var(--tier-silver)",
  gold: "var(--tier-gold)",
};

const CATEGORY_ORDER: AchievementCategory[] = [
  "building",
  "engagement",
  "depth",
  "social",
  "resilience",
  "real_world",
];

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  // Check for new achievements, then fetch all
  const admin = createAdminClient();
  await checkAndAwardAchievements(admin, user.id);
  const earned = await getStudentAchievements(admin, user.id);

  // Build a set of earned achievement+tier combos
  const earnedSet = new Map<string, { tier: AchievementTier; earned_at: string }>();
  for (const e of earned) {
    // Keep the highest tier per achievement, and earliest date per tier
    const key = `${e.achievement_id}:${e.tier}`;
    if (!earnedSet.has(key)) {
      earnedSet.set(key, { tier: e.tier, earned_at: e.earned_at });
    }
  }

  // Group achievements by category
  const grouped = new Map<AchievementCategory, typeof ACHIEVEMENTS>();
  for (const cat of CATEGORY_ORDER) {
    grouped.set(
      cat,
      ACHIEVEMENTS.filter((a) => a.category === cat)
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <AppNav
        isAdmin={profile.role === "org_admin"}
        studentName={profile.full_name || profile.email || undefined}
      />

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
            Achievements
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {earned.length > 0
              ? `${earned.length} badge${earned.length !== 1 ? "s" : ""} earned`
              : "Complete lessons to start earning badges."}
          </p>
        </div>

        {earned.length === 0 && (
          <div className="mb-8 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-6 text-center">
            <p className="text-2xl mb-2">🏆</p>
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
              Your trophy case is empty — for now.
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Every badge here is something you earn by building your business. Complete your first lesson to unlock your first one.
            </p>
          </div>
        )}

        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat) ?? [];
          if (items.length === 0) return null;

          return (
            <section key={cat} className="mb-8">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-3">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((achievement) => {
                  // For multi-tier achievements, show each tier. For single-tier, show one card.
                  return achievement.tiers.map((tier) => {
                    const key = `${achievement.id}:${tier}`;
                    const earnedInfo = earnedSet.get(key);
                    const isEarned = !!earnedInfo;
                    const tierColor = TIER_COLORS[tier];

                    return (
                      <div
                        key={key}
                        className="rounded-xl border p-4 transition-colors"
                        style={{
                          borderColor: isEarned ? `${tierColor}60` : "var(--border)",
                          backgroundColor: isEarned ? `${tierColor}08` : "var(--bg)",
                          opacity: isEarned ? 1 : 0.4,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <span
                              className="text-2xl block"
                              style={{
                                filter: isEarned ? "none" : "grayscale(100%)",
                              }}
                            >
                              {achievement.icon}
                            </span>
                            {!isEarned && (
                              <span className="absolute -bottom-1 -right-1 text-xs">
                                🔒
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
                                {achievement.name}
                              </span>
                              {achievement.tiers.length > 1 && (
                                <span
                                  className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                  style={{
                                    color: tierColor,
                                    backgroundColor: `${tierColor}18`,
                                  }}
                                >
                                  {tier}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                              {achievement.tierDescriptions[tier] ?? achievement.description}
                            </p>
                            {isEarned && earnedInfo && (
                              <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                                Earned{" "}
                                {new Date(earnedInfo.earned_at).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
