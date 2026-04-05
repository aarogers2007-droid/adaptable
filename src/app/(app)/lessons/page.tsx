import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLessonUnlocked } from "@/lib/lessons";
import type { Profile, Lesson, StudentProgress } from "@/lib/types";
import Link from "next/link";
import AppNav from "@/components/ui/AppNav";

export default async function LessonsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, lessonsRes, progressRes] = await Promise.all([
    supabase.from("profiles").select("business_idea, full_name, role").eq("id", user.id).single(),
    supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
    supabase.from("student_progress").select("*").eq("student_id", user.id),
  ]);

  const profile = profileRes.data as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  const lessons = (lessonsRes.data ?? []) as unknown as Lesson[];
  const progress = (progressRes.data ?? []) as unknown as StudentProgress[];

  // Group by module
  const modules = new Map<string, { sequence: number; lessons: (Lesson & { progress: StudentProgress | null; unlocked: boolean })[] }>();

  for (const lesson of lessons) {
    if (!modules.has(lesson.module_name)) {
      modules.set(lesson.module_name, { sequence: lesson.module_sequence, lessons: [] });
    }
    const lp = progress.find((p) => p.lesson_id === lesson.id) ?? null;
    modules.get(lesson.module_name)!.lessons.push({
      ...lesson,
      progress: lp,
      unlocked: isLessonUnlocked(lesson, lessons, progress),
    });
  }

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <AppNav isAdmin={profile.role === "org_admin"} studentName={profile.full_name || undefined} />

      <div className="mx-auto max-w-[800px] px-6 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Your Lessons</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Every lesson is personalized to {profile.business_idea.name}.
        </p>

        <div className="mt-8 space-y-8">
          {[...modules.entries()].sort((a, b) => a[1].sequence - b[1].sequence).map(([moduleName, mod]) => (
            <div key={moduleName}>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
                {moduleName}
              </h2>
              <div className="mt-3 space-y-2">
                {mod.lessons.map((lesson) => {
                  const isCompleted = lesson.progress?.status === "completed";
                  const isLocked = !lesson.unlocked;

                  return (
                    <div key={lesson.id}>
                      {isLocked ? (
                        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 opacity-50">
                          <span className="text-sm text-[var(--text-muted)]">🔒</span>
                          <span className="text-sm text-[var(--text-muted)]">{lesson.title}</span>
                        </div>
                      ) : (
                        <Link
                          href={`/lessons/${lesson.id}`}
                          className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 hover:border-[var(--primary)] transition-colors"
                        >
                          <span className="text-sm">
                            {isCompleted ? "✓" : "○"}
                          </span>
                          <span className={`text-sm font-medium ${isCompleted ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
                            {lesson.title}
                          </span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
