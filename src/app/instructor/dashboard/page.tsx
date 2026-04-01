import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InstructorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify instructor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
    redirect("/dashboard");
  }

  // Get instructor's classes with enrolled students
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, class_enrollments(student_id)")
    .eq("instructor_id", user.id);

  // Get all student profiles for enrolled students
  const studentIds = (classes ?? []).flatMap(
    (c) => ((c.class_enrollments as { student_id: string }[]) ?? []).map((e) => e.student_id)
  );

  let students: (Profile & { class_name: string })[] = [];

  if (studentIds.length > 0) {
    const { data: studentProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, business_idea")
      .in("id", studentIds);

    // Get progress counts per student
    const { data: progressData } = await supabase
      .from("student_progress")
      .select("student_id, status")
      .in("student_id", studentIds)
      .eq("status", "completed");

    const completedCounts = new Map<string, number>();
    for (const p of progressData ?? []) {
      completedCounts.set(p.student_id, (completedCounts.get(p.student_id) ?? 0) + 1);
    }

    // Map students to classes
    const studentClassMap = new Map<string, string>();
    for (const cls of classes ?? []) {
      for (const e of (cls.class_enrollments as { student_id: string }[]) ?? []) {
        studentClassMap.set(e.student_id, cls.name);
      }
    }

    students = ((studentProfiles ?? []) as unknown as Profile[]).map((s) => ({
      ...s,
      class_name: studentClassMap.get(s.id) ?? "",
      _completedLessons: completedCounts.get(s.id) ?? 0,
    })) as (Profile & { class_name: string })[];
  }

  // Get total lessons count
  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true });

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </span>
          <span className="text-sm font-medium text-[var(--text-primary)]">Instructor Dashboard</span>
          <div className="ml-auto">
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Sign out</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Your Classes</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {students.length} student{students.length !== 1 ? "s" : ""} across {(classes ?? []).length} class{(classes ?? []).length !== 1 ? "es" : ""}
        </p>

        {students.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8 text-center">
            <p className="text-[var(--text-secondary)]">No students enrolled yet.</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Share your class invite code to get started.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Class</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Progress</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const completedCount = (student as unknown as { _completedLessons: number })._completedLessons ?? 0;
                  const total = totalLessons ?? 0;
                  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

                  return (
                    <tr key={student.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">
                          {student.full_name || "Unnamed"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">{student.email}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{student.class_name}</td>
                      <td className="px-4 py-3">
                        {student.business_idea ? (
                          <span className="text-[var(--text-primary)]">{student.business_idea.name}</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">Not started</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-[var(--bg-muted)]">
                            <div
                              className="h-1.5 rounded-full bg-[var(--primary)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)]">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
