import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Adaptable for Schools — AI-Native Entrepreneurship Education",
  description:
    "Where students design, plan, and prepare to launch real businesses. Built for VentureLab. Standards-aligned, AI-powered, teacher-supported.",
};

const STATS = [
  { value: "1:1", label: "Every student gets a personal AI mentor" },
  { value: "8", label: "Lessons, standards-aligned and checkpoint-gated" },
  { value: "4", label: "National frameworks mapped per lesson" },
  { value: "155", label: "Countries with language support" },
];

const JOURNEY_STEPS = [
  {
    number: "01",
    title: "Discover Their Why",
    description:
      "Students complete an interactive Ikigai discovery to find the intersection of what they love, what they're good at, what the world needs, and what can be paid for. This becomes the foundation of their business.",
  },
  {
    number: "02",
    title: "Validate the Idea",
    description:
      "Through guided research on competition, target customers, and market need, students learn to think critically about whether their idea solves a real problem. No hand-waving, real analysis.",
  },
  {
    number: "03",
    title: "Talk to Customers",
    description:
      "An AI-powered Customer Interview Sandbox lets students practice asking open-ended questions to four realistic customer personas before conducting real interviews.",
  },
  {
    number: "04",
    title: "Build the Plan",
    description:
      "Students synthesize everything into a pricing strategy, customer acquisition plan, and final pitch. Every artifact they produce feeds into an auto-assembled business plan.",
  },
];

const AI_FEATURES = [
  {
    title: "Personalized to Every Student",
    description:
      "The AI detects each student's learning style, pace, and emotional state, then adapts its vocabulary, detail level, and encouragement in real time. A visual learner gets examples. An analytical thinker gets data. Every student gets the mentor they need.",
  },
  {
    title: "Always About Their Business",
    description:
      "Every example, every question, every checkpoint references the student's actual business idea. A student designing custom sneakers gets different guidance than one building a tutoring nonprofit. The curriculum is the same; the experience is unique.",
  },
  {
    title: "Teacher-Visible, Teacher-Controlled",
    description:
      "Teachers see a live feed of student progress, get alerts when students are stuck or struggling, and can intervene with one-click nudges. The AI is the tool; the teacher is the authority.",
  },
  {
    title: "Content Moderation Built In",
    description:
      "Input and output moderation in 10 languages filters inappropriate content before it reaches students. Prompt injection attempts are blocked. Every AI interaction is logged and auditable.",
  },
];

const TEACHER_TOOLS_PRIMARY = [
  {
    icon: "eye",
    title: "Live Dashboard",
    description: "Real-time view of every student's progress, current lesson, last activity, and business idea. No waiting for end-of-unit reports.",
  },
  {
    icon: "bell",
    title: "Smart Alerts",
    description: "Automatic detection of stuck students, emotional patterns, inactivity, and content flags. Prioritized by severity so you focus on who needs you most.",
  },
];

const TEACHER_TOOLS_SECONDARY = [
  {
    title: "One-Click Nudges",
    description: "Pre-written, context-aware message templates for each alert type. Send encouragement in 10 seconds.",
  },
  {
    title: "Class Analytics",
    description: "Completion rates, stuck points, average pace by lesson, and active-this-week metrics.",
  },
  {
    title: "Follow-Up Flags",
    description: "Flag any student for follow-up with priority levels and due dates. Your to-do list, built in.",
  },
  {
    title: "Intervention Log",
    description: "Every nudge, message, and resolution logged automatically. Documentation already done.",
  },
];

const STANDARDS = [
  { code: "NBEA", name: "National Business Education Association", focus: "Entrepreneurship Standards I-V" },
  { code: "ISTE", name: "ISTE Standards for Students", focus: "Empowered Learner, Knowledge Constructor, Computational Thinker" },
  { code: "CCSS", name: "Common Core State Standards", focus: "ELA (argumentative writing, research, speaking) + Math (proportional reasoning)" },
  { code: "Jump$tart", name: "Jump$tart Coalition", focus: "Financial Decision Making, Employment & Income, Spending & Saving" },
];

const SAFETY_ITEMS = [
  {
    title: "Content Moderation",
    detail: "All student input and AI output is filtered through multi-language moderation. Blocked content never reaches the screen.",
  },
  {
    title: "No Data Sold. Ever.",
    detail: "Student data is used only to personalize their learning experience. Never shared with third parties, never used for advertising.",
  },
  {
    title: "Teacher Oversight",
    detail: "Every AI interaction is visible to the teacher. Alerts surface anything that needs human attention.",
  },
  {
    title: "Rate Limiting",
    detail: "Per-student, per-feature rate limits prevent abuse and ensure fair usage across the class.",
  },
  {
    title: "Audit Trail",
    detail: "All AI usage is logged with timestamps, features used, and token counts. Full transparency for compliance.",
  },
  {
    title: "Invite-Only Access",
    detail: "Students join via teacher-generated invite codes tied to specific classes. No open registration.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is this just ChatGPT with a business theme?",
    a: "No. Adaptable uses a structured 8-lesson curriculum with checkpoints, mastery signals, and completion criteria. The AI follows lesson plans written by educators. Students can't skip ahead without demonstrating understanding. It's closer to a Socratic tutor than a chatbot.",
  },
  {
    q: "What devices do students need?",
    a: "A Chromebook and an internet connection. Adaptable runs entirely in the browser with no plugins, downloads, or WebGL. It's built specifically for school hardware.",
  },
  {
    q: "How long does the curriculum take?",
    a: "The 8 core lessons are designed for a 2-4 week unit, depending on class schedule. Most students spend 20-40 minutes per lesson. Teachers control the pacing.",
  },
  {
    q: "Can students cheat by asking the AI for answers?",
    a: "The AI is designed to ask questions, not give answers. When a student tries to shortcut, the AI redirects them to think critically. Checkpoint questions require original analysis of their specific business idea.",
  },
  {
    q: "What if a student writes something inappropriate?",
    a: "Content moderation runs on every input and output in 10 languages. Flagged content triggers an instant teacher alert. The teacher decides the response.",
  },
  {
    q: "Do teachers need training to use this?",
    a: "The instructor dashboard includes a built-in walkthrough on first login. Most teachers are comfortable within one class period. For larger deployments, we offer onboarding sessions.",
  },
  {
    q: "How does this align with my existing curriculum?",
    a: "Adaptable maps to NBEA Entrepreneurship Standards, Common Core (ELA + Math), ISTE Standards, and Jump$tart Financial Literacy Standards. A full lesson-by-lesson alignment document is available for curriculum review.",
  },
  {
    q: "What happens to student data after the course ends?",
    a: "Teachers can export student progress and artifacts at any time. Data retention policies are configurable per organization. Student accounts can be deactivated and data deleted on request.",
  },
  {
    q: "Can parents see what their child is doing?",
    a: "Yes. Adaptable includes a Parent View accessible via a PIN code set by the teacher. Parents can see their child's progress, business idea, and lesson completion without needing a separate account.",
  },
  {
    q: "Does this work for students who already have a business idea?",
    a: "Yes. During onboarding, students can indicate they already have a business. The AI adapts to build on their existing idea rather than starting from scratch.",
  },
];

function IconEye() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

const PRIMARY_ICONS: Record<string, () => React.ReactElement> = {
  eye: IconEye,
  bell: IconBell,
};

/* Ikigai diagram for the hero — uses HTML divs with mix-blend-mode
   to match the product's organic color blending at intersections */
const IKIGAI_CIRCLES = [
  { label: "What you love", color: "#F5E642", x: 50, y: 28 },
  { label: "What you're good at", color: "#A8DB5A", x: 32, y: 50 },
  { label: "What the world needs", color: "#F4A79D", x: 68, y: 50 },
  { label: "What you can be paid for", color: "#6DD5D0", x: 50, y: 72 },
] as const;

const LABEL_POSITIONS = [
  { text: "What you love", x: "50%", y: "4%" },
  { text: "What you're good at", x: "8%", y: "50%" },
  { text: "What the world needs", x: "92%", y: "50%" },
  { text: "What you can be paid for", x: "50%", y: "96%" },
] as const;

function IkigaiDiagram() {
  return (
    <div
      className="relative mx-auto w-full max-w-[480px]"
      style={{ aspectRatio: "1 / 1" }}
      role="img"
      aria-label="Ikigai diagram: four overlapping circles representing what you love, what you're good at, what the world needs, and what you can be paid for, with your business at the center"
    >
      {/* Four circles — staggered scale entrance */}
      {IKIGAI_CIRCLES.map((c) => (
        <div
          key={c.label}
          className="absolute rounded-full ikigai-hero-circle hover:opacity-40 transition-opacity duration-200"
          style={{
            width: "50%",
            height: "50%",
            left: `${c.x}%`,
            top: `${c.y}%`,
            backgroundColor: c.color,
          }}
        />
      ))}

      {/* Center — radial gradient with glow, matching the product */}
      <div
        className="absolute rounded-full pointer-events-none ikigai-hero-center"
        style={{
          width: "18%",
          height: "18%",
          left: "50%",
          top: "50%",
          background: "radial-gradient(circle, #4A6741 40%, #8B9E6A 100%)",
          boxShadow: "0 0 24px rgba(74, 103, 65, 0.3)",
          zIndex: 5,
        }}
      />

      {/* Center label */}
      <div
        className="absolute pointer-events-none flex flex-col items-center justify-center ikigai-hero-center"
        style={{
          left: "50%",
          top: "50%",
          zIndex: 6,
        }}
      >
        <span className="font-[family-name:var(--font-display)] text-[11px] font-bold text-white/90 tracking-[0.15em] leading-tight">
          YOUR
        </span>
        <span className="font-[family-name:var(--font-display)] text-[11px] font-bold text-white/90 tracking-[0.15em] leading-tight">
          BUSINESS
        </span>
      </div>

      {/* Outer labels — positioned inside the container bounds */}
      {LABEL_POSITIONS.map((lbl) => (
        <span
          key={lbl.text}
          className="absolute font-[family-name:var(--font-display)] text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap pointer-events-none ikigai-hero-label"
          style={{
            left: lbl.x,
            top: lbl.y,
          }}
        >
          {lbl.text}
        </span>
      ))}
    </div>
  );
}

export default function ForSchoolsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--primary)]"
          >
            Adaptable
          </Link>
          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              How It Works
            </a>
            <a href="#teacher-tools" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              For Teachers
            </a>
            <a href="#standards" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Standards
            </a>
            <a href="#faq" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              FAQ
            </a>
            <Link
              href="/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign In
            </Link>
            <a
              href="#request-demo"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-150"
            >
              Request a Demo
            </a>
          </div>
          {/* Mobile nav */}
          <div className="flex items-center gap-4 md:hidden">
            <Link
              href="/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign In
            </Link>
            <a
              href="#request-demo"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] transition-colors"
            >
              Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-20">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Left: copy */}
            <div className="animate-[fade-up_600ms_ease-out_both]">
              <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">
                Built for VentureLab
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-[32px] font-bold leading-[1.1] text-[var(--text-primary)] md:text-[48px]">
                Every student designs a real business.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)] md:text-xl">
                An AI-native curriculum that adapts to every student's idea, pace, and learning style.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
                {["Discover what they care about", "Validate a real idea", "Interview customers", "Set pricing", "Build a launch plan"].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{step}</span>
                    {i < arr.length - 1 && <span className="text-[var(--text-muted)]" aria-hidden="true">&middot;</span>}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#request-demo"
                  className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-light)] hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all duration-150"
                >
                  Request a Demo
                </a>
                <Link
                  href="/standards"
                  className="rounded-lg border border-[var(--border-strong)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                >
                  View Curriculum Alignment
                </Link>
              </div>
            </div>

            {/* Right: Ikigai diagram */}
            <div className="flex justify-center">
              <IkigaiDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-6 py-10 sm:flex-row sm:divide-x sm:divide-[var(--border)]">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex-1 stat-item sm:pl-6 first:pl-0">
              <p className="font-[family-name:var(--font-display)] text-[36px] font-bold leading-none text-[var(--primary)]">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works — vertical timeline */}
      <section id="how-it-works" className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-semibold text-[var(--text-primary)]">
            The Student Journey
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            Four stages. Eight lessons. One real business at the end.
          </p>

          <div className="relative mt-12 max-w-[640px] space-y-10">
            {/* Vertical connecting line */}
            <div
              className="absolute left-[15px] top-0 bottom-0 w-[2px]"
              style={{ background: "linear-gradient(to bottom, var(--primary), var(--primary-light), transparent)" }}
              aria-hidden="true"
            />

            {JOURNEY_STEPS.map((step, idx) => (
              <div key={step.number} className="relative flex gap-6">
                {/* Number badge */}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] font-[family-name:var(--font-display)] text-sm font-bold text-white">
                  {step.number}
                </div>
                {/* Content */}
                <div className={idx < JOURNEY_STEPS.length - 1 ? "pb-2" : ""}>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI That Teaches */}
      <section className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-semibold text-[var(--text-primary)]">
            AI That Teaches, Not Tells
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            The AI is a Socratic mentor, not an answer machine. It asks questions,
            gives feedback, and adapts to each student.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {AI_FEATURES.map((feature) => (
              <div key={feature.title} className="border-l-2 border-[var(--primary)] pl-6">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher Tools — two-tier layout */}
      <section id="teacher-tools" className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-semibold text-[var(--text-primary)]">
            Built for Teachers, Not Just Students
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            The instructor dashboard gives you visibility and control.
            You see everything. You decide what happens next.
          </p>

          {/* Primary tools — large cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {TEACHER_TOOLS_PRIMARY.map((tool, idx) => {
              const Icon = PRIMARY_ICONS[tool.icon];
              return (
                <div
                  key={tool.title}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8 hover:shadow-lg hover:border-[var(--primary)]/30 hover:-translate-y-1 transition-all duration-250 ease-out stagger-enter"
                  style={{ animationDelay: `${idx * 120}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] transition-transform duration-250 ease-out group-hover:scale-110">
                    {Icon && <Icon />}
                  </div>
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Secondary tools — compact grid with left accent */}
          <div className="mt-12">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Also included
            </p>
            <div className="mt-4 grid gap-x-12 gap-y-6 sm:grid-cols-2">
              {TEACHER_TOOLS_SECONDARY.map((tool, idx) => (
                <div
                  key={tool.title}
                  className="border-l-2 border-[var(--border-strong)] pl-4 stagger-enter"
                  style={{ animationDelay: `${240 + idx * 80}ms` }}
                >
                  <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                    {tool.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {tool.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust: Standards + Safety combined */}
      <section id="standards" className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-semibold text-[var(--text-primary)]">
            Built for the Classroom
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            Standards-aligned, privacy-first, and designed for institutional trust.
          </p>

          {/* Standards as horizontal badges */}
          <div className="mt-12 flex flex-wrap gap-4">
            {STANDARDS.map((std) => (
              <div
                key={std.code}
                className="inline-flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-5 py-3.5 hover:border-[var(--primary)]/30 hover:shadow-sm transition-all duration-100"
              >
                <span className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                  {std.code}
                </span>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">{std.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{std.focus}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/standards"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
            >
              View full lesson-by-lesson alignment document
              <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>

          {/* Safety items — compact two-column list */}
          <div className="mt-12 grid gap-x-12 gap-y-5 sm:grid-cols-2">
            {SAFETY_ITEMS.map((item) => (
              <div key={item.title} className="border-l-2 border-[var(--primary)]/40 pl-4">
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-semibold text-[var(--text-primary)]">
            Frequently Asked Questions
          </h2>

          <div className="mt-12 max-w-[800px] divide-y divide-[var(--border)] border-t border-[var(--border)]">
            {FAQ.map((item, idx) => (
              <div key={idx} className="py-6 -mx-4 px-4 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors duration-100">
                <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                  <span className="text-[var(--primary)] mr-1.5">Q:</span>
                  {item.q}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request a Demo CTA — dark teal with amber button */}
      <section id="request-demo" className="bg-[var(--bg)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="rounded-xl bg-[var(--primary-dark)] p-12 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-[32px] font-semibold text-white">
              See It in Action
            </h2>
            <p className="mx-auto mt-3 max-w-[500px] text-base text-white/80">
              30-minute walkthrough with your team. We'll show you the student
              experience, the instructor dashboard, and answer every question.
            </p>
            <div className="mt-8">
              <a
                href="mailto:demo@adaptable.app?subject=Demo%20Request%20-%20Adaptable%20for%20Schools"
                className="inline-flex rounded-lg bg-[var(--accent)] px-8 py-3 text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-all duration-150"
                style={{ boxShadow: "0 0 20px rgba(245, 158, 11, 0.35), 0 0 60px rgba(245, 158, 11, 0.1)" }}
              >
                Request a Demo
              </a>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Or email us directly at demo@adaptable.app
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:justify-between">
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-muted)]">
            Adaptable &mdash; A VentureLab Product
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/standards"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Curriculum Alignment
            </Link>
            <Link
              href="/login"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
