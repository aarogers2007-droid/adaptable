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

        {/* Flow diagram */}
        <div className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-4">
            Page Flow
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 overflow-x-auto">
            <FlowDiagram />
          </div>
        </div>
      </div>
    </main>
  );
}

function FlowDiagram() {
  // Box positions: [x, y, w, h, label, color]
  const boxes: Array<[number, number, number, number, string, string]> = [
    // Entry points (top row)
    [20, 20, 100, 36, "Landing /", "#9CA3AF"],
    [160, 20, 100, 36, "For Schools", "#9CA3AF"],
    [300, 20, 100, 36, "Demo", "#9CA3AF"],
    [440, 20, 100, 36, "VENTURE", "#C084FC"],

    // Auth (second row)
    [90, 90, 80, 36, "Login", "#60A5FA"],
    [200, 90, 80, 36, "Signup", "#60A5FA"],
    [320, 90, 80, 36, "Join", "#60A5FA"],
    [440, 90, 80, 36, "Teacher\nSignup", "#60A5FA"],

    // Onboarding (third row)
    [80, 170, 110, 36, "Ikigai Wizard", "#F5E642"],
    [240, 170, 110, 36, "Invention\nWizard", "#C084FC"],
    [420, 170, 110, 36, "Teacher\nOnboarding", "#60A5FA"],

    // Main experiences (fourth row)
    [20, 260, 100, 36, "Dashboard", "#4ADE80"],
    [140, 260, 80, 36, "Lessons", "#4ADE80"],
    [240, 260, 80, 36, "AI Guide", "#4ADE80"],
    [340, 260, 80, 36, "Plan", "#4ADE80"],
    [440, 260, 80, 36, "Card", "#4ADE80"],
    [540, 260, 100, 36, "Achievements", "#4ADE80"],

    // Completion (fifth row)
    [140, 340, 120, 36, "Completion\nCeremony", "#F59E0B"],
    [300, 340, 100, 36, "Founder's\nLog", "#0D9488"],

    // Admin (right column)
    [560, 90, 110, 36, "Instructor\nDashboard", "#F87171"],
    [560, 170, 110, 36, "Invention\nAdmin", "#C084FC"],
    [560, 250, 100, 36, "Admin", "#F87171"],

    // External
    [440, 340, 100, 36, "Parent View", "#9CA3AF"],
  ];

  // Arrows: [fromBoxIdx, toBoxIdx]
  const arrows: Array<[number, number]> = [
    // Landing → Login, Signup
    [0, 4], [0, 5],
    // For Schools → Login, Demo
    [1, 4], [1, 2],
    // Demo → Login
    [2, 4],
    // VENTURE → Signup, Invention Wizard
    [3, 5], [3, 9],
    // Login → Dashboard, Instructor, Admin
    [4, 11], [4, 19], [4, 21],
    // Signup → Join
    [5, 6],
    // Join → Ikigai or Invention
    [6, 8], [6, 9],
    // Teacher Signup → Teacher Onboarding
    [7, 10],
    // Ikigai → Dashboard
    [8, 11],
    // Invention → Completion (group screen)
    [9, 16],
    // Teacher Onboarding → Instructor Dashboard
    [10, 19],
    // Dashboard → Lessons, AI Guide, Plan, Card, Achievements
    [11, 12], [11, 13], [11, 14], [11, 15], [11, 16],
    // Lessons → Completion
    [12, 17],
    // Dashboard → Founder's Log
    [11, 18],
    // Instructor → Invention Admin
    [19, 20],
  ];

  function boxCenter(idx: number): [number, number] {
    const b = boxes[idx];
    return [b[0] + b[2] / 2, b[1] + b[3] / 2];
  }

  function boxBottom(idx: number): [number, number] {
    const b = boxes[idx];
    return [b[0] + b[2] / 2, b[1] + b[3]];
  }

  function boxTop(idx: number): [number, number] {
    const b = boxes[idx];
    return [b[0] + b[2] / 2, b[1]];
  }

  return (
    <svg viewBox="0 0 700 400" className="w-full" style={{ minWidth: "700px", height: "auto" }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
        </marker>
      </defs>

      {/* Arrows */}
      {arrows.map(([from, to], i) => {
        const [x1, y1] = boxBottom(from);
        const [x2, y2] = boxTop(to);
        // If same row, use centers
        const sameRow = Math.abs(boxes[from][1] - boxes[to][1]) < 10;
        let fx: number, fy: number, tx: number, ty: number;
        if (sameRow) {
          const [cx1, cy1] = boxCenter(from);
          const [cx2, cy2] = boxCenter(to);
          fx = boxes[from][0] + (cx2 > cx1 ? boxes[from][2] : 0);
          fy = cy1;
          tx = boxes[to][0] + (cx2 > cx1 ? 0 : boxes[to][2]);
          ty = cy2;
        } else {
          fx = x1; fy = y1; tx = x2; ty = y2;
        }
        return (
          <line
            key={i}
            x1={fx} y1={fy} x2={tx} y2={ty}
            stroke="#D1D5DB" strokeWidth="1" markerEnd="url(#arrowhead)"
            opacity="0.6"
          />
        );
      })}

      {/* Boxes */}
      {boxes.map(([x, y, w, h, label, color], i) => (
        <g key={i}>
          <rect
            x={x} y={y} width={w} height={h}
            rx="6" ry="6"
            fill="var(--bg)"
            stroke={color}
            strokeWidth="1.5"
          />
          {label.includes("\n") ? (
            label.split("\n").map((line, li) => (
              <text
                key={li}
                x={x + w / 2} y={y + h / 2 + (li - 0.5) * 11}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontWeight="500"
                fill="var(--text-primary)"
                fontFamily="var(--font-body, system-ui)"
              >
                {line}
              </text>
            ))
          ) : (
            <text
              x={x + w / 2} y={y + h / 2}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fontWeight="500"
              fill="var(--text-primary)"
              fontFamily="var(--font-body, system-ui)"
            >
              {label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
