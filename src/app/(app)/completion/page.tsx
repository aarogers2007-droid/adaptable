import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, StudentProgress } from "@/lib/types";
import Link from "next/link";
import CompletionConfetti from "./CompletionConfetti";

export default async function CompletionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, progressRes, lessonsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("student_progress").select("*").eq("student_id", user.id).eq("status", "completed"),
    supabase.from("lessons").select("id").order("module_sequence").order("lesson_sequence"),
  ]);

  const profile = profileRes.data as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  const completedCount = (progressRes.data ?? []).length;
  const totalLessons = (lessonsRes.data ?? []).length;

  // Only show completion if all lessons are done
  if (completedCount < totalLessons) {
    redirect("/dashboard");
  }

  const { name, niche, target_customer, revenue_model } = profile.business_idea;
  const studentName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <CompletionConfetti />

      <div className="max-w-lg w-full text-center">
        {/* Celebration header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-wider">
            Program Complete
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text-primary)]">
            You did it, {studentName}!
          </h1>
          <p className="mt-3 text-lg text-[var(--text-secondary)]">
            You didn't just learn about entrepreneurship. You built a real business.
          </p>
        </div>

        {/* Business summary card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-8 text-left">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            What you built
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
            {name}
          </h2>
          <p className="mt-1 text-[var(--text-secondary)]">{niche}</p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Your customers</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{target_customer}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">How you make money</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{revenue_model}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Lessons completed</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{completedCount} of {totalLessons}</p>
            </div>
          </div>
        </div>

        {/* What's next */}
        <div className="mt-8 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-6">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
            What's next?
          </h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            The lessons gave you the foundation. Now it's time to go build for real.
            Use the AI Guide anytime you need help, and keep tracking your progress
            on your dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/chat"
            className="rounded-lg border border-[var(--border-strong)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Talk to AI Guide
          </Link>
        </div>
      </div>
    </main>
  );
}
