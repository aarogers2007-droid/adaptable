import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const dynamic = "force-dynamic";

/**
 * AJ's Dashboard — platform owner only.
 *
 * Hardcoded to aarogers2007@gmail.com. No one else can access this page.
 * Every route on the platform is listed as a direct link. No auth flows,
 * no redirects, no friction. Click and go.
 */

const AJ_EMAIL = "aarogers2007@gmail.com";
const VENTURE_CLASS_ID = "c0000000-0000-0000-0000-000000000c01";

export default async function AJDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  // Hard gate: only AJ's email. Nobody else. Ever.
  if (profile?.email !== AJ_EMAIL) {
    redirect("/dashboard");
  }

  const sections = [
    {
      label: "Student Experience",
      links: [
        { href: "/dashboard", name: "Student Dashboard" },
        { href: "/onboarding", name: "Ikigai Wizard (Onboarding)" },
        { href: "/onboarding/ready", name: "Onboarding Complete" },
        { href: "/lessons", name: "Lessons Index" },
        { href: "/chat", name: "AI Guide Chat" },
        { href: "/plan", name: "Business Plan" },
        { href: "/card", name: "Business Card Designer" },
        { href: "/achievements", name: "Achievements" },
        { href: "/leaderboard", name: "Leaderboard" },
        { href: "/completion", name: "Completion Ceremony" },
        { href: "/dashboard/founders-log", name: "Founder's Log" },
        { href: "/dashboard/founders-log/analytics", name: "Founder's Log Analytics" },
        { href: "/privacy", name: "Privacy Settings" },
        { href: "/standards", name: "Standards Alignment" },
      ],
    },
    {
      label: "Invention Mode",
      links: [
        { href: "/invention", name: "Invention Wizard (Student)" },
        { href: "/venture", name: "VENTURE Landing Page" },
        { href: `/instructor/invention/${VENTURE_CLASS_ID}`, name: "Invention Admin Dashboard" },
        { href: `/instructor/invention/${VENTURE_CLASS_ID}/print/roster`, name: "Print: Group Roster" },
        { href: `/instructor/invention/${VENTURE_CLASS_ID}/print/slips`, name: "Print: Student Slips" },
      ],
    },
    {
      label: "Admin & Instructor",
      links: [
        { href: "/admin", name: "Platform Admin" },
        { href: "/admin/feedback", name: "Tester Feedback" },
        { href: "/instructor/dashboard", name: "Instructor Dashboard" },
        { href: "/teacher-onboarding", name: "Teacher Onboarding" },
      ],
    },
    {
      label: "Auth & Onboarding",
      links: [
        { href: "/login", name: "Login Page" },
        { href: "/signup", name: "Student Signup" },
        { href: "/teacher-signup", name: "Teacher Signup" },
        { href: "/join", name: "Join a Class" },
        { href: "/parental-consent-pending", name: "Parental Consent Pending" },
      ],
    },
    {
      label: "Public Pages",
      links: [
        { href: "/demo", name: "Demo Page" },
        { href: "/for-schools", name: "For Schools" },
        { href: "/", name: "Landing Page" },
      ],
    },
    {
      label: "Parent",
      links: [
        { href: "/parent/view", name: "Parent View" },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-6 py-3">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </span>
          <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: "#C084FC" }}>
            AJ
          </span>
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
          AJ&apos;s Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Every page on the platform. Click and go.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div key={section.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
                  >
                    <span>{link.name}</span>
                    <span className="text-[var(--text-muted)]">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
