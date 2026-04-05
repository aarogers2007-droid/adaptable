"use client";

import { useState, useTransition } from "react";
import { sendMessage } from "./actions";

interface MessageComposerProps {
  classId: string;
  className: string;
  studentId: string | null; // null = announcement to all
  studentName: string | null;
  studentCount: number;
  onClose: () => void;
  onSent?: () => void;
}

export default function MessageComposer({
  classId,
  className: cls,
  studentId,
  studentName,
  studentCount,
  onClose,
  onSent,
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!message.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await sendMessage(classId, studentId, message.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
        onSent?.();
        setTimeout(() => onClose(), 1500);
      }
    });
  }

  const recipient = studentId
    ? studentName ?? "Student"
    : `All ${studentCount} students in ${cls}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg">
        {sent ? (
          <div className="py-8 text-center">
            <div className="mb-3 text-3xl">&#10003;</div>
            <p className="font-medium text-[var(--text-primary)]">Message sent</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {studentId ? `${studentName} will see your message.` : "All students will see your announcement."}
            </p>
          </div>
        ) : (
          <>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">
              {studentId ? "Message Student" : "Send Announcement"}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              To: <span className="font-medium">{recipient}</span>
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                studentId
                  ? "Write your message..."
                  : "Write an announcement for the whole class..."
              }
              rows={5}
              className="mt-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              autoFocus
            />

            {error && (
              <p className="mt-2 text-sm text-[var(--error)]">{error}</p>
            )}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isPending || !message.trim()}
                className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50"
              >
                {isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
