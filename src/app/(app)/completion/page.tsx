import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, StudentProgress, Lesson, BusinessIdea, IkigaiResult } from "@/lib/types";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from "@/lib/achievements";
import Link from "next/link";
import CompletionConfetti from "./CompletionConfetti";
import AppNav from "@/components/ui/AppNav";

export default async function CompletionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, progressRes, lessonsRes, decisionsRes, pitchRes, achievementsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("student_progress").select("*").eq("student_id", user.id),
    supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
    supabase.from("lesson_decisions").select("*").eq("student_id", user.id).order("created_at"),
    supabase.from("business_pitches").select("*").eq("student_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("student_achievements").select("*").eq("student_id", user.id),
  ]);

  const profile = profileRes.data as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  const allProgress = (progressRes.data ?? []) as unknown as StudentProgress[];
  const allLessons = (lessonsRes.data ?? []) as unknown as Lesson[];
  const completedCount = allProgress.filter((p) => p.status === "completed").length;
  const totalLessons = allLessons.length;

  if (completedCount < totalLessons) {
    redirect("/dashboard");
  }

  const businessIdea = profile.business_idea as BusinessIdea;
  const ikigaiResult = profile.ikigai_result as IkigaiResult | null;
  const studentName = profile.full_name?.split(" ")[0] ?? "there";
  const isAdmin = profile.role === "org_admin";

  // Decision journal entries with lesson titles
  const decisions = (decisionsRes.data ?? []) as { decision_text: string; lesson_id: string }[];
  const lessonMap = new Map(allLessons.map((l) => [l.id, l]));
  const decisionsWithTitles = decisions.map((d) => ({
    text: d.decision_text,
    lessonTitle: lessonMap.get(d.lesson_id)?.title ?? "Lesson",
  }));

  // Business pitch
  const pitch = pitchRes.data as { pitch_text: string; ai_feedback: string | null } | null;

  // Achievements
  const earnedAchievements = (achievementsRes.data ?? []) as { achievement_id: string; tier: string; earned_at: string }[];
  const earnedWithDefs = earnedAchievements
    .map((ea) => {
      const def = ACHIEVEMENT_MAP.get(ea.achievement_id);
      if (!def) return null;
      return { ...def, tier: ea.tier, earned_at: ea.earned_at };
    })
    .filter(Boolean);

  return (
    <main className="min-h-screen completion-atmosphere">
      <AppNav isAdmin={isAdmin} studentName={profile.full_name || undefined} />
      <CompletionConfetti />

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Celebration header */}
        <div className="stagger-enter text-center mb-10" style={{ animationDelay: "0ms" }}>
          <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-wider">
            Program Complete
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[56px] font-bold leading-[1.05] tracking-[-0.025em] text-[var(--text-primary)]">
            You did it, {studentName}!
          </h1>
          <p className="mt-3 text-lg text-[var(--text-secondary)]">
            You didn't just learn about entrepreneurship. You designed a real venture.
          </p>
        </div>

        {/* Business summary card */}
        <section className="stagger-enter rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-8" style={{ animationDelay: "100ms" }}>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Your Venture
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
            {businessIdea.name}
          </h2>
          <p className="mt-1 text-[var(--text-secondary)]">{businessIdea.niche}</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Target Customer</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{businessIdea.target_customer}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Revenue Model</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{businessIdea.revenue_model}</p>
            </div>
          </div>
        </section>

        {/* Ikigai */}
        {ikigaiResult && (
          <section className="stagger-enter mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6" style={{ animationDelay: "200ms" }}>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Your Ikigai
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: "#FEF9C3" }}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">What I Love</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{ikigaiResult.passions.join(", ")}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#ECFCCB" }}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">What I'm Good At</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{ikigaiResult.skills.join(", ")}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#FFE4E6" }}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">What People Need</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{ikigaiResult.needs.join(", ")}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#CCFBF1" }}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">How I Get Paid</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{ikigaiResult.monetization}</p>
              </div>
            </div>
          </section>
        )}

        {/* Key Decisions */}
        {decisionsWithTitles.length > 0 && (
          <section className="stagger-enter mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6" style={{ animationDelay: "300ms" }}>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Key Decisions You Made
            </p>
            <div className="space-y-3">
              {decisionsWithTitles.map((d, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-medium text-[var(--primary)]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">{d.lessonTitle}</p>
                    <p className="text-sm text-[var(--text-primary)]">{d.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Business Pitch — #15 signature typography */}
        {pitch?.pitch_text && (
          <section className="stagger-enter mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6" style={{ animationDelay: "400ms" }}>
            <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-3">
              Your Business Pitch
            </p>
            <p className="text-xl font-medium font-[family-name:var(--font-display)] text-[var(--text-primary)] leading-relaxed italic">
              &ldquo;{pitch.pitch_text}&rdquo;
            </p>
            {pitch.ai_feedback && (
              <div className="mt-4 rounded-lg bg-[var(--bg-muted)] px-4 py-3">
                <p className="text-xs text-[var(--text-muted)] mb-1">AI Feedback</p>
                <p className="text-sm text-[var(--text-secondary)]">{pitch.ai_feedback}</p>
              </div>
            )}
          </section>
        )}

        {/* Achievements */}
        {earnedWithDefs.length > 0 && (
          <section className="stagger-enter mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6" style={{ animationDelay: "500ms" }}>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Badges Earned
            </p>
            <div className="flex flex-wrap gap-3">
              {earnedWithDefs.map((a) => {
                if (!a) return null;
                const tierColor = a.tier === "gold" ? "var(--tier-gold)" : a.tier === "silver" ? "var(--tier-silver)" : "var(--tier-bronze)";
                return (
                  <div
                    key={`${a.id}-${a.tier}`}
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1.5"
                  >
                    <span className="text-base">{a.icon}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{a.name}</span>
                    <span className="text-xs font-semibold" style={{ color: tierColor }}>
                      {a.tier}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* What's next */}
        <section className="mt-8 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-6 text-center">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
            What's next?
          </h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            You've made every decision a real founder makes. Your business plan is ready.
            Share it with someone you trust, talk to real customers, and start building.
          </p>
        </section>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/plan"
            className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
          >
            View Business Plan
          </Link>
          <Link
            href="/card"
            className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Business Card
          </Link>
          <Link
            href="/chat"
            className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Talk to AI Guide
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Dashboard
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-[var(--text-muted)]">
          Powered by Adaptable, a VentureLab program
        </p>
      </div>
    </main>
  );
}
