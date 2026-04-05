"use client";

import { useState, useEffect } from "react";
import { submitCheckIn, getTodayCheckIn } from "@/app/(app)/dashboard/checkin-actions";
import VoiceInput from "@/components/ui/VoiceInput";

const PROMPTS = [
  "What happened today with your business idea?",
  "Did you spot any potential customers today?",
  "What's one thing you're unsure about right now?",
  "Did anyone say something that made you think about your business?",
  "What would you work on first if you launched tomorrow?",
  "What's exciting you most about your venture right now?",
  "What's the hardest part of your business to figure out?",
];

const LAUNCH_PROMPTS = [
  "Did you reach out to any potential customers? What happened?",
  "Has anyone shown real interest in paying for your product/service?",
  "What's the one thing standing between you and your first sale?",
  "Did you talk to a real person about your business this week?",
  "What did you learn from actually putting your idea out there?",
];

function getTodayPrompt(allLessonsComplete: boolean): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const pool = allLessonsComplete ? LAUNCH_PROMPTS : PROMPTS;
  return pool[dayOfYear % pool.length];
}

interface CheckInData {
  prompt: string;
  response: string;
  ai_reply: string | null;
}

export default function DailyCheckIn({ allLessonsComplete = false }: { allLessonsComplete?: boolean }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckInData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const todayPrompt = getTodayPrompt(allLessonsComplete);

  // Check if already checked in today
  useEffect(() => {
    async function check() {
      try {
        const existing = await getTodayCheckIn();
        if (existing) {
          setCheckedIn(true);
          setCheckInData({
            prompt: existing.prompt,
            response: existing.response,
            ai_reply: existing.ai_reply,
          });
        }
      } catch {
        // Ignore — show the form
      } finally {
        setInitialLoading(false);
      }
    }
    check();
  }, []);

  const [nudge, setNudge] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Minimum quality nudge (once)
    if (trimmed.length < 10 && !nudge) {
      setNudge(true);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await submitCheckIn(todayPrompt, trimmed);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setCheckedIn(true);
    setCheckInData({
      prompt: todayPrompt,
      response: trimmed,
      ai_reply: result.aiReply ?? null,
    });
    setLoading(false);
  }

  if (initialLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--bg-muted)]" />
      </div>
    );
  }

  // Collapsed state — already checked in
  if (checkedIn && checkInData) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
        <p className="text-xs font-medium text-[var(--success)] uppercase tracking-wider">
          Checked in today &#10003;
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {checkInData.prompt}
        </p>
        <p className="mt-1 text-sm text-[var(--text-primary)]">
          &ldquo;{checkInData.response}&rdquo;
        </p>
        {checkInData.ai_reply && (
          <p className="mt-2 text-sm text-[var(--text-secondary)] italic">
            {checkInData.ai_reply}
          </p>
        )}
      </div>
    );
  }

  // Active state — show prompt and input
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
      <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">
        Daily Check-in
      </p>
      <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
        {todayPrompt}
      </p>
      <form onSubmit={handleSubmit} className="mt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Just a sentence or two..."
          rows={2}
          maxLength={1000}
          className="w-full resize-none rounded-lg border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--error)]">{error}</p>
        )}
        {nudge && (
          <p className="mt-1 text-xs text-[var(--accent)]">
            Can you give a little more? Even one real sentence helps.
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <VoiceInput onTranscription={(text) => { setInput((prev) => prev ? prev + " " + text : text); setNudge(false); }} disabled={loading} />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
          >
            {loading ? "Sending..." : "Check in"}
          </button>
        </div>
      </form>
    </div>
  );
}
