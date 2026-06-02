import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AJAnalytics from "./AJAnalytics";

export const dynamic = "force-dynamic";

/**
 * AJ's Dashboard — platform owner only.
 *
 * Hardcoded to aarogers2007@gmail.com. No one else can access this page.
 * Every route on the platform is listed as a direct link. No auth flows,
 * no redirects, no friction. Click and go.
 */

const VENTURE_CLASS_ID = "c0000000-0000-0000-0000-000000000c01";

export default async function AJDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_owner")
    .eq("id", user.id)
    .single();

  // Hard gate: platform owners only
  if (!profile?.is_platform_owner) {
    redirect("/dashboard");
  }

  // Fetch open support escalations
  const { data: escalations } = await supabase
    .from("support_escalations")
    .select("id, user_name, user_role, summary, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch scenario count
  const { count: scenarioCount } = await supabase
    .from("scenarios")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const sections = [
    {
      label: "Student Experience",
      links: [
        { href: "/dashboard", name: "Student Dashboard" },
        { href: "/onboarding", name: "Ikigai Wizard (Onboarding)" },
        { href: "/onboarding/ready", name: "Onboarding Complete" },
        { href: "/lessons", name: "Lessons Index" },
        { href: "/scenarios", name: `Scenarios Library (${scenarioCount ?? 0} active)` },
        { href: "/plan", name: "Business Plan" },
        { href: "/card", name: "Business Card Designer" },
        { href: "/achievements", name: "Achievements" },
        { href: "/leaderboard", name: "Leaderboard (Grade-Filtered)" },
        { href: "/completion", name: "Completion Ceremony" },
        { href: "/dashboard/founders-log", name: "Founder's Log" },
        { href: "/dashboard/founders-log/analytics", name: "Founder's Log Analytics" },
        { href: "/privacy", name: "Privacy Settings" },
      ],
    },
    {
      label: "Invention Mode",
      links: [
        { href: "/invention", name: "Invention Wizard (Student)" },
        { href: `/instructor/invention/${VENTURE_CLASS_ID}`, name: "Invention Admin Dashboard" },
        { href: `/instructor/invention/${VENTURE_CLASS_ID}/print/roster`, name: "Print: Group Roster" },
        { href: `/instructor/invention/${VENTURE_CLASS_ID}/print/slips`, name: "Print: Student Slips" },
      ],
    },
    {
      label: "Admin & Instructor",
      links: [
        { href: "/admin", name: "Platform Admin (Provision Orgs)" },
        { href: "/instructor/dashboard", name: "Instructor Dashboard" },
      ],
    },
    {
      label: "Auth & Onboarding",
      links: [
        { href: "/login", name: "Login Page" },
        { href: "/signup", name: "Student Signup" },
        { href: "/join", name: "Join a Class (Optional)" },
      ],
    },
    {
      label: "Public Pages",
      links: [
        { href: "/", name: "Landing Page" },
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

        {/* Real-time analytics */}
        <div className="mt-6">
          <AJAnalytics />
        </div>

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

        {/* Support escalations */}
        {escalations && escalations.length > 0 && (
          <div className="mt-8">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-4">
              Open Support Issues ({escalations.length})
            </h2>
            <div className="space-y-3">
              {escalations.map((esc) => (
                <div key={esc.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{esc.user_name}</span>
                    <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{esc.user_role}</span>
                    <span className="ml-auto text-[10px] text-[var(--text-muted)]">
                      {new Date(esc.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap" style={{ lineHeight: 1.5 }}>
                    {esc.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flow diagram */}
        <div className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-4">
            Platform Flow
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 overflow-x-auto">
            <FlowDiagram />
            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--border)] pt-4">
              <p className="w-full text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Key</p>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#9CA3AF" }} /><span className="text-xs text-[var(--text-secondary)]">Public pages</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#60A5FA" }} /><span className="text-xs text-[var(--text-secondary)]">Auth flow</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#C084FC" }} /><span className="text-xs text-[var(--text-secondary)]">Invention mode</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#F5E642" }} /><span className="text-xs text-[var(--text-secondary)]">Curriculum onboarding</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#4ADE80" }} /><span className="text-xs text-[var(--text-secondary)]">Student experience</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#F59E0B" }} /><span className="text-xs text-[var(--text-secondary)]">Completion</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#0D9488" }} /><span className="text-xs text-[var(--text-secondary)]">Reflection</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#F87171" }} /><span className="text-xs text-[var(--text-secondary)]">Admin</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#38BDF8" }} /><span className="text-xs text-[var(--text-secondary)]">Scenarios</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2" style={{ borderColor: "#A78BFA" }} /><span className="text-xs text-[var(--text-secondary)]">Org onboarding</span></div>
              {/* Arrows */}
              <div className="flex items-center gap-2"><svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="var(--border-strong)" strokeWidth="1.5" /></svg><span className="text-xs text-[var(--text-secondary)]">Natural navigation</span></div>
              <div className="flex items-center gap-2"><svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="6 4" /></svg><span className="text-xs text-[var(--text-secondary)]">Auth redirect</span></div>
              <div className="flex items-center gap-2"><svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#F87171" strokeWidth="1.5" strokeDasharray="2 3" /></svg><span className="text-xs text-[var(--text-secondary)]">Admin route</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FlowDiagram() {
  const W = 120, H = 40, GAP_X = 16, GAP_Y = 26;
  const COL = (c: number) => 20 + c * (W + GAP_X);
  const ROW_Y = (r: number) => 20 + r * (H + GAP_Y);

  const boxes: Array<{ x: number; y: number; w: number; h: number; label: string; color: string }> = [
    // Row 0: Entry points (4)
    { x: COL(0), y: ROW_Y(0), w: W, h: H, label: "Landing /", color: "#9CA3AF" },         // 0
    { x: COL(1), y: ROW_Y(0), w: W, h: H, label: "For Schools", color: "#9CA3AF" },        // 1
    { x: COL(2), y: ROW_Y(0), w: W, h: H, label: "Demo", color: "#9CA3AF" },               // 2
    { x: COL(3), y: ROW_Y(0), w: W, h: H, label: "VENTURE", color: "#C084FC" },            // 3
    { x: COL(4), y: ROW_Y(0), w: W, h: H, label: "Subdomain", color: "#A78BFA" },          // 4

    // Row 1: Auth (5)
    { x: COL(0), y: ROW_Y(1), w: W, h: H, label: "Login", color: "#60A5FA" },              // 5
    { x: COL(1), y: ROW_Y(1), w: W, h: H, label: "Student Signup", color: "#60A5FA" },     // 6
    { x: COL(2), y: ROW_Y(1), w: W, h: H, label: "Join Class", color: "#60A5FA" },         // 7
    { x: COL(3), y: ROW_Y(1), w: W, h: H, label: "Teacher Signup", color: "#60A5FA" },     // 8
    { x: COL(4), y: ROW_Y(1), w: W, h: H, label: "Org Onboarding", color: "#A78BFA" },     // 9

    // Row 2: Onboarding (3)
    { x: COL(0), y: ROW_Y(2), w: W, h: H, label: "Ikigai Wizard", color: "#F5E642" },      // 10
    { x: COL(1), y: ROW_Y(2), w: W, h: H, label: "Invention Wizard", color: "#C084FC" },   // 11
    { x: COL(3), y: ROW_Y(2), w: W, h: H, label: "Teacher Onboard", color: "#60A5FA" },    // 12

    // Row 3: Main experience (5)
    { x: COL(0), y: ROW_Y(3), w: W, h: H, label: "Dashboard", color: "#4ADE80" },          // 13
    { x: COL(1), y: ROW_Y(3), w: W, h: H, label: "Lessons", color: "#4ADE80" },            // 14
    { x: COL(2), y: ROW_Y(3), w: W, h: H, label: "Scenarios", color: "#38BDF8" },          // 15
    { x: COL(3), y: ROW_Y(3), w: W, h: H, label: "AI Guide", color: "#4ADE80" },           // 16
    { x: COL(4), y: ROW_Y(3), w: W, h: H, label: "Plan / Card", color: "#4ADE80" },        // 17

    // Row 4: Rewards + Reflection (5)
    { x: COL(0), y: ROW_Y(4), w: W, h: H, label: "Achievements", color: "#4ADE80" },       // 18
    { x: COL(1), y: ROW_Y(4), w: W, h: H, label: "Leaderboard", color: "#4ADE80" },        // 19
    { x: COL(2), y: ROW_Y(4), w: W, h: H, label: "Completion", color: "#F59E0B" },         // 20
    { x: COL(3), y: ROW_Y(4), w: W, h: H, label: "Founder's Log", color: "#0D9488" },      // 21
    { x: COL(4), y: ROW_Y(4), w: W, h: H, label: "Parent View", color: "#9CA3AF" },        // 22

    // Row 5: Admin (3)
    { x: COL(0), y: ROW_Y(5), w: W, h: H, label: "Instructor Dash", color: "#F87171" },    // 23
    { x: COL(1), y: ROW_Y(5), w: W, h: H, label: "Invention Admin", color: "#C084FC" },    // 24
    { x: COL(2), y: ROW_Y(5), w: W, h: H, label: "Platform Admin", color: "#F87171" },     // 25
  ];

  const arrows: Array<{ from: number; to: number; type: "nav" | "auth" | "admin" }> = [
    // Entry → Auth
    { from: 0, to: 5, type: "auth" }, { from: 1, to: 5, type: "auth" },
    { from: 2, to: 5, type: "auth" }, { from: 3, to: 6, type: "auth" },
    { from: 4, to: 5, type: "auth" },
    // Login → destinations
    { from: 5, to: 13, type: "auth" }, { from: 5, to: 23, type: "admin" }, { from: 5, to: 25, type: "admin" },
    { from: 5, to: 9, type: "auth" }, // org_admin without org → org onboarding
    // Signup → Join (optional)
    { from: 6, to: 7, type: "nav" },
    // Join → Wizards
    { from: 7, to: 10, type: "nav" }, { from: 7, to: 11, type: "nav" },
    // Teacher flows
    { from: 8, to: 12, type: "nav" }, { from: 12, to: 23, type: "admin" },
    // Org onboarding → Instructor
    { from: 9, to: 23, type: "nav" },
    // Wizards → destinations
    { from: 10, to: 13, type: "nav" }, { from: 11, to: 20, type: "nav" },
    // Dashboard navigation (main tabs)
    { from: 13, to: 14, type: "nav" }, { from: 13, to: 15, type: "nav" },
    { from: 13, to: 16, type: "nav" }, { from: 13, to: 17, type: "nav" },
    // Lessons → Achievements
    { from: 14, to: 18, type: "nav" },
    // Scenarios → badges (back to dashboard)
    { from: 15, to: 18, type: "nav" },
    // Dashboard → rewards
    { from: 13, to: 19, type: "nav" }, { from: 13, to: 21, type: "nav" },
    // Admin
    { from: 23, to: 24, type: "admin" },
  ];

  const totalW = 20 + 5 * (W + GAP_X);
  const totalH = ROW_Y(5) + H + 20;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full" style={{ minWidth: `${totalW}px`, height: "auto" }}>
      <defs>
        <marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--text-muted)" />
        </marker>
      </defs>

      {/* Row labels */}
      {[
        { y: ROW_Y(0), label: "Entry" },
        { y: ROW_Y(1), label: "Auth" },
        { y: ROW_Y(2), label: "Onboarding" },
        { y: ROW_Y(3), label: "Experience" },
        { y: ROW_Y(4), label: "Rewards" },
        { y: ROW_Y(5), label: "Admin" },
      ].map((r, i) => (
        <text key={i} x={8} y={r.y + H / 2} textAnchor="end" dominantBaseline="middle"
          fontSize="7" fill="var(--text-muted)" fontWeight="600" fontFamily="var(--font-body, system-ui)"
          transform={`rotate(-90, 8, ${r.y + H / 2})`}>{r.label}</text>
      ))}

      {arrows.map((a, i) => {
        const f = boxes[a.from], t = boxes[a.to];
        const sameRow = f.y === t.y;
        let x1: number, y1: number, x2: number, y2: number;
        if (sameRow) {
          const ltr = t.x > f.x;
          x1 = ltr ? f.x + f.w : f.x; y1 = f.y + f.h / 2;
          x2 = ltr ? t.x : t.x + t.w; y2 = t.y + t.h / 2;
        } else {
          x1 = f.x + f.w / 2; y1 = f.y + f.h;
          x2 = t.x + t.w / 2; y2 = t.y;
        }
        const dash = a.type === "auth" ? "6 4" : a.type === "admin" ? "2 3" : "none";
        const color = a.type === "auth" ? "#60A5FA" : a.type === "admin" ? "#F87171" : "var(--border-strong)";
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth="1.5" strokeDasharray={dash} markerEnd="url(#ah)" opacity="0.5" />
        );
      })}

      {boxes.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill="var(--bg)" stroke={b.color} strokeWidth="2" />
          <text x={b.x + b.w / 2} y={b.y + b.h / 2} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fontWeight="500" fill="var(--text-primary)" fontFamily="var(--font-body, system-ui)">
            {b.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
