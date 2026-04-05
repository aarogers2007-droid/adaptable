"use client";

import { useState, useEffect } from "react";
import {
  savePitch,
  getPitchForModule,
} from "@/app/(app)/lessons/[id]/pitch-actions";
import VoiceInput from "@/components/ui/VoiceInput";

interface BusinessPitchProps {
  moduleSequence: number;
  onComplete: () => void;
}

interface PitchData {
  pitch_text: string;
  ai_feedback: string | null;
}

export default function BusinessPitch({
  moduleSequence,
  onComplete,
}: BusinessPitchProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check if already pitched for this module
  useEffect(() => {
    async function check() {
      try {
        const existing = await getPitchForModule(moduleSequence);
        if (existing) {
          setSubmitted(true);
          setPitchData({
            pitch_text: existing.pitch_text,
            ai_feedback: existing.ai_feedback,
          });
        }
      } catch {
        // Ignore
      } finally {
        setInitialLoading(false);
      }
    }
    check();
  }, [moduleSequence]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    const result = await savePitch(moduleSequence, trimmed);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setPitchData({
      pitch_text: trimmed,
      ai_feedback: result.aiFeedback ?? null,
    });
    setLoading(false);
  }

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-[700px] px-6 py-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--bg-muted)]" />
        </div>
      </div>
    );
  }

  // Already submitted — show pitch + feedback
  if (submitted && pitchData) {
    return (
      <div className="mx-auto max-w-[700px] px-6 py-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
          <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
            Your Business Pitch
          </p>
          <p className="mt-3 text-sm text-[var(--text-primary)]">
            &ldquo;{pitchData.pitch_text}&rdquo;
          </p>
          {pitchData.ai_feedback && (
            <div className="mt-4 rounded-lg bg-[var(--bg-muted)] px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
                AI Feedback
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {pitchData.ai_feedback}
              </p>
            </div>
          )}
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

  // Input form
  return (
    <div className="mx-auto max-w-[700px] px-6 py-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6">
        <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
          Teach the AI
        </p>
        <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
          Pitch your business. Hit these 3 points:
        </p>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">1.</span> What does your business do? (one sentence)
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">2.</span> Who is it for and why do they need it?
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">3.</span> Why are YOU the right person to build this?
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-[var(--text-muted)]">
            Say it in your own words. Voice works great here.
          </p>
          <VoiceInput onTranscription={(text) => setInput((prev) => prev ? prev + " " + text : text)} disabled={loading} />
        </div>
        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="My business is... It's for people who... I'm building this because..."
            rows={5}
            className="w-full resize-y rounded-lg border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
          />
          {error && (
            <p className="mt-1 text-xs text-[var(--error)]">{error}</p>
          )}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="mt-2 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
          >
            {loading ? "Sending..." : "Share your pitch"}
          </button>
        </form>
      </div>
    </div>
  );
}
