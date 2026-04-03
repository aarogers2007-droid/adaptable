import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Lesson } from "@/lib/types";
import Link from "next/link";

export default async function ReadyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, lessonsRes] = await Promise.all([
    supabase.from("profiles").select("business_idea, full_name").eq("id", user.id).single(),
    supabase.from("lessons").select("id, title, module_name, module_sequence, lesson_sequence")
      .order("module_sequence").order("lesson_sequence").limit(1),
  ]);

  const profile = profileRes.data as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  const firstLesson = (lessonsRes.data?.[0] ?? null) as unknown as Lesson | null;
  const studentName = profile.full_name?.split(" ")[0] ?? "there";
  const { name, niche, target_customer, revenue_model } = profile.business_idea;

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Celebration */}
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-[var(--primary)] uppercase tracking-wider">
            Your business is born
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
            Meet {name}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            {studentName}, you just created something real. Let's make it happen.
          </p>
        </div>

        {/* Business summary */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Your niche</p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">{niche}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Your customers</p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">{target_customer}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">How you'll make money</p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">{revenue_model}</p>
          </div>
        </div>

        {/* What's coming */}
        <div className="mt-8 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
            Here's what's next
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            You'll work through 8 lessons that teach you how to turn {name} into a real,
            paying business. Every lesson is a conversation tailored to your niche.
            No lectures, no busywork. Just real steps for your real business.
          </p>
        </div>

        {/* Start button */}
        <div className="mt-8 text-center">
          <Link
            href={firstLesson ? `/lessons/${firstLesson.id}` : "/lessons"}
            className="inline-block rounded-lg bg-[var(--accent)] px-8 py-3.5 text-base font-semibold text-[var(--text-primary)] hover:brightness-110 transition-all shadow-md"
          >
            Start Lesson 1 →
          </Link>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Takes about 10 minutes. You can pause and come back anytime.
          </p>
        </div>

        {/* Skip to dashboard */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
          >
            Skip to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
