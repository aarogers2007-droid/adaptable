import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AdminActions from "./AdminActions";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, is_platform_owner, full_name, business_idea")
    .eq("id", user.id)
    .single();

  // Platform owner gets this dashboard. Regular org_admin gets redirected.
  if (!(profileData as Record<string, unknown> | null)?.is_platform_owner) {
    if (profileData?.role === "org_admin") {
      redirect("/instructor/dashboard");
    }
    redirect("/dashboard");
  }

  // ── Load platform-wide data ──
  const [classesRes, profilesRes, inventionSessionsRes, progressRes] = await Promise.all([
    supabase.from("classes").select("id, name, session_type, instructor_id, org_id").order("created_at"),
    supabase.from("profiles").select("id, full_name, email, role, is_platform_owner, org_id").in("role", ["instructor", "org_admin"]),
    supabase.from("invention_sessions").select("id, completed_at"),
    supabase.from("student_progress").select("id, status"),
  ]);

  const classes = classesRes.data ?? [];
  const admins = profilesRes.data ?? [];

  // Enrollment counts per class
  const enrollmentCounts: Record<string, number> = {};
  for (const cls of classes) {
    const { count } = await supabase
      .from("class_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", cls.id);
    enrollmentCounts[cls.id] = count ?? 0;
  }

  // Invite codes per class
  const inviteCodes: Record<string, string> = {};
  for (const cls of classes) {
    const { data: code } = await supabase
      .from("invite_codes")
      .select("code")
      .eq("class_id", cls.id)
      .limit(1)
      .single();
    if (code) inviteCodes[cls.id] = code.code;
  }

  // Stats
  const totalStudents = Object.values(enrollmentCounts).reduce((a, b) => a + b, 0);
  const completedInventions = inventionSessionsRes.data?.filter((s) => s.completed_at).length ?? 0;
  const completedLessons = progressRes.data?.filter((p) => p.status === "completed").length ?? 0;

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Platform Admin
          </span>
          <Link href="/instructor/dashboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Instructor View
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Sign out</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
          Platform Dashboard
        </h1>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Total Students</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">{totalStudents}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Completed Inventions</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">{completedInventions}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Completed Curriculum Lessons</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">{completedLessons}</p>
          </div>
        </div>

        {/* Classes */}
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
            All Classes
          </h2>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Class", "Code", "Type", "Students", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id} className="border-b border-[var(--border)]">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{cls.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[var(--bg-muted)] px-2 py-0.5 font-mono text-xs text-[var(--text-primary)]">
                        {inviteCodes[cls.id] ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        cls.session_type === "invention"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {cls.session_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{enrollmentCounts[cls.id] ?? 0}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={cls.session_type === "invention"
                          ? `/instructor/invention/${cls.id}`
                          : "/instructor/dashboard"}
                        className="text-xs font-medium text-[var(--primary)] hover:underline"
                      >
                        Dashboard
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin accounts */}
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
            Instructors &amp; Admins
          </h2>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Name", "Email", "Role", "Scope"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  // Find which classes this admin has access to
                  const ownedClasses = classes.filter((c) => c.instructor_id === admin.id);
                  const coAdminClasses = classes.filter((c) => {
                    const ids = ((c as Record<string, unknown>).grouping_config as Record<string, unknown> | undefined)?.co_admin_ids as string[] ?? [];
                    return ids.includes(admin.id);
                  });
                  const scopeStr = (admin as Record<string, unknown>).is_platform_owner
                    ? "All classes"
                    : [...ownedClasses.map((c) => c.name), ...coAdminClasses.map((c) => `${c.name} (co-admin)`)].join(", ") || "No classes";

                  return (
                    <tr key={admin.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{admin.full_name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{admin.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          (admin as Record<string, unknown>).is_platform_owner
                            ? "bg-amber-100 text-amber-700"
                            : admin.role === "org_admin"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {(admin as Record<string, unknown>).is_platform_owner ? "Platform Owner" : admin.role === "org_admin" ? "Org Admin" : "Instructor"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{scopeStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dev tools — keep existing AdminActions for testing */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">Dev Tools</p>
          <AdminActions hasBusinessIdea={!!profileData?.business_idea} />
        </div>
      </div>
    </main>
  );
}
