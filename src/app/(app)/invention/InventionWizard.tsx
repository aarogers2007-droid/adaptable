"use client";

import { useState, useEffect } from "react";
import { saveInventionProgress, synthesizeInvention, getGroupAssignment } from "./actions";

// ── Circle definitions ──

const CIRCLE_1_CARDS = [
  { id: "physical", label: "A physical product", desc: "Something you can hold, wear, or use in the real world." },
  { id: "digital", label: "A digital tool or app", desc: "Software, a platform, something that lives on a screen." },
  { id: "medical", label: "A medical or health innovation", desc: "Something that helps people feel better, stay healthier, or live with a condition." },
  { id: "learning", label: "A learning tool", desc: "Something that helps people understand or practice something." },
  { id: "environmental", label: "An environmental solution", desc: "Something that helps the planet, animals, or nature." },
  { id: "social", label: "A social or community tool", desc: "Something that connects people or fixes a social problem." },
  { id: "transport", label: "A transportation or infrastructure invention", desc: "Something that moves people, goods, or information differently." },
  { id: "wildcard", label: "Something entirely new", desc: "It does not fit any of these categories." },
];

const CIRCLE_2_CARDS = [
  { id: "builder", label: "Builder", desc: "I immediately start thinking about how to make the thing. I want to know what it looks like and how it works." },
  { id: "empath", label: "Empath", desc: "I think about the people affected first. I want to understand how they feel before I think about solutions." },
  { id: "systems_thinker", label: "Systems Thinker", desc: "I ask why the problem exists in the first place. I want to understand what broke before I fix it." },
  { id: "connector", label: "Connector", desc: "I look for what already exists that could be combined or repurposed. I find solutions hiding in other fields." },
  { id: "storyteller", label: "Storyteller", desc: "I think about how to make people care. I want to find the words or images that make the idea feel real." },
];

const CIRCLE_3_CHIPS = [
  "Animals and nature",
  "A specific culture or language",
  "A medical condition or disability",
  "Technology and coding",
  "Farming or food",
  "Mental health",
  "A sport or physical discipline",
  "A creative field",
  "A religion or spiritual practice",
  "A part of the world most people haven't seen",
];

const CIRCLE_4_CARDS = [
  { id: "one_person", label: "A", desc: "One person's life is completely transformed. They will never be the same." },
  { id: "community", label: "B", desc: "A small community of people finally has something they have always needed." },
  { id: "generation", label: "C", desc: "A whole generation of kids grows up with something we never had." },
  { id: "world", label: "D", desc: "Something that changes the world." },
];

const CIRCLE_5_CHIPS = [
  "Draw it",
  "Build a prototype",
  "Write it out",
  "Make a video",
  "Act it out",
  "Build a slide or poster",
  "Explain it out loud to someone",
];

// ── Types ──

interface InventionIdea {
  title: string;
  tagline: string;
  problem: string;
  mechanism: string;
  who_it_helps: string;
  why_it_matters: string;
}

interface ExistingSession {
  circle_1_category?: string | null;
  idea_freetext?: string | null;
  circle_2_archetype?: string | null;
  circle_3_chips?: string[] | null;
  circle_3_freetext?: string | null;
  circle_4_scale?: string | null;
  circle_5_voice?: string[] | null;
  synthesized_idea?: string | null;
  group_number?: number | null;
  completed_at?: string | null;
}

interface Props {
  studentName: string;
  existingSession: ExistingSession | null;
}

export default function InventionWizard({ studentName, existingSession }: Props) {
  // If already completed, show result
  const alreadyDone = existingSession?.completed_at && existingSession?.synthesized_idea;

  // Determine starting step from existing session
  function getStartingStep(): number {
    if (alreadyDone) return 6; // result screen
    if (!existingSession) return 1;
    if (existingSession.circle_5_voice?.length) return 6; // all circles done, needs synthesis
    if (existingSession.circle_4_scale) return 5;
    if (existingSession.circle_3_chips?.length) return 4;
    if (existingSession.circle_2_archetype) return 3;
    if (existingSession.circle_1_category) return 2;
    return 1;
  }

  const [step, setStep] = useState(getStartingStep);

  // Circle state — hydrate from existing session
  const [circle1, setCircle1] = useState(existingSession?.circle_1_category ?? "");
  const [ideaText, setIdeaText] = useState(existingSession?.idea_freetext ?? "");
  const [circle2, setCircle2] = useState(existingSession?.circle_2_archetype ?? "");
  const [circle3Chips, setCircle3Chips] = useState<string[]>(existingSession?.circle_3_chips ?? []);
  const [circle3Text, setCircle3Text] = useState(existingSession?.circle_3_freetext ?? "");
  const [circle4, setCircle4] = useState(existingSession?.circle_4_scale ?? "");
  const [circle5, setCircle5] = useState<string[]>(existingSession?.circle_5_voice ?? []);

  // Synthesis state
  const [synthesizing, setSynthesizing] = useState(false);
  const [idea, setIdea] = useState<InventionIdea | null>(() => {
    if (existingSession?.synthesized_idea) {
      try { return JSON.parse(existingSession.synthesized_idea); } catch { return null; }
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  // Group assignment
  const [groupNumber, setGroupNumber] = useState<number | null>(existingSession?.group_number ?? null);
  const [groupRevealed, setGroupRevealed] = useState(false);

  // Check group on load
  useEffect(() => {
    if (alreadyDone) {
      getGroupAssignment().then((res) => {
        if (res.groupNumber) {
          setGroupNumber(res.groupNumber);
          setGroupRevealed(res.revealed ?? false);
        }
      });
    }
  }, [alreadyDone]);

  const [saving, setSaving] = useState(false);

  async function handleNext() {
    setSaving(true);
    setError(null);

    const data: Record<string, unknown> = {};
    if (step === 1) { data.circle_1_category = circle1; data.idea_freetext = ideaText; }
    if (step === 2) { data.circle_2_archetype = circle2; }
    if (step === 3) { data.circle_3_chips = circle3Chips; data.circle_3_freetext = circle3Text; }
    if (step === 4) { data.circle_4_scale = circle4; }
    if (step === 5) { data.circle_5_voice = circle5; }

    const result = await saveInventionProgress(data as any);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (step === 5) {
      // All circles done — trigger synthesis
      setSynthesizing(true);
      const synthResult = await synthesizeInvention({
        circle_1_category: circle1,
        idea_freetext: ideaText,
        circle_2_archetype: circle2,
        circle_3_chips: circle3Chips,
        circle_3_freetext: circle3Text,
        circle_4_scale: circle4,
        circle_5_voice: circle5,
      });
      setSynthesizing(false);

      if (synthResult.error) {
        setError(synthResult.error);
        return;
      }

      setIdea(synthResult.idea);
      setStep(6);
    } else {
      setStep(step + 1);
    }
  }

  function canProceed(): boolean {
    if (step === 1) return !!circle1 && ideaText.trim().length > 0;
    if (step === 2) return !!circle2;
    if (step === 3) return circle3Chips.length > 0;
    if (step === 4) return !!circle4;
    if (step === 5) return circle5.length > 0;
    return false;
  }

  // ── Result screen ──
  if ((step === 6 && idea) || alreadyDone) {
    const displayIdea = idea ?? (existingSession?.synthesized_idea ? JSON.parse(existingSession.synthesized_idea) : null);
    if (!displayIdea) return null;

    return (
      <main className="min-h-screen bg-[var(--bg)] px-6 py-16">
        <div className="mx-auto max-w-[600px]">
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>
            Your invention
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[34px] font-bold leading-tight text-[var(--text-primary)]">
            {displayIdea.title}
          </h1>
          <p className="mt-3 text-lg text-[var(--text-secondary)]" style={{ lineHeight: 1.618 }}>
            {displayIdea.tagline}
          </p>

          <div className="mt-8 space-y-6">
            {[
              { label: "The problem", value: displayIdea.problem },
              { label: "How it works", value: displayIdea.mechanism },
              { label: "Who it helps", value: displayIdea.who_it_helps },
              { label: "Why it matters", value: displayIdea.why_it_matters },
            ].map((item) => (
              <div key={item.label}>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                  {item.label}
                </p>
                <p className="mt-1 text-base text-[var(--text-primary)]" style={{ lineHeight: 1.618 }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Group assignment */}
          <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 text-center">
            {groupRevealed && groupNumber ? (
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                You are in Group {groupNumber}
              </p>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]" style={{ lineHeight: 1.618 }}>
                Your group will be assigned before May 13. Check back here closer to the event.
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Synthesizing screen ──
  if (synthesizing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Generating your invention concept...
          </p>
        </div>
      </main>
    );
  }

  // ── Wizard steps ──
  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-12">
      <div className="mx-auto max-w-[600px]">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className="h-2 flex-1 rounded-full transition-colors"
              style={{
                background: s < step ? "#0D9488" : s === step ? "#14B8A6" : "#E5E7EB",
              }}
            />
          ))}
        </div>

        {/* Step label */}
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>
          Circle {step} of 5
        </p>

        {/* ── Circle 1: The Wish ── */}
        {step === 1 && (
          <div className="mt-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
              What kind of invention do you want to create?
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {CIRCLE_1_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setCircle1(card.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    circle1 === card.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20"
                      : "border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{card.label}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{card.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Describe your idea in one sentence. What does it do and who does it help?
              </label>
              <input
                type="text"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value.slice(0, 120))}
                maxLength={120}
                className="mt-2 w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                placeholder="e.g., A water filter that works without electricity for villages without clean water"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">{ideaText.length}/120</p>
            </div>
          </div>
        )}

        {/* ── Circle 2: The Mind ── */}
        {step === 2 && (
          <div className="mt-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
              When you see a problem that needs solving, what do you do first?
            </h2>
            <div className="mt-6 space-y-3">
              {CIRCLE_2_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setCircle2(card.id)}
                  className={`w-full rounded-xl border p-5 text-left transition-all ${
                    circle2 === card.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20"
                      : "border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{card.label}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{card.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Circle 3: The Lens ── */}
        {step === 3 && (
          <div className="mt-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
              What is something you know a lot about that most kids your age probably don&apos;t?
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Pick up to two.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {CIRCLE_3_CHIPS.map((chip) => {
                const selected = circle3Chips.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setCircle3Chips(circle3Chips.filter((c) => c !== chip));
                      } else if (circle3Chips.length < 2) {
                        setCircle3Chips([...circle3Chips, chip]);
                      }
                    }}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${
                      selected
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Tell us more. What specifically do you know about this that someone else wouldn&apos;t?
              </label>
              <input
                type="text"
                value={circle3Text}
                onChange={(e) => setCircle3Text(e.target.value.slice(0, 80))}
                maxLength={80}
                className="mt-2 w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                placeholder="e.g., I've lived with Type 1 diabetes since I was 8"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">{circle3Text.length}/80</p>
            </div>
          </div>
        )}

        {/* ── Circle 4: The Scale ── */}
        {step === 4 && (
          <div className="mt-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
              If your invention worked perfectly, which of these feels most exciting to you?
            </h2>
            <div className="mt-6 space-y-3">
              {CIRCLE_4_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setCircle4(card.id)}
                  className={`w-full rounded-xl border p-5 text-left transition-all ${
                    circle4 === card.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20"
                      : "border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-sm font-bold text-[var(--text-primary)]">
                    {card.label}
                  </span>
                  <span className="text-sm text-[var(--text-primary)]">{card.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Circle 5: The Voice ── */}
        {step === 5 && (
          <div className="mt-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
              When you want to share an idea with someone, what feels most comfortable?
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Pick up to two.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {CIRCLE_5_CHIPS.map((chip) => {
                const selected = circle5.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setCircle5(circle5.filter((c) => c !== chip));
                      } else if (circle5.length < 2) {
                        setCircle5([...circle5, chip]);
                      }
                    }}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${
                      selected
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-lg border border-[var(--border-strong)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            {saving ? "Saving..." : step === 5 ? "Generate My Invention" : "Next"}
          </button>
        </div>
      </div>
    </main>
  );
}
