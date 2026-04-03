import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNextLesson, calculateProgress } from "@/lib/lessons";
import type { Profile, Lesson, StudentProgress, MentorCheckin } from "@/lib/types";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile, lessons, progress, and latest check-in in parallel
  const [profileRes, lessonsRes, progressRes, checkinRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
    supabase.from("student_progress").select("*").eq("student_id", user.id),
    supabase.from("mentor_checkins").select("*").eq("student_id", user.id).order("created_at", { ascending: false }).limit(1),
  ]);

  const profile = profileRes.data as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  const lessons = (lessonsRes.data ?? []) as unknown as Lesson[];
  const progress = (progressRes.data ?? []) as unknown as StudentProgress[];
  const latestCheckin = (checkinRes.data?.[0] ?? null) as unknown as MentorCheckin | null;

  const { niche, name, target_customer, revenue_model } = profile.business_idea;
  const nextLesson = getNextLesson(lessons, progress);
  const completedCount = progress.filter((p) => p.status === "completed").length;
  const { percentage, completed, total } = calculateProgress(profile, lessons.length, completedCount);

  // Check if check-in is stale (>7 days)
  const checkinStale = !latestCheckin || (Date.now() - new Date(latestCheckin.created_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </span>
          <Link href="/dashboard" className="text-sm font-medium text-[var(--text-primary)]">
            My Business
          </Link>
          <Link href="/lessons" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Lessons
          </Link>
          <Link href="/chat" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            AI Guide
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-[var(--text-muted)]">{profile.full_name || profile.email}</span>
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Business Hero */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
                {name}
              </h1>
              <p className="mt-1 text-[var(--text-secondary)]">
                {niche} for {target_customer}
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {revenue_model}
              </p>
            </div>
            <Link
              href="/onboarding"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Edit
            </Link>
          </div>
          <div className="mt-6">
            <div className="h-2 rounded-full bg-[var(--bg-muted)]">
              <div
                className="h-2 rounded-full bg-[var(--primary)] transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {completed} of {total} milestones completed
            </p>
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

        {/* Current Lesson CTA */}
        {nextLesson && (
          <Link
            href={`/lessons/${nextLesson.id}`}
            className="mt-4 block rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 hover:border-[var(--primary)] transition-colors group"
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

        {/* Secondary sections */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/chat"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 hover:border-[var(--primary)] transition-colors"
          >
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Ask AI Guide
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Get answers about {name}. Try: "How do I find my first customers?"
            </p>
            <span className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
              Start conversation →
            </span>
          </Link>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Niche Resources
            </h3>
            {profile.niche_recommendations ? (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {(profile.niche_recommendations as unknown[]).length} businesses like yours to study.
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Resources will appear after you complete a few lessons.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
