"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import IkigaiDiagram, { STEPS, type IkigaiStep } from "./IkigaiDiagram";
import StepContent from "./StepContent";
import type { IkigaiDraft, BusinessIdea } from "@/lib/types";

const MAX_REGENS = 5;

/*
 * Two states:
 *   1. DIAGRAM — all 4 circles visible, click any to fill it
 *   2. FULL-SCREEN — circle's color fills the screen, title + entries
 *
 * After all 4 done → center reveals business idea with confetti.
 */

const MOCK_SUGGESTIONS: Record<number, string[][]> = {
  1: [
    ["Animals", "Music", "Technology", "Art & Design", "Sports", "Cooking", "Gaming", "Fashion"],
    ["Photography", "Writing", "Science", "Nature", "Building Things", "Social Media", "Dance", "Helping People"],
  ],
  2: [
    ["Good with animals", "Tech-savvy", "Creative eye", "Patient teacher", "Fast learner", "Organized"],
    ["Public speaking", "Problem solving", "Artistic", "Good listener", "Detail-oriented", "Social skills"],
  ],
  3: [
    ["Pet care for busy families", "Tech help for seniors", "Affordable tutoring", "Eco-friendly products", "Mental health awareness", "Local food access"],
    ["After-school activities", "Small business websites", "Community gardens", "Homework help", "Fitness coaching", "Event planning"],
  ],
  4: [
    ["Charge per visit", "Charge by the hour", "Sell each item", "Monthly package", "Sell downloads", "Take a cut of each sale"],
    ["Teach classes or workshops", "Earn from ads or sponsors", "Offer free + paid premium", "Sell custom orders", "Subscription box", "Tips and donations"],
  ],
};

function getMockSuggestions(step: number, regen: number): string[] {
  const pool = MOCK_SUGGESTIONS[step] ?? [[]];
  return pool[regen % pool.length];
}

function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function generateMockBusinessIdea(draft: IkigaiDraft, name: string): BusinessIdea {
  const passion = titleCase((draft.passions ?? [])[0] ?? "Creativity");
  const need = titleCase((draft.needs ?? [])[0] ?? "Helping Others");
  const monetization = (draft.monetization ?? "per-session service fee").toLowerCase();
  return {
    niche: titleCase(`${passion} for ${need}`),
    name: `${name}'s ${titleCase(passion)} Business`,
    target_customer: `People who need help with ${need.toLowerCase()}`,
    revenue_model: `Earn money through ${monetization}, building a client base in your community and online`,
  };
}

interface IkigaiWizardProps {
  initialDraft: IkigaiDraft | null;
  initialName?: string;
  isAdmin?: boolean;
  /**
   * Demo mode: visitor on /demo who doesn't have an account. Skips the
   * saveDraft DB writes (no auth) and replaces the "I'm in" → /onboarding/ready
   * navigation with a sign-up CTA modal. Synthesis still uses the real AI
   * (rate-limited per-IP server-side).
   */
  demoMode?: boolean;
  onDemoComplete?: (idea: BusinessIdea) => void;
}

export default function IkigaiWizard({ initialDraft, initialName, isAdmin, demoMode, onDemoComplete }: IkigaiWizardProps) {
  const router = useRouter();

  const [studentName, setStudentName] = useState(initialName ?? "");
  const [nameConfirmed, setNameConfirmed] = useState(!!initialName);
  const [nameExiting, setNameExiting] = useState(false);
  const [ikigaiIntroSeen, setIkigaiIntroSeen] = useState(!!initialName);
  const [ikigaiEntering, setIkigaiEntering] = useState(false);
  const [ikigaiExiting, setIkigaiExiting] = useState(false);
  const [diagramEntering, setDiagramEntering] = useState(!!initialName);
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [skipIdea, setSkipIdea] = useState("");
  const [skipValidating, setSkipValidating] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<IkigaiStep | null>(null);
  const [draft, setDraft] = useState<IkigaiDraft>(initialDraft ?? { step: 1 });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    const set = new Set<number>();
    if (initialDraft) {
      if (initialDraft.passions?.length) set.add(1);
      if (initialDraft.skills?.length) set.add(2);
      if (initialDraft.needs?.length) set.add(3);
      if (initialDraft.monetization) set.add(4);
    }
    return set;
  });
  const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
  const [selectedItems, setSelectedItems] = useState<Record<number, string[]>>(() => {
    const items: Record<number, string[]> = {};
    if (initialDraft?.passions) items[1] = initialDraft.passions;
    if (initialDraft?.skills) items[2] = initialDraft.skills;
    if (initialDraft?.needs) items[3] = initialDraft.needs;
    if (initialDraft?.monetization) items[4] = [initialDraft.monetization];
    return items;
  });
  const [regenCounts, setRegenCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  // The student's editable business name. Initialized to the AI's placeholder
  // (`{first}'s {category}`) on synthesis, but the student can rename it to
  // anything they want before clicking "I'm in". Reset on every re-synthesize.
  const [editableName, setEditableName] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [revealPhase, setRevealPhase] = useState<"none" | "dimming" | "card" | "ready">("none");
  const [error, setError] = useState<string | null>(null);

  // Sync editableName to the AI's placeholder name whenever a new businessIdea
  // arrives (initial synth + every re-synthesize). This is the (2b) behavior:
  // re-synthesize resets the name back to the placeholder for the new niche.
  useEffect(() => {
    if (businessIdea?.name) {
      setEditableName(businessIdea.name);
    }
  }, [businessIdea]);

  // When the reveal hits "ready" on desktop, focus the name input and place
  // the cursor at the end so the I-beam blinks at the end of the placeholder
  // — visual hint that the student can rename it. We skip mobile auto-focus
  // because popping the keyboard during a celebratory reveal is jarring.
  useEffect(() => {
    if (revealPhase !== "ready") return;
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) return;
    const input = nameInputRef.current;
    if (!input) return;
    // Tiny delay so the focus lands AFTER the reveal animation settles
    const t = setTimeout(() => {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }, 200);
    return () => clearTimeout(t);
  }, [revealPhase]);

  // Auto-resume synthesis on mount if the student has a complete draft but
  // no business_idea yet. This is the "Aaron case" — student finished the
  // wizard, draft was saved, but the reveal/confirm step didn't complete (page
  // closed, network died, etc.). When they come back to /onboarding, the
  // wizard would otherwise show "4/4 complete" with no card and no continue
  // option. Auto-firing the synth picks up exactly where they left off.
  useEffect(() => {
    // Only run once on mount, only in non-demo mode, only when:
    // - all 4 steps have data
    // - we're not already synthesizing
    // - we don't already have a businessIdea
    // - reveal phase hasn't started yet (we're not mid-animation)
    if (demoMode) return;
    if (synthesizing) return;
    if (businessIdea) return;
    if (revealPhase !== "none") return;
    const draftComplete =
      !!draft.passions?.length &&
      !!draft.skills?.length &&
      !!draft.needs?.length &&
      !!draft.monetization;
    if (!draftComplete) return;

    // Don't fight an active step view
    if (activeStep) return;

    let cancelled = false;
    (async () => {
      setSynthesizing(true);
      let idea: BusinessIdea | null = null;
      try {
        const { synthesizeBusinessIdea } = await import("@/app/(app)/onboarding/actions");
        const result = await synthesizeBusinessIdea(draft);
        if (cancelled) return;
        idea = result.idea;
        if (!idea && result.error) setError(result.error);
      } catch { /* preview mode */ }
      if (cancelled) return;

      if (!idea) {
        idea = generateMockBusinessIdea(draft, studentName);
      }

      setSynthesizing(false);
      setBusinessIdea(idea);
      setTimeout(() => setRevealPhase("dimming"), 200);
      setTimeout(() => setRevealPhase("card"), 1200);
      setTimeout(() => setRevealPhase("ready"), 2000);
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally only runs once on mount — we don't want this to re-fire
    // when the user's local state changes. The dependency array is empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load suggestions for a step
  async function loadSuggestions(step: IkigaiStep, regen = 0) {
    if (!regen && suggestions[step]?.length) return;
    setLoading(true);

    try {
      const { generateSuggestions } = await import("@/app/(app)/onboarding/actions");
      const result = await generateSuggestions(step, draft);
      if (result.suggestions.length > 0) {
        setSuggestions((prev) => ({ ...prev, [step]: result.suggestions }));
        setLoading(false);
        return;
      }
    } catch { /* preview mode */ }

    await new Promise((r) => setTimeout(r, 400));
    setSuggestions((prev) => ({ ...prev, [step]: getMockSuggestions(step, regen) }));
    setLoading(false);
  }

  // Click a circle → go full-screen
  function handleStepClick(step: IkigaiStep) {
    setActiveStep(step);
    loadSuggestions(step);
  }

  // Done with a step → back to diagram
  async function handleDone() {
    if (!activeStep) return;
    const items = selectedItems[activeStep] ?? [];
    if (items.length === 0) return;

    // Update draft
    const newDraft = { ...draft, step: activeStep };
    const keyMap: Record<IkigaiStep, string> = { 1: "passions", 2: "skills", 3: "needs", 4: "monetization" };
    const key = keyMap[activeStep];
    if (key === "monetization") {
      newDraft.monetization = items.join(", ");
    } else {
      (newDraft as Record<string, unknown>)[key] = items;
    }
    setDraft(newDraft);

    // Mark completed
    const newCompleted = new Set(completedSteps);
    newCompleted.add(activeStep);
    setCompletedSteps(newCompleted);

    // Save draft (non-blocking) — skip in demo mode (no auth, no DB)
    if (!demoMode) {
      try {
        const { saveDraft } = await import("@/app/(app)/onboarding/actions");
        saveDraft(newDraft);
      } catch { /* preview mode */ }
    }

    // Back to diagram
    setActiveStep(null);

    // All 4 done? → synthesize
    if (newCompleted.size === 4) {
      setSynthesizing(true);

      let idea: BusinessIdea | null = null;
      try {
        const { synthesizeBusinessIdea } = await import("@/app/(app)/onboarding/actions");
        const result = await synthesizeBusinessIdea(
          newDraft,
          demoMode ? { demoMode: true, firstName: studentName } : undefined
        );
        idea = result.idea;
        // Surface rate-limit / cap errors to the visitor
        if (!idea && result.error && demoMode) {
          setError(result.error);
        }
      } catch { /* preview mode */ }

      if (!idea) {
        await new Promise((r) => setTimeout(r, 1200));
        idea = generateMockBusinessIdea(newDraft, studentName);
      }

      setSynthesizing(false);
      setBusinessIdea(idea);
      // Phase 1: dim the diagram
      setTimeout(() => setRevealPhase("dimming"), 200);
      // Phase 2: show the card
      setTimeout(() => setRevealPhase("card"), 1200);
      // Phase 3: show the buttons
      setTimeout(() => setRevealPhase("ready"), 2000);
    }
  }

  // Back to diagram without saving
  function handleBack() {
    setActiveStep(null);
  }

  // Regenerate suggestions
  async function handleRegenerate() {
    if (!activeStep) return;
    const count = (regenCounts[activeStep] ?? 0) + 1;
    if (count > MAX_REGENS) return;
    setRegenCounts((prev) => ({ ...prev, [activeStep]: count }));
    setSuggestions((prev) => ({ ...prev, [activeStep]: [] }));
    await loadSuggestions(activeStep, count);
  }

  function handleCustomAdd(item: string) {
    if (!activeStep) return;
    const current = selectedItems[activeStep] ?? [];
    setSelectedItems((prev) => ({ ...prev, [activeStep]: [...current, item] }));
  }

  async function handleConfirm() {
    if (!businessIdea) return;
    setError(null);

    // Use the student's edited name if they typed one, otherwise fall back
    // to the AI placeholder. Trim and validate before sending — empty or
    // whitespace-only is rejected with an inline error so the student knows
    // they need to type something.
    const finalName = (editableName || businessIdea.name || "").trim();
    if (!finalName) {
      setError("Give your venture a name first — even just a placeholder works.");
      nameInputRef.current?.focus();
      return;
    }
    if (finalName.length > 60) {
      setError("That name is too long — keep it under 60 characters.");
      nameInputRef.current?.focus();
      return;
    }
    const ideaToSave: BusinessIdea = { ...businessIdea, name: finalName };

    // Demo mode: don't write to DB. Hand the idea up to the parent component
    // (DemoShowcase) so it can render the sign-up CTA with the visitor's
    // venture rendered above it.
    if (demoMode) {
      onDemoComplete?.(ideaToSave);
      return;
    }

    try {
      const { confirmBusinessIdea } = await import("@/app/(app)/onboarding/actions");
      const result = await confirmBusinessIdea(ideaToSave, draft);
      if (result.success) {
        router.push("/onboarding/ready");
        return;
      }
      // Server action returned an error — surface it instead of silently
      // navigating to /onboarding/ready, which would bounce back to the
      // wizard and look like a confusing restart.
      if (result.error) {
        setError(result.error);
        return;
      }
      setError("Couldn't save your business idea. Please try again — if this keeps happening, refresh the page.");
    } catch (e) {
      // Network failure / preview mode — distinguish the two. In a real
      // browser context (not preview), surface the error. In preview mode
      // (no Supabase), the import itself succeeds and the action call would
      // throw a server-only error — fall through to /onboarding/ready so
      // the demo path still works.
      const isPreview =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.pathname.startsWith("/demo"));
      if (isPreview) {
        router.push("/onboarding/ready");
        return;
      }
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(`Couldn't save your business idea: ${msg}. Please try again.`);
    }
  }

  async function handleResynthesize() {
    setRevealPhase("none");
    setBusinessIdea(null);
    setSynthesizing(true);

    let idea: BusinessIdea | null = null;
    try {
      const { synthesizeBusinessIdea } = await import("@/app/(app)/onboarding/actions");
      const result = await synthesizeBusinessIdea(
        draft,
        demoMode ? { demoMode: true, firstName: studentName } : undefined
      );
      idea = result.idea;
      if (!idea && result.error && demoMode) setError(result.error);
    } catch { /* preview mode */ }

    if (!idea) {
      await new Promise((r) => setTimeout(r, 1200));
      idea = generateMockBusinessIdea(draft, studentName);
    }

    setSynthesizing(false);
    setBusinessIdea(idea);
    setTimeout(() => setRevealPhase("dimming"), 200);
    setTimeout(() => setRevealPhase("card"), 1200);
    setTimeout(() => setRevealPhase("ready"), 2000);
  }

  function handleStartOver() {
    setActiveStep(null);
    setDraft({ step: 1 });
    setCompletedSteps(new Set());
    setSuggestions({});
    setSelectedItems({});
    setRegenCounts({});
    setRevealPhase("none");
    setBusinessIdea(null);
    setError(null);
  }

  const activeStepConfig = activeStep ? STEPS.find((s) => s.id === activeStep) : null;

  // Validate and submit a pre-existing business idea
  async function handleSkipSubmit() {
    if (!skipIdea.trim() || skipValidating) return;
    setSkipError(null);
    setSkipValidating(true);

    try {
      const { validateAndCreateBusinessIdea } = await import("@/app/(app)/onboarding/skip-actions");
      const result = await validateAndCreateBusinessIdea(skipIdea.trim());

      if (result.idea) {
        router.push("/onboarding/ready");
      } else {
        setSkipError(result.error ?? "That doesn't seem like a real business idea.");
      }
    } catch {
      setSkipError("Couldn't validate your idea right now. Try the Ikigai wizard instead.");
    }

    setSkipValidating(false);
  }

  const [nameError, setNameError] = useState<string | null>(null);

  // Save name to profile when confirmed
  async function handleNameConfirm() {
    if (!studentName.trim()) return;

    // Moderate name
    const { moderateName } = await import("@/lib/content-moderation");
    const nameCheck = moderateName(studentName);
    if (!nameCheck.safe) {
      setNameError(nameCheck.reason ?? "Please enter a valid name.");
      return;
    }
    setNameError(null);
    setNameExiting(true);
    // Fade out name screen, then fade in dictionary
    setTimeout(() => {
      setNameConfirmed(true);
      setIkigaiIntroSeen(false);
      // Double rAF ensures the browser paints opacity:0 before transitioning to 1
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIkigaiEntering(true));
      });
    }, 800);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ full_name: studentName.trim() })
          .eq("id", user.id);
      }
    } catch {
      // Preview mode, no-op
    }
  }

  return (
    <>
      {/* NAME INPUT — shown before the diagram */}
      {!nameConfirmed && (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
          style={{
            opacity: nameExiting ? 0 : 1,
            transition: "opacity 0.8s ease-in-out",
          }}
        >
          <div className="max-w-md w-full text-center">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
              What's your name?
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              We'll use this to personalize your business idea.
            </p>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && studentName.trim() && handleNameConfirm()}
              placeholder="Your first name"
              maxLength={50}
              autoFocus
              className="mt-6 w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-center text-lg outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 font-[family-name:var(--font-display)]"
            />
            {nameError && (
              <p className="mt-2 text-sm text-[var(--error)]">{nameError}</p>
            )}
            <button
              onClick={handleNameConfirm}
              disabled={!studentName.trim()}
              className="mt-4 w-full rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* IKIGAI DICTIONARY INTRO */}
      {nameConfirmed && !ikigaiIntroSeen && (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
          style={{
            opacity: ikigaiExiting ? 0 : ikigaiEntering ? 1 : 0,
            transition: "opacity 0.8s ease-in-out",
          }}
        >
          <div className="max-w-xl w-full">
            {/* Dictionary card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-10 sm:p-14">
              {/* Word */}
              <h1
                className="text-5xl sm:text-6xl tracking-tight text-[var(--text-primary)]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, fontStyle: "italic" }}
              >
                ikigai
              </h1>

              {/* Pronunciation */}
              <p className="mt-3 text-base text-[var(--text-muted)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                /ee·kee·guy/ &nbsp;
                <span className="italic">noun</span> &nbsp;
                <span className="text-sm">Japanese</span>
              </p>

              {/* Divider */}
              <div className="mt-5 mb-5 border-t border-[var(--border)]" />

              {/* Definition */}
              <p className="text-lg text-[var(--text-primary)] leading-relaxed" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                A reason for being; the intersection of what you <em>love</em>, what you&apos;re <em>good at</em>,
                what the world <em>needs</em>, and what you can be <em>paid for</em>.
              </p>

              {/* Origin */}
              <p className="mt-6 text-sm text-[var(--text-muted)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                <span className="font-semibold">Origin: </span>Okinawa, Japan — where the concept is credited as one reason
                for the island&apos;s unusually long life expectancy.
              </p>
            </div>

            {/* CTA below the card */}
            <div className="mt-8 text-center">
              <p className="text-base text-[var(--text-secondary)] mb-5">
                We&apos;re going to find yours, {studentName.split(" ")[0]}.
              </p>
              <button
                onClick={() => {
                  setIkigaiExiting(true);
                  setTimeout(() => {
                    setIkigaiIntroSeen(true);
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => setDiagramEntering(true));
                    });
                  }, 800);
                }}
                className="rounded-lg bg-[var(--primary)] px-10 py-3.5 text-base font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
              >
                Let&apos;s go
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN STEP VIEW */}
      {nameConfirmed && ikigaiIntroSeen && activeStep && activeStepConfig && (
        <StepContent
          step={activeStepConfig}
          suggestions={suggestions[activeStep] ?? []}
          selectedItems={selectedItems[activeStep] ?? []}
          onSelect={(items) => setSelectedItems((prev) => ({ ...prev, [activeStep]: items }))}
          onCustomAdd={handleCustomAdd}
          onRegenerate={handleRegenerate}
          onDone={handleDone}
          onBack={handleBack}
          loading={loading}
          regenCount={regenCounts[activeStep] ?? 0}
          maxRegens={MAX_REGENS}
        />
      )}

      {/* DIAGRAM VIEW */}
      {nameConfirmed && ikigaiIntroSeen && !activeStep && (
        <div
          className={`relative min-h-screen flex flex-col items-center px-4 py-8 ${
            // Pre-reveal: center the diagram vertically and hide overflow
            // (the diagram is fixed-size and looks best centered).
            // Reveal phases: top-align so the card flows naturally below the
            // heading and the page scrolls if the card is taller than the
            // viewport. This is the fix for mobile users getting stuck with
            // the "I'm in" button below the fold.
            revealPhase === "none" ? "justify-center overflow-hidden" : "justify-start"
          }`}
          style={{
            opacity: diagramEntering ? 1 : 0,
            transition: "opacity 1s ease-in-out",
          }}
        >
          <div className="mb-6 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
              Discover Your Business
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {synthesizing
                ? "Putting the pieces together..."
                : revealPhase === "dimming"
                ? "Here's what we found."
                : revealPhase !== "none"
                ? ""
                : completedSteps.size === 0
                ? "Click any circle to start exploring."
                : completedSteps.size < 4
                ? `${completedSteps.size}/4 complete. Click a circle to continue.`
                : ""}
            </p>

            {/* Skip path — elevated to a proper button */}
            {completedSteps.size === 0 && revealPhase === "none" && !synthesizing && !showSkipForm && (
              <button
                onClick={() => setShowSkipForm(true)}
                className="mt-3 rounded-full border border-[var(--border-strong)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                I already know what I want to build →
              </button>
            )}
          </div>

          {/* Diagram — only rendered before the reveal. Once revealPhase fires
              we hide it completely so the card can claim the full vertical
              space and the page scrolls naturally on small screens. */}
          {revealPhase === "none" && (
            <div className="relative w-full max-w-[500px]">
              <IkigaiDiagram
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
                showReveal={false}
                businessName={undefined}
              />
            </div>
          )}

          {/* Personal Card reveal — in-flow (not absolute) so it pushes the
              parent's scroll height. The buttons at the bottom of the card
              are reachable on any device. */}
          {revealPhase !== "none" && businessIdea && (
            <div
              className="relative w-full px-4 pb-12"
              style={{
                maxWidth: "420px",
                opacity: revealPhase === "card" || revealPhase === "ready" ? 1 : 0,
                transform: revealPhase === "card" || revealPhase === "ready" ? "translateY(0)" : "translateY(20px)",
                transition: "all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              <div
                className="ikigai-reveal-card rounded-xl bg-[var(--bg)] border border-[var(--border)]"
                style={{ position: "relative", overflow: "visible" }}
              >
                {/* Three breathing glow shells */}
                <div className="ikigai-reveal-glow ikigai-reveal-glow-outer" />
                <div className="ikigai-reveal-glow ikigai-reveal-glow-mid" />
                <div className="ikigai-reveal-glow ikigai-reveal-glow-inner" />

                {/* Gradient bar glow + warm wash */}
                <div className="ikigai-reveal-bar-glow" />
                <div className="ikigai-reveal-gradient-wash" />

                {/* Aura particles — sparks from all edges */}
                <div className="ikigai-reveal-particles">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const colors = ["#F5E642", "#A8DB5A", "#F4A79D", "#6DD5D0"];
                    const color = colors[i % 4];
                    const size = 4 + Math.random() * 5;
                    const edge = i % 4;
                    const pos = edge === 0
                      ? { left: `${-3 + Math.random() * 6}%`, top: `${5 + Math.random() * 90}%` }
                      : edge === 1
                      ? { left: `${97 + Math.random() * 6}%`, top: `${5 + Math.random() * 90}%` }
                      : edge === 2
                      ? { left: `${10 + Math.random() * 80}%`, top: `${-3 + Math.random() * 6}%` }
                      : { left: `${10 + Math.random() * 80}%`, top: `${97 + Math.random() * 6}%` };
                    return (
                      <div
                        key={i}
                        className="ikigai-reveal-particle"
                        style={{
                          ...pos,
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: color,
                          boxShadow: `0 0 ${size * 2}px ${color}66, 0 0 ${size * 4}px ${color}33`,
                          animationDelay: `${Math.random() * 4}s`,
                          animationDuration: `${2 + Math.random() * 2.618}s`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Ikigai gradient bar */}
                <div className="flex h-1.5" style={{ position: "relative", zIndex: 2, borderRadius: "12px 12px 0 0", overflow: "hidden" }}>
                  <div className="flex-1" style={{ backgroundColor: "var(--ikigai-love)" }} />
                  <div className="flex-1" style={{ backgroundColor: "var(--ikigai-skills)" }} />
                  <div className="flex-1" style={{ backgroundColor: "var(--ikigai-needs)" }} />
                  <div className="flex-1" style={{ backgroundColor: "var(--ikigai-money)" }} />
                </div>

                <div className="p-6 text-left">
                  <p className="text-sm font-medium text-[var(--text-muted)] tracking-wide">
                    Your venture (tap to rename)
                  </p>
                  {/* Editable business name. The AI provides a placeholder
                      ({first}'s {category}) and the student can rename it to
                      anything they want before clicking "I'm in". The input is
                      styled to look like the original h2 — same font, same
                      size, same weight — but with a subtle dashed underline
                      that thickens on focus, signaling editability without
                      shouting "form field". On desktop the input auto-focuses
                      with the cursor at the end so the I-beam blinks at the
                      end of the placeholder name as a visual hint. */}
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={editableName}
                    onChange={(e) => setEditableName(e.target.value)}
                    maxLength={60}
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Business name (editable)"
                    className="ikigai-name-input mt-2 w-full bg-transparent font-[family-name:var(--font-display)] text-[32px] font-bold leading-tight text-[var(--text-primary)] outline-none border-b-2 border-dashed border-[var(--border)] focus:border-[var(--primary)] focus:border-solid transition-colors px-0 py-0.5"
                  />
                  <p className="mt-2 text-base text-[var(--text-secondary)]">
                    {businessIdea.niche}
                  </p>

                  {businessIdea.why_this_fits && (
                    <div className="mt-5 pt-5 border-t border-[var(--border)]">
                      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Why this fits you
                      </p>
                      <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                        {businessIdea.why_this_fits}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                      How you earn
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {businessIdea.revenue_model}
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons — outside the card, stacked */}
              <div
                className="mt-6 flex flex-col items-center gap-3"
                style={{
                  opacity: revealPhase === "ready" ? 1 : 0,
                  transition: "opacity 400ms ease-out",
                }}
              >
                <button
                  onClick={handleConfirm}
                  className="w-full rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-light)] active:bg-[var(--primary-dark)] py-3.5 text-base font-semibold text-white transition-colors"
                >
                  I&apos;m in
                </button>
                <button
                  onClick={handleResynthesize}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:underline"
                >
                  Show me something else
                </button>
                <button
                  onClick={handleStartOver}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
                >
                  Change my answers
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-[var(--error)]">
              {error}
              <button onClick={() => setError(null)} className="ml-2 font-medium underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Reset button */}
          {(completedSteps.size > 0 || revealPhase !== "none") && (
            <button
              onClick={() => {
                if (confirm("This will clear all your answers and start over. Are you sure?")) {
                  window.location.href = "/onboarding?reset=true";
                }
              }}
              className="mt-8 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
            >
              Reset and start over
            </button>
          )}

          {/* Skip form — already have a business idea */}
          {showSkipForm && revealPhase === "none" && !synthesizing && (
            <div className="mt-6">{(
                <div className="max-w-md w-full mx-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
                    What's your business idea?
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Describe what you'd sell or offer. We'll set up your venture studio around it.
                  </p>
                  <textarea
                    value={skipIdea}
                    onChange={(e) => { setSkipIdea(e.target.value); setSkipError(null); }}
                    placeholder="e.g., I want to open a nail salon that specializes in custom nail art for prom and special events"
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 resize-none"
                    autoFocus
                  />
                  {skipError && (
                    <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                      {skipError}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleSkipSubmit}
                      disabled={skipIdea.trim().length < 10 || skipValidating}
                      className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
                    >
                      {skipValidating ? "Checking..." : "Set up my venture"}
                    </button>
                    <button
                      onClick={() => { setShowSkipForm(false); setSkipIdea(""); setSkipError(null); }}
                      className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
