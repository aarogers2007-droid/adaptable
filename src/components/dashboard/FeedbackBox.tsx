"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "@/lib/feedback-actions";

/**
 * "Tell AJ your thoughts" feedback box for friends/family user testing.
 * Lives prominently on the dashboard. Optional 1-5 rating, required message.
 * After submit: confirmation state with option to leave another note.
 */
export default function FeedbackBox() {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError("Add a thought before submitting.");
      return;
    }

    startTransition(async () => {
      const result = await submitFeedback({
        message,
        rating: rating ?? undefined,
        page: typeof window !== "undefined" ? window.location.pathname : undefined,
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      });
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setSubmitted(true);
      setMessage("");
      setRating(null);
    });
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-2xl">
            ✨
          </div>
          <div className="flex-1">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
              Thank you.
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              That means a lot. AJ will read every word.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 text-sm font-medium text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
            >
              Leave another note →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-2xl">
          💭
        </div>
        <div className="flex-1">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
            Tell AJ your thoughts
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            What confused you? What surprised you? What would you change?
            Anything you noticed — the messy stuff is the most useful.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write what you're thinking..."
                rows={4}
                maxLength={5000}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 resize-none"
                disabled={isPending}
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">
                  {message.length > 0 && `${message.length} characters`}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Optional: how does it feel so far?
              </p>
              <div className="mt-2 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="text-2xl transition-transform hover:scale-125"
                    aria-label={`Rate ${n} out of 5`}
                  >
                    <span
                      className={
                        (hoverRating ?? rating ?? 0) >= n
                          ? "opacity-100"
                          : "opacity-30"
                      }
                    >
                      ⭐
                    </span>
                  </button>
                ))}
                {rating && (
                  <button
                    type="button"
                    onClick={() => setRating(null)}
                    className="ml-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    clear
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !message.trim()}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Sending..." : "Send to AJ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
