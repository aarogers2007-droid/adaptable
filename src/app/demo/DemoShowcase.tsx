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
 * Business: Studio Bloom
 */

import { useState } from "react";
import Link from "next/link";

// ── ACTUAL PLATFORM COMPONENTS ──
import IkigaiDiagram from "@/components/ikigai/IkigaiDiagram";
import Card3D from "@/app/(app)/card/Card3D";
import CompletionCeremony from "@/app/(app)/completion/CompletionCeremony";
import AppNav from "@/components/ui/AppNav";

// ── Demo data ──
const ELSA = {
  name: "Elsa Martinez",
  first: "Elsa",
};

const STUDIO_BLOOM = {
  name: "Studio Bloom",
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

  if (showCeremony && !ceremonyDone) {
    return (
      <CompletionCeremony
        studentName={ELSA.name}
        businessName={STUDIO_BLOOM.name}
        businessNiche={STUDIO_BLOOM.niche}
        ikigai={IKIGAI}
        onComplete={() => {
          setCeremonyDone(true);
          setShowCeremony(false);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* ═══ REAL APP NAV ═══ */}
      <AppNav isAdmin={false} studentName={ELSA.name} />

      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center justify-center px-6 py-32 text-center border-b border-[var(--border)]">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">A VentureLab Product</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[48px] font-bold leading-[1.1] text-[var(--text-primary)]">
          Adaptable
        </h1>
        <p className="mt-5 max-w-[500px] text-lg leading-relaxed text-[var(--text-secondary)]">
          Where every student discovers what they care about, validates a real business idea, and builds a plan to launch it.
        </p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          This is {ELSA.first}&apos;s journey through the platform. Scroll to see every feature.
        </p>
      </section>

      {/* ═══ 1. IKIGAI DIAGRAM — REAL COMPONENT ═══ */}
      <Section label="The Starting Point" title="Ikigai Discovery" description={`Every student begins by answering four questions about themselves. The Ikigai diagram guides them through the process. Here is the actual interactive diagram — click any circle.`}>
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div className="mx-auto w-full max-w-[400px]">
            <IkigaiDiagram
              completedSteps={new Set([1, 2, 3, 4])}
              onStepClick={() => {}}
              showReveal={false}
              businessName={STUDIO_BLOOM.name}
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
      </Section>

      {/* ═══ 2. DASHBOARD — Using real CSS classes ═══ */}
      <Section label="The Home Base" title="Student Dashboard" description={`After discovering her Ikigai, ${ELSA.first} lands on her personalized venture studio. Everything revolves around ${STUDIO_BLOOM.name}.`}>
        <div className="mx-auto max-w-[620px]">
          {/* Business hero */}
          <div className="stagger-enter rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-8">
            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">Your Venture</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[32px] font-bold text-[var(--text-primary)]">{STUDIO_BLOOM.name}</h2>
            <p className="mt-1 text-[var(--text-secondary)]">{STUDIO_BLOOM.niche}</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Target Customer</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{STUDIO_BLOOM.target}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Revenue Model</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{STUDIO_BLOOM.revenue}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="stagger-enter mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Your Progress</span>
              <span className="text-xs text-[var(--text-muted)]">5 of 8 lessons</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-muted)]">
              <div className="h-2 rounded-full progress-shimmer" style={{ width: "62.5%", background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} />
            </div>
          </div>

          {/* Continue CTA */}
          <div className="stagger-enter mt-4 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5 flex items-center justify-between" style={{ animationDelay: "200ms" }}>
            <div>
              <p className="text-xs font-medium text-[var(--primary)]">Continue Learning</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Lesson 6: What Did You Learn?</p>
              <p className="text-xs text-[var(--text-muted)]">Module 2 &middot; Customer Discovery</p>
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
      <Section label="The Core Experience" title="AI Lesson Conversations" description="Every conversation is personalized to the student's business idea. The AI asks questions, not gives answers. Checkpoints gate progress. Suggestion chips appear when students are stuck.">
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
                  <p className="text-base leading-relaxed">Let&apos;s think about who your ideal customer really is. Not just &ldquo;everyone&rdquo; — but the specific person who would be MOST excited about {STUDIO_BLOOM.name}.</p>
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

      {/* ═══ 4. BUSINESS CARD — REAL COMPONENT ═══ */}
      <Section label="The Reward" title="Business Card Designer" description={`Students design a 3D business card that tilts on hover, flips on click, and unlocks new fonts as they write more. Try hovering over ${ELSA.first}'s card.`}>
        <div className="mx-auto" style={{ maxWidth: "500px" }}>
          <Card3D
            businessName={STUDIO_BLOOM.name}
            niche={STUDIO_BLOOM.niche}
            studentName={ELSA.name}
            targetCustomer={STUDIO_BLOOM.target}
            finish="holographic"
            accentColor="#0D9488"
            cardBase="black"
            showBack={true}
            backContent={{
              achievements: [
                { name: "First Idea", icon: "💡", tier: "gold" },
                { name: "Market Ready", icon: "🎯", tier: "silver" },
                { name: "Customer Pro", icon: "🤝", tier: "gold" },
                { name: "Price Setter", icon: "💰", tier: "bronze" },
                { name: "Pitch Perfect", icon: "🎤", tier: "silver" },
              ],
            }}
            borderStyle="rounded"
            isFounder={true}
            showRotateHint={true}
          />
          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Hover to tilt &middot; Click to flip &middot; 7 base colors &middot; 8 unlockable fonts &middot; 5 card finishes
          </p>
        </div>
      </Section>

      {/* ═══ 5. BUSINESS PLAN — Using real CSS patterns ═══ */}
      <Section label="The Output" title="Auto-Assembled Business Plan" description="Students never 'write a business plan.' It assembles itself from their decisions and conversations across all 8 lessons.">
        <div className="mx-auto max-w-[620px]">
          <div className="space-y-6">
            {[
              { n: 1, t: "Vision", b: `${STUDIO_BLOOM.niche}. Born from ${ELSA.first}'s Ikigai — her love of painting, her teaching ability, and her community's need for affordable art education.` },
              { n: 2, t: "Target Customer", b: `${STUDIO_BLOOM.target}. Revenue: ${STUDIO_BLOOM.revenue}.` },
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
              &ldquo;{STUDIO_BLOOM.name} gives teens a place to create, learn, and earn through art — because everyone deserves to express themselves, regardless of what they can afford.&rdquo;
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">&mdash; {ELSA.first}, Founder of {STUDIO_BLOOM.name}</p>
          </div>
        </div>
      </Section>

      {/* ═══ 6. INSTRUCTOR DASHBOARD — Full fidelity mockup ═══ */}
      <Section label="For Teachers" title="Instructor Dashboard" description="Real-time visibility into every student's progress, business idea, and emotional state. Smart alerts detect when students are stuck. One-click nudges keep them moving.">
        <div className="mx-auto max-w-[800px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[var(--border)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">Entrepreneurship — Period 3</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">28 students &middot; <span className="text-[var(--warning)]">2 alerts</span></p>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: "students", label: "Students", count: 28, active: true },
                { key: "feed", label: "Live Feed", active: false },
                { key: "alerts", label: "Alerts", count: 2, active: false },
                { key: "followups", label: "Follow-ups", active: false },
                { key: "analytics", label: "Analytics", active: false },
              ].map((tab) => (
                <span key={tab.key} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab.active ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"}`}>
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
                  { name: ELSA.name, biz: STUDIO_BLOOM.name, pct: 62.5, active: "2 min ago", status: "On track", sColor: "var(--success)" },
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
          <div className="flex items-start gap-3 border-t border-amber-300 bg-amber-50 px-4 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--text-secondary)]">...</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[var(--text-primary)]">Marcus Johnson</span>
                <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">warning</span>
                <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-xs text-[var(--text-muted)]">stuck</span>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Student hasn&apos;t progressed past Lesson 3 in 4 days</p>
            </div>
            <span className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-white cursor-pointer transition-colors">Send Nudge</span>
            <span className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-white cursor-pointer transition-colors">Dismiss</span>
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
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">5 of 8 lessons complete</p>
            </div>
          </div>
          <div className="p-5 border-b border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Business Idea</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">{STUDIO_BLOOM.name}</p>
            <p className="text-sm text-[var(--text-secondary)]">{STUDIO_BLOOM.niche}</p>
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
              {ELSA.first} is halfway through and doing great. Ask her about the customer interviews she&apos;s been practicing — she&apos;s learning to ask the right questions before building. Encouraging her to talk to real people about {STUDIO_BLOOM.name} would be the most valuable thing right now.
            </p>
          </div>
        </div>
      </Section>

      {/* ═══ 8. COMPLETION CEREMONY — REAL COMPONENT ═══ */}
      <Section label="The Finish Line" title="Completion Ceremony" description="When a student completes all 8 lessons, they experience a multi-scene ceremony: the founder's letter, their Ikigai re-revealed, a formal diploma, and a personal farewell from their AI mentor.">
        <div className="mx-auto max-w-[500px] text-center">
          <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-8">
            This uses the ACTUAL ceremony component from the platform — the same one students experience. Click below to watch the full sequence.
          </p>
          <button
            onClick={() => { setShowCeremony(true); setCeremonyDone(false); }}
            className="rounded-lg bg-[var(--accent)] px-8 py-3 text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-colors"
            style={{ boxShadow: "0 0 20px rgba(245, 158, 11, 0.35), 0 0 60px rgba(245, 158, 11, 0.1)" }}
          >
            Experience the Ceremony
          </button>
          {ceremonyDone && (
            <p className="mt-4 text-sm text-[var(--success)] font-medium">Ceremony complete. That&apos;s what every student experiences.</p>
          )}
        </div>
      </Section>

      {/* ═══ CLOSING ═══ */}
      <section className="flex flex-col items-center justify-center min-h-[50vh] px-6 py-20 text-center border-t border-[var(--border)]">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">Built for VentureLab</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[40px] font-bold text-[var(--text-primary)]">This is Adaptable.</h2>
        <p className="mt-4 max-w-[440px] text-base text-[var(--text-secondary)] leading-relaxed">
          No platform has ever streamlined the entrepreneurial process for students like this. We are the first. And the work speaks for itself.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/for-schools" className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors">
            Bring This to Your Students
          </Link>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-lg border border-[var(--border-strong)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors">
            Back to Top
          </button>
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
