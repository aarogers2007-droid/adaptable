"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IkigaiDiagram, { STEPS, type IkigaiStep } from "./IkigaiDiagram";
import StepContent from "./StepContent";
import Confetti from "./Confetti";
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
    ["Per-session service fee", "Monthly subscription", "Per-project pricing", "Commission-based", "Freemium model", "Hourly rate"],
    ["Selling digital products", "Teaching workshops", "Affiliate marketing", "Sponsorships", "Tips & donations", "Rental/lending"],
  ],
};

function getMockSuggestions(step: number, regen: number): string[] {
  const pool = MOCK_SUGGESTIONS[step] ?? [[]];
  return pool[regen % pool.length];
}

function generateMockBusinessIdea(draft: IkigaiDraft): BusinessIdea {
  const passion = (draft.passions ?? [])[0] ?? "creativity";
  const skill = (draft.skills ?? [])[0] ?? "problem solving";
  const need = (draft.needs ?? [])[0] ?? "helping others";
  const names = [`${passion} Studio`, `The ${skill} Lab`, `${passion} & Co`, `${need.split(" ")[0]} Works`];
  return {
    niche: `${passion.toLowerCase()} services`,
    name: names[Math.floor(Math.random() * names.length)],
    target_customer: `People who need help with ${need.toLowerCase()}`,
    pricing: "$25/session",
  };
}

interface IkigaiWizardProps {
  initialDraft: IkigaiDraft | null;
}

export default function IkigaiWizard({ initialDraft }: IkigaiWizardProps) {
  const router = useRouter();

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
  const [showReveal, setShowReveal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    // Save draft (non-blocking)
    try {
      const { saveDraft } = await import("@/app/(app)/onboarding/actions");
      saveDraft(newDraft);
    } catch { /* preview mode */ }

    // Back to diagram
    setActiveStep(null);

    // All 4 done? → synthesize
    if (newCompleted.size === 4) {
      setSynthesizing(true);

      let idea: BusinessIdea | null = null;
      try {
        const { synthesizeBusinessIdea } = await import("@/app/(app)/onboarding/actions");
        const result = await synthesizeBusinessIdea(newDraft);
        idea = result.idea;
      } catch { /* preview mode */ }

      if (!idea) {
        await new Promise((r) => setTimeout(r, 1200));
        idea = generateMockBusinessIdea(newDraft);
      }

      setSynthesizing(false);
      setBusinessIdea(idea);
      setTimeout(() => {
        setShowReveal(true);
        setTimeout(() => setShowConfetti(true), 300);
      }, 500);
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
    try {
      const { confirmBusinessIdea } = await import("@/app/(app)/onboarding/actions");
      const result = await confirmBusinessIdea(businessIdea, draft);
      if (result.success) { router.push("/dashboard"); return; }
    } catch { /* preview mode */ }
    alert(`Business confirmed: ${businessIdea.name}! In production this redirects to your dashboard.`);
  }

  async function handleResynthesize() {
    setShowReveal(false);
    setShowConfetti(false);
    setBusinessIdea(null);
    setSynthesizing(true);

    let idea: BusinessIdea | null = null;
    try {
      const { synthesizeBusinessIdea } = await import("@/app/(app)/onboarding/actions");
      const result = await synthesizeBusinessIdea(draft);
      idea = result.idea;
    } catch { /* preview mode */ }

    if (!idea) {
      await new Promise((r) => setTimeout(r, 1200));
      idea = generateMockBusinessIdea(draft);
    }

    setSynthesizing(false);
    setBusinessIdea(idea);
    setTimeout(() => {
      setShowReveal(true);
      setTimeout(() => setShowConfetti(true), 300);
    }, 500);
  }

  function handleStartOver() {
    setActiveStep(null);
    setDraft({ step: 1 });
    setCompletedSteps(new Set());
    setSuggestions({});
    setSelectedItems({});
    setRegenCounts({});
    setShowReveal(false);
    setShowConfetti(false);
    setBusinessIdea(null);
    setError(null);
  }

  const activeStepConfig = activeStep ? STEPS.find((s) => s.id === activeStep) : null;

  return (
    <>
      {/* FULL-SCREEN STEP VIEW */}
      {activeStep && activeStepConfig && (
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
      {!activeStep && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
          <div className="mb-6 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
              Discover Your Business
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {synthesizing
                ? "Building your business idea..."
                : showReveal
                ? "Your business idea is ready!"
                : completedSteps.size === 0
                ? "Click any circle to start exploring."
                : completedSteps.size < 4
                ? `${completedSteps.size}/4 complete. Click a circle to continue.`
                : "All done!"}
            </p>
          </div>

          <div className="relative">
            <IkigaiDiagram
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
              showReveal={showReveal}
              businessName={businessIdea?.name}
            />
            <Confetti active={showConfetti} />
          </div>

          {/* Synthesizing spinner */}
          {synthesizing && (
            <div className="mt-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Creating your business idea...
              </p>
            </div>
          )}

          {/* Reveal card */}
          {showReveal && businessIdea && (
            <div className="mt-6 max-w-md w-full">
              <div className="rounded-xl border border-[var(--border)] bg-white p-6 text-center">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                  Your Business
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">
                  {businessIdea.name}
                </h2>
                <p className="mt-1 text-[var(--text-secondary)]">
                  {businessIdea.niche}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-sm">
                    {businessIdea.target_customer}
                  </span>
                  <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-sm font-semibold text-[var(--primary)]">
                    {businessIdea.pricing}
                  </span>
                </div>
                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    onClick={handleConfirm}
                    className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:brightness-110 transition-all"
                  >
                    This is my business!
                  </button>
                  <button
                    onClick={handleResynthesize}
                    className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    Try again
                  </button>
                </div>
                <button
                  onClick={handleStartOver}
                  className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
                >
                  Start completely over
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
        </div>
      )}
    </>
  );
}
