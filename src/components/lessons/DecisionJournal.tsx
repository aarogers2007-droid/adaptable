"use client";

import { useState } from "react";
import { saveDecision } from "@/app/(app)/lessons/[id]/decision-actions";
import VoiceInput from "@/components/ui/VoiceInput";

interface DecisionJournalProps {
  lessonId: string;
  onComplete: () => void;
}

export default function DecisionJournal({
  lessonId,
  onComplete,
}: DecisionJournalProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [nudge, setNudge] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (trimmed.length < 15 && !nudge) {
      setNudge(true);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await saveDecision(lessonId, trimmed);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-[700px] px-6 py-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--success)] decision-stamp">
            Decision recorded &#10003;
          </p>
          <p className="mt-2 text-lg font-medium font-[family-name:var(--font-display)] text-[var(--text-primary)]" style={{ opacity: 0, animation: "fade-up 300ms ease-out 200ms forwards" }}>
            &ldquo;{input.trim()}&rdquo;
          </p>
          <button
            onClick={onComplete}
            className="mt-4 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[700px] px-6 py-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
        <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">
          Decision Journal
        </p>
        <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
          The biggest decision I made in this lesson was ___
        </p>
        <form onSubmit={handleSubmit} className="mt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. I decided to focus on teen customers instead of adults"
            maxLength={500}
            className="w-full rounded-lg border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
          />
          {error && (
            <p className="mt-1 text-xs text-[var(--error)]">{error}</p>
          )}
          {nudge && (
            <p className="mt-1 text-xs text-[var(--accent)]">
              Can you give a little more? Even one real sentence helps your AI co-founder remember.
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VoiceInput onTranscription={(text) => { setInput((prev) => prev ? prev + " " + text : text); setNudge(false); }} disabled={loading} />
              <span className="text-xs text-[var(--text-muted)]">
                {input.length}/500
              </span>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
            >
              {loading ? "Saving..." : "Save decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
