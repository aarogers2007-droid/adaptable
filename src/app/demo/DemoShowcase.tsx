"use client";

/*
 * ADAPTABLE PRODUCT DEMO — Full Fidelity
 *
 * Uses ACTUAL platform components with mock data.
 * No recreations. No simplifications. The real thing.
 *
 * Golden Ratio (φ = 1.618034) governs all section spacing:
 *   Section padding: 80px (≈ φ⁵ in base-8 scale)
 *   Content max-width: 800px (≈ 100/φ × 1296px viewport)
 *   Gap between header and content: 48px (≈ φ⁴ × 8)
 *
 * Student: Elsa Martinez
 * Business: Elsa's Art Studio
 */

import { useRef, useState } from "react";
import Link from "next/link";

// ── Mobile tab system (md:hidden). Desktop (>=md) is unaffected — every
// tab pane force-shows via md:!block so the linear scroll layout is
// identical to before. Tabs group the demo's 12 sections into 5 coherent
// narrative beats so mobile visitors aren't staring down a 19,500px scroll. ──
type MobileTab = "journey" | "rewards" | "teachers" | "mirror" | "moments" | "proof";

const MOBILE_TABS: { key: MobileTab; label: string }[] = [
  { key: "journey", label: "Journey" },
  { key: "rewards", label: "Rewards" },
  { key: "teachers", label: "Teachers" },
  { key: "mirror", label: "Mirror" },
  { key: "moments", label: "Moments" },
  { key: "proof", label: "Proof" },
];

// ── ACTUAL PLATFORM COMPONENTS ──
import IkigaiDiagram from "@/components/ikigai/IkigaiDiagram";
import Card3D from "@/app/(app)/card/Card3D";
import CompletionCeremony from "@/app/(app)/completion/CompletionCeremony";
import IkigaiWizard from "@/components/ikigai/IkigaiWizard";
import type { BusinessIdea } from "@/lib/types";
import IkigaiRevealDemo from "./IkigaiRevealDemo";
import DemoAchievements from "./DemoAchievements";
import DemoCardDesigner from "./DemoCardDesigner";

// ── Demo data ──
const ELSA = {
  name: "Elsa Martinez",
  first: "Elsa",
};

const ELSA_STUDIO = {
  name: "Elsa's Art Studio",
  niche: "An art education studio for creative self-expression",
  target: "14-18 year olds who love creating but don't have access to art programs",
  revenue: "Weekly group workshops ($25/session) + private lessons ($40/hr)",
};

const IKIGAI = {
  passions: ["Painting", "Drawing", "Helping others create"],
  skills: ["Visual composition", "Color theory", "Teaching"],
  needs: ["Creative outlets for teens", "Affordable art education", "Self-expression spaces"],
  monetization: "Art workshops, Private lessons, Commission pieces",
};

const DECISIONS = [
  { lesson: "Your WHY", text: "I want to help teens express themselves through art because it changed my life." },
  { lesson: "Niche Validation", text: "There are no affordable teen art programs in my area — the closest is 30 min away and costs $200/month." },
  { lesson: "Competition Research", text: "My edge is that I'm a teen myself. I know what we actually want to create, not what adults think we should." },
  { lesson: "Target Customer", text: "My ideal customer is a 15-year-old who doodles in class, watches art tutorials on YouTube, and wishes they could take real lessons." },
  { lesson: "Customer Interviews", text: "3 out of 4 people I interviewed said they'd pay for a weekly workshop if it was under $30." },
];

export default function DemoShowcase() {
  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyDone, setCeremonyDone] = useState(false);
  const [showIkigaiReveal, setShowIkigaiReveal] = useState(false);
  const [ikigaiRevealDone, setIkigaiRevealDone] = useState(false);
  // Editable business name — visitor can rename "Elsa's Art Studio" and
  // watch it propagate across the dashboard, business plan, business card,
  // parent view, instructor dashboard preview, and pitch quote. Single
  // source of truth, no persistence (resets on page refresh).
  const [bizName, setBizName] = useState<string>(ELSA_STUDIO.name);
  // DIY wizard launcher: when true, the inline IkigaiDiagram in the Ikigai
  // Discovery section is replaced with a live IkigaiWizard component running
  // in demoMode (no auth, real synthesis, sign-up CTA at the end).
  const [showDiyWizard, setShowDiyWizard] = useState(false);
  const [diyResult, setDiyResult] = useState<BusinessIdea | null>(null);

  // Tab state — applies on both mobile and desktop. Default to "journey"
  // (the product walkthrough).
  const [mobileTab, setMobileTab] = useState<MobileTab>("journey");
  const tabsAnchorRef = useRef<HTMLDivElement | null>(null);

  const selectMobileTab = (key: MobileTab) => {
    setMobileTab(key);
    // Scroll the tab bar back into view so the visitor lands at the top
    // of the new pane instead of mid-scroll of the old one.
    requestAnimationFrame(() => {
      tabsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Utility: className that hides the group unless its tab is active.
  const tabPane = (key: MobileTab) =>
    mobileTab === key ? "" : "hidden";

  if (showCeremony && !ceremonyDone) {
    return (
      <CompletionCeremony
        studentName={ELSA.name}
        businessName={bizName}
        businessNiche={ELSA_STUDIO.niche}
        ikigai={IKIGAI}
        demoMode={true}
        onComplete={() => {
          setCeremonyDone(true);
          setShowCeremony(false);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center justify-center px-6 py-32 text-center border-b border-[var(--border)]">
        <h1 className="font-[family-name:var(--font-display)] text-[48px] font-bold leading-[1.1] text-[var(--text-primary)]">
          Adaptable
        </h1>
        <p className="mt-5 max-w-[500px] text-lg leading-relaxed text-[var(--text-secondary)]">
          Where every student discovers what they care about, validates a real business idea, and builds a plan to launch it.
        </p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          This is {ELSA.first}&apos;s journey through the platform. Scroll to see every feature.
        </p>
      </section>

      {/* ═══ TAB NAV — applies on both mobile and desktop ═══
              Sticky so a visitor scrolling within a tab can jump sideways
              without scrolling all the way back up. Centered on desktop,
              horizontally scrollable on narrow screens if labels overflow. */}
      <div
        ref={tabsAnchorRef}
        className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm"
        role="tablist"
        aria-label="Demo sections"
      >
        <div className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-3 py-3 md:justify-center md:gap-2 md:px-6 md:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOBILE_TABS.map((t) => {
            const active = mobileTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                data-tab={t.key}
                onClick={() => selectMobileTab(t.key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 font-[family-name:var(--font-display)] text-[13px] font-semibold transition-colors md:px-6 md:py-2.5 md:text-sm ${
                  active
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ TAB PANE: JOURNEY — Ikigai → Dashboard → Lessons ═══ */}
      <div className={tabPane("journey")}>

      {/* ═══ 1. IKIGAI DIAGRAM — REAL COMPONENT ═══ */}
      <Section label="The Starting Point" title="Ikigai Discovery" description={`Every student begins by answering four questions about themselves. The Ikigai diagram guides them through the process. Here is the actual interactive diagram — click any circle.`}>
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div className="mx-auto w-full max-w-[400px]">
            <IkigaiDiagram
              completedSteps={new Set([1, 2, 3, 4])}
              onStepClick={() => {}}
              showReveal={false}
              businessName={bizName}
            />
          </div>
          <div className="space-y-4">
            <p className="text-base font-semibold text-[var(--text-primary)]">{ELSA.first}&apos;s Ikigai Answers:</p>
            {[
              { label: "What she loves", items: IKIGAI.passions, color: "#F5E642" },
              { label: "What she's good at", items: IKIGAI.skills, color: "#A8DB5A" },
              { label: "What people need", items: IKIGAI.needs, color: "#F4A79D" },
              { label: "How she earns", items: [IKIGAI.monetization], color: "#6DD5D0" },
            ].map((g, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-4" style={{ borderLeftWidth: "3px", borderLeftColor: g.color }}>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{g.label}</p>
                <div className="flex flex-wrap gap-2">
                  {g.items.map(item => (
                    <span key={item} className="rounded-full px-3 py-1 text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-primary)]">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Try-it-yourself CTA — launches the real Ikigai wizard in demo mode */}
        <div className="mt-12 rounded-xl border-2 border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary)]/10 p-8 text-center">
          <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">DIY moment</p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
            Try it yourself
          </h3>
          <p className="mt-2 text-base text-[var(--text-secondary)] max-w-[520px] mx-auto">
            Walk the actual Ikigai wizard — same steps, same questions, same AI synthesis a real student gets. In about 3 minutes you&apos;ll have your own venture.
          </p>
          <button
            onClick={() => {
              setShowDiyWizard(true);
              setDiyResult(null);
            }}
            className="mt-5 rounded-lg bg-[var(--primary)] px-7 py-3.5 text-base font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
            style={{ boxShadow: "0 0 20px rgba(13, 148, 136, 0.35), 0 0 60px rgba(13, 148, 136, 0.1)" }}
          >
            Walk the wizard →
          </button>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Real AI synthesis. Rate-limited to 5 tries per visitor.
          </p>
        </div>
      </Section>

      {/* Full-screen DIY wizard overlay */}
      {showDiyWizard && !diyResult && (
        <div className="fixed inset-0 z-[100] bg-[var(--bg)] overflow-y-auto">
          <button
            onClick={() => setShowDiyWizard(false)}
            className="fixed top-4 right-4 z-[110] rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors shadow-md"
          >
            Close ✕
          </button>
          <IkigaiWizard
            initialDraft={null}
            demoMode
            onDemoComplete={(idea) => setDiyResult(idea)}
          />
        </div>
      )}

      {/* DIY result — shows the visitor's venture + sign-up CTA */}
      {showDiyWizard && diyResult && (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-subtle)] overflow-y-auto px-6 py-12">
          <div className="mx-auto max-w-[560px]">
            <button
              onClick={() => {
                setShowDiyWizard(false);
                setDiyResult(null);
              }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ← back to demo
            </button>
            <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8">
              <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">Your venture</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-[40px] font-bold leading-tight text-[var(--text-primary)]">
                {diyResult.name}
              </h2>
              <p className="mt-3 text-lg text-[var(--text-secondary)]">{diyResult.niche}</p>
              {diyResult.why_this_fits && (
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Why this fits you</p>
                  <p className="text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{diyResult.why_this_fits}</p>
                </div>
              )}
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">How you&apos;d earn</p>
                <p className="text-base text-[var(--text-secondary)]">{diyResult.revenue_model}</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-base text-[var(--text-secondary)]">
                Real students go through 22 lessons with a personal AI mentor next.
              </p>
              <Link
                href="/signup"
                className="mt-4 inline-block rounded-lg bg-[var(--primary)] px-8 py-3.5 text-base font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
                style={{ boxShadow: "0 0 20px rgba(13, 148, 136, 0.35), 0 0 60px rgba(13, 148, 136, 0.1)" }}
              >
                Save this venture & start lesson 1 →
              </Link>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Free. Takes 30 seconds. No credit card.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 2. DASHBOARD — Using real CSS classes ═══ */}
      <Section label="The Home Base" title="Student Dashboard" description={`After discovering her Ikigai, ${ELSA.first} lands on her personalized venture studio. Everything revolves around ${bizName}.`}>
        <div className="mx-auto max-w-[620px]">
          {/* Business hero */}
          <div className="stagger-enter rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-8">
            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">
              Your Venture <span className="ml-1 text-[var(--text-muted)] normal-case tracking-normal">(tap to rename — watch it change everywhere)</span>
            </p>
            {/* Editable name — same pattern as the production wizard. Visitor
                renames Elsa's Art Studio and the new name propagates instantly
                to the business card, business plan, parent view, instructor
                table, and pitch quote below. Pure local state, no persistence. */}
            <input
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value.slice(0, 60))}
              maxLength={60}
              autoComplete="off"
              spellCheck={false}
              aria-label="Business name (editable)"
              className="ikigai-name-input mt-2 w-full bg-transparent font-[family-name:var(--font-display)] font-bold leading-tight text-[var(--text-primary)] outline-none border-2 border-dashed border-[var(--border)] rounded-xl focus:border-[var(--primary)] focus:border-solid transition-colors px-4 py-3"
            />
            <p className="mt-1 text-[var(--text-secondary)]">{ELSA_STUDIO.niche}</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Target Customer</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{ELSA_STUDIO.target}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Revenue Model</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{ELSA_STUDIO.revenue}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="stagger-enter mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Your Progress</span>
              <span className="text-xs text-[var(--text-muted)]">14 of 22 lessons</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-muted)]">
              <div className="h-2 rounded-full progress-shimmer" style={{ width: "63.6%", background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} />
            </div>
          </div>

          {/* Continue CTA */}
          <div className="stagger-enter mt-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5 flex items-center justify-between" style={{ animationDelay: "200ms" }}>
            <div>
              <p className="text-xs font-medium text-[var(--primary)]">Continue Learning</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Lesson: Setting Profitable Prices</p>
              <p className="text-xs text-[var(--text-muted)]">Module 5 &middot; Run the Numbers</p>
            </div>
            <span className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white">Continue →</span>
          </div>

          {/* Decisions */}
          <div className="stagger-enter mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6" style={{ animationDelay: "300ms" }}>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">Key Decisions</p>
            <div className="space-y-3">
              {DECISIONS.map((d, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-medium text-[var(--primary)]">{i + 1}</span>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">{d.lesson}</p>
                    <p className="text-sm text-[var(--text-primary)]">{d.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 3. LESSON CONVERSATION — Using real CSS classes ═══ */}
      <Section label="The Core Experience" title="AI Lesson Conversations" description="Every conversation is personalized to the student's business idea. The AI asks questions instead of giving answers. Checkpoints gate progress. Suggestion chips appear when students are stuck.">
        <div className="mx-auto max-w-[620px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
          {/* Header with real lesson CSS */}
          <div className="border-b border-[var(--border)] bg-[var(--bg)]">
            <div className="px-5 py-3">
              <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] px-4 py-2.5 mb-2">
                <p className="text-xs font-medium text-[var(--primary)]">Goal</p>
                <p className="text-sm text-[var(--text-secondary)]">Define your target customer and understand their specific needs.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Module 1</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Define Your Target Customer</p>
                </div>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-muted)]">
                  <div className="h-2 rounded-full checkpoint-bar" style={{ width: "50%", background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} />
                </div>
                <p className="text-xs text-[var(--text-muted)]">2/4</p>
              </div>
            </div>
          </div>

          {/* Messages using REAL ai-message class */}
          <div className="lesson-atmosphere px-5 py-5 space-y-5">
            {/* AI message 1 */}
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  <div className="ikigai-icon"><div className="ikigai-icon-dot ik-d1" /><div className="ikigai-icon-dot ik-d2" /><div className="ikigai-icon-dot ik-d3" /><div className="ikigai-icon-dot ik-d4" /></div>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Guide</span>
                </div>
                <div className="ai-message rounded-2xl bg-[var(--bg-muted)] text-[var(--text-primary)] px-6 py-5 space-y-3">
                  <p className="text-base leading-relaxed">Let&apos;s think about who your ideal customer really is. Not just &ldquo;everyone&rdquo; — but the specific person who would be MOST excited about {bizName}.</p>
                  <p className="text-base leading-relaxed">Think about age, interests, and what problem they&apos;re trying to solve. Who comes to mind?</p>
                </div>
              </div>
            </div>

            {/* Student message */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl bg-[var(--primary)] text-white px-5 py-3">
                <p className="text-base leading-relaxed">I think it would be teens who love art but can&apos;t afford expensive classes or don&apos;t have art programs at school</p>
              </div>
            </div>

            {/* AI message 2 */}
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  <div className="ikigai-icon"><div className="ikigai-icon-dot ik-d1" /><div className="ikigai-icon-dot ik-d2" /><div className="ikigai-icon-dot ik-d3" /><div className="ikigai-icon-dot ik-d4" /></div>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Guide</span>
                </div>
                <div className="ai-message rounded-2xl bg-[var(--bg-muted)] text-[var(--text-primary)] px-6 py-5 space-y-3">
                  <p className="text-base leading-relaxed">Now THAT is a target customer. You can picture her — she doodles in class, watches art tutorials on YouTube, wishes she could take real lessons.</p>
                  <p className="text-base leading-relaxed">That specificity is what makes a business real. Where does she hang out? How would you find her?</p>
                </div>
              </div>
            </div>

            {/* Checkpoint celebration using REAL class */}
            <div className="checkpoint-celebration rounded-lg px-4 py-2.5 text-center" style={{ animation: "none", opacity: 1 }}>
              <p className="text-sm font-semibold text-[var(--primary)]">Checkpoint reached</p>
              <p className="text-xs text-[var(--text-muted)]">2/4 complete</p>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-[var(--text-muted)] self-center mr-1">Stuck?</span>
              {["Instagram art accounts", "School art clubs", "Local community centers"].map((s, i) => (
                <span key={s} className="chip-cascade rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]" style={{ animationDelay: `${i * 200}ms` }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Input using REAL styling */}
          <div className="border-t border-[var(--border)] bg-[var(--bg)] px-5 py-4">
            <div className="flex gap-3">
              <div className="lesson-input flex-1 rounded-xl border border-[var(--border-strong)] px-4 py-3 text-base text-[var(--text-muted)]">What are you thinking?</div>
              <span className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white">Send</span>
            </div>
          </div>
        </div>
      </Section>

      </div>
      {/* ═══ END TAB PANE: JOURNEY ═══ */}

      {/* ═══ TAB PANE: REWARDS — Card, Achievements, Business Plan ═══ */}
      <div className={tabPane("rewards")}>

      {/* ═══ 4. BUSINESS CARD — DIY DESIGNER ═══ */}
      <Section label="The Reward" title="Business Card Designer" description="Students design a 3D business card that tilts as they move across it and unlocks new fonts and finishes as they progress. Pick the color, accent, finish, and border below — the card responds in real time.">
        <div className="mx-auto max-w-[820px]">
          <DemoCardDesigner
            studentName={ELSA.name}
            defaultBusinessName={bizName}
            niche={ELSA_STUDIO.niche}
            targetCustomer={ELSA_STUDIO.target}
          />
        </div>
      </Section>

      {/* ═══ 4b. ACHIEVEMENT GALLERY — DIY ═══ */}
      <Section label="The Milestones" title="Achievement Gallery" description="Real students earn these badges as they progress through the program. Click any to unlock it and see the celebration. Each tier (bronze, silver, gold) signals a different depth of mastery.">
        <div className="mx-auto max-w-[820px]">
          <DemoAchievements />
        </div>
      </Section>

      {/* ═══ 5. BUSINESS PLAN — Using real CSS patterns ═══ */}
      <Section label="The Output" title="Auto-Assembled Business Plan" description="Students never 'write a business plan.' It assembles itself from their decisions and conversations across all 22 lessons.">
        <div className="mx-auto max-w-[620px]">
          <div className="space-y-6">
            {[
              { n: 1, t: "Vision", b: `${ELSA_STUDIO.niche}. Born from ${ELSA.first}'s Ikigai — her love of painting, her teaching ability, and her community's need for affordable art education.` },
              { n: 2, t: "Target Customer", b: `${ELSA_STUDIO.target}. Revenue: ${ELSA_STUDIO.revenue}.` },
              { n: 3, t: "Key Decisions", decisions: true },
            ].map((s) => (
              <div key={s.n} className="stagger-enter flex gap-4" style={{ animationDelay: `${s.n * 100}ms` }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-bold text-white">{s.n}</span>
                <div>
                  <h4 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">{s.t}</h4>
                  {s.decisions ? (
                    <div className="mt-2 space-y-2">
                      {DECISIONS.map((d, i) => (
                        <p key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--border)] pl-3">&ldquo;{d.text}&rdquo;</p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-base text-[var(--text-secondary)] leading-relaxed">{s.b}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-3">The Pitch</p>
            <p className="text-xl font-medium font-[family-name:var(--font-display)] text-[var(--text-primary)] leading-relaxed italic">
              &ldquo;{bizName}{" "}gives teens a place to create, learn, and earn through art — because everyone deserves to express themselves, regardless of what they can afford.&rdquo;
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">&mdash; {ELSA.first}, Founder of {bizName}</p>
          </div>
        </div>
      </Section>

      </div>
      {/* ═══ END TAB PANE: REWARDS ═══ */}

      {/* ═══ TAB PANE: TEACHERS — Instructor dashboard + Parent view ═══ */}
      <div className={tabPane("teachers")}>

      {/* ═══ 6. INSTRUCTOR DASHBOARD — Full fidelity mockup ═══ */}
      <Section label="For Teachers" title="Instructor Dashboard" description="Real-time visibility into every student's progress, business idea, and emotional state. Smart alerts detect when students are stuck. One-click nudges keep them moving.">
        <div className="mx-auto max-w-[800px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[var(--border)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">Entrepreneurship — Period 3</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">28 students &middot; <span className="text-[var(--warning)]">2 alerts</span></p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {[
                { key: "students", label: "Students", count: 28, active: true },
                { key: "feed", label: "Live Feed", active: false },
                { key: "alerts", label: "Alerts", count: 2, active: false },
                { key: "followups", label: "Follow-ups", active: false },
                { key: "analytics", label: "Analytics", active: false },
              ].map((tab) => (
                <span key={tab.key} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab.active ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"}`}>
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-1.5 text-xs ${tab.active ? "text-white/80" : "text-[var(--text-muted)]"}`}>({tab.count})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Student", "Business Idea", "Progress", "Last Active", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: ELSA.name, biz: bizName, pct: 62.5, active: "2 min ago", status: "On track", sColor: "var(--success)" },
                  { name: "Marcus Johnson", biz: "Fresh Kicks Co.", pct: 37.5, active: "3 days ago", status: "Needs help", sColor: "var(--warning)" },
                  { name: "Priya Sharma", biz: "Spice Route", pct: 87.5, active: "1 hr ago", status: "On track", sColor: "var(--success)" },
                  { name: "Jaylen Carter", biz: "Cart Culture", pct: 25, active: "5 days ago", status: "Inactive", sColor: "var(--error)" },
                  { name: "Sofia Reyes", biz: "Bilingual Tutoring Co.", pct: 100, active: "Today", status: "Complete", sColor: "var(--primary)" },
                ].map((s, i) => (
                  <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{s.biz}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-[var(--bg-muted)]">
                          <div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{Math.round(s.pct)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{s.active}</td>
                    <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ color: s.sColor, background: `color-mix(in srgb, ${s.sColor} 10%, transparent)` }}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Alert using real alert panel styling */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 border-t border-amber-300 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--text-secondary)]">...</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm text-[var(--text-primary)]">Marcus Johnson</span>
                  <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">warning</span>
                  <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-xs text-[var(--text-muted)]">stuck</span>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Student hasn&apos;t progressed past Lesson 3 in 4 days</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0 pl-10 sm:pl-0">
              <span className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-white cursor-pointer transition-colors">Send Nudge</span>
              <span className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-white cursor-pointer transition-colors">Dismiss</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 7. PARENT VIEW ═══ */}
      <Section label="For Parents" title="Parent View" description="Parents see their child's progress, business idea, and Ikigai — all behind a PIN set by the teacher. Designed for 60 seconds of context.">
        <div className="mx-auto max-w-[520px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
          <div className="p-6 flex items-center gap-5 border-b border-[var(--border)]">
            <div className="relative" style={{ width: "72px", height: "72px" }}>
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-muted)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 52 * 0.625} ${2 * Math.PI * 52 * 0.375}`}
                  strokeLinecap="round" transform="rotate(-90 60 60)" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--primary)]">63%</span>
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">{ELSA.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">Ms. Davis&apos;s Entrepreneurship &middot; Period 3</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">14 of 22 lessons complete</p>
            </div>
          </div>
          <div className="p-5 border-b border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Business Idea</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">{bizName}</p>
            <p className="text-sm text-[var(--text-secondary)]">{ELSA_STUDIO.niche}</p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3 border-b border-[var(--border)]">
            {[
              { label: "What She Loves", val: IKIGAI.passions.join(", "), bg: "rgba(245,230,66,0.12)" },
              { label: "What She's Good At", val: IKIGAI.skills.join(", "), bg: "rgba(168,219,90,0.12)" },
              { label: "What People Need", val: IKIGAI.needs.join(", "), bg: "rgba(244,167,157,0.12)" },
              { label: "How She Earns", val: IKIGAI.monetization, bg: "rgba(109,213,208,0.12)" },
            ].map((q, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: q.bg }}>
                <p className="text-[10px] font-semibold text-[var(--text-primary)]">{q.label}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{q.val}</p>
              </div>
            ))}
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">How You Can Help</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {ELSA.first} is halfway through and doing great. Ask her about the customer interviews she&apos;s been practicing — she&apos;s learning to ask the right questions before building. Encouraging her to talk to real people about {bizName} would be the most valuable thing right now.
            </p>
          </div>
        </div>
      </Section>

      </div>
      {/* ═══ END TAB PANE: TEACHERS ═══ */}

      {/* ═══ TAB PANE: MIRROR — Founder's Mirror + Founder's Log ═══ */}
      <div className={tabPane("mirror")}>

      <Section label="The Inner Game" title="Founder's Mirror" description="No entrepreneur understood discipline, consistency, and failure-as-growth on day one. Neither will your students. The Mirror doesn't teach resilience — it creates the conditions where resilience develops on its own.">
        <div className="mx-auto max-w-[640px] space-y-10">

          {/* The Mirror Modal */}
          <div>
            <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">The Moment</p>
            <div className="rounded-xl overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
              {/* Teal header band */}
              <div className="bg-[#F0FDFA] border-b border-[#CCFBF1] px-7 pt-6 pb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)] mb-4 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                  Founder&apos;s Mirror
                </p>
                <p className="font-[family-name:var(--font-display)] text-[20px] font-normal leading-[1.6] text-[var(--text-primary)] tracking-[-0.01em]">
                  You started this lesson three times before finishing it. What was different today?
                </p>
              </div>
              <div className="bg-white px-7 pt-6 pb-7">
                <div className="flex items-center gap-1.5 mb-5 text-[13px] text-[var(--text-muted)]">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="opacity-60"><path d="M4 7V5a4 4 0 118 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h1zm2 0h4V5a2 2 0 10-4 0v2z" /></svg>
                  <span>Private to you. No one else sees this.</span>
                </div>
                <div className="w-full min-h-[100px] p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] text-[16px] leading-[1.65] text-[var(--text-muted)] italic">
                  I think I was rushing the first two times. Today I actually read each question before answering...
                </div>
                <div className="flex items-center justify-between mt-5">
                  <span className="text-[14px] text-[var(--text-muted)]">Not right now</span>
                  <span className="min-h-[44px] px-7 rounded-lg bg-[var(--primary)] text-white text-[14px] font-medium inline-flex items-center">Save this</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              After every lesson completion, the AI generates one observation and one question. Maximum 40 words. No advice. No praise. No &ldquo;failure is growth&rdquo; platitudes. It states what it sees and asks what the student sees. Then it shuts up. The student decides whether to write honestly or skip. Both are okay.
            </p>
          </div>

          {/* Three trigger types */}
          <div>
            <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">Three Triggers</p>
            <div className="grid gap-3">
              {[
                { trigger: "Lesson Completion", example: "You moved through this one fast. What clicked?", color: "var(--primary)" },
                { trigger: "Return from Absence", example: "You've been away 6 days. Last time you were working on brand identity. What brought you back?", color: "#6366F1" },
                { trigger: "Weekly Review", example: "You were active 5 days this week and completed 2 lessons. What pattern are you noticing about yourself?", color: "var(--accent)" },
              ].map((t) => (
                <div key={t.trigger} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 flex gap-3 items-start">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: t.color }} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t.trigger}</p>
                    <p className="mt-1 text-sm italic text-[var(--text-secondary)]">&ldquo;{t.example}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Founder's Log */}
          <div>
            <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">The Founder&apos;s Log</p>
            <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <h3 className="font-[family-name:var(--font-display)] text-[22px] font-semibold text-[var(--text-primary)]">Your Founder&apos;s Log</h3>
                <p className="text-[13px] text-[var(--text-muted)] mt-1">5 reflections across 3 weeks</p>
                {/* Mood bar */}
                <div className="flex gap-[3px] h-[6px] rounded-[3px] overflow-hidden mt-4">
                  <div className="flex-1 rounded-[3px]" style={{ background: "#0D9488" }} />
                  <div className="flex-1 rounded-[3px]" style={{ background: "#0D9488" }} />
                  <div className="flex-1 rounded-[3px]" style={{ background: "#F59E0B" }} />
                  <div className="flex-1 rounded-[3px]" style={{ background: "#6366F1" }} />
                  <div className="flex-1 rounded-[3px]" style={{ background: "#0D9488" }} />
                </div>
              </div>

              {/* Timeline entries */}
              <div className="relative pl-10 pr-6 pb-6">
                <div className="absolute left-[25px] top-0 bottom-0 w-[2px] bg-[var(--bg-muted)]" />

                {[
                  { date: "April 12", context: "After \u201CWhat to Do After Your First Sale\u201D", dot: "#0D9488", wash: "bg-[#F0FDFA] border-l-[#0D9488]", prompt: "You moved through this one fast. What clicked?", response: "I think it clicked because I already experienced my first real customer interaction last week. The lesson felt like it was describing what I'd just lived through." },
                  { date: "April 9", context: "After \u201CSet Your Price\u201D", dot: "#F59E0B", wash: "bg-[#FFFBEB] border-l-[#F59E0B]", prompt: "Your pricing numbers changed 4 times. What were you wrestling with?", response: "I kept going back and forth between charging what I think it's worth and what my friends would actually pay. I still don't know the answer tbh." },
                  { date: "April 5", context: "Welcome back", dot: "#6366F1", wash: "bg-[#EEF2FF] border-l-[#6366F1]", prompt: "You've been away 9 days. What brought you back?", response: "Honestly, I almost didn't come back. But I kept thinking about the logo I designed and I wanted to see if I could actually make it real." },
                ].map((entry, i) => (
                  <div key={i} className="relative pb-8 last:pb-0">
                    <div className="absolute -left-[22px] top-[3px] w-3 h-3 rounded-full border-2 border-white" style={{ background: entry.dot, boxShadow: "0 0 0 1px rgba(0,0,0,0.06)" }} />
                    <p className="text-[12px] font-medium text-[var(--text-muted)] mb-2">{entry.date} &middot; {entry.context}</p>
                    <p className="text-[14px] italic text-[var(--text-muted)] mb-2">{entry.prompt}</p>
                    <div className={`text-[15px] text-[var(--text-primary)] leading-[1.7] p-4 rounded-lg border-l-[3px] ${entry.wash}`}>
                      {entry.response}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              Over 22 lessons, these reflections accumulate into a private journal of who the student is becoming as a founder. The emotional color washes tell the story without words: teal for engaged, amber for frustrated, indigo for return-from-absence. No teacher sees this. No AI analyzes the content. It&apos;s the student&apos;s own record of their own journey.
            </p>
          </div>

          {/* Privacy + Design Philosophy */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Privacy by Design</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                RLS locks every row to the student who wrote it. No teacher access. No admin bypass. No AI reads the content. Safety monitoring uses the existing emotional detection system, not the journal. Trust is earned at the pixel level.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">AI Restraint</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                The Mirror prompt is validated before display: max 40 words, no advice words (&ldquo;should&rdquo;, &ldquo;try&rdquo;), no praise (&ldquo;great&rdquo;, &ldquo;amazing&rdquo;), no reframing (&ldquo;failure is growth&rdquo;). If the AI breaks a rule, it falls back to a generic prompt. The quality is inversely proportional to how much the AI talks.
              </p>
            </div>
          </div>

        </div>
      </Section>

      </div>
      {/* ═══ END TAB PANE: MIRROR ═══ */}

      {/* ═══ TAB PANE: MOMENTS — The Two Reveals ═══ */}
      <div className={tabPane("moments")}>

      {/* ═══ 8. THE TWO REVEALS ═══
              Two distinct moments in a real student's journey:
                1. Ikigai Reveal — at the end of the wizard, before the lessons
                2. Graduation Ceremony — after lesson 22, at the end of the program */}
      <Section label="The Two Moments" title="The Reveals" description="Two moments real students get. The first lands at the end of the Ikigai wizard — their venture appears, ignited, before they've taken a single lesson. The second lands after lesson 22 — the four parts of who they are remain in vigil while the venture they built with the AI is born in the negative space between them, then the founder's letter, then the diploma.">
        <div className="mx-auto max-w-[640px]">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Ikigai Reveal — wizard's "ignited" card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 text-center">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Moment 1</p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                The Ikigai Reveal
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                The wizard ignites. Their venture appears with a multi-layer breathing glow and spark embers. Ten minutes after they walked in with no idea, they walk out with one.
              </p>
              <button
                onClick={() => {
                  setShowIkigaiReveal(true);
                  setIkigaiRevealDone(false);
                }}
                className="mt-5 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
                style={{ boxShadow: "0 0 20px rgba(13, 148, 136, 0.35), 0 0 60px rgba(13, 148, 136, 0.1)" }}
              >
                {ikigaiRevealDone ? "Watch Ikigai Reveal again" : "Watch Ikigai Reveal"}
              </button>
            </div>

            {/* Graduation Ceremony — vigil: parents witness, ember ignites, name is born */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 text-center">
              <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">Moment 2</p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                The Graduation Ceremony
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                The four parts of who they are arrive, breathing on their own. Light gathers in the space they hold between them. Their venture is born from that light. The four remain, witnessing. Founder&apos;s letter. Diploma. The full arc.
              </p>
              <button
                onClick={() => {
                  setShowCeremony(true);
                  setCeremonyDone(false);
                }}
                className="mt-5 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-colors"
                style={{ boxShadow: "0 0 20px rgba(245, 158, 11, 0.35), 0 0 60px rgba(245, 158, 11, 0.1)" }}
              >
                {ceremonyDone ? "Watch Graduation Ceremony again" : "Watch Graduation Ceremony"}
              </button>
            </div>
          </div>

          {(ikigaiRevealDone || ceremonyDone) && (
            <p className="mt-6 text-center text-sm text-[var(--text-muted)] font-medium">
              That&apos;s what real students see. Confidence built on a moment they earned.
            </p>
          )}
        </div>
      </Section>

      {/* Ikigai reveal overlay */}
      {showIkigaiReveal && (
        <IkigaiRevealDemo
          studentFirstName={ELSA.first}
          businessName={bizName}
          businessNiche={ELSA_STUDIO.niche}
          whyThisFits={`You love painting and helping others create. You're good at color theory and teaching. Your community needs affordable art education for teens. ${bizName} is where all four meet.`}
          revenueModel={ELSA_STUDIO.revenue}
          onClose={() => {
            setShowIkigaiReveal(false);
            setIkigaiRevealDone(true);
          }}
        />
      )}

      </div>
      {/* ═══ END TAB PANE: MOMENTS ═══ */}

      {/* ═══ TAB PANE: PROOF — Numbers, Partnership, Story ═══ */}
      <div className={tabPane("proof")}>

      {/* ═══ THE NUMBERS — measured outcomes ═══ */}
      <Section label="The Numbers" title="Measured Like an ML Team, Not an Ed-Tech Course" description="We don't ship AI mentoring on vibes. Every prompt change is graded against a stress test of simulated student personas, judged by an independent model. Here's what the latest full run shows.">
        <div className="mx-auto max-w-[720px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Self-confidence</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-[40px] font-bold leading-none text-[var(--text-primary)]">+1.15</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Average gain on a 5-point scale. &ldquo;Could YOU personally start a business someday?&rdquo; <strong>100% of simulated students gained.</strong></p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Understanding</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-[40px] font-bold leading-none text-[var(--text-primary)]">+1.53</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Average gain on a 5-point scale. &ldquo;Do you actually GET what running a business means?&rdquo; <strong>100% of simulated students gained.</strong></p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Alien → Accessible</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-[40px] font-bold leading-none text-[var(--text-primary)]">97%</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Flipped from &ldquo;business is something other people do&rdquo; to &ldquo;this could be me.&rdquo; 58 of 60 simulated students.</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Decisively moved</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-[40px] font-bold leading-none text-[var(--text-primary)]">70%</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Independent Opus judge verdict: 42 of 60 simulated students were unambiguously moved by the wizard. The remaining 30% were partially moved. Zero were not moved at all.</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">How we measure</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              60 simulated student journeys, 20 personas across 3 motivation levels (low/medium/high), spanning coherent
              cases, multi-track interests, slang/ESL voices, age 12 and age 18 boundaries, and students who
              already run a small business. Synthesizer: Claude Sonnet. Judge: Claude Opus 4.6 (cross-model
              — eliminates self-preference bias). 4 rounds of prompt iteration, 144 stress-tested personas
              in the wizard quality eval, every commit measured.
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              These are simulated upper bounds, not real-teen rates — but the SHAPE of the result is the
              strongest signal in education we&apos;ve ever measured: <strong>when the wizard works, it changes
              how kids think about themselves before it changes what they do.</strong>
            </p>
          </div>

          {/* Knowledge base rigor callout — Adaptable Factual Floor */}
          <div className="mt-4 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5">
            <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">The Adaptable Factual Floor</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              The AI mentor pulls from a curated knowledge base of <strong>20 entries</strong> covering real frameworks and
              principles — Lean Canvas, Jobs-to-be-Done, Mom Test, Golden Circle, Build-Measure-Learn, value-based pricing,
              and more. Every entry is fact-checked by an independent Claude Opus judge against a single standard:
              <em> any claim a student could see must be traceable to a source a 16-year-old could verify in 60 seconds</em>.
              The latest audit: <strong>0 likely-hallucinated citations across 15 specific claims</strong>. Zero invented
              statistics, zero fabricated case studies, zero misattributed quotes. <strong>22 of 22 lessons</strong> get
              this verified context the moment a student starts a conversation. Confidence built on facts, not hype.
            </p>
          </div>
        </div>
      </Section>

      {/* ═══ THE PARTNERSHIP — for VentureLab specifically ═══ */}
      <Section label="The Partnership" title="What Adaptable Becomes Inside VentureLab" description="VentureLab has spent years showing kids what entrepreneurship can be. Adaptable solves the part that's always been the hardest.">
        <div className="mx-auto max-w-[720px] space-y-6">
          <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-6">
            <p className="text-base leading-relaxed text-[var(--text-primary)]">
              Most teen entrepreneurship education assumes the student already has an idea.
              The hardest moment in a 14-year-old&apos;s entrepreneurial journey isn&apos;t building
              the business — it&apos;s the blank page before the business exists. <strong>Adaptable
              solves the blank page.</strong>
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-primary)]">
              The Ikigai wizard takes a kid who has never thought about business and gives them
              a real, specific, executable idea in 10 minutes — grounded in what they already
              love and what they&apos;re already good at. Then 22 conversation-style lessons
              break entrepreneurship down into pieces a teenager can actually hold in their head,
              one at a time, in their own words.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-primary)]">
              It&apos;s not a course. It&apos;s not a textbook. It&apos;s not another platform that
              assumes the student already has an idea. It&apos;s the missing first step — and
              it&apos;s the only place that talks to a kid the way a real founder would.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">The leverage</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Same teachers, same schools, same global reach — with a tool that gets every
                student to &ldquo;I have an idea I actually want to build&rdquo; before lesson one.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">The multiplier</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                A 1:1 AI mentor for every student — not as a replacement for VentureLab&apos;s
                educators, but as the always-on first conversation that makes their work matter
                more.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ THE STORY — short-form essay (15 sentences) right before the closing argument ═══ */}
      <Section
        label="The Story"
        title="Adaptable, in 15 Sentences"
        description="If you only have two minutes, here's the whole product."
      >
        <div className="mx-auto max-w-[640px]">
          <article
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 md:p-8 text-[var(--text-primary)] text-[16px] md:text-[17px] space-y-4"
            style={{
              fontFamily: '"Times New Roman", Times, serif',
              lineHeight: "1.75",
            }}
          >
            <p>
              Most teen entrepreneurship programs assume the student already has an idea. Adaptable starts at zero. The Ikigai wizard takes a 14-year-old who has never thought about business and gives them one specific, executable idea in ten minutes, grounded in what they already love and what they&apos;re already good at.
            </p>
            <p>
              From there, 22 conversation-style lessons across six modules walk the student from discovery through their first sale: Find Your Niche, Know Your Customer, Build Your Brand, Get Your First Customer, Run the Numbers, Launch and Learn. Every lesson is delivered by a one-to-one AI mentor that asks questions instead of giving lectures, references the student&apos;s specific business by name, and gates progression on checkpoint mastery so no one skips ahead.
            </p>
            <p>
              But the hardest part of entrepreneurship isn&apos;t the business plan. It&apos;s the inner game: discipline, consistency, and the realization that bad days aren&apos;t failure, they&apos;re the mechanism. The Founder&apos;s Mirror surfaces this by showing students their own behavior back to them after every lesson, every return from absence, every week. One observation, one question, maximum 40 words. No advice. No praise. The AI shuts up and the student decides whether to write honestly about what they&apos;re feeling. Over 22 lessons, those reflections accumulate into a private Founder&apos;s Log that no teacher sees and no algorithm analyzes.
            </p>
            <p>
              The mentor pulls from a fact-checked knowledge base where every claim is traceable to a source a 16-year-old could verify in 60 seconds. Two layers of moderation run on every input and output. Crisis signals fire real-time email alerts to the instructor. All 22 lessons are mapped to NBEA, Common Core, ISTE, and Jump$tart standards. 18 achievements across five categories reward consistency, depth, and comebacks, not just completion.
            </p>
            <p>
              The mission, in the founder&apos;s own words: <em>transformation, not education.</em> Adaptable is the place where a kid who has never thought about starting something walks out the other side understanding entrepreneurship as accessible instead of foreign, with a private record of their own growth in their own words to prove it.
            </p>

            <div className="pt-4 mt-2 border-t border-[var(--border)]">
              <p
                className="text-sm italic text-[var(--text-secondary)]"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                — AJ Rogers, founder, age 19
              </p>
              <p
                className="mt-1 text-xs text-[var(--text-muted)]"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                Built for VentureLab.
              </p>
            </div>
          </article>
        </div>
      </Section>

      </div>
      {/* ═══ END TAB PANE: PROOF ═══ */}

      {/* ═══ CLOSING ═══ */}
      <section className="flex flex-col items-center justify-center min-h-[50vh] px-6 py-20 text-center border-t border-[var(--border)]">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">Built for VentureLab</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[40px] font-bold text-[var(--text-primary)]">This is Adaptable.</h2>
        <p className="mt-4 max-w-[480px] text-base text-[var(--text-secondary)] leading-relaxed">
          The blank page is the hardest part of starting anything. We solved it for teens. Now let&apos;s figure out what we build together.
        </p>
        <div className="mt-8 flex gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors">
            Back to Top
          </button>
          <Link href="/for-schools" className="rounded-lg border border-[var(--border-strong)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
            See the institutional brief
          </Link>
        </div>
      </section>
    </main>
  );
}

function Section({ label, title, description, children }: {
  label: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <section className="px-6 border-b border-[var(--border)]" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
      <div className="mx-auto max-w-[800px]">
        <div style={{ marginBottom: "48px" }}>
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">{label}</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-[32px] font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-3 max-w-[600px] text-base text-[var(--text-secondary)] leading-relaxed">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
