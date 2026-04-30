"use client";

import { useState, useEffect } from "react";
import { saveInventionProgress, completeInventionSession, getGroupAssignment } from "./actions";
import InventionIkigai from "@/components/InventionIkigai";
import ForceLightMode from "@/components/ui/ForceLightMode";

// ── Circle definitions ──

const CIRCLES = [
  { num: 1, name: "The Wish", color: "#C084FC", question: "What kind of invention do you want to create?" },
  { num: 2, name: "The Mind", color: "#60A5FA", question: "When you see a problem that needs solving, what do you do first?" },
  { num: 3, name: "The Lens", color: "#2DD4BF", question: "What is something you know a lot about that most kids your age probably don't?" },
  { num: 4, name: "The Scale", color: "#FBBF24", question: "If your invention worked perfectly, which of these feels most exciting to you?" },
  { num: 5, name: "The Voice", color: "#F87171", question: "When you want to share an idea with someone, what feels most comfortable?" },
];

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
  "Animals and nature", "A specific culture or language", "A medical condition or disability",
  "Technology and coding", "Farming or food", "Mental health",
  "A sport or physical discipline", "A creative field", "A religion or spiritual practice",
  "A part of the world most people haven't seen",
];

const CIRCLE_4_CARDS = [
  { id: "one_person", label: "A", desc: "One person's life is completely transformed. They will never be the same." },
  { id: "community", label: "B", desc: "A small community of people finally has something they have always needed." },
  { id: "generation", label: "C", desc: "A whole generation of kids grows up with something we never had." },
  { id: "world", label: "D", desc: "Something that changes the world." },
];

const CIRCLE_5_CHIPS = [
  "Draw it", "Build a prototype", "Write it out", "Make a video",
  "Act it out", "Build a slide or poster", "Explain it out loud to someone",
];

// Label lookups
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CIRCLE_1_CARDS.map(c => [c.id, c.label]));
const ARCHETYPE_LABEL: Record<string, string> = Object.fromEntries(CIRCLE_2_CARDS.map(c => [c.id, c.label]));
const SCALE_LABEL: Record<string, string> = Object.fromEntries(CIRCLE_4_CARDS.map(c => [c.id, `${c.label} — ${c.desc}`]));

interface ExistingSession {
  circle_1_category?: string | null;
  circle_2_archetype?: string | null;
  circle_3_chips?: string[] | null;
  circle_3_freetext?: string | null;
  circle_4_scale?: string | null;
  circle_5_voice?: string[] | null;
  group_number?: number | null;
  completed_at?: string | null;
}

interface Props {
  studentName: string;
  existingSession: ExistingSession | null;
}

export default function InventionWizard({ existingSession }: Props) {
  const alreadyDone = !!existingSession?.completed_at;

  function getStartingStep(): number {
    if (alreadyDone) return 6;
    if (!existingSession) return 0; // diagram view
    if (existingSession.circle_5_voice?.length) return 6;
    if (existingSession.circle_4_scale) return 0; // back to diagram
    if (existingSession.circle_3_chips?.length) return 0;
    if (existingSession.circle_2_archetype) return 0;
    if (existingSession.circle_1_category) return 0;
    return 0;
  }

  // step 0 = pentagon diagram, 1-5 = circle screens, 6 = completion
  const [step, setStep] = useState(getStartingStep);
  const [animating, setAnimating] = useState(false);

  // Circle state
  const [circle1, setCircle1] = useState(existingSession?.circle_1_category ?? "");
  const [circle2, setCircle2] = useState(existingSession?.circle_2_archetype ?? "");
  const [circle3Chips, setCircle3Chips] = useState<string[]>(existingSession?.circle_3_chips ?? []);
  const [circle3Text, setCircle3Text] = useState(existingSession?.circle_3_freetext ?? "");
  const [circle4, setCircle4] = useState(existingSession?.circle_4_scale ?? "");
  const [circle5, setCircle5] = useState<string[]>(existingSession?.circle_5_voice ?? []);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exiting, setExiting] = useState(false);

  function exitToDigram() {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setStep(0);
    }, 400);
  }

  // Group
  const [groupNumber, setGroupNumber] = useState<number | null>(existingSession?.group_number ?? null);
  const [groupRevealed, setGroupRevealed] = useState(false);

  useEffect(() => {
    if (alreadyDone || step === 6) {
      getGroupAssignment().then(res => {
        if (res.groupNumber) { setGroupNumber(res.groupNumber); setGroupRevealed(res.revealed ?? false); }
      });
    }
  }, [alreadyDone, step]);

  // Completed circles
  function getCompleted(): number[] {
    const done: number[] = [];
    if (circle1) done.push(1);
    if (circle2) done.push(2);
    if (circle3Chips.length > 0) done.push(3);
    if (circle4) done.push(4);
    if (circle5.length > 0) done.push(5);
    return done;
  }

  function openCircle(num: number) {
    setAnimating(true);
    setStep(num);
    setTimeout(() => setAnimating(false), 400);
  }

  async function handleDone() {
    setSaving(true);
    setError(null);

    const data: Record<string, unknown> = {};
    if (step === 1) data.circle_1_category = circle1;
    if (step === 2) data.circle_2_archetype = circle2;
    if (step === 3) { data.circle_3_chips = circle3Chips; data.circle_3_freetext = circle3Text; }
    if (step === 4) data.circle_4_scale = circle4;
    if (step === 5) data.circle_5_voice = circle5;

    const result = await saveInventionProgress(data as Parameters<typeof saveInventionProgress>[0]);
    setSaving(false);
    if (result.error) { setError(result.error); return; }

    // Zoom out back to diagram
    exitToDigram();
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);

    // Save circle 5 first
    const saveResult = await saveInventionProgress({ circle_5_voice: circle5 });
    if (saveResult.error) { setError(saveResult.error); setSaving(false); return; }

    const completeResult = await completeInventionSession();
    setSaving(false);
    if (completeResult.error) { setError(completeResult.error); return; }
    setStep(6);
  }

  function canDone(): boolean {
    if (step === 1) return !!circle1;
    if (step === 2) return !!circle2;
    if (step === 3) return circle3Chips.length > 0;
    if (step === 4) return !!circle4;
    if (step === 5) return circle5.length > 0;
    return false;
  }

  const allCirclesDone = getCompleted().length === 5;
  const activeCircle = step >= 1 && step <= 5 ? CIRCLES[step - 1] : null;

  // ── Completion screen ──
  if (step === 6 || alreadyDone) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-6 py-16">
        <ForceLightMode />
        <div className="mx-auto max-w-[600px]">
          <div className="rounded-xl border-2 border-[var(--primary)] bg-[var(--primary)]/5 p-8 text-center">
            {groupRevealed && groupNumber ? (
              <>
                <p className="font-[family-name:var(--font-display)] text-[48px] font-bold text-[var(--primary)]">Group {groupNumber}</p>
                <p className="mt-3 text-base text-[var(--text-primary)]" style={{ lineHeight: 1.618 }}>Remember this number — you will need it on May 13.</p>
              </>
            ) : (
              <p className="text-base text-[var(--text-secondary)]" style={{ lineHeight: 1.618 }}>Your group will be assigned before May 13. Check back here closer to the event.</p>
            )}
          </div>
          <div className="mt-10 space-y-6">
            {[
              { label: "Circle 1 — The Wish", value: CATEGORY_LABEL[circle1 || existingSession?.circle_1_category || ""] || "—" },
              { label: "Circle 2 — The Mind", value: ARCHETYPE_LABEL[circle2 || existingSession?.circle_2_archetype || ""] || "—" },
              { label: "Circle 3 — The Lens", value: (circle3Chips.length > 0 ? circle3Chips : existingSession?.circle_3_chips ?? []).join(", ") || "—", sub: circle3Text || existingSession?.circle_3_freetext },
              { label: "Circle 4 — The Scale", value: SCALE_LABEL[circle4 || existingSession?.circle_4_scale || ""] || "—" },
              { label: "Circle 5 — The Voice", value: (circle5.length > 0 ? circle5 : existingSession?.circle_5_voice ?? []).join(", ") || "—" },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>{item.label}</p>
                <p className="mt-2 text-sm text-[var(--text-primary)]">{item.value}</p>
                {item.sub && <p className="mt-1 text-sm text-[var(--text-secondary)] italic">&ldquo;{item.sub}&rdquo;</p>}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Circle step (full-screen colored background) ──
  if (activeCircle) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col overflow-y-auto ${animating ? "ikigai-expand" : ""} ${exiting ? "ikigai-collapse" : ""}`}
        style={{
          backgroundColor: activeCircle.color,
          backgroundImage: `
            radial-gradient(ellipse 70% 50% at 50% 10%, rgba(255,255,255,0.2) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 10% 90%, rgba(0,0,0,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 90% 90%, rgba(0,0,0,0.12) 0%, transparent 50%)
          `,
        }}
      >
        {/* Back button */}
        <div className="px-6 pt-6">
          <button
            onClick={exitToDigram}
            className="rounded-lg bg-white/30 px-4 py-2 text-sm font-medium hover:bg-white/50 transition-colors"
            style={{ color: "#111827" }}
          >
            &larr; Back
          </button>
        </div>

        {/* Title */}
        <div className="px-6 pt-8 pb-2 text-center">
          <p className="text-sm font-medium" style={{ color: "rgba(0,0,0,0.5)" }}>
            Circle {activeCircle.num} of 5
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold" style={{ color: "#111827" }}>
            {activeCircle.question}
          </h2>
          {(step === 3 || step === 5) && (
            <p className="mt-2 text-sm" style={{ color: "rgba(0,0,0,0.45)" }}>Pick up to two.</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-[680px]">

            {/* Circle 1: Category cards */}
            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {CIRCLE_1_CARDS.map((card, idx) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setCircle1(card.id)}
                    className={`chip-enter rounded-2xl p-6 text-left transition-all duration-150 ${
                      circle1 === card.id
                        ? "bg-[#111827] text-white shadow-lg scale-105"
                        : "bg-white/70 text-[#111827] hover:bg-white hover:shadow-md"
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <p className="text-sm font-semibold">{card.label}</p>
                    <p className="mt-1 text-xs opacity-70">{card.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Circle 2: Archetype cards */}
            {step === 2 && (
              <div className="space-y-3">
                {CIRCLE_2_CARDS.map((card, idx) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setCircle2(card.id)}
                    className={`chip-enter w-full rounded-2xl p-6 text-left transition-all duration-150 ${
                      circle2 === card.id
                        ? "bg-[#111827] text-white shadow-lg scale-[1.02]"
                        : "bg-white/70 text-[#111827] hover:bg-white hover:shadow-md"
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <p className="text-sm font-semibold">{card.label}</p>
                    <p className="mt-1 text-xs opacity-70">{card.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Circle 3: Chips + free text */}
            {step === 3 && (
              <div>
                <div className="flex flex-wrap justify-center gap-2">
                  {CIRCLE_3_CHIPS.map((chip, idx) => {
                    const selected = circle3Chips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (selected) setCircle3Chips(circle3Chips.filter(c => c !== chip));
                          else if (circle3Chips.length < 2) setCircle3Chips([...circle3Chips, chip]);
                        }}
                        className={`chip-enter rounded-full px-6 py-3 text-base font-medium transition-all duration-150 ${
                          selected
                            ? "bg-[#111827] text-white shadow-lg scale-105"
                            : "bg-white/70 text-[#111827] hover:bg-white hover:shadow-md"
                        }`}
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        {selected && <span className="mr-1.5">&#10003;</span>}
                        {chip}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8 mx-auto max-w-[400px]">
                  <p className="text-sm mb-2 text-center" style={{ color: "rgba(0,0,0,0.5)" }}>
                    Tell us more (optional)
                  </p>
                  <input
                    type="text"
                    value={circle3Text}
                    onChange={e => setCircle3Text(e.target.value.slice(0, 80))}
                    maxLength={80}
                    className="w-full rounded-lg bg-white/70 px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)] focus:bg-white focus:shadow-md transition-all"
                    placeholder="e.g., I've lived in 3 countries"
                  />
                </div>
              </div>
            )}

            {/* Circle 4: Scale cards */}
            {step === 4 && (
              <div className="space-y-3">
                {CIRCLE_4_CARDS.map((card, idx) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setCircle4(card.id)}
                    className={`chip-enter w-full rounded-2xl p-6 text-left transition-all duration-150 ${
                      circle4 === card.id
                        ? "bg-[#111827] text-white shadow-lg scale-[1.02]"
                        : "bg-white/70 text-[#111827] hover:bg-white hover:shadow-md"
                    }`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-sm font-bold">{card.label}</span>
                    <span className="text-sm">{card.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Circle 5: Voice chips */}
            {step === 5 && (
              <div className="flex flex-wrap justify-center gap-2">
                {CIRCLE_5_CHIPS.map((chip, idx) => {
                  const selected = circle5.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        if (selected) setCircle5(circle5.filter(c => c !== chip));
                        else if (circle5.length < 2) setCircle5([...circle5, chip]);
                      }}
                      className={`chip-enter rounded-full px-6 py-3 text-base font-medium transition-all duration-150 ${
                        selected
                          ? "bg-[#111827] text-white shadow-lg scale-105"
                          : "bg-white/70 text-[#111827] hover:bg-white hover:shadow-md"
                      }`}
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      {selected && <span className="mr-1.5">&#10003;</span>}
                      {chip}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 rounded-lg bg-white/80 px-3 py-2 text-sm text-red-600 text-center">{error}</div>
        )}

        {/* Done / Complete button */}
        <div className="px-6 pb-8 text-center">
          {step === 5 && allCirclesDone ? (
            <button
              onClick={handleComplete}
              disabled={!canDone() || saving}
              className="rounded-xl px-10 py-3.5 text-base font-semibold text-white hover:opacity-90 disabled:opacity-30 transition-all shadow-lg"
              style={{ background: "#111827" }}
            >
              {saving ? "Saving..." : "Complete Ikigai"}
            </button>
          ) : (
            <button
              onClick={handleDone}
              disabled={!canDone() || saving}
              className="rounded-xl px-10 py-3.5 text-base font-semibold text-white hover:opacity-90 disabled:opacity-30 transition-all shadow-lg"
              style={{ background: "#111827" }}
            >
              {saving ? "Saving..." : "Done"}
            </button>
          )}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ikigai-expand {
            from { transform: scale(0.3); opacity: 0; border-radius: 50%; }
            to { transform: scale(1); opacity: 1; border-radius: 0; }
          }
          .ikigai-expand { animation: ikigai-expand 400ms ease-out forwards; }
          @keyframes ikigai-collapse {
            from { transform: scale(1); opacity: 1; border-radius: 0; }
            to { transform: scale(0.3); opacity: 0; border-radius: 50%; }
          }
          .ikigai-collapse { animation: ikigai-collapse 400ms ease-in forwards; }
          @keyframes chip-in {
            from { opacity: 0; transform: scale(0.85) translateY(6px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .chip-enter { animation: chip-in 250ms ease-out both; }
        `}} />
      </div>
    );
  }

  // ── Pentagon diagram view (step 0) ──
  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-6 py-12">
      <ForceLightMode />
      <div className="w-full max-w-[600px]">
        <InventionIkigai
          currentCircle={0}
          completedCircles={getCompleted()}
          onCircleClick={(num) => openCircle(num)}
        />
      </div>

      {/* Status text */}
      <div className="mt-8 text-center">
        {allCirclesDone ? (
          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">All circles complete!</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Open Circle 5 and tap &ldquo;Complete Ikigai&rdquo; to finish.</p>
          </div>
        ) : (
          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">Tap a circle to begin</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{getCompleted().length} of 5 complete</p>
          </div>
        )}
      </div>
    </main>
  );
}
