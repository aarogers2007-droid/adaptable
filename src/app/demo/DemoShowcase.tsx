"use client";

/*
 * ADAPTABLE PRODUCT DEMO
 * A premium, scroll-based showcase of every platform feature.
 * Each section recreates the actual UI at full fidelity.
 * Cinematic moments (Ikigai reveal, ceremony) interrupt with dark takeovers.
 *
 * Student: Elsa
 * Business: Studio Bloom — an art education studio for creative self-expression
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── Demo data for Elsa / Studio Bloom ──
const STUDENT = { name: "Elsa", fullName: "Elsa Martinez" };
const BUSINESS = {
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
  { lesson: "Research Your Competition", text: "My edge is that I'm a teen myself. I know what we actually want to create, not what adults think we should." },
  { lesson: "Target Customer", text: "My ideal customer is a 15-year-old who doodles in class, watches art tutorials on YouTube, and wishes they could take real lessons." },
];

export default function DemoShowcase() {
  const [revealPhase, setRevealPhase] = useState(0);
  const revealRef = useRef<HTMLDivElement>(null);
  const [ceremonyPhase, setCeremonyPhase] = useState(0);
  const ceremonyRef = useRef<HTMLDivElement>(null);

  // Ikigai reveal trigger on scroll
  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && revealPhase === 0) {
        setRevealPhase(1);
        setTimeout(() => setRevealPhase(2), 2618);
        setTimeout(() => setRevealPhase(3), 4236);
        setTimeout(() => setRevealPhase(4), 6854);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [revealPhase]);

  // Ceremony trigger on scroll
  useEffect(() => {
    const el = ceremonyRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && ceremonyPhase === 0) {
        setCeremonyPhase(1);
        setTimeout(() => setCeremonyPhase(2), 4236);
        setTimeout(() => setCeremonyPhase(3), 8472);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ceremonyPhase]);

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">A VentureLab Product</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[48px] font-bold leading-[1.1] text-[var(--text-primary)]">Adaptable</h1>
        <p className="mt-5 max-w-[500px] text-lg leading-relaxed text-[var(--text-secondary)]">
          An AI-native venture studio where every student discovers what they care about, validates a real business idea, and builds a plan to launch it.
        </p>
        <p className="mt-3 text-sm text-[var(--text-muted)]">Follow {STUDENT.name}&apos;s journey. Scroll to explore.</p>
        <div className="mt-8 animate-bounce text-[var(--text-muted)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
      </section>

      {/* ═══ 1. IKIGAI WIZARD ═══ */}
      <DemoSection label="The Starting Point" title="Ikigai Discovery" description={`Every student begins by answering four questions about themselves. From their answers, a business idea emerges — not from a template, but from who they are. Here's what ${STUDENT.name} shared:`}>
        <div className="grid gap-8 md:grid-cols-2 items-start">
          {/* Ikigai diagram */}
          <div className="relative mx-auto w-full max-w-[360px]" style={{ aspectRatio: "1/1" }}>
            <div className="absolute rounded-full" style={{ width: "50%", height: "50%", left: "50%", top: "19.1%", transform: "translate(-50%,-50%)", background: "#F5E642", opacity: 0.55 }} />
            <div className="absolute rounded-full" style={{ width: "50%", height: "50%", left: "19.1%", top: "50%", transform: "translate(-50%,-50%)", background: "#A8DB5A", opacity: 0.55 }} />
            <div className="absolute rounded-full" style={{ width: "50%", height: "50%", left: "80.9%", top: "50%", transform: "translate(-50%,-50%)", background: "#F4A79D", opacity: 0.55 }} />
            <div className="absolute rounded-full" style={{ width: "50%", height: "50%", left: "50%", top: "80.9%", transform: "translate(-50%,-50%)", background: "#6DD5D0", opacity: 0.55 }} />
            <div className="absolute rounded-full" style={{ width: "19.1%", height: "19.1%", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, #4A6741 38.2%, #8B9E6A 61.8%, transparent 100%)", boxShadow: "0 0 40px rgba(74,103,65,0.5)" }} />
            <span className="absolute text-xs font-semibold text-[var(--text-primary)]" style={{ left: "50%", top: "4%", transform: "translateX(-50%)" }}>What you love</span>
            <span className="absolute text-xs font-semibold text-[var(--text-primary)]" style={{ left: "2%", top: "48%" }}>What you&apos;re<br/>good at</span>
            <span className="absolute text-xs font-semibold text-[var(--text-primary)]" style={{ right: "2%", top: "48%", textAlign: "right" }}>What the world<br/>needs</span>
            <span className="absolute text-xs font-semibold text-[var(--text-primary)]" style={{ left: "50%", bottom: "2%", transform: "translateX(-50%)" }}>What you can be paid for</span>
          </div>

          {/* Elsa's answers */}
          <div className="space-y-4">
            {[
              { label: `What ${STUDENT.name} loves`, items: IKIGAI.passions, color: "#F5E642", bg: "rgba(245,230,66,0.1)" },
              { label: "What she's good at", items: IKIGAI.skills, color: "#A8DB5A", bg: "rgba(168,219,90,0.1)" },
              { label: "What people need", items: IKIGAI.needs, color: "#F4A79D", bg: "rgba(244,167,157,0.1)" },
              { label: "How she earns", items: [IKIGAI.monetization], color: "#6DD5D0", bg: "rgba(109,213,208,0.1)" },
            ].map((group, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-4" style={{ borderLeftWidth: "3px", borderLeftColor: group.color }}>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: group.bg, color: "var(--text-primary)" }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DemoSection>

      {/* ═══ 2. IKIGAI REVEAL — CINEMATIC ═══ */}
      <section ref={revealRef} className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
        <div className="absolute" style={{ width: "61.8vh", height: "61.8vh", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(25,50,82,0.09) 0%, transparent 61.8%)" }} />
        <div className="relative" style={{ width: "min(420px, 61.8vh)", aspectRatio: "1/1" }}>
          {[
            { bg: "#F5E642", left: "50%", top: "19.1%" },
            { bg: "#A8DB5A", left: "19.1%", top: "50%" },
            { bg: "#F4A79D", left: "80.9%", top: "50%" },
            { bg: "#6DD5D0", left: "50%", top: "80.9%" },
          ].map((c, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: revealPhase >= 2 ? "3%" : "50%", height: revealPhase >= 2 ? "3%" : "50%",
              left: revealPhase >= 2 ? "50%" : c.left, top: revealPhase >= 2 ? "50%" : c.top,
              transform: "translate(-50%,-50%)", background: c.bg,
              opacity: revealPhase >= 1 ? (revealPhase >= 2 ? 0 : 0.618) : 0,
              transition: "all 2.618s cubic-bezier(0.55,0,0.2,1)",
            }} />
          ))}
          <div className="absolute rounded-full" style={{
            width: "19.1%", height: "19.1%", left: "50%", top: "50%",
            background: "radial-gradient(circle, #4A6741 38.2%, #8B9E6A 61.8%, transparent 100%)",
            boxShadow: "0 0 40px rgba(74,103,65,0.5)",
            opacity: revealPhase >= 1 && revealPhase < 3 ? 1 : 0,
            transform: `translate(-50%,-50%) scale(${revealPhase >= 2 ? 0.3 : 1})`,
            transition: "all 1.618s ease-out",
          }} />
          <div className="absolute text-center" style={{
            left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 10,
            opacity: revealPhase >= 3 ? 1 : 0, transition: "opacity 2.618s ease-out",
          }}>
            <span className="font-[family-name:var(--font-display)] text-[28px] font-extrabold text-white" style={{ textShadow: "0 0 28px rgba(74,103,65,0.5)" }}>{BUSINESS.name}</span>
            {revealPhase >= 4 && <span className="block mt-3 text-[11px] font-medium text-white/35 tracking-[0.146em]">This came from who you are.</span>}
          </div>
        </div>
      </section>

      {/* ═══ 3. STUDENT DASHBOARD ═══ */}
      <DemoSection label="The Home Base" title="Student Dashboard" description={`After Ikigai discovery, ${STUDENT.name} lands on her personalized venture studio. Everything revolves around her business idea.`}>
        <div className="mx-auto max-w-[600px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
          {/* Business hero */}
          <div className="p-6 border-b border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">Your Venture</p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-bold text-[var(--text-primary)]">{BUSINESS.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{BUSINESS.niche}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div><p className="text-xs font-medium text-[var(--text-muted)]">Target Customer</p><p className="mt-1 text-sm text-[var(--text-primary)]">{BUSINESS.target}</p></div>
              <div><p className="text-xs font-medium text-[var(--text-muted)]">Revenue Model</p><p className="mt-1 text-sm text-[var(--text-primary)]">{BUSINESS.revenue}</p></div>
            </div>
          </div>
          {/* Progress */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">Your Progress</span>
              <span className="text-xs text-[var(--text-muted)]">5 of 8 lessons</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-muted)]">
              <div className="h-2 rounded-full" style={{ width: "62.5%", background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} />
            </div>
          </div>
          {/* Continue CTA */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--primary)]">Continue Learning</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Lesson 6: What Did You Learn?</p>
              <p className="text-xs text-[var(--text-muted)]">Module 2 &middot; Customer Discovery</p>
            </div>
            <span className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white">Continue →</span>
          </div>
          {/* Decisions */}
          <div className="p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Key Decisions</p>
            <div className="space-y-3">
              {DECISIONS.slice(0, 3).map((d, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[10px] font-bold text-[var(--primary)]">{i + 1}</span>
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)]">{d.lesson}</p>
                    <p className="text-sm text-[var(--text-primary)]">{d.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DemoSection>

      {/* ═══ 4. LESSON EXPERIENCE ═══ */}
      <DemoSection label="The Core Experience" title="AI Lesson Conversations" description="Every conversation is personalized to the student's business idea. The AI asks questions, not gives answers. Checkpoints gate progress. Suggestion chips appear when students are stuck.">
        <div className="mx-auto max-w-[600px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)]">
            <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] px-3 py-2 mb-2">
              <p className="text-[10px] font-medium text-[var(--primary)]">Goal</p>
              <p className="text-xs text-[var(--text-secondary)]">Define your target customer and understand their specific needs.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Module 1</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Define Your Target Customer</p>
              </div>
              <div className="flex-1 h-2 rounded-full bg-[var(--bg-muted)]"><div className="h-2 rounded-full" style={{ width: "50%", background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} /></div>
              <span className="text-[10px] text-[var(--text-muted)]">2/4</span>
            </div>
          </div>
          {/* Messages */}
          <div className="p-5 space-y-5" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(13,148,136,0.03) 0%, transparent 70%), var(--bg)" }}>
            {/* AI message 1 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 ml-1">
                <div className="relative" style={{ width: "12px", height: "12px" }}>
                  <div className="absolute rounded-full" style={{ width: "5px", height: "5px", background: "#F5E642", top: 0, left: "3.5px" }} />
                  <div className="absolute rounded-full" style={{ width: "5px", height: "5px", background: "#A8DB5A", top: "3.5px", left: 0 }} />
                  <div className="absolute rounded-full" style={{ width: "5px", height: "5px", background: "#F4A79D", top: "3.5px", right: 0 }} />
                  <div className="absolute rounded-full" style={{ width: "5px", height: "5px", background: "#6DD5D0", bottom: 0, left: "3.5px" }} />
                </div>
                <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Guide</span>
              </div>
              <div className="ai-message rounded-2xl bg-[var(--bg-muted)] px-5 py-4 max-w-[85%] space-y-2">
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">Let&apos;s think about who your ideal customer really is. Not just &ldquo;everyone&rdquo; — but the specific person who would be MOST excited about {BUSINESS.name}.</p>
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">Think about age, interests, and what problem they&apos;re trying to solve. Who comes to mind?</p>
              </div>
            </div>
            {/* Student message */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl bg-[var(--primary)] text-white px-5 py-3">
                <p className="text-sm leading-relaxed">I think it would be teens who love art but can&apos;t afford expensive classes or don&apos;t have art programs at school</p>
              </div>
            </div>
            {/* AI message 2 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1 ml-1">
                <div className="relative" style={{ width: "12px", height: "12px" }}>
                  <div className="absolute rounded-full" style={{ width: "5px", height: "5px", background: "#F5E642", top: 0, left: "3.5px" }} />
                  <div className="absolute rounded-full" style={{ width: "5px", height: "5px", background: "#A8DB5A", top: "3.5px", left: 0 }} />
                  <div className="absolute rounded-full" style={{ width: "5px", height: "5px", background: "#F4A79D", top: "3.5px", right: 0 }} />
                  <div className="absolute rounded-full" style={{ width: "5px", height: "5px", background: "#6DD5D0", bottom: 0, left: "3.5px" }} />
                </div>
                <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Guide</span>
              </div>
              <div className="ai-message rounded-2xl bg-[var(--bg-muted)] px-5 py-4 max-w-[85%] space-y-2">
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">Now THAT is a target customer. A teen who loves creating but doesn&apos;t have access. You can picture her — she doodles in class, watches art tutorials on YouTube.</p>
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">That specificity is what makes a business real. Where does she hang out? How would you find her?</p>
              </div>
            </div>
            {/* Checkpoint */}
            <div className="checkpoint-celebration rounded-lg px-4 py-2.5 text-center" style={{ animation: "none", opacity: 1 }}>
              <p className="text-sm font-semibold text-[var(--primary)]">Checkpoint reached</p>
              <p className="text-xs text-[var(--text-muted)]">2/4 complete</p>
            </div>
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-[var(--text-muted)] self-center mr-1">Stuck?</span>
              {["Instagram art accounts", "School art clubs", "Local community centers"].map(s => (
                <span key={s} className="rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">{s}</span>
              ))}
            </div>
          </div>
          {/* Input */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--text-muted)]">What are you thinking?</div>
              <span className="rounded-xl bg-[var(--primary)] px-5 py-3 text-xs font-semibold text-white">Send</span>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* ═══ 5. BUSINESS CARD ═══ */}
      <DemoSection label="The Reward" title="Business Card Designer" description="Students design a 3D business card that tilts on hover and flips to show achievements. Fonts unlock as they write more. Finishes unlock via achievements. It's a reward system disguised as a design tool.">
        <div className="mx-auto max-w-[500px]">
          <div className="relative mx-auto rounded-2xl p-8 text-white" style={{
            width: "100%", maxWidth: "400px", aspectRatio: "16/10",
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.1) inset",
          }}>
            <div className="flex h-1 rounded-full overflow-hidden mb-6">
              <div className="flex-1 bg-[#F5E642]" /><div className="flex-1 bg-[#A8DB5A]" /><div className="flex-1 bg-[#F4A79D]" /><div className="flex-1 bg-[#6DD5D0]" />
            </div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold">{STUDENT.fullName}</p>
            <p className="mt-1 text-lg font-semibold text-white/90">{BUSINESS.name}</p>
            <p className="mt-2 text-sm text-white/50">{BUSINESS.niche}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[
              { n: "7", d: "Base colors — black, white, navy, forest, wine, and more" },
              { n: "8", d: "Fonts unlock as students write more across the platform" },
              { n: "5", d: "Finishes — matte, holographic, silver, chrome, gold" },
              { n: "3D", d: "Pure CSS — tilts on hover, flips to show achievements" },
            ].map((f, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">{f.n}</span>
                <p className="text-sm text-[var(--text-secondary)]">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </DemoSection>

      {/* ═══ 6. BUSINESS PLAN ═══ */}
      <DemoSection label="The Output" title="Auto-Assembled Business Plan" description="Students never 'write a business plan.' It assembles itself from their decisions and conversations across all 8 lessons.">
        <div className="mx-auto max-w-[550px] rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-sm">
          <div className="space-y-5">
            {[
              { n: 1, t: "Vision", b: `${BUSINESS.niche}. Born from ${STUDENT.name}'s Ikigai — her love of painting, her teaching ability, and her community's need for affordable art education.` },
              { n: 2, t: "Target Customer", b: `${BUSINESS.target}. Revenue model: ${BUSINESS.revenue}.` },
              { n: 3, t: "Competitive Edge", b: DECISIONS[2].text },
            ].map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">{s.n}</span>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{s.t}</h4>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">{s.b}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-2">The Pitch</p>
            <p className="text-lg font-medium font-[family-name:var(--font-display)] text-[var(--text-primary)] leading-relaxed italic">
              &ldquo;{BUSINESS.name} gives teens a place to create, learn, and earn through art — because everyone deserves to express themselves, regardless of what they can afford.&rdquo;
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">&mdash; {STUDENT.name}, Founder of {BUSINESS.name}</p>
          </div>
        </div>
      </DemoSection>

      {/* ═══ 7. INSTRUCTOR DASHBOARD ═══ */}
      <DemoSection label="For Teachers" title="Instructor Dashboard" description="Real-time visibility into every student's progress, business idea, and emotional state. Smart alerts detect when students are stuck. One-click nudges keep them moving.">
        <div className="mx-auto max-w-[700px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--text-primary)]">Entrepreneurship — Period 3</h3>
              <p className="text-xs text-[var(--text-muted)]">28 students &middot; 2 alerts</p>
            </div>
            <div className="flex gap-1">
              {["Students", "Live Feed", "Alerts", "Follow-ups", "Analytics"].map((tab, i) => (
                <span key={tab} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${i === 0 ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"}`}>
                  {tab}{tab === "Alerts" && <span className="ml-1 text-[10px]">(2)</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="p-3 font-medium">Student</th><th className="p-3 font-medium">Business Idea</th><th className="p-3 font-medium">Progress</th><th className="p-3 font-medium">Last Active</th><th className="p-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {[
                  { name: STUDENT.fullName, biz: BUSINESS.name, pct: 62.5, active: "2 min ago", status: "On track", color: "var(--success)" },
                  { name: "Marcus Johnson", biz: "Fresh Kicks Co.", pct: 37.5, active: "3 days ago", status: "Needs help", color: "var(--warning)" },
                  { name: "Priya Sharma", biz: "Spice Route", pct: 87.5, active: "1 hr ago", status: "On track", color: "var(--success)" },
                  { name: "Jaylen Carter", biz: "Cart Culture", pct: 25, active: "5 days ago", status: "Inactive", color: "var(--error)" },
                ].map((s, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="p-3 font-medium text-[var(--text-primary)]">{s.name}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{s.biz}</td>
                    <td className="p-3"><div className="h-1.5 w-24 rounded-full bg-[var(--bg-muted)]"><div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} /></div></td>
                    <td className="p-3 text-[var(--text-muted)]">{s.active}</td>
                    <td className="p-3"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 10%, transparent)` }}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Alert */}
          <div className="p-4 flex items-start gap-3 border-t border-amber-200 bg-amber-50">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-amber-600">!</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">Marcus Johnson — Stuck on Lesson 3 for 4 days</p>
              <p className="text-xs text-[var(--text-muted)]">Student hasn&apos;t progressed. Consider a check-in.</p>
            </div>
            <span className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-white cursor-pointer">Send Nudge</span>
          </div>
        </div>
      </DemoSection>

      {/* ═══ 8. PARENT VIEW ═══ */}
      <DemoSection label="For Parents" title="Parent View" description="Parents see their child's progress, business idea, and Ikigai — all behind a PIN set by the teacher. Designed for 60 seconds of context.">
        <div className="mx-auto max-w-[500px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
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
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">{STUDENT.fullName}</h3>
              <p className="text-xs text-[var(--text-muted)]">Ms. Davis&apos;s Entrepreneurship &middot; Period 3</p>
              <p className="text-xs text-[var(--text-secondary)]">5 of 8 lessons complete</p>
            </div>
          </div>
          <div className="p-4 border-b border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Business Idea</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">{BUSINESS.name}</p>
            <p className="text-sm text-[var(--text-secondary)]">{BUSINESS.niche}</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 border-b border-[var(--border)]">
            {[
              { label: "What She Loves", items: IKIGAI.passions.join(", "), bg: "rgba(245,230,66,0.12)" },
              { label: "What She's Good At", items: IKIGAI.skills.join(", "), bg: "rgba(168,219,90,0.12)" },
              { label: "What People Need", items: IKIGAI.needs.join(", "), bg: "rgba(244,167,157,0.12)" },
              { label: "How She Earns", items: IKIGAI.monetization, bg: "rgba(109,213,208,0.12)" },
            ].map((q, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: q.bg }}>
                <p className="text-[10px] font-semibold text-[var(--text-primary)]">{q.label}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{q.items}</p>
              </div>
            ))}
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">How You Can Help</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {STUDENT.name} is halfway through and doing great. Ask her about the customer interviews she&apos;s been practicing. Encouraging her to talk to real people about {BUSINESS.name} would be the most valuable thing right now.
            </p>
          </div>
        </div>
      </DemoSection>

      {/* ═══ 9. COMPLETION CEREMONY — CINEMATIC ═══ */}
      <section ref={ceremonyRef} className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-[2618ms]" style={{ opacity: ceremonyPhase >= 1 && ceremonyPhase < 2 ? 1 : 0 }}>
          <div className="max-w-[480px] text-left" style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "17px", lineHeight: 1.618, color: "rgba(255,255,255,0.75)" }}>
            <p>Dear {STUDENT.name},</p>
            <p className="mt-[1.618em]">With this launchpad, I only hope you realize all that you are capable of. I started this platform with nothing but a vision, and an unstoppable will. You are capable of more than you know.</p>
            <p className="mt-[2.618em]" style={{ fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}>
              <span className="block mt-[0.382em] not-italic font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>&mdash; AJ Rogers, age 19</span>
              <span className="block mt-[0.236em] not-italic text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Founder of Adaptable</span>
            </p>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-[2618ms]" style={{ opacity: ceremonyPhase === 2 ? 1 : 0 }}>
          <span style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "0.236em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.65)" }}>Program Complete.</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-[2618ms]" style={{ opacity: ceremonyPhase >= 3 ? 1 : 0 }}>
          <div className="rounded-xl overflow-hidden" style={{
            background: "#f5f0e8", width: "min(520px, 80.9vw)", aspectRatio: "1.618/1",
            border: "2px solid #c4b18a", outline: "1px solid #d4c9a8", outlineOffset: "8.472px",
            padding: "8%", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", textAlign: "center" as const,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 80px rgba(196,177,138,0.08)",
            animation: ceremonyPhase >= 3 ? "ceremony-name-fade 1.618s ease-out forwards" : "none",
          }}>
            <div style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "11px", letterSpacing: "0.382em", textTransform: "uppercase" as const, color: "#8a7d65", marginBottom: "1.618em" }}>Adaptable Venture Program</div>
            <div style={{ fontFamily: "var(--font-diploma), 'Playfair Display', serif", fontSize: "17px", letterSpacing: "0.146em", textTransform: "uppercase" as const, color: "#5c5240", marginBottom: "0.618em" }}>Certificate of Completion</div>
            <div style={{ fontFamily: "var(--font-diploma), 'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: "#1a1712", marginBottom: "0.618em" }}>{STUDENT.fullName}</div>
            <div style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "11px", color: "#6b6050", lineHeight: 1.618, maxWidth: "340px", marginBottom: "1.618em" }}>
              has completed the Adaptable Venture Program and designed <strong>{BUSINESS.name}</strong>, {BUSINESS.niche.toLowerCase()}.
            </div>
            <div style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "11px", color: "#9a8e78", letterSpacing: "0.09em" }}>
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CLOSING ═══ */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center bg-[var(--bg)]">
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

function DemoSection({ label, title, description, children }: {
  label: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <section className="px-6 py-20 border-b border-[var(--border)]">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-12">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--primary)]">{label}</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-[32px] font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-3 max-w-[600px] text-base text-[var(--text-secondary)] leading-relaxed">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
