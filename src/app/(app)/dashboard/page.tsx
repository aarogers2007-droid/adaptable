import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextLesson, calculateProgress } from "@/lib/lessons";
import { checkAndAwardAchievements, getStudentAchievements, ACHIEVEMENT_MAP } from "@/lib/achievements";
import type { Profile, Lesson, StudentProgress, MentorCheckin } from "@/lib/types";
import Link from "next/link";
import AppNav from "@/components/ui/AppNav";
import DailyCheckIn from "@/components/dashboard/DailyCheckIn";
import DashboardAchievements from "./DashboardAchievements";
import FeedbackBox from "@/components/dashboard/FeedbackBox";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile, lessons, progress, latest check-in, and class settings in parallel
  const [profileRes, lessonsRes, progressRes, checkinRes, enrollmentRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
    supabase.from("student_progress").select("*").eq("student_id", user.id),
    supabase.from("mentor_checkins").select("*").eq("student_id", user.id).order("created_at", { ascending: false }).limit(1),
    supabase.from("class_enrollments").select("class_id, classes(streaks_enabled)").eq("student_id", user.id).limit(1).single(),
  ]);

  // Class-level settings — teacher can disable streaks for the whole class
  const classData = enrollmentRes.data as { classes: { streaks_enabled?: boolean } | null } | null;
  const streaksEnabled = classData?.classes?.streaks_enabled ?? true;

  const profile = profileRes.data as unknown as Profile | null;
  // If the profile fetch errored entirely, log it and bounce to /login instead
  // of silently sending the student to /onboarding (which would re-fetch and
  // re-bounce them in a loop). Only redirect to /onboarding when the profile
  // exists but business_idea is genuinely missing.
  if (!profile) {
    console.error("[dashboard] profile fetch returned null", { user_id: user.id, error: profileRes.error });
    redirect("/login");
  }
  if (!profile.business_idea) redirect("/onboarding");

  const lessons = (lessonsRes.data ?? []) as unknown as Lesson[];
  const progress = (progressRes.data ?? []) as unknown as StudentProgress[];
  const latestCheckin = (checkinRes.data?.[0] ?? null) as unknown as MentorCheckin | null;

  const { niche, name, target_customer, revenue_model } = profile.business_idea;
  const nextLesson = getNextLesson(lessons, progress);
  const completedCount = progress.filter((p) => p.status === "completed").length;
  const { percentage, completed, total } = calculateProgress(profile, lessons.length, completedCount);

  // Check if check-in is stale (>7 days)
  const checkinStale = !latestCheckin || (Date.now() - new Date(latestCheckin.created_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

  // Compute check-in streak
  const { data: streakCheckins } = await supabase
    .from("daily_checkins")
    .select("created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  let streak = 0;
  if (streakCheckins && streakCheckins.length > 0) {
    const uniqueDays = [...new Set(streakCheckins.map((c) => {
      const d = new Date(c.created_at);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    }))].sort().reverse();

    const today = new Date();
    const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
    const expected = new Date(todayStr + "T00:00:00Z");

    if (uniqueDays[0] !== todayStr) {
      expected.setUTCDate(expected.getUTCDate() - 1);
      const yStr = `${expected.getUTCFullYear()}-${String(expected.getUTCMonth() + 1).padStart(2, "0")}-${String(expected.getUTCDate()).padStart(2, "0")}`;
      if (uniqueDays[0] !== yStr) { streak = 0; }
    }

    if (streak === 0 && uniqueDays[0] !== todayStr) {
      // streak stays 0
    } else {
      for (const dayStr of uniqueDays) {
        const expStr = `${expected.getUTCFullYear()}-${String(expected.getUTCMonth() + 1).padStart(2, "0")}-${String(expected.getUTCDate()).padStart(2, "0")}`;
        if (dayStr === expStr) {
          streak++;
          expected.setUTCDate(expected.getUTCDate() - 1);
        } else if (dayStr < expStr) {
          break;
        }
      }
    }
  }

  // Fetch all decisions for dashboard context
  const { data: allDecisionsData } = await supabase
    .from("lesson_decisions")
    .select("decision_text, lesson_id")
    .eq("student_id", user.id)
    .order("created_at", { ascending: true });
  const allDecisions = (allDecisionsData ?? []) as { decision_text: string; lesson_id: string }[];
  const latestDecision = allDecisions.length > 0 ? allDecisions[allDecisions.length - 1] : undefined;
  const latestDecisionLesson = latestDecision ? lessons.find((l) => l.id === latestDecision.lesson_id) : null;

  // Check and award achievements
  const admin = createAdminClient();
  const newlyAwarded = await checkAndAwardAchievements(admin, user.id);
  const allEarned = await getStudentAchievements(admin, user.id);

  // Map earned achievements to display data
  const earnedDisplay = allEarned.map((e) => {
    const def = ACHIEVEMENT_MAP.get(e.achievement_id);
    return {
      id: e.achievement_id,
      name: def?.name ?? e.achievement_id,
      icon: def?.icon ?? "🏅",
      tier: e.tier,
    };
  });

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <AppNav isAdmin={profile.role === "org_admin"} studentName={profile.full_name || profile.email || undefined} />

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Business Hero — tightened. Heading scales down on mobile so the
            Continue CTA below stays above the fold on a 375x812 iPhone. */}
        <section className="stagger-enter rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 sm:p-8" style={{ animationDelay: "0ms" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-[family-name:var(--font-display)] text-[32px] sm:text-[40px] md:text-[48px] font-bold leading-[1.1] tracking-tight break-words">
                {name}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-[var(--text-secondary)] line-clamp-2">
                {niche} for {target_customer}
              </p>
            </div>
            <Link
              href="/onboarding"
              className="shrink-0 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Edit
            </Link>
          </div>
          <div className="mt-5">
            <div className="h-2 rounded-full bg-[var(--bg-muted)]">
              <div
                className="h-2 rounded-full bg-[var(--primary)] transition-all duration-500 progress-shimmer"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                {completed === 0
                  ? `Just getting started · ${total} milestones ahead`
                  : `${completed} of ${total} milestones complete`}
              </p>
              {streaksEnabled && streak > 0 && (
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${streak >= 7 ? "streak-badge-hot" : "streak-badge"}`}>
                  <span className="text-base">🔥</span>
                  <span className="text-[var(--accent)] flex items-baseline gap-1">
                    <span className="text-xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{streak}</span>
                    <span className="text-xs font-medium">day streak</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* All lessons complete */}
        {!nextLesson && completedCount === lessons.length && lessons.length > 0 && (
          <Link
            href="/completion"
            className="mt-4 block rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-6 hover:bg-[var(--primary)]/10 transition-colors text-center"
          >
            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">
              Program Complete
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
              You finished all {lessons.length} lessons!
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              See what you built →
            </p>
          </Link>
        )}

        {/* Last Decision — pull quote */}
        {latestDecision && allDecisions.length === 1 && (
          <div className="stagger-enter mt-4 rounded-xl border border-[var(--border)] border-l-4 border-l-[var(--primary)] bg-[var(--bg)] p-6" style={{ animationDelay: "50ms" }}>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              {latestDecisionLesson ? latestDecisionLesson.title : "Your last decision"}
            </p>
            <p className="mt-2 text-xl font-semibold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
              &ldquo;{latestDecision.decision_text}&rdquo;
            </p>
          </div>
        )}

        {/* Current Lesson CTA — first-time users (0 completed LESSONS,
            the wizard doesn't count) get a hero treatment with a
            personalized welcome and a strong CTA button. Returning users
            get the compact version. Per Opus UX review: "make 'Continue'
            significantly more prominent for users with 0 progress;
            the hierarchy doesn't scream 'do this first'." */}
        {nextLesson && completedCount === 0 && (
          <Link
            href={`/lessons/${nextLesson.id}`}
            className="stagger-enter mt-4 block rounded-xl border-2 border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary)]/10 p-6 sm:p-8 hover:from-[var(--primary)]/10 hover:to-[var(--primary)]/15 transition-colors group"
            style={{
              animationDelay: "100ms",
              boxShadow: "0 0 20px rgba(13, 148, 136, 0.15), 0 0 60px rgba(13, 148, 136, 0.05)",
            }}
          >
            <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
              Start Here
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
              Hey {profile.full_name?.split(" ")[0] ?? "there"}, let&apos;s get {name} off the ground.
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {nextLesson.module_name} &middot; Lesson {nextLesson.lesson_sequence} &middot; {nextLesson.title}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-base font-semibold text-white group-hover:bg-[var(--primary-dark)] transition-colors">
              Start Lesson 1 →
            </span>
          </Link>
        )}
        {nextLesson && completedCount > 0 && (
          <Link
            href={`/lessons/${nextLesson.id}`}
            className="stagger-enter mt-4 block rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 hover:border-[var(--primary)] transition-colors group"
            style={{ animationDelay: "100ms" }}
          >
            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">
              Continue
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold group-hover:text-[var(--primary)] transition-colors">
              {nextLesson.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {nextLesson.module_name} &middot; Lesson {nextLesson.lesson_sequence}
            </p>
          </Link>
        )}

        {/* Check-in banner */}
        {latestCheckin && !checkinStale && (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
            <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
              Weekly Check-in
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-3">
              {latestCheckin.content}
            </p>
          </div>
        )}

        {/* Daily Check-In — hidden on day 1 (nothing to reflect on yet) */}
        {(() => {
          const createdAt = new Date(profile.created_at);
          const isDay1 = (Date.now() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
          return !isDay1 ? (
            <div className="stagger-enter mt-4" style={{ animationDelay: "200ms" }}>
              <DailyCheckIn allLessonsComplete={completedCount === lessons.length && lessons.length > 0} />
            </div>
          ) : null;
        })()}

        {/* Decision Journal — only show list when 2+ decisions (1 decision shows as pull-quote above) */}
        {allDecisions.length > 1 && (
          <div className="stagger-enter mt-4" style={{ animationDelay: "250ms" }}>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Your Decisions ({allDecisions.length})
                </p>
                <Link href="/plan" className="text-sm font-medium text-[var(--primary)] hover:underline">
                  View Business Plan →
                </Link>
              </div>
              <div className="space-y-4">
                {allDecisions.map((d, i) => {
                  const lesson = lessons.find((l) => l.id === d.lesson_id);
                  return (
                    <div key={i} className="flex gap-3">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0D9488]/10 text-xs font-semibold text-[var(--primary)]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">{lesson?.title ?? "Lesson"}</p>
                        <p className="text-base text-[var(--text-primary)]">{d.decision_text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Secondary sections — Niche Resources only renders when populated
            (empty state was creating a dead card per Opus UX review). */}
        <div
          className={`stagger-enter mt-4 grid grid-cols-1 gap-4 ${profile.niche_recommendations ? "md:grid-cols-2" : ""}`}
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="/chat"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 hover:border-[var(--primary)] transition-colors"
          >
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Ask AI Guide
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Get answers about {name}. Try: &ldquo;How do I find my first customers?&rdquo;
            </p>
            <span className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
              Start conversation →
            </span>
          </Link>

          {profile.niche_recommendations && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Niche Resources
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {(profile.niche_recommendations as unknown[]).length} businesses like yours to study.
              </p>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="mt-4">
          <DashboardAchievements
            newlyAwarded={newlyAwarded}
            earned={earnedDisplay}
          />
        </div>

        {/* Tester feedback box — friends/family user testing window. Moved
            from above-the-fold to below the achievements per Opus UX review:
            it was competing with the Continue Lesson CTA for first-time
            students and pushing the primary action below the fold. */}
        <div className="stagger-enter mt-4" style={{ animationDelay: "350ms" }}>
          <FeedbackBox />
        </div>
      </div>
    </main>
  );
}
