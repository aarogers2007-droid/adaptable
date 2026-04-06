import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Adaptable for Schools — AI-Native Entrepreneurship Education",
  description:
    "Where students design, plan, and prepare to launch real businesses. Built for VentureLab. Standards-aligned, AI-powered, teacher-supported.",
};

const STATS = [
  { value: "8", label: "Standards-Aligned Lessons" },
  { value: "4", label: "National Frameworks" },
  { value: "155", label: "Countries Supported" },
  { value: "1:1", label: "AI Mentor Ratio" },
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
      "Through guided research on competition, target customers, and market need, students learn to think critically about whether their idea solves a real problem. No hand-waving — real analysis.",
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

const TEACHER_TOOLS = [
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
  {
    icon: "send",
    title: "One-Click Nudges",
    description: "Pre-written, context-aware message templates for each alert type. Send encouragement, check in, or redirect — in 10 seconds, not 10 minutes.",
  },
  {
    icon: "bar-chart",
    title: "Class Analytics",
    description: "Completion rates, stuck points, average pace by lesson, and active-this-week metrics. See where the class is thriving and where it needs you.",
  },
  {
    icon: "flag",
    title: "Follow-Up Flags",
    description: "Flag any student for follow-up with priority levels and due dates. Your to-do list, built into the dashboard.",
  },
  {
    icon: "clipboard",
    title: "Intervention Log",
    description: "Every nudge, message, flag, and resolution is logged automatically. Documentation for parent conferences, IEPs, and admin reviews — already done.",
  },
];

const STANDARDS = [
  { code: "NBEA", name: "National Business Education Association", focus: "Entrepreneurship Standards I–V" },
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
    detail: "Student data is used only to personalize their learning experience. It is never shared with third parties, used for advertising, or sold.",
  },
  {
    title: "Teacher Oversight",
    detail: "Every AI interaction is visible to the teacher. Alerts surface anything that needs human attention. The AI does not replace the adult in the room.",
  },
  {
    title: "Rate Limiting",
    detail: "Per-student, per-feature rate limits prevent abuse and ensure fair usage across the class.",
  },
  {
    title: "Audit Trail",
    detail: "All AI usage is logged with timestamps, features used, and token counts. Full transparency for administrators and compliance reviews.",
  },
  {
    title: "Authentication",
    detail: "Students join only via teacher-generated invite codes tied to specific classes. No open registration. No anonymous access.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is this just ChatGPT with a business theme?",
    a: "No. Adaptable uses a structured 8-lesson curriculum with checkpoints, mastery signals, and completion criteria. The AI follows lesson plans written by educators — it doesn't freestyle. Students can't skip ahead without demonstrating understanding. It's closer to a Socratic tutor than a chatbot.",
  },
  {
    q: "What devices do students need?",
    a: "A Chromebook and an internet connection. Adaptable runs entirely in the browser with no plugins, downloads, or WebGL. It's built specifically for school hardware.",
  },
  {
    q: "How long does the curriculum take?",
    a: "The 8 core lessons are designed for a 2-4 week unit, depending on class schedule. Most students spend 20-40 minutes per lesson. Teachers control the pacing — students can't rush past checkpoints.",
  },
  {
    q: "Can students cheat by asking the AI for answers?",
    a: "The AI is designed to ask questions, not give answers. When a student tries to shortcut (\"just tell me what to write\"), the AI redirects them to think critically. Checkpoint questions require original analysis of their specific business idea — there's nothing to copy.",
  },
  {
    q: "What if a student writes something inappropriate?",
    a: "Content moderation runs on every input and output in 10 languages. Flagged content triggers an instant teacher alert. The teacher decides the response — the AI doesn't make disciplinary decisions.",
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
    a: "Yes. During onboarding, students can indicate they already have a business. The AI adapts to build on their existing idea rather than starting from scratch, validating and strengthening what they've already started.",
  },
];

function IconEye() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}
function IconBarChart() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}

const TOOL_ICONS: Record<string, () => React.ReactElement> = {
  eye: IconEye,
  bell: IconBell,
  send: IconSend,
  "bar-chart": IconBarChart,
  flag: IconFlag,
  clipboard: IconClipboard,
};

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
          <div className="flex items-center gap-6">
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
            <a
              href="#request-demo"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] transition-colors"
            >
              Request a Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="max-w-[720px]">
            <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">
              Built for VentureLab
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[48px] font-bold leading-[1.1] text-[var(--text-primary)]">
              Every student designs a real business.
            </h1>
            <p className="mt-5 text-xl leading-relaxed text-[var(--text-secondary)]">
              Adaptable is an AI-native entrepreneurship curriculum where students
              discover what they care about, validate a real business idea, interview
              customers, set pricing, and build a launch plan. Every lesson is
              personalized to their idea, their pace, and their learning style.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a
                href="#request-demo"
                className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-light)] transition-colors"
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

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--primary)]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-bold text-[var(--text-primary)]">
            The Student Journey
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            Four stages. Eight lessons. One real business at the end.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {JOURNEY_STEPS.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6"
              >
                <span className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--primary)]">
                  {step.number}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI That Teaches */}
      <section className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-bold text-[var(--text-primary)]">
            AI That Teaches, Not Tells
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            The AI is a Socratic mentor, not an answer machine. It asks questions,
            gives feedback, and adapts to each student.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {AI_FEATURES.map((feature) => (
              <div key={feature.title}>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher Tools */}
      <section id="teacher-tools" className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-bold text-[var(--text-primary)]">
            Built for Teachers, Not Just Students
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            The instructor dashboard gives you visibility and control.
            You see everything. You decide what happens next.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEACHER_TOOLS.map((tool) => {
              const Icon = TOOL_ICONS[tool.icon];
              return (
                <div
                  key={tool.title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--primary)]">
                    {Icon && <Icon />}
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Standards */}
      <section id="standards" className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-bold text-[var(--text-primary)]">
            Standards-Aligned Curriculum
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            Every lesson maps to recognized national frameworks. Full
            lesson-by-lesson alignment is available for curriculum review.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {STANDARDS.map((std) => (
              <div
                key={std.code}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5"
              >
                <span className="inline-block rounded-md bg-[var(--primary)] px-2.5 py-0.5 text-xs font-bold text-white">
                  {std.code}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                  {std.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{std.focus}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/standards"
              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
            >
              View full lesson-by-lesson alignment document &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Safety & Privacy */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-bold text-[var(--text-primary)]">
            Safety and Privacy
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-[var(--text-secondary)]">
            We take student safety seriously. Here's how.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SAFETY_ITEMS.map((item) => (
              <div key={item.title}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-[family-name:var(--font-display)] text-[32px] font-bold text-[var(--text-primary)]">
            Frequently Asked Questions
          </h2>

          <div className="mt-12 space-y-0 divide-y divide-[var(--border)]">
            {FAQ.map((item, idx) => (
              <div key={idx} className="py-6">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {item.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request a Demo CTA */}
      <section id="request-demo" className="bg-[var(--bg)]">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-12 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-[32px] font-bold text-[var(--text-primary)]">
              See It in Action
            </h2>
            <p className="mx-auto mt-3 max-w-[500px] text-base text-[var(--text-secondary)]">
              30-minute walkthrough with your team. We'll show you the student
              experience, the instructor dashboard, and answer every question.
            </p>
            <div className="mt-8">
              <a
                href="mailto:demo@adaptable.app?subject=Demo%20Request%20-%20Adaptable%20for%20Schools"
                className="inline-flex rounded-lg bg-[var(--primary)] px-8 py-3 text-base font-semibold text-white hover:bg-[var(--primary-light)] transition-colors"
              >
                Request a Demo
              </a>
            </div>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              Or email us directly at demo@adaptable.app
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6">
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
