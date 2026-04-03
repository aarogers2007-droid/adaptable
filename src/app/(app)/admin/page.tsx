import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Lesson, StudentProgress } from "@/lib/types";
import Link from "next/link";
import AdminActions from "./AdminActions";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileData || profileData.role !== "org_admin") {
    redirect("/dashboard");
  }

  const [lessonsRes, progressRes, profileRes] = await Promise.all([
    supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
    supabase.from("student_progress").select("*").eq("student_id", user.id),
    supabase.from("profiles").select("business_idea, full_name, ikigai_result").eq("id", user.id).single(),
  ]);

  const lessons = (lessonsRes.data ?? []) as unknown as Lesson[];
  const progress = (progressRes.data ?? []) as unknown as StudentProgress[];
  const profile = profileRes.data as unknown as Profile | null;

  // Group by module
  const modules = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    if (!modules.has(lesson.module_name)) modules.set(lesson.module_name, []);
    modules.get(lesson.module_name)!.push(lesson);
  }

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Admin
          </span>
          <Link href="/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Student View
          </Link>
          <Link href="/instructor/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Instructor View
          </Link>
          <div className="ml-auto">
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Sign out</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Admin Playground</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          View any lesson, reset progress, test the experience.
        </p>

        {/* Quick actions */}
        <AdminActions hasBusinessIdea={!!profile?.business_idea} />

        {/* Current state */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Business Idea</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {profile?.business_idea?.name ?? "Not set"}
            </p>
            {profile?.business_idea && (
              <p className="text-xs text-[var(--text-muted)]">{profile.business_idea.niche}</p>
            )}
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Lessons Completed</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {progress.filter((p) => p.status === "completed").length} / {lessons.length}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Profile Name</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {profile?.full_name ?? "Not set"}
            </p>
          </div>
        </div>

        {/* All lessons (no gating) */}
        <div className="mt-8 space-y-6">
          {[...modules.entries()].map(([moduleName, moduleLessons]) => (
            <div key={moduleName}>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                {moduleName}
              </h2>
              <div className="mt-3 space-y-2">
                {moduleLessons.map((lesson) => {
                  const lp = progress.find((p) => p.lesson_id === lesson.id);
                  const status = lp?.status ?? "not_started";
                  const hasConversation = !!(lp?.artifacts as Record<string, unknown>)?.conversation;

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3"
                    >
                      <span className="text-sm">
                        {status === "completed" ? "✓" : status === "in_progress" ? "◐" : "○"}
                      </span>
                      <div className="flex-1">
                        <Link
                          href={`/lessons/${lesson.id}`}
                          className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--primary)]"
                        >
                          {lesson.title}
                        </Link>
                        <div className="flex gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            status === "completed"
                              ? "bg-emerald-50 text-emerald-600"
                              : status === "in_progress"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-gray-50 text-gray-400"
                          }`}>
                            {status.replace("_", " ")}
                          </span>
                          {hasConversation && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                              has conversation
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/lessons/${lesson.id}`}
                        className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-muted)] transition-colors"
                      >
                        Open
                      </Link>
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
