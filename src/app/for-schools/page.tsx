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

/* Ikigai SVG for the hero */
function IkigaiDiagram() {
  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .ikigai-center-pulse {
            animation: ikigaiPulse 3s ease-in-out infinite;
            transform-origin: 200px 215px;
          }
          @keyframes ikigaiPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.9; }
          }
          .ikigai-circle {
            transition: opacity 200ms ease-out;
          }
          .ikigai-circle:hover {
            opacity: 0.65 !important;
          }
        }
      `}</style>
      <svg viewBox="0 0 400 430" className="w-full max-w-[480px]" aria-label="Ikigai diagram showing four overlapping circles: What you love, What you're good at, What the world needs, and What you can be paid for">
        {/* Four overlapping circles — spread to match product diagram */}
        <circle className="ikigai-circle" cx="200" cy="120" r="110" fill="#F5E642" opacity="0.55" stroke="#fff" strokeWidth="1" />
        <circle className="ikigai-circle" cx="120" cy="230" r="110" fill="#A8DB5A" opacity="0.55" stroke="#fff" strokeWidth="1" />
        <circle className="ikigai-circle" cx="280" cy="230" r="110" fill="#F4A79D" opacity="0.55" stroke="#fff" strokeWidth="1" />
        <circle className="ikigai-circle" cx="200" cy="310" r="110" fill="#6DD5D0" opacity="0.55" stroke="#fff" strokeWidth="1" />

        {/* Center glow */}
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4A6741" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4A6741" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="215" r="60" fill="url(#centerGlow)" />

        {/* Center circles */}
        <circle cx="200" cy="215" r="45" fill="#8B9E6A" opacity="0.85" />
        <circle className="ikigai-center-pulse" cx="200" cy="215" r="24" fill="#4A6741" stroke="#fff" strokeWidth="1.5" />

        {/* Intersection labels */}
        <text x="160" y="168" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="10" fontWeight="600" fill="#6B7A3D" opacity="0.8">Passion</text>
        <text x="240" y="168" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="10" fontWeight="600" fill="#B87D4A" opacity="0.8">Mission</text>
        <text x="155" y="280" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="10" fontWeight="600" fill="#5A9A5A" opacity="0.8">Profession</text>
        <text x="248" y="280" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="10" fontWeight="600" fill="#8A7A5A" opacity="0.8">Vocation</text>

        {/* Outer labels */}
        <text x="200" y="40" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="13" fontWeight="600" className="fill-[var(--text-primary)]">What you love</text>
        <text x="38" y="230" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="12" fontWeight="600" className="fill-[var(--text-primary)]">What you&apos;re</text>
        <text x="38" y="245" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="12" fontWeight="600" className="fill-[var(--text-primary)]">good at</text>
        <text x="362" y="230" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="12" fontWeight="600" className="fill-[var(--text-primary)]">What the world</text>
        <text x="362" y="245" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="12" fontWeight="600" className="fill-[var(--text-primary)]">needs</text>
        <text x="200" y="400" textAnchor="middle" fontFamily="'Satoshi', sans-serif" fontSize="13" fontWeight="600" className="fill-[var(--text-primary)]">What you can be paid for</text>

        {/* Center label */}
        <text x="200" y="211" textAnchor="middle" fill="white" fontFamily="'Satoshi', sans-serif" fontSize="10" fontWeight="800" letterSpacing="1.5">YOUR</text>
        <text x="200" y="224" textAnchor="middle" fill="white" fontFamily="'Satoshi', sans-serif" fontSize="10" fontWeight="800" letterSpacing="1.5">BUSINESS</text>
      </svg>
    </>
  );
}

export default function ForSchoolsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
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
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] transition-colors"
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
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">
                Built for VentureLab
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-[32px] font-bold leading-[1.1] text-[var(--text-primary)] md:text-[48px]">
                Every student designs a real business.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)] md:text-xl">
                An AI-native curriculum that adapts to every student's idea, pace, and learning style.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {["Discover what they care about", "Validate a real idea", "Interview customers", "Set pricing", "Build a launch plan"].map((step) => (
                  <span key={step} className="text-sm text-[var(--text-muted)]">
                    {step}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#request-demo"
                  className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-colors"
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
            <div className="flex justify-center md:justify-end">
              <IkigaiDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-6 py-8 sm:flex-row">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex-1">
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--primary)]">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{stat.label}</p>
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
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border)]" aria-hidden="true" />

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
            {TEACHER_TOOLS_PRIMARY.map((tool) => {
              const Icon = PRIMARY_ICONS[tool.icon];
              return (
                <div
                  key={tool.title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8 hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
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

          {/* Secondary tools — compact grid, no cards */}
          <div className="mt-8 grid gap-x-12 gap-y-6 sm:grid-cols-2">
            {TEACHER_TOOLS_SECONDARY.map((tool) => (
              <div key={tool.title}>
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
                className="inline-flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-5 py-3"
              >
                <span className="inline-block rounded bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--primary)]">
                  {std.code}
                </span>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">{std.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{std.focus}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Link
              href="/standards"
              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
            >
              View full lesson-by-lesson alignment document &rarr;
            </Link>
          </div>

          {/* Safety items — compact two-column list */}
          <div className="mt-12 grid gap-x-12 gap-y-4 sm:grid-cols-2">
            {SAFETY_ITEMS.map((item) => (
              <div key={item.title}>
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
              <div key={idx} className="py-6">
                <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
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
                className="inline-flex rounded-lg bg-[var(--accent)] px-8 py-3 text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-colors"
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
