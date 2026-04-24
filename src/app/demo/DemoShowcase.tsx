"use client";

/*
 * ADAPTABLE DEMO — Narrative Experience
 *
 * A story following Elsa Martinez's journey, structured as tabs
 * so visitors navigate sideways, not through a 10,000px scroll.
 *
 * Golden Ratio (φ = 1.618034) governs all scales:
 *   Typography: 11, 13, 16, 21, 34, 55, 89, 144px (Fibonacci)
 *   Spacing:    8, 13, 21, 34, 55, 89, 144, 233px
 *   Line height: 1.618
 *
 * Tab structure (replaces linear scroll):
 *   Start    — Quote + Distance (Day 1 vs Day 30)
 *   Learn    — Wizard + Conversation + Mirror + Founder's Log
 *   Build    — Plan + Card
 *   Prove    — Numbers (Von Restorff dark section)
 *   Guide    — Teacher dashboard + Parent view
 *   Graduate — Ceremony + CTA
 *
 * Student: Elsa Martinez, age 16
 * Business: Elsa's Art Studio
 */

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

// ── ACTUAL PLATFORM COMPONENTS ──
import CompletionCeremony from "@/app/(app)/completion/CompletionCeremony";
import IkigaiWizard from "@/components/ikigai/IkigaiWizard";
import type { BusinessIdea } from "@/lib/types";
import DemoCardDesigner from "./DemoCardDesigner";
import InventionIkigai from "@/components/InventionIkigai";
import DemoInventionMode from "./DemoInventionMode";
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
  monetization: ["Art workshops", "Private lessons", "Commission pieces"],
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

  const forceVisible = () => setVisible(true);
  return { ref, visible, forceVisible };
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
function useCounter(target: number, active: boolean, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const factor = Math.pow(10, decimals);
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased * factor) / factor);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration, decimals]);

  return value;
}

// ── Tab type ──
type DemoTab = "start" | "learn" | "build" | "prove" | "guide" | "graduate" | "invention" | "summary";

const TABS: { key: DemoTab; label: string }[] = [
  { key: "start", label: "Start" },
  { key: "learn", label: "Learn" },
  { key: "build", label: "Build" },
  { key: "prove", label: "Prove" },
  { key: "guide", label: "Guide" },
  { key: "graduate", label: "Graduate" },
  { key: "invention", label: "Invention" },
  { key: "summary", label: "Summary" },
];

export default function DemoShowcase() {
  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyDone, setCeremonyDone] = useState(false);
  const [showDiyWizard, setShowDiyWizard] = useState(false);
  const [diyResult, setDiyResult] = useState<BusinessIdea | null>(null);

  // Entry state — false = quote landing, true = tabs visible
  const [entered, setEntered] = useState(false);
  const [quoteFading, setQuoteFading] = useState(false);

  // Auto-skip quote if user has already seen it, or failsafe after 5s
  useEffect(() => {
    if (sessionStorage.getItem("demo-entered") === "1") {
      setEntered(true);
      // Force all scroll-triggered animations since we skipped the entry
      requestAnimationFrame(() => {
        distance.forceVisible();
        conversation.forceVisible();
        mirror.forceVisible();
        numbers.forceVisible();
      });
      return;
    }
    // Failsafe: if quote button somehow doesn't work, auto-enter after 5s
    const failsafe = setTimeout(() => {
      if (!entered) { setEntered(true); sessionStorage.setItem("demo-entered", "1"); }
    }, 5000);
    return () => clearTimeout(failsafe);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnter = () => {
    setQuoteFading(true);
    setTimeout(() => {
      setEntered(true);
      sessionStorage.setItem("demo-entered", "1");
      window.scrollTo({ top: 0 });
      // Double-rAF: wait for React to render the DOM, then force animations
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          distance.forceVisible();
        });
      });
    }, 600);
  };

  // Tab state — applies on both mobile and desktop
  const [activeTab, setActiveTab] = useState<DemoTab>("start");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll-triggered sections
  const distance = useInView(0.3);
  const conversation = useInView(0.2);
  const mirror = useInView(0.3);
  const numbers = useInView(0.2);

  // Map tabs → scroll-triggered sections they contain
  const tabAnimations: Record<DemoTab, Array<() => void>> = {
    start: [distance.forceVisible],
    learn: [conversation.forceVisible, mirror.forceVisible],
    build: [],
    prove: [numbers.forceVisible],
    guide: [],
    graduate: [],
    invention: [],
    summary: [],
  };

  const selectTab = (key: DemoTab) => {
    setActiveTab(key);
    // Double-rAF: first frame lets React render, second fires animations
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tabAnimations[key].forEach((fn) => fn());
      });
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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

  // Mirror response starts after the prompt finishes typing (80 chars × 40ms = ~3.2s + 1.2s pause)
  const [mirrorResponseReady, setMirrorResponseReady] = useState(false);
  useEffect(() => {
    if (!mirror.visible) return;
    const timer = setTimeout(() => setMirrorResponseReady(true), 4400);
    return () => clearTimeout(timer);
  }, [mirror.visible]);

  const mirrorResponse = useTypewriter(
    "I think I was rushing the first two times. Today I actually read each question before answering...",
    mirrorResponseReady,
    35
  );

  // Confidence meter
  // Updated from 2026-04-17 eval run (59 completed paths)
  const confidenceBefore = useCounter(2.6, numbers.visible, 800, 1);
  const confidenceAfter = useCounter(3.7, numbers.visible, 1400, 1);
  const understandBefore = useCounter(2.1, numbers.visible, 800, 1);
  const understandAfter = useCounter(3.6, numbers.visible, 1400, 1);

  // ── Ceremony overlay ──
  if (showCeremony && !ceremonyDone) {
    return (
      <CompletionCeremony
        studentName={ELSA.name}
        businessName={ELSA_STUDIO.name}
        businessNiche={ELSA_STUDIO.niche}
        ikigai={{ ...IKIGAI, monetization: IKIGAI.monetization.join(", ") }}
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

      {/* ═══ NAV — only visible on quote landing, hidden after entry ═══ */}
      <nav className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 ${entered ? "hidden" : ""}`}>
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-bold"
          style={{ color: entered ? "var(--primary)" : "#F9FAFB" }}
        >
          Adaptable
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/for-schools"
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: entered ? "var(--text-secondary)" : "#9CA3AF" }}
          >
            For Schools
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: entered ? "var(--primary)" : "rgba(255,255,255,0.15)",
              color: "#fff",
            }}
          >
            Log In
          </Link>
        </div>
      </nav>

      {/* ═══ QUOTE LANDING — full viewport, fades out on enter ═══ */}
      {!entered && (
        <section
          className="flex min-h-[100vh] flex-col items-center justify-center px-8 text-center transition-opacity duration-600"
          style={{
            background: "#111827",
            opacity: quoteFading ? 0 : 1,
            transition: "opacity 600ms ease-out",
          }}
        >
          <blockquote
            className="max-w-[680px] font-[family-name:var(--font-display)]"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#F9FAFB" }}
          >
            &ldquo;The hardest moment in a 14-year-old&apos;s entrepreneurial journey isn&apos;t building the business. It&apos;s the blank page before the business exists.&rdquo;
          </blockquote>
          <p className="mt-8" style={{ fontSize: "16px", lineHeight: 1.618, color: "#9CA3AF" }}>
            AJ Rogers, founder, age 19
          </p>
          <button
            onClick={handleEnter}
            className="rounded-lg bg-[var(--primary)] px-8 py-4 font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
            style={{
              marginTop: "55px",
              fontSize: "16px",
              boxShadow: "0 0 21px rgba(13, 148, 136, 0.35), 0 0 55px rgba(13, 148, 136, 0.1)",
            }}
          >
            Experience the journey
          </button>
        </section>
      )}

      {/* ═══ TAB NAV — appears after entry, tabs cascade in ═══ */}
      {entered && (
        <div
          ref={tabsRef}
          className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm"
          role="tablist"
          aria-label="Demo sections"
        >
          <div className="mx-auto flex max-w-[1200px] items-center gap-1 overflow-x-auto px-3 py-3 md:px-6 md:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/" className="mr-3 shrink-0 font-[family-name:var(--font-display)] text-base font-bold text-[var(--primary)] hidden md:block">Adaptable</Link>
            {TABS.map((t, i) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => selectTab(t.key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 font-[family-name:var(--font-display)] text-[13px] font-semibold transition-all md:px-5 md:py-2.5 md:text-sm ${
                  activeTab === t.key
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                }`}
                style={{
                  opacity: 0,
                  animation: `fadeSlideIn 400ms ease-out ${i * 120}ms forwards`,
                }}
              >
                {t.label}
              </button>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-3 hidden md:flex">
              <Link href="/for-schools" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">For Schools</Link>
              <Link href="/login" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white">Log In</Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: START — Distance (Day 1 vs Day 30)
          ═══════════════════════════════════════════════════════════ */}
      {entered && activeTab === "start" && (
      <section ref={distance.ref} style={{ padding: "89px 34px", animation: "fadeSlideIn 600ms ease-out 300ms both" }}>
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
                Before Adaptable
              </p>
              <div className="mx-auto w-full max-w-[480px] opacity-40">
                <div style={{ aspectRatio: "1 / 1", position: "relative" }}>
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="30.9" r="20" fill="#F5E642" opacity="0.35" />
                    <circle cx="30.9" cy="50" r="20" fill="#A8DB5A" opacity="0.35" />
                    <circle cx="69.1" cy="50" r="20" fill="#F4A79D" opacity="0.35" />
                    <circle cx="50" cy="69.1" r="20" fill="#6DD5D0" opacity="0.35" />
                  </svg>
                </div>
              </div>
              <p className="mt-8" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
                No idea. No plan. Just a blank page.
              </p>
            </div>

            {/* After: completed Ikigai */}
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
                Day 1
              </p>
              <div className="mx-auto w-full max-w-[480px]">
                <GoldenIkigai />
              </div>
              <p className="mt-8 font-[family-name:var(--font-display)] font-semibold" style={{ fontSize: "16px", lineHeight: 1.618, color: "#111827" }}>
                {ELSA_STUDIO.name}
              </p>
            </div>
          </div>

          <p
            className="mx-auto mt-16 max-w-[600px] text-center font-[family-name:var(--font-display)]"
            style={{ fontSize: "21px", lineHeight: 1.618, color: "#111827" }}
          >
            This is what Adaptable does. Use the tabs above to see how.
          </p>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: LEARN — Wizard + Conversation + Mirror + Founder's Log
          ═══════════════════════════════════════════════════════════ */}
      {entered && activeTab === "learn" && (
      <>
      {/* Wizard section */}
      <section
        className="border-b border-[var(--border)]"
        style={{ padding: "89px 34px", background: "var(--bg-subtle)" }}
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
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            Try it yourself
          </h2>
          <p className="mx-auto mt-5 max-w-[520px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            Walk the actual Ikigai wizard. Same steps, same questions, same AI synthesis a real student gets. In less than two minutes you&apos;ll have your own venture.
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

        {/* Elsa's answers */}
        <div className="mx-auto mt-16 max-w-[680px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "What she loves", items: IKIGAI.passions, color: "#F5E642" },
              { label: "What she's good at", items: IKIGAI.skills, color: "#A8DB5A" },
              { label: "What people need", items: IKIGAI.needs, color: "#F4A79D" },
              { label: "How she earns", items: IKIGAI.monetization, color: "#6DD5D0" },
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

      {/* Conversation section */}
      <section ref={conversation.ref} style={{ padding: "89px 34px" }}>
        <div className="mx-auto max-w-[620px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            What it feels like
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
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm" style={{ marginTop: "55px" }}>
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

              {/* Student message — typewriter */}
              <div
                className="transition-all duration-500"
                style={{ opacity: conversation.visible ? 1 : 0, transitionDelay: "800ms" }}
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
                style={{ opacity: conversation.visible ? 1 : 0, transitionDelay: "4500ms" }}
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
              <div className="transition-all duration-300" style={{ opacity: conversation.visible ? 1 : 0, transitionDelay: "5500ms" }}>
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

      {/* Mirror + Founder's Log section */}
      <section
        ref={mirror.ref}
        className="border-t border-[var(--border)]"
        style={{ padding: "89px 34px", background: "var(--bg-subtle)" }}
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
          <div className="rounded-xl overflow-hidden" style={{ marginTop: "55px", boxShadow: "0 8px 34px rgba(0,0,0,0.08)" }}>
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
            <div className="bg-white px-7 pt-6 pb-7">
              <div className="flex items-center gap-1.5 mb-5" style={{ fontSize: "13px", color: "#9CA3AF" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="opacity-60"><path d="M4 7V5a4 4 0 118 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h1zm2 0h4V5a2 2 0 10-4 0v2z" /></svg>
                <span>Private to you. No one else sees this.</span>
              </div>
              <div
                className="w-full min-h-[89px] p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] italic"
                style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}
              >
                {mirrorResponseReady ? mirrorResponse : ""}
                {mirrorResponseReady && mirrorResponse.length < 95 && (
                  <span className="animate-pulse">|</span>
                )}
              </div>
            </div>
          </div>

          {/* Founder's Log preview — #9 */}
          <div className="mt-13" style={{ marginTop: "55px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0D9488", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              The Founder&apos;s Log
            </p>
            <p style={{ fontSize: "13px", color: "#4B5563", marginBottom: "16px" }}>
              Over 22 lessons, these reflections accumulate into a private journal. No teacher sees this. No algorithm ranks it.
            </p>
            <div className="space-y-3">
              {[
                { date: "April 12", lesson: "What to Do After Your First Sale", prompt: "You moved through this one fast. What clicked?", color: "#0D9488" },
                { date: "April 9", lesson: "Set Your Price", prompt: "Your pricing numbers changed 4 times. What were you wrestling with?", color: "#F59E0B" },
                { date: "April 5", lesson: "Welcome back", prompt: "You've been away 9 days. What brought you back?", color: "#6366F1" },
                { date: "March 28", lesson: "Find Your Niche", prompt: "You spent 20 minutes on this answer. What made it hard?", color: "#0D9488" },
              ].map((entry) => (
                <div key={entry.date} className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: entry.color }} />
                  <div className="min-w-0">
                    <p style={{ fontSize: "11px", color: "#9CA3AF" }}>{entry.date} &middot; {entry.lesson}</p>
                    <p className="mt-1 italic" style={{ fontSize: "13px", color: "#4B5563" }}>&ldquo;{entry.prompt}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: BUILD — Plan + Card
          ═══════════════════════════════════════════════════════════ */}
      {entered && activeTab === "build" && (
      <>
      <section style={{ padding: "89px 34px" }}>
        <div className="mx-auto max-w-[800px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            What she built
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

          <div className="flex justify-center" style={{ marginTop: "55px" }}>
            <BusinessPlanFolder />
          </div>

          {/* Grade tier badges — #12: descriptions visible, not title-only */}
          <div className="mt-8">
            <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "13px", textAlign: "center" }}>Adapts to every grade level</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { tier: "K-2", label: "Lower Elementary", desc: "$0 startup capital. Neighborhood only." },
                { tier: "3-5", label: "Upper Elementary", desc: "Under $10. School + local." },
                { tier: "6-8", label: "Middle School", desc: "Under $50. Online OK." },
                { tier: "9-12", label: "High School", desc: "Under $100. Full range." },
              ].map((g) => (
                <div
                  key={g.tier}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3"
                >
                  <span className="font-semibold" style={{ fontSize: "13px", color: "#111827" }}>{g.tier} {g.label}</span>
                  <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-[var(--border)]"
        style={{ padding: "89px 34px", background: "var(--bg-subtle)" }}
      >
        <div className="mx-auto max-w-[820px]">
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            What she earned
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            A business card she designed
          </h2>
          <p className="mt-3 max-w-[600px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            3D tilt, custom colors, finishes that unlock with progress. Pick any combination below.
          </p>

          <div style={{ marginTop: "55px" }}>
            <DemoCardDesigner
              studentName={ELSA.name}
              defaultBusinessName={ELSA_STUDIO.name}
              niche={ELSA_STUDIO.niche}
              targetCustomer={ELSA_STUDIO.target}
            />
          </div>
        </div>
      </section>
      </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: PROVE — Numbers (Von Restorff dark section)
          ═══════════════════════════════════════════════════════════ */}
      {entered && activeTab === "prove" && (
      <section
        ref={numbers.ref}
        style={{ padding: "89px 34px" }}
      >
        <div className="mx-auto max-w-[800px]">

          {/* ── 1. Header ── */}
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            Evidence
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            Measured before we scaled
          </h2>
          <p className="mt-3 max-w-[600px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            We built an eval harness before we built marketing. Every prompt change is graded against 60 AI student personas, judged by an independent model. Here&apos;s what the latest run shows.
          </p>

          {/* ── 2. Dual confidence + understanding meter ── */}
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-8"
            style={{ marginTop: "55px" }}
          >
            {/* Confidence row */}
            <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>
              Self-confidence: &ldquo;Could YOU start a business?&rdquo;
            </p>
            <div className="mt-5 flex items-end gap-8 justify-center">
              <div className="text-center">
                <div
                  className="mx-auto rounded-lg transition-all duration-1000"
                  style={{ width: "55px", height: `${confidenceBefore * 26}px`, background: "#E5E7EB", minHeight: "8px" }}
                />
                <p className="mt-3 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "34px", color: "#111827" }}>
                  {confidenceBefore.toFixed(1)}<span style={{ fontSize: "16px", color: "#9CA3AF" }}>/5</span>
                </p>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Before</p>
              </div>
              <svg width="34" height="21" viewBox="0 0 34 21" fill="none" className="mb-8">
                <path d="M1 10.5h28M23 4l6 6.5-6 6.5" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-center">
                <div
                  className="mx-auto rounded-lg transition-all duration-[1400ms]"
                  style={{ width: "55px", height: `${confidenceAfter * 26}px`, background: "linear-gradient(180deg, #14B8A6, #0D9488)", minHeight: "8px" }}
                />
                <p className="mt-3 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "34px", color: "#111827" }}>
                  {confidenceAfter.toFixed(1)}<span style={{ fontSize: "16px", color: "#9CA3AF" }}>/5</span>
                </p>
                <p style={{ fontSize: "11px", color: "#0D9488" }}>After</p>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "21px", color: "#0D9488" }}>+1.09</span>
              <span className="ml-2" style={{ fontSize: "16px", color: "#4B5563" }}>average confidence gain</span>
              <p style={{ fontSize: "13px", color: "#9CA3AF" }}>93% of students gained confidence</p>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]" style={{ margin: "34px 0" }} />

            {/* Understanding row */}
            <p style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>
              Understanding: &ldquo;Do you GET what running a business means?&rdquo;
            </p>
            <div className="mt-5 flex items-end gap-8 justify-center">
              <div className="text-center">
                <div
                  className="mx-auto rounded-lg transition-all duration-1000"
                  style={{ width: "55px", height: `${understandBefore * 26}px`, background: "#E5E7EB", minHeight: "8px" }}
                />
                <p className="mt-3 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "34px", color: "#111827" }}>
                  {understandBefore.toFixed(1)}<span style={{ fontSize: "16px", color: "#9CA3AF" }}>/5</span>
                </p>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Before</p>
              </div>
              <svg width="34" height="21" viewBox="0 0 34 21" fill="none" className="mb-8">
                <path d="M1 10.5h28M23 4l6 6.5-6 6.5" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-center">
                <div
                  className="mx-auto rounded-lg transition-all duration-[1400ms]"
                  style={{ width: "55px", height: `${understandAfter * 26}px`, background: "linear-gradient(180deg, #14B8A6, #0D9488)", minHeight: "8px" }}
                />
                <p className="mt-3 font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "34px", color: "#111827" }}>
                  {understandAfter.toFixed(1)}<span style={{ fontSize: "16px", color: "#9CA3AF" }}>/5</span>
                </p>
                <p style={{ fontSize: "11px", color: "#0D9488" }}>After</p>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "21px", color: "#0D9488" }}>+1.48</span>
              <span className="ml-2" style={{ fontSize: "16px", color: "#4B5563" }}>average understanding gain</span>
              <p style={{ fontSize: "13px", color: "#9CA3AF" }}>100% of students gained understanding</p>
            </div>
          </div>

          {/* ── 3. Standalone knockout stat ── */}
          <div style={{ marginTop: "55px", marginBottom: "55px" }}>
            <p className="font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "55px", color: "#111827" }}>
              93%
            </p>
            <p style={{ fontSize: "21px", lineHeight: 1.618, color: "#4B5563" }}>
              flipped from &ldquo;business is for other people&rdquo; to &ldquo;this could be me.&rdquo;
            </p>
          </div>

          {/* ── 4. Segment breakdown — the wow moment ── */}
          <p
            className="font-[family-name:var(--font-display)]"
            style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#0D9488" }}
          >
            By student segment
          </p>
          <h3
            className="mt-3 font-[family-name:var(--font-display)] font-semibold"
            style={{ fontSize: "21px", lineHeight: 1.618, color: "#111827" }}
          >
            The hardest-to-reach students moved the most
          </h3>

          <div className="mt-5 space-y-3">
            {[
              {
                label: "Low-motivation students",
                desc: "Students who said they had zero interest in business",
                stat: "+1.15",
                detail: "confidence gain. 100% flipped alien to accessible.",
              },
              {
                label: "Age 12 and under",
                desc: "Elementary students with no business exposure",
                stat: "+1.33",
                detail: "confidence gain. Highest of any age group.",
              },
              {
                label: "Slang and ESL speakers",
                desc: "Students who don't speak textbook English",
                stat: "+1.75",
                detail: "understanding gain. Largest of any segment.",
              },
            ].map((seg) => (
              <div
                key={seg.label}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8"
              >
                <div className="sm:flex-1 min-w-0">
                  <p className="font-semibold" style={{ fontSize: "16px", color: "#111827" }}>{seg.label}</p>
                  <p style={{ fontSize: "13px", color: "#9CA3AF" }}>{seg.desc}</p>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="font-[family-name:var(--font-display)] font-bold" style={{ fontSize: "21px", color: "#0D9488" }}>{seg.stat}</span>
                  <p style={{ fontSize: "13px", color: "#4B5563" }}>{seg.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── 5. Methodology footnote ── */}
          <p style={{ marginTop: "55px", fontSize: "13px", lineHeight: 1.618, color: "#9CA3AF" }}>
            60 AI personas across 3 motivation tiers. Synthesizer: Claude Sonnet. Independent judge: Claude Opus (cross-model, no self-preference bias). These are simulated upper bounds — but when the wizard works, it changes how students think about themselves.
          </p>

          {/* ── 6. Trust floor ── */}
          <div className="grid gap-4 sm:grid-cols-2" style={{ marginTop: "34px" }}>
            <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5">
              <p className="font-semibold" style={{ fontSize: "16px", color: "#111827" }}>38 fact-checked entries</p>
              <p className="mt-1" style={{ fontSize: "13px", color: "#4B5563" }}>
                Every claim in the knowledge base passes a verification test a 16-year-old could check in 60 seconds.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5">
              <p className="font-semibold" style={{ fontSize: "16px", color: "#111827" }}>Standards aligned</p>
              <p className="mt-1" style={{ fontSize: "13px", color: "#4B5563" }}>
                NBEA, Common Core, ISTE, Jump$tart. 22 lessons mapped. Full curriculum alignment available.
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: GUIDE — Teacher dashboard + Parent view
          ═══════════════════════════════════════════════════════════ */}
      {entered && activeTab === "guide" && (
      <section style={{ padding: "89px 34px" }}>
        <div className="mx-auto max-w-[1000px]">
          <h2
            className="font-[family-name:var(--font-display)] font-semibold text-center"
            style={{ fontSize: "34px", lineHeight: 1.618, color: "#111827" }}
          >
            Teachers see everything. Parents see enough.
          </h2>
          <div className="mx-auto mt-5 w-16 h-px" style={{ background: "#E5E7EB" }} />

          {/* Teacher Dashboard */}
          <div className="text-center" style={{ marginTop: "55px" }}>
            <h3 className="font-[family-name:var(--font-display)] font-semibold mb-6" style={{ fontSize: "24px", color: "#111827" }}>
              Teacher Dashboard
            </h3>
            <div className="mx-auto max-w-[700px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm text-left">
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
                      { name: ELSA.name, biz: ELSA_STUDIO.name, pct: 64, status: "On track", sColor: "#059669" },
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
              {/* Alert — #13: button instead of span */}
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
                <button type="button" className="rounded-lg px-3 py-1.5 hover:bg-white transition-colors" style={{ fontSize: "11px", fontWeight: 500, color: "#0D9488" }}>
                  Send Nudge
                </button>
              </div>
            </div>

          </div>

          {/* Parent View */}
          <div className="text-center" style={{ marginTop: "55px" }}>
            <h3 className="font-[family-name:var(--font-display)] font-semibold mb-2" style={{ fontSize: "24px", color: "#111827" }}>
              Parent View
            </h3>
            <p className="mb-6 mx-auto max-w-[500px]" style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.618 }}>
              Parents see their child&apos;s progress, business idea, and how to help — all behind a PIN. Designed for 60 seconds of context.
            </p>
            <div className="mx-auto max-w-[480px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-sm text-left">
              <div className="p-5 flex items-center gap-4 border-b border-[var(--border)]">
                <div className="relative" style={{ width: "55px", height: "55px" }}>
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-muted)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 52 * (14/22)} ${2 * Math.PI * 52 * (1 - 14/22)}`}
                      strokeLinecap="round" transform="rotate(-90 60 60)" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ fontSize: "13px", color: "#0D9488" }}>64%</span>
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
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: GRADUATE — Ceremony + CTA
          ═══════════════════════════════════════════════════════════ */}
      {entered && activeTab === "graduate" && (
      <>
      {/* Ceremony */}
      <section
        style={{ padding: "89px 34px", background: "var(--bg-subtle)" }}
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
            {ceremonyDone ? "That's what real students see." : "Every student who finishes all 22 lessons gets this."}
          </h2>
          <p className="mt-3" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
            {ceremonyDone
              ? "Confidence built on a moment they earned."
              : "It takes 90 seconds. Press play."}
          </p>
          <button
            onClick={() => {
              setCeremonyDone(false);
              setShowCeremony(true);
            }}
            className="mt-8 rounded-lg px-8 py-4 font-semibold text-white transition-colors hover:brightness-110"
            style={{
              fontSize: "16px",
              background: "#F59E0B",
              boxShadow: "0 0 21px rgba(245, 158, 11, 0.35), 0 0 55px rgba(245, 158, 11, 0.1)",
            }}
          >
            {ceremonyDone ? "Watch it again" : "Watch the graduation ceremony"}
          </button>
        </div>
      </section>

      {/* CTA */}
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
        <div className="flex flex-col sm:flex-row gap-4" style={{ marginTop: "55px" }}>
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--primary)] px-8 py-4 font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors text-center"
            style={{
              fontSize: "16px",
              boxShadow: "0 0 21px rgba(13, 148, 136, 0.35), 0 0 55px rgba(13, 148, 136, 0.1)",
            }}
          >
            Find your venture
          </Link>
          <Link
            href="/for-schools"
            className="rounded-lg border border-white/20 px-8 py-4 font-semibold transition-colors hover:bg-white/5 text-center"
            style={{ fontSize: "16px", color: "#F9FAFB" }}
          >
            Bring Adaptable to your district
          </Link>
        </div>
        <p style={{ marginTop: "89px", fontSize: "11px", color: "#9CA3AF" }}>
          Built for VentureLab&apos;s 155-country network &middot; By AJ Rogers, age 19
        </p>
      </section>
      </>
      )}

      {/* ═══ TAB: INVENTION MODE ═══ */}
      {entered && activeTab === "invention" && (
        <DemoInventionMode />
      )}

      {/* ═══ TAB: SUMMARY ═══ */}
      {entered && activeTab === "summary" && (
        <section style={{ padding: "89px 34px" }}>
          <div className="mx-auto max-w-[700px]">
            <h2 className="font-[family-name:var(--font-display)] text-center font-semibold mb-8" style={{ fontSize: "34px", color: "var(--text-primary)" }}>
              Summary
            </h2>
            <article
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 md:p-10"
              style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: 1.75, fontSize: "17px", color: "var(--text-primary)" }}
            >
              <h3 className="font-[family-name:var(--font-display)] font-semibold mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>A 1:1 AI Mentor for Every Student</h3>
              <p style={{ textIndent: "2em" }}>
                Adaptable delivers what no human-staffed program can: a <strong>dedicated AI mentor for every single student</strong>, available 24/7, personalized to their specific business idea, adapted to their grade level, and trained on real entrepreneurship frameworks. A single teacher with 30 students cannot provide 1:1 Socratic mentoring. Adaptable can. The platform replaces <strong>$2.5M-4M/year in equivalent human mentoring labor</strong> with a system that scales to unlimited students without degrading quality. Each student receives <strong>22 conversation-style lessons</strong> across six modules, with an AI that asks questions instead of lecturing, references their business by name in every response, and gates progression on demonstrated understanding rather than seat time.
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>The Ikigai Discovery Engine</h3>
              <p style={{ textIndent: "2em" }}>
                The hardest moment in a teenager&apos;s entrepreneurial journey is the blank page before the business exists. Adaptable solves it in <strong>under two minutes</strong>. An Ikigai-based wizard generates a specific, executable business idea grounded in what the student already loves and is already good at. This is not a random business generator. It is an <strong>eval-validated synthesis system</strong> that has been stress-tested against 60 synthetic student personas spanning coherent inputs, multi-track interests, slang and ESL voices, sarcastic refusals, and prompt injection attempts. The result: <strong>93% of simulated students</strong> flipped from &ldquo;business is something other people do&rdquo; to &ldquo;this could be me&rdquo; after a single Ikigai session.
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>K-12 Grade Adaptation</h3>
              <p style={{ textIndent: "2em" }}>
                A single platform that serves <strong>every grade level from kindergarten through 12th grade</strong>. Four tiers adapt vocabulary, sentence length, tone, examples, capital limits, and business scope: K-2 students get neighborhood-only ideas with zero startup cost and parent involvement at every step. High school students get full-range businesses with online components and up to $100 in startup capital. The AI mentor adjusts its entire personality and teaching approach per tier. <strong>No other entrepreneurship platform on the market covers K-12 in a single product.</strong>
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>AI Guide with Full Student Context</h3>
              <p style={{ textIndent: "2em" }}>
                Beyond the structured curriculum, every student gets an <strong>always-available AI Guide</strong> that knows their business, their Ikigai, their decisions across all completed lessons, their recent reflections, and their emotional state. The Guide uses <strong>hybrid semantic retrieval</strong> from a 38-entry fact-checked knowledge base, re-ranked per message so different questions surface different knowledge. It detects when a student has been stuck on a lesson for days and proactively offers help. It remembers what the student asked in previous sessions. It reads the Founder&apos;s Mirror reflections and adjusts its tone based on the student&apos;s emotional trajectory. <strong>No edtech chatbot on the market has this depth of student context.</strong>
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>The Founder&apos;s Mirror</h3>
              <p style={{ textIndent: "2em" }}>
                Entrepreneurship education that ignores the inner game produces students who know what a business plan is but don&apos;t believe they can build one. The Founder&apos;s Mirror is a <strong>private reflection layer</strong> that shows students their own behavior back to them after every lesson. One observation and one question. Maximum 40 words. No advice. No praise. No &ldquo;failure is growth&rdquo; platitudes. Over 22 lessons, those reflections accumulate into a <strong>Founder&apos;s Log</strong> that no teacher sees, no algorithm analyzes, and no leaderboard ranks. This is the student&apos;s private record of who they were becoming while they were building. <strong>No competitor has anything like this.</strong>
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>Invention Mode for Events</h3>
              <p style={{ textIndent: "2em" }}>
                For large-scale events, Adaptable includes a completely separate <strong>Invention Mode</strong> that replaces the business curriculum with a five-circle discovery wizard designed for group formation. A <strong>five-step grouping algorithm</strong> sorts hundreds of students into balanced teams optimized across invention category, thinking archetype, knowledge diversity, ambition scale, and communication style. The admin dashboard provides real-time completion tracking, archetype distribution breakdowns, a live algorithm terminal replay, manual student overrides, group reveal controls, and <strong>print-ready outputs</strong> for wall rosters and door handout slips. This is a <strong>complete event facilitation system</strong> that would cost $50K-100K to build as a standalone product.
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>Enterprise-Grade Safety</h3>
              <p style={{ textIndent: "2em" }}>
                Every student input passes through <strong>three safety layers</strong>: regex-based content moderation covering profanity and threats in 12+ languages, ML-based moderation via Claude Haiku that catches subtle toxicity and coded language, and crisis detection that identifies self-harm signals, suicidal ideation, and abuse indicators. Crisis signals fire <strong>real-time teacher alerts with email notification</strong>. The student is never abandoned — they see a supportive response with 988 Lifeline, Crisis Text Line, and Trevor Project resources while the teacher is notified instantly. <strong>COPPA compliance</strong> is built in with age-gated parental consent, token-hashed verification, and role-based data access. Output moderation filters every AI response before it reaches the student. <strong>This safety infrastructure alone would take a funded team 6+ months to build.</strong>
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>Factual Floor &amp; Knowledge Integrity</h3>
              <p style={{ textIndent: "2em" }}>
                The AI mentor draws from <strong>38 fact-checked knowledge base entries</strong> covering Lean Canvas, Jobs-to-be-Done, Mom Test, Golden Circle, Build-Measure-Learn, value-based pricing, and more. Every entry passes the <strong>Adaptable Factual Floor</strong>: any claim a student could see must be traceable to a source a 16-year-old could independently verify in 60 seconds. Zero invented statistics. Zero fabricated case studies. Zero misattributed quotes. Retrieval is hybrid: tag-based candidate fetch plus per-message semantic re-ranking via pgvector. A student asking about pricing gets pricing knowledge, not generic content. <strong>22 of 22 lessons have verified context with at least 3 topically matched entries each.</strong>
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>Teacher &amp; Parent Tools</h3>
              <p style={{ textIndent: "2em" }}>
                Teachers get a <strong>real-time dashboard</strong> with student progress tracking, smart alerts for stuck and inactive students, one-click nudges, live activity feeds, and follow-up management. The system automatically detects when students are struggling and surfaces alerts before the teacher would notice. Parents get a <strong>PIN-protected view</strong> designed for 60 seconds of context: their child&apos;s progress, business idea, Ikigai, and specific guidance on how to help. The business plan <strong>assembles itself</strong> from student decisions across all 22 lessons — students never &ldquo;write a business plan,&rdquo; they build one through conversation. All 22 lessons are mapped to <strong>NBEA, Common Core, ISTE, and Jump$tart standards</strong> with full curriculum alignment documentation available for procurement committees.
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>Eval-Driven Quality Assurance</h3>
              <p style={{ textIndent: "2em" }}>
                Every prompt change runs through a <strong>regression test suite</strong> before reaching a single student. 60 synthetic student personas across 3 motivation levels (low, medium, high), spanning coherent cases, multi-track interests, slang and ESL voices, age 12 and 18 boundaries, and students who already run businesses. Synthesizer: Claude Sonnet. Judge: Claude Opus. <strong>Cross-model evaluation eliminates self-preference bias.</strong> The eval system tracks self-confidence gain (+1.09 average on a 5-point scale), understanding gain (+1.48), alien-to-accessible flip rate (93%), and RAG faithfulness (0.83, zero low-faithfulness turns). The students who needed it most — low-motivation, youngest, ESL speakers — <strong>showed the largest gains</strong>. This level of measurement infrastructure is what well-funded AI companies build after Series A. Adaptable has it at launch.
              </p>

              <h3 className="font-[family-name:var(--font-display)] font-semibold mt-8 mb-3" style={{ fontSize: "20px", fontFamily: "var(--font-display, system-ui)" }}>The Mission</h3>
              <p style={{ textIndent: "2em" }}>
                The mission is <strong>transformation, not education</strong>. A kid walks in thinking entrepreneurship is something other people do, and walks out with a business, a private record of their own growth, and the confidence that comes from building something real. Adaptable is not a course. It is not a chatbot. It is a <strong>complete AI-native venture studio</strong> that delivers personalized 1:1 mentoring at a scale no human program can match, with safety infrastructure that exceeds industry standards, measurement rigor that proves it works, and a product experience that treats teenagers as real builders.
              </p>

              <div className="pt-4 mt-6 border-t border-[var(--border)]">
                <p className="text-sm italic" style={{ color: "var(--text-secondary)", fontFamily: '"Times New Roman", Times, serif' }}>
                  — AJ Rogers, founder, age 19
                </p>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* ── Full-screen DIY wizard overlay ── */}
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

      {/* DIY result */}
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
            <div className="text-center" style={{ marginTop: "55px" }}>
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

    </main>
  );
}

/**
 * Golden Ratio Ikigai Diagram — exact copy from /for-schools page.
 */
function GoldenIkigai() {
  return (
    <div
      className="relative mx-auto w-full max-w-[480px]"
      style={{ aspectRatio: "1 / 1" }}
      role="img"
      aria-label="Ikigai diagram: four overlapping circles representing what you love, what you're good at, what the world needs, and what you can be paid for, with your business at the center"
    >
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        viewBox="0 0 100 100"
        style={{ zIndex: 1 }}
      >
        <circle cx="50" cy="30.901" r="20" fill="#F5E642" opacity="0.55" className="ikigai-hero-circle" />
        <circle cx="30.901" cy="50" r="20" fill="#A8DB5A" opacity="0.55" className="ikigai-hero-circle" />
        <circle cx="69.099" cy="50" r="20" fill="#F4A79D" opacity="0.55" className="ikigai-hero-circle" />
        <circle cx="50" cy="69.099" r="20" fill="#6DD5D0" opacity="0.55" className="ikigai-hero-circle" />

        <line x1="31.26" y1="23.92" x2="26" y2="22" stroke="#C4B320" strokeWidth="0.5" opacity="0.55" />
        <circle cx="31.26" cy="23.92" r="1.05" fill="#C4B320" opacity="0.7" />
        <line x1="21.25" y1="67.52" x2="17.7" y2="73.9" stroke="#7AAD3A" strokeWidth="0.5" opacity="0.55" />
        <circle cx="21.25" cy="67.52" r="1.05" fill="#7AAD3A" opacity="0.7" />
        <line x1="78.64" y1="32.42" x2="82.1" y2="26.1" stroke="#D4796E" strokeWidth="0.5" opacity="0.55" />
        <circle cx="78.64" cy="32.42" r="1.05" fill="#D4796E" opacity="0.7" />
        <line x1="68.74" y1="76.08" x2="72" y2="77.3" stroke="#4DBAB4" strokeWidth="0.5" opacity="0.55" />
        <circle cx="68.74" cy="76.08" r="1.05" fill="#4DBAB4" opacity="0.7" />
      </svg>

      <div
        className="absolute rounded-full pointer-events-none ikigai-hero-center"
        style={{
          width: "15.28%", height: "15.28%",
          left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, #4A6741 40%, #8B9E6A 100%)",
          boxShadow: "0 0 20px rgba(74, 103, 65, 0.3)", zIndex: 5,
        }}
      />

      <div
        className="absolute pointer-events-none flex flex-col items-center justify-center ikigai-hero-center"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 6 }}
      >
        <span className="font-[family-name:var(--font-display)] text-[9.5px] font-extrabold text-white/90 tracking-[0.15em] leading-tight">YOUR</span>
        <span className="font-[family-name:var(--font-display)] text-[9.5px] font-extrabold text-white/90 tracking-[0.15em] leading-tight">BUSINESS</span>
      </div>

      <div className="absolute font-[family-name:var(--font-display)] text-[17px] font-bold text-[var(--text-primary)] leading-tight pointer-events-none ikigai-hero-label" style={{ top: "16.5%", left: "5%" }}>
        What you love
      </div>
      <div className="absolute font-[family-name:var(--font-display)] text-[17px] font-bold text-[var(--text-primary)] leading-tight pointer-events-none ikigai-hero-label" style={{ bottom: "14.5%", left: "5%" }}>
        What you&apos;re<br />good at
      </div>
      <div className="absolute font-[family-name:var(--font-display)] text-[17px] font-bold text-[var(--text-primary)] leading-tight pointer-events-none ikigai-hero-label" style={{ top: "14.5%", right: "5%", textAlign: "right" }}>
        What the world<br />needs
      </div>
      <div className="absolute font-[family-name:var(--font-display)] text-[17px] font-bold text-[var(--text-primary)] leading-tight pointer-events-none ikigai-hero-label" style={{ bottom: "14.5%", right: "5%", textAlign: "right" }}>
        What you can<br />be paid for
      </div>
    </div>
  );
}
