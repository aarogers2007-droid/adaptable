"use client";

import { useState } from "react";
import { sendParentMessage } from "./actions";

export default function ParentMessageForm({
  token,
  teacherName,
  studentFirstName,
}: {
  token: string;
  teacherName: string;
  studentFirstName: string;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setError(null);
    setLoading(true);

    const result = await sendParentMessage(token, message);
    if (result.success) {
      setSent(true);
      setMessage("");
    } else {
      setError(result.error ?? "Something went wrong.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <svg
            className="h-5 w-5 text-[var(--success)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Message sent to {teacherName}
          </p>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          They&apos;ll see your message in their dashboard.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-3 text-xs font-medium text-[var(--primary)] hover:underline"
        >
          Send another message
        </button>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        Contact Teacher
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {teacherName} is {studentFirstName}&apos;s teacher
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder={`Write a message to ${teacherName}...`}
            rows={3}
            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 resize-none"
          />
          <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
            {message.length}/500
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!message.trim() || loading}
          className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
        >
          {loading ? "Sending..." : `Message ${teacherName}`}
        </button>
      </form>
    </section>
  );
}
