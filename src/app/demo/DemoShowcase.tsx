"use client";

/*
 * ADAPTABLE DEMO — Narrative Experience
 *
 * A scroll-driven story following Elsa Martinez's journey.
 * No tabs. No feature catalog. Just the story of transformation.
 *
 * Golden Ratio (φ = 1.618034) governs all scales:
 *   Typography: 11, 13, 16, 21, 34, 55, 89, 144px (Fibonacci)
 *   Spacing:    8, 13, 21, 34, 55, 89, 144, 233px
 *   Line height: 1.618
 *
 * Psychological framework:
 *   Processing Fluency — simple layouts, generous whitespace
 *   Narrative Bias — story arc, not feature list
 *   Von Restorff Effect — Section 6 breaks the pattern
 *   Peak-End Rule — Ceremony + CTA are the last two things you feel
 *
 * Student: Elsa Martinez, age 16
 * Business: Elsa's Art Studio
 */

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── ACTUAL PLATFORM COMPONENTS ──
import IkigaiDiagram from "@/components/ikigai/IkigaiDiagram";
import CompletionCeremony from "@/app/(app)/completion/CompletionCeremony";
import IkigaiWizard from "@/components/ikigai/IkigaiWizard";
import type { BusinessIdea } from "@/lib/types";
import IkigaiRevealDemo from "./IkigaiRevealDemo";
import DemoCardDesigner from "./DemoCardDesigner";
import BusinessPlanFolder from "@/components/business-plan/BusinessPlanFolder";

// ── Demo data ──
const ELSA = { name: "Elsa Martinez", first: "Elsa", age: 16 };

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

// ── Scroll-triggered visibility hook ──
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ── Typewriter effect hook ──
function useTypewriter(text: string, active: boolean, speed = 35) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) return;
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);

  return displayed;
}

// ── Animated counter hook ──
function useCounter(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration]);

  return value;
}

export default function DemoShowcase() {
  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyDone, setCeremonyDone] = useState(false);
  const [showDiyWizard, setShowDiyWizard] = useState(false);
  const [diyResult, setDiyResult] = useState<BusinessIdea | null>(null);
  const [showIkigaiReveal, setShowIkigaiReveal] = useState(false);

  // Scroll-triggered sections
  const distance = useInView(0.3);
  const conversation = useInView(0.2);
  const mirror = useInView(0.3);
  const numbers = useInView(0.2);
  const ceremony = useInView(0.4);

  // Typewriter texts
  const chatLine1 = useTypewriter(
    "I think it would be teens who love art but can't afford expensive classes or don't have art programs at school",
    conversation.visible,
    30
  );

  const mirrorPrompt = useTypewriter(
    "You started this lesson three times before finishing it. What was different today?",
    mirror.visible,
    40
  );

  const mirrorResponse = useTypewriter(
    "I think I was rushing the first two times. Today I actually read each question before answering...",
    mirror.visible,
    35
  );

  // Confidence meter
  const confidenceBefore = useCounter(2, numbers.visible, 800);
  const confidenceAfter = useCounter(4, numbers.visible, 1400);

  // Auto-trigger ceremony on scroll
  const ceremonyTriggered = useRef(false);
  useEffect(() => {
    if (ceremony.visible && !ceremonyTriggered.current && !ceremonyDone) {
      ceremonyTriggered.current = true;
      const timer = setTimeout(() => setShowCeremony(true), 600);
      return () => clearTimeout(timer);
    }
  }, [ceremony.visible, ceremonyDone]);

  // ── Ceremony overlay ──
  if (showCeremony && !ceremonyDone) {
    return (
      <CompletionCeremony
        studentName={ELSA.name}
        businessName={ELSA_STUDIO.name}
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

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: THE QUOTE
          Full-bleed dark. One quote. One name. One age.
          Peak-End Rule: the first feeling sets the frame.
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="flex min-h-[100vh] flex-col items-center justify-center px-8 text-center"
        style={{ background: "#111827" }}
      >
        <blockquote
          className="max-w-[680px] font-[family-name:var(--font-display)]"
          style={{ fontSize: "34px", lineHeight: 1.618, color: "#F9FAFB" }}
        >
          &ldquo;I walked in thinking entrepreneurship was something other people do. I walked out with a business.&rdquo;
        </blockquote>
        <p className="mt-8" style={{ fontSize: "16px", lineHeight: 1.618, color: "#9CA3AF" }}>
          {ELSA.name}, age {ELSA.age}
        </p>
        <p className="mt-2" style={{ fontSize: "13px", color: "#4B5563" }}>
          Scroll to see her journey
        </p>
        {/* Subtle scroll indicator */}
        <div className="mt-13 animate-bounce" style={{ marginTop: "55px" }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: THE DISTANCE
          Blank Ikigai (38.2%) vs completed plan (61.8%).
          Processing Fluency: the contrast tells the story instantly.
          ═══════════════════════════════════════════════════════════ */}
      <section ref={distance.ref} style={{ padding: "144px 34px" }}>
        <div className="mx-auto max-w-[1000px]">
          <div className="grid grid-cols-1 gap-13 md:grid-cols-2 items-center" style={{ gap: "89px" }}>
            {/* Before: blank Ikigai */}
            <div
              className="text-center transition-all duration-700"
              style={{
                opacity: distance.visible ? 1 : 0,
                transform: distance.visible ? "translateY(0)" : "translateY(34px)",
              }}
            >
              <p
                className="font-[family-name:var(--font-display)] mb-5"
                style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}
              >
                Day 1
              </p>
              <div className="mx-auto w-full max-w-[320px] opacity-40">
                <IkigaiDiagram
                  completedSteps={new Set()}
                  onStepClick={() => {}}
                  showReveal={false}
                />
              </div>
              <p className="mt-8" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
                No idea. No plan. Just a blank page.
              </p>
            </div>

            {/* After: completed plan */}
            <div
              className="text-center transition-all duration-700"
              style={{
                opacity: distance.visible ? 1 : 0,
                transform: distance.visible ? "translateY(0)" : "translateY(34px)",
                transitionDelay: "300ms",
              }}
            >
              <p
                className="font-[family-name:var(--font-display)] mb-5"
                style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
              >
                Day 30
              </p>
              <div className="mx-auto w-full max-w-[320px]">
                <IkigaiDiagram
                  completedSteps={new Set([1, 2, 3, 4])}
                  onStepClick={() => {}}
                  showReveal={false}
                  businessName={ELSA_STUDIO.name}
                />
              </div>
              <p className="mt-8" style={{ fontSize: "16px", lineHeight: 1.618, color: "#111827" }}>
                A real business. A 4-week plan. Confidence built on facts.
              </p>
            </div>
          </div>

          <p
            className="mx-auto mt-16 max-w-[600px] text-center font-[family-name:var(--font-display)]"
            style={{ fontSize: "21px", lineHeight: 1.618, color: "#111827" }}
          >
            This is what Adaptable does. Everything below is how.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: THE WIZARD
          Full width. "Try it yourself." The DIY wizard is the centerpiece.
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="border-t border-b border-[var(--border)]"
        style={{ padding: "144px 34px", background: "var(--bg-subtle)" }}
      >
        <div className="mx-auto max-w-[800px] text-center">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            The starting point
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "55px", lineHeight: 1.618, color: "#111827" }}
          >
            Try it yourself
          </h2>
          <p className="mx-auto mt-5 max-w-[520px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            Walk the actual Ikigai wizard. Same steps, same questions, same AI synthesis a real student gets. In about 3 minutes you&apos;ll have your own venture.
          </p>
          <button
            onClick={() => { setShowDiyWizard(true); setDiyResult(null); }}
            className="mt-8 rounded-lg bg-[var(--primary)] px-8 py-4 font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
            style={{
              fontSize: "16px",
              boxShadow: "0 0 21px rgba(13, 148, 136, 0.35), 0 0 55px rgba(13, 148, 136, 0.1)",
            }}
          >
            Walk the wizard
          </button>
          <p className="mt-3" style={{ fontSize: "11px", color: "#9CA3AF" }}>
            Real AI synthesis. Rate-limited to 5 tries per visitor.
          </p>
        </div>

        {/* Elsa's answers — context for what the wizard produces */}
        <div className="mx-auto mt-16 max-w-[680px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "What she loves", items: IKIGAI.passions, color: "#F5E642" },
              { label: "What she's good at", items: IKIGAI.skills, color: "#A8DB5A" },
              { label: "What people need", items: IKIGAI.needs, color: "#F4A79D" },
              { label: "How she earns", items: [IKIGAI.monetization], color: "#6DD5D0" },
            ].map((g) => (
              <div key={g.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4" style={{ borderLeftWidth: "3px", borderLeftColor: g.color }}>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                  {g.label}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.items.map(item => (
                    <span key={item} className="rounded-full bg-[var(--bg-subtle)] px-3 py-1" style={{ fontSize: "13px", color: "#111827" }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-screen DIY wizard overlay */}
      {showDiyWizard && !diyResult && (
        <div className="fixed inset-0 z-[100] bg-[var(--bg)] overflow-y-auto">
          <button
            onClick={() => setShowDiyWizard(false)}
            className="fixed top-4 right-4 z-[110] rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors shadow-md"
          >
            Close
          </button>
          <IkigaiWizard
            initialDraft={null}
            demoMode
            onDemoComplete={(idea) => setDiyResult(idea)}
          />
        </div>
      )}

      {/* DIY result — visitor's venture + sign-up CTA */}
      {showDiyWizard && diyResult && (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-subtle)] overflow-y-auto px-8" style={{ paddingTop: "89px", paddingBottom: "89px" }}>
          <div className="mx-auto max-w-[560px]">
            <button
              onClick={() => { setShowDiyWizard(false); setDiyResult(null); }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              &larr; back to demo
            </button>
            <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8">
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>
                Your venture
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}>
                {diyResult.name}
              </h2>
              <p className="mt-3" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>{diyResult.niche}</p>
              {diyResult.why_this_fits && (
                <div className="mt-8 pt-8 border-t border-[var(--border)]">
                  <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: "8px" }}>Why this fits you</p>
                  <p style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563", whiteSpace: "pre-line" }}>{diyResult.why_this_fits}</p>
                </div>
              )}
              <div className="mt-8 pt-8 border-t border-[var(--border)]">
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: "8px" }}>How you&apos;d earn</p>
                <p style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>{diyResult.revenue_model}</p>
              </div>
            </div>
            <div className="mt-13 text-center" style={{ marginTop: "55px" }}>
              <p style={{ fontSize: "16px", color: "#4B5563" }}>
                Real students go through 22 lessons with a personal AI mentor next.
              </p>
              <Link
                href="/signup"
                className="mt-5 inline-block rounded-lg bg-[var(--primary)] px-8 py-4 font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
                style={{ fontSize: "16px", boxShadow: "0 0 21px rgba(13, 148, 136, 0.35)" }}
              >
                Save this venture &amp; start lesson 1
              </Link>
              <p className="mt-3" style={{ fontSize: "11px", color: "#9CA3AF" }}>
                Free. Takes 30 seconds. No credit card.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: THE CONVERSATION
          Typewriter chat transcript. The core product experience.
          Narrative Bias: you watch Elsa learn in real time.
          ═══════════════════════════════════════════════════════════ */}
      <section ref={conversation.ref} style={{ padding: "144px 34px" }}>
        <div className="mx-auto max-w-[620px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            The core experience
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            Every lesson is a conversation
          </h2>
          <p className="mt-3 max-w-[500px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            The AI asks questions instead of giving answers. Checkpoints gate progress. Every conversation is about {ELSA.first}&apos;s business, not a generic textbook.
          </p>

          {/* Chat transcript */}
          <div
            className="mt-13 rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm"
            style={{ marginTop: "55px" }}
          >
            {/* Lesson header */}
            <div className="border-b border-[var(--border)] px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF" }}>Module 2</p>
                  <p className="font-semibold" style={{ fontSize: "13px", color: "#111827" }}>Define Your Target Customer</p>
                </div>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-muted)]">
                  <div className="h-2 rounded-full" style={{ width: "50%", background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} />
                </div>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>2/4</p>
              </div>
            </div>

            <div className="lesson-atmosphere px-5 py-5 space-y-5">
              {/* AI message */}
              <div
                className="transition-all duration-500"
                style={{ opacity: conversation.visible ? 1 : 0, transform: conversation.visible ? "translateY(0)" : "translateY(13px)" }}
              >
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <div className="ikigai-icon"><div className="ikigai-icon-dot ik-d1" /><div className="ikigai-icon-dot ik-d2" /><div className="ikigai-icon-dot ik-d3" /><div className="ikigai-icon-dot ik-d4" /></div>
                      <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF" }}>Guide</span>
                    </div>
                    <div className="ai-message rounded-2xl bg-[var(--bg-muted)] px-6 py-5 space-y-3" style={{ color: "#111827" }}>
                      <p style={{ fontSize: "16px", lineHeight: 1.618 }}>
                        Let&apos;s think about who your ideal customer really is. Not just &ldquo;everyone&rdquo; — but the specific person who would be MOST excited about {ELSA_STUDIO.name}.
                      </p>
                      <p style={{ fontSize: "16px", lineHeight: 1.618 }}>
                        Think about age, interests, and what problem they&apos;re trying to solve. Who comes to mind?
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student message — typewriter */}
              <div
                className="transition-all duration-500"
                style={{
                  opacity: conversation.visible ? 1 : 0,
                  transform: conversation.visible ? "translateY(0)" : "translateY(13px)",
                  transitionDelay: "800ms",
                }}
              >
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-[var(--primary)] text-white px-5 py-3">
                    <p style={{ fontSize: "16px", lineHeight: 1.618 }}>
                      {chatLine1}
                      {conversation.visible && chatLine1.length < 110 && <span className="animate-pulse">|</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI response */}
              <div
                className="transition-all duration-500"
                style={{
                  opacity: conversation.visible ? 1 : 0,
                  transform: conversation.visible ? "translateY(0)" : "translateY(13px)",
                  transitionDelay: "4500ms",
                }}
              >
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <div className="ikigai-icon"><div className="ikigai-icon-dot ik-d1" /><div className="ikigai-icon-dot ik-d2" /><div className="ikigai-icon-dot ik-d3" /><div className="ikigai-icon-dot ik-d4" /></div>
                      <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF" }}>Guide</span>
                    </div>
                    <div className="ai-message rounded-2xl bg-[var(--bg-muted)] px-6 py-5 space-y-3" style={{ color: "#111827" }}>
                      <p style={{ fontSize: "16px", lineHeight: 1.618 }}>
                        Now THAT is a target customer. You can picture her — she doodles in class, watches art tutorials on YouTube, wishes she could take real lessons.
                      </p>
                      <p style={{ fontSize: "16px", lineHeight: 1.618 }}>
                        That specificity is what makes a business real. Where does she hang out? How would you find her?
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkpoint */}
              <div
                className="transition-all duration-300"
                style={{
                  opacity: conversation.visible ? 1 : 0,
                  transitionDelay: "5500ms",
                }}
              >
                <div className="checkpoint-celebration rounded-lg px-4 py-2.5 text-center" style={{ animation: "none", opacity: 1 }}>
                  <p className="font-semibold" style={{ fontSize: "13px", color: "#0D9488" }}>Checkpoint reached</p>
                  <p style={{ fontSize: "11px", color: "#9CA3AF" }}>2/4 complete</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-8" style={{ fontSize: "13px", lineHeight: 1.618, color: "#9CA3AF", textAlign: "center" }}>
            22 lessons. 6 modules. Every one personalized to {ELSA.first}&apos;s business.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: THE MIRROR
          Typewriter reflection + AI response after 1.2s pause.
          The quiet moment. The inner game.
          ═══════════════════════════════════════════════════════════ */}
      <section
        ref={mirror.ref}
        className="border-t border-[var(--border)]"
        style={{ padding: "144px 34px", background: "var(--bg-subtle)" }}
      >
        <div className="mx-auto max-w-[620px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            The inner game
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            Founder&apos;s Mirror
          </h2>
          <p className="mt-3 max-w-[500px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            After every lesson, one observation and one question. Maximum 40 words. No advice. No praise. The AI shuts up and the student decides whether to write honestly.
          </p>

          {/* Mirror card */}
          <div className="mt-13 rounded-xl overflow-hidden" style={{ marginTop: "55px", boxShadow: "0 8px 34px rgba(0,0,0,0.08)" }}>
            {/* Teal header */}
            <div className="bg-[#F0FDFA] border-b border-[#CCFBF1] px-7 pt-6 pb-5">
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488", marginBottom: "16px" }}>
                Founder&apos;s Mirror
              </p>
              <p
                className="font-[family-name:var(--font-display)]"
                style={{ fontSize: "21px", fontWeight: 400, lineHeight: 1.618, color: "#111827" }}
              >
                {mirrorPrompt}
                {mirror.visible && mirrorPrompt.length < 80 && <span className="animate-pulse" style={{ color: "#0D9488" }}>|</span>}
              </p>
            </div>
            {/* Student response */}
            <div className="bg-white px-7 pt-6 pb-7">
              <div className="flex items-center gap-1.5 mb-5" style={{ fontSize: "13px", color: "#9CA3AF" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="opacity-60"><path d="M4 7V5a4 4 0 118 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h1zm2 0h4V5a2 2 0 10-4 0v2z" /></svg>
                <span>Private to you. No one else sees this.</span>
              </div>
              <div
                className="w-full min-h-[89px] p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] italic"
                style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}
              >
                {mirror.visible && mirrorPrompt.length >= 80 ? mirrorResponse : ""}
                {mirror.visible && mirrorPrompt.length >= 80 && mirrorResponse.length < 95 && (
                  <span className="animate-pulse">|</span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center" style={{ fontSize: "13px", lineHeight: 1.618, color: "#9CA3AF" }}>
            Over 22 lessons, these accumulate into a private Founder&apos;s Log that no teacher sees and no algorithm ranks.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: THE NUMBERS
          Von Restorff Effect: darker background breaks the pattern.
          Animated confidence meter is the centerpiece.
          ═══════════════════════════════════════════════════════════ */}
      <section
        ref={numbers.ref}
        style={{ padding: "144px 34px", background: "#111827" }}
      >
        <div className="mx-auto max-w-[800px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            The proof
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#F9FAFB" }}
          >
            Measured like an ML team, not an ed-tech course
          </h2>

          {/* Confidence meter — the centerpiece */}
          <div
            className="mt-13 rounded-xl border border-white/10 p-8"
            style={{ marginTop: "55px", background: "rgba(255,255,255,0.05)" }}
          >
            <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>
              Self-confidence: &ldquo;Could YOU start a business?&rdquo;
            </p>
            <div className="mt-8 flex items-end gap-8 justify-center">
              {/* Before */}
              <div className="text-center">
                <div
                  className="mx-auto rounded-lg transition-all duration-1000"
                  style={{
                    width: "55px",
                    height: `${confidenceBefore * 34}px`,
                    background: "rgba(255,255,255,0.15)",
                    minHeight: "8px",
                  }}
                />
                <p className="mt-3 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "34px", color: "#F9FAFB" }}>
                  {confidenceBefore}<span style={{ fontSize: "16px", color: "#9CA3AF" }}>/5</span>
                </p>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Before</p>
              </div>

              {/* Arrow */}
              <svg width="34" height="21" viewBox="0 0 34 21" fill="none" className="mb-8">
                <path d="M1 10.5h28M23 4l6 6.5-6 6.5" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* After */}
              <div className="text-center">
                <div
                  className="mx-auto rounded-lg transition-all duration-1400"
                  style={{
                    width: "55px",
                    height: `${confidenceAfter * 34}px`,
                    background: "linear-gradient(180deg, #14B8A6, #0D9488)",
                    minHeight: "8px",
                  }}
                />
                <p className="mt-3 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "34px", color: "#F9FAFB" }}>
                  {confidenceAfter}<span style={{ fontSize: "16px", color: "#9CA3AF" }}>/5</span>
                </p>
                <p style={{ fontSize: "11px", color: "#0D9488" }}>After</p>
              </div>
            </div>
            <p className="mt-5 text-center" style={{ fontSize: "13px", color: "#9CA3AF" }}>
              +{numbers.visible ? "1.15" : "0"} average gain. 100% of simulated students gained.
            </p>
          </div>

          {/* Stats grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Understanding gain", value: "+1.53", sub: "on a 5-point scale" },
              { label: "Alien to accessible", value: "97%", sub: "flipped their self-belief" },
              { label: "Decisively moved", value: "70%", sub: "independent Opus judge" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 p-5"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>
                  {stat.label}
                </p>
                <p className="mt-3 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "34px", color: "#F9FAFB" }}>
                  {stat.value}
                </p>
                <p className="mt-1" style={{ fontSize: "13px", color: "#9CA3AF" }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          <p className="mt-8" style={{ fontSize: "13px", lineHeight: 1.618, color: "#9CA3AF" }}>
            60 simulated students, 20 personas across 3 motivation levels. Synthesizer: Claude Sonnet. Judge: Claude Opus (cross-model, eliminates self-preference bias). Every commit measured.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7: THE PLAN
          BusinessPlanFolder with grade tier badges.
          ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "144px 34px" }}>
        <div className="mx-auto max-w-[800px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            The output
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            A business plan that builds itself
          </h2>
          <p className="mt-3 max-w-[600px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            Students never &ldquo;write a business plan.&rdquo; It assembles from their decisions across 22 lessons. Click through {ELSA.first}&apos;s.
          </p>

          <div className="mt-13 flex justify-center" style={{ marginTop: "55px" }}>
            <BusinessPlanFolder />
          </div>

          {/* Grade tier badges */}
          <div className="mt-8 text-center">
            <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "13px" }}>Adapts to every grade level</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { tier: "K-2", label: "Lower Elementary", desc: "$0 capital, neighborhood" },
                { tier: "3-5", label: "Upper Elementary", desc: "Under $10, school + local" },
                { tier: "6-8", label: "Middle School", desc: "Under $50, online OK" },
                { tier: "9-12", label: "High School", desc: "Under $100, full range" },
              ].map((g) => (
                <span
                  key={g.tier}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5"
                  style={{ fontSize: "11px", color: "#4B5563" }}
                  title={g.desc}
                >
                  {g.tier} {g.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 8: THE CARD
          DemoCardDesigner — 3D business card the student designs.
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="border-t border-[var(--border)]"
        style={{ padding: "144px 34px", background: "var(--bg-subtle)" }}
      >
        <div className="mx-auto max-w-[820px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            The reward
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            A business card they designed
          </h2>
          <p className="mt-3 max-w-[600px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            3D tilt, custom colors, finishes that unlock with progress. Pick any combination below.
          </p>

          <div className="mt-13" style={{ marginTop: "55px" }}>
            <DemoCardDesigner
              studentName={ELSA.name}
              defaultBusinessName={ELSA_STUDIO.name}
              niche={ELSA_STUDIO.niche}
              targetCustomer={ELSA_STUDIO.target}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 9: THE TEACHER AND PARENT
          Dashboard + parent view side by side on desktop.
          ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "144px 34px" }}>
        <div className="mx-auto max-w-[1000px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            The adults
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            Teachers see everything. Parents see enough.
          </h2>

          <div className="mt-13 grid gap-8 lg:grid-cols-5" style={{ marginTop: "55px" }}>
            {/* Instructor dashboard — 3/5 width */}
            <div className="lg:col-span-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[var(--border)]">
                <h3 className="font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "16px", color: "#111827" }}>
                  Entrepreneurship — Period 3
                </h3>
                <p className="mt-1" style={{ fontSize: "13px", color: "#4B5563" }}>
                  28 students &middot; <span style={{ color: "#D97706" }}>2 alerts</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Student", "Business", "Progress", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-left" style={{ fontSize: "11px", fontWeight: 500, color: "#9CA3AF" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: ELSA.name, biz: ELSA_STUDIO.name, pct: 63, status: "On track", sColor: "#059669" },
                      { name: "Marcus Johnson", biz: "Fresh Kicks Co.", pct: 38, status: "Needs help", sColor: "#D97706" },
                      { name: "Priya Sharma", biz: "Spice Route", pct: 88, status: "On track", sColor: "#059669" },
                      { name: "Jaylen Carter", biz: "Cart Culture", pct: 25, status: "Inactive", sColor: "#DC2626" },
                    ].map((s, i) => (
                      <tr key={i} className="border-b border-[var(--border)]">
                        <td className="px-4 py-3 font-medium" style={{ fontSize: "13px", color: "#111827" }}>{s.name}</td>
                        <td className="px-4 py-3" style={{ fontSize: "13px", color: "#4B5563" }}>{s.biz}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-[var(--bg-muted)]">
                              <div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)" }} />
                            </div>
                            <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{s.pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2 py-0.5" style={{ fontSize: "11px", fontWeight: 500, color: s.sColor, background: `${s.sColor}15` }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Alert */}
              <div className="flex items-start gap-3 border-t border-amber-300 bg-amber-50 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ fontSize: "13px", color: "#111827" }}>Marcus Johnson</span>
                    <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5" style={{ fontSize: "11px" }}>stuck</span>
                  </div>
                  <p className="mt-1" style={{ fontSize: "13px", color: "#4B5563" }}>
                    Hasn&apos;t progressed past Lesson 3 in 4 days
                  </p>
                </div>
                <span className="rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white transition-colors" style={{ fontSize: "11px", fontWeight: 500, color: "#0D9488" }}>
                  Send Nudge
                </span>
              </div>
            </div>

            {/* Parent view — 2/5 width */}
            <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm self-start">
              <div className="p-5 flex items-center gap-4 border-b border-[var(--border)]">
                <div className="relative" style={{ width: "55px", height: "55px" }}>
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-muted)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 52 * 0.625} ${2 * Math.PI * 52 * 0.375}`}
                      strokeLinecap="round" transform="rotate(-90 60 60)" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ fontSize: "13px", color: "#0D9488" }}>63%</span>
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "16px", color: "#111827" }}>{ELSA.name}</h3>
                  <p style={{ fontSize: "11px", color: "#9CA3AF" }}>14 of 22 lessons complete</p>
                </div>
              </div>
              <div className="p-5 border-b border-[var(--border)]">
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF" }}>Business Idea</p>
                <p className="mt-1 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "16px", color: "#111827" }}>{ELSA_STUDIO.name}</p>
                <p style={{ fontSize: "13px", color: "#4B5563" }}>{ELSA_STUDIO.niche}</p>
              </div>
              <div className="p-5">
                <p className="font-semibold" style={{ fontSize: "13px", color: "#111827", marginBottom: "4px" }}>How You Can Help</p>
                <p style={{ fontSize: "13px", lineHeight: 1.618, color: "#4B5563" }}>
                  {ELSA.first} is halfway through and doing great. Ask her about the customer interviews she&apos;s been practicing. Encouraging her to talk to real people would be the most valuable thing right now.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 10: THE CEREMONY
          Auto-plays on scroll after 600ms delay.
          Peak-End Rule: this is the peak.
          ═══════════════════════════════════════════════════════════ */}
      <section
        ref={ceremony.ref}
        className="border-t border-[var(--border)]"
        style={{ padding: "144px 34px", background: "var(--bg-subtle)" }}
      >
        <div className="mx-auto max-w-[640px] text-center">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#F59E0B" }}
          >
            The moment
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            {ceremonyDone ? "That's what real students see." : "After lesson 22, this happens."}
          </h2>
          {!ceremonyDone && (
            <p className="mt-3" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
              The four parts of who they are arrive. Light gathers in the space they hold. Their venture is born from that light. Founder&apos;s letter. Diploma.
            </p>
          )}

          {ceremonyDone && (
            <div className="mt-8">
              <p style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
                Confidence built on a moment they earned.
              </p>
              <button
                onClick={() => {
                  setCeremonyDone(false);
                  ceremonyTriggered.current = false;
                  setShowCeremony(true);
                }}
                className="mt-5 rounded-lg border border-[var(--border-strong)] px-6 py-3 font-semibold hover:bg-[var(--bg-muted)] transition-colors"
                style={{ fontSize: "13px", color: "#111827" }}
              >
                Watch it again
              </button>
            </div>
          )}

          {!ceremonyDone && !ceremony.visible && (
            <p className="mt-8 animate-pulse" style={{ fontSize: "13px", color: "#9CA3AF" }}>
              Scroll to trigger the ceremony...
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 11: THE CTA
          Dark. Simple. One line + sign up.
          Peak-End Rule: this is the end.
          ═══════════════════════════════════════════════════════════ */}
      <section
        className="flex min-h-[55vh] flex-col items-center justify-center px-8 text-center"
        style={{ background: "#111827" }}
      >
        <h2
          className="font-[family-name:var(--font-display)] font-semibold"
          style={{ fontSize: "34px", lineHeight: 1.618, color: "#F9FAFB" }}
        >
          This is Adaptable.
        </h2>
        <p className="mt-5 max-w-[480px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#9CA3AF" }}>
          The blank page is the hardest part of starting anything. We solved it for teens.
        </p>
        <div className="mt-13 flex gap-4" style={{ marginTop: "55px" }}>
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--primary)] px-8 py-4 font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
            style={{
              fontSize: "16px",
              boxShadow: "0 0 21px rgba(13, 148, 136, 0.35), 0 0 55px rgba(13, 148, 136, 0.1)",
            }}
          >
            Get started
          </Link>
          <Link
            href="/for-schools"
            className="rounded-lg border border-white/20 px-8 py-4 font-semibold transition-colors hover:bg-white/5"
            style={{ fontSize: "16px", color: "#F9FAFB" }}
          >
            For schools
          </Link>
        </div>
        <p className="mt-13" style={{ marginTop: "89px", fontSize: "11px", color: "#4B5563" }}>
          Built for VentureLab &middot; By AJ Rogers, age 19
        </p>
      </section>

      {/* ── Ikigai reveal overlay ── */}
      {showIkigaiReveal && (
        <IkigaiRevealDemo
          studentFirstName={ELSA.first}
          businessName={ELSA_STUDIO.name}
          businessNiche={ELSA_STUDIO.niche}
          whyThisFits={`You love painting and helping others create. You're good at color theory and teaching. Your community needs affordable art education for teens. ${ELSA_STUDIO.name} is where all four meet.`}
          revenueModel={ELSA_STUDIO.revenue}
          onClose={() => setShowIkigaiReveal(false)}
        />
      )}
    </main>
  );
}
