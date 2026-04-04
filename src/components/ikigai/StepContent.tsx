"use client";

import { useState, useRef, useEffect } from "react";
import type { StepConfig } from "./IkigaiDiagram";

interface StepContentProps {
  step: StepConfig;
  suggestions: string[];
  selectedItems: string[];
  onSelect: (items: string[]) => void;
  onCustomAdd: (item: string) => void;
  onRegenerate: () => void;
  onDone: () => void;
  onBack: () => void;
  loading: boolean;
  regenCount: number;
  maxRegens: number;
}

/**
 * Full-screen view when a circle is selected.
 * The circle's color IS the entire page background.
 * Title at top. Entries below. That's it.
 */
export default function StepContent({
  step,
  suggestions,
  selectedItems,
  onSelect,
  onCustomAdd,
  onRegenerate,
  onDone,
  onBack,
  loading,
  regenCount,
  maxRegens,
}: StepContentProps) {
  const [customInput, setCustomInput] = useState("");
  const [showNudge, setShowNudge] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, [step.id]);

  function toggleItem(item: string) {
    if (selectedItems.includes(item)) {
      onSelect(selectedItems.filter((i) => i !== item));
    } else {
      onSelect([...selectedItems, item]);
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !selectedItems.includes(trimmed)) {
      onCustomAdd(trimmed);
      setCustomInput("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: step.color }}
    >
      {/* Back button */}
      <div className="px-6 pt-6">
        <button
          onClick={onBack}
          className="rounded-lg bg-white/30 px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-white/50 transition-colors"
        >
          ← Back to diagram
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-8 pb-2 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--text-primary)]">
          {step.label}
        </h2>
        <p className="mt-3 text-base text-[var(--text-primary)]/70 max-w-lg mx-auto">
          {step.question}
        </p>
        <p className="mt-2 text-sm text-[var(--text-primary)]/40">
          Pick 2-3 that feel most like you, or type your own
        </p>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center px-6 pt-6 pb-8 overflow-y-auto">
        {/* Suggestions */}
        <div className="w-full max-w-xl">
          {loading ? (
            <div className="flex gap-2 flex-wrap justify-center">
              {[95, 110, 85, 120, 100, 90].map((w, i) => (
                <div
                  key={i}
                  className="h-10 rounded-full bg-white/30 animate-pulse"
                  style={{ width: w }}
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-2.5 flex-wrap justify-center">
              {suggestions.map((item) => {
                const isSelected = selectedItems.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isSelected
                        ? "bg-[var(--text-primary)] text-white shadow-lg scale-105"
                        : "bg-white/70 text-[var(--text-primary)] hover:bg-white hover:shadow-md"
                    }`}
                  >
                    {isSelected && <span className="mr-1.5">&#10003;</span>}
                    {item}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom input */}
          <form onSubmit={handleCustomSubmit} className="mt-6">
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type your own..."
                className="flex-1 rounded-lg bg-white/70 px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)] focus:bg-white focus:shadow-md transition-all"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="rounded-lg bg-white/80 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-white disabled:opacity-40 transition-all"
              >
                Add
              </button>
            </div>
          </form>

          {/* Selected items */}
          {selectedItems.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-sm text-[var(--text-primary)]/60 mb-3 font-medium">
                Your answers
              </p>
              <div className="flex gap-2 flex-wrap justify-center">
                {selectedItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--text-primary)]/15 px-4 py-2 text-sm font-medium text-[var(--text-primary)]"
                  >
                    {item}
                    <button
                      onClick={() => toggleItem(item)}
                      className="opacity-50 hover:opacity-100 text-base leading-none"
                      aria-label={`Remove ${item}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regenerate */}
          <div className="mt-6 text-center">
            <button
              onClick={onRegenerate}
              disabled={loading || regenCount >= maxRegens}
              className="text-sm text-[var(--text-primary)]/50 hover:text-[var(--text-primary)]/80 disabled:opacity-30 transition-colors"
            >
              ↻ Different suggestions ({maxRegens - regenCount} left)
            </button>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-h-8" />

        {/* Minimum input nudge */}
        {showNudge && (
          <p className="mb-3 text-sm text-[var(--text-primary)]/60 bg-white/40 rounded-lg px-4 py-2 text-center">
            Just one? That's fine, but adding 1-2 more helps create a better business idea for you.
          </p>
        )}

        {/* Done button */}
        <button
          onClick={() => {
            if (selectedItems.length === 1 && !showNudge) {
              setShowNudge(true);
              return;
            }
            setShowNudge(false);
            onDone();
          }}
          disabled={selectedItems.length === 0}
          className="rounded-xl bg-[var(--text-primary)] px-10 py-3.5 text-base font-semibold text-white hover:opacity-90 disabled:opacity-30 transition-all shadow-lg"
        >
          {showNudge ? "Continue with 1 →" : "Done →"}
        </button>
      </div>
    </div>
  );
}
