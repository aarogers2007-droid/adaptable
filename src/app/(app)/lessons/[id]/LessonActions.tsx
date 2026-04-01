"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markLessonComplete } from "./actions";
import Link from "next/link";

interface LessonActionsProps {
  lessonId: string;
  progressId: string;
  isCompleted: boolean;
  nextLessonId: string | null;
}

export default function LessonActions({
  lessonId,
  progressId,
  isCompleted,
  nextLessonId,
}: LessonActionsProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const router = useRouter();

  async function handleComplete() {
    setLoading(true);
    const result = await markLessonComplete(progressId);
    if (result.success) {
      setCompleted(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="mt-12 border-t border-[var(--border)] pt-8">
      {completed ? (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--success)]">
            ✓ Lesson completed
          </p>
          {nextLessonId ? (
            <Link
              href={`/lessons/${nextLessonId}`}
              className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
            >
              Next Lesson →
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
            >
              Back to Dashboard
            </Link>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Finished the exercise above?
          </p>
          <button
            onClick={handleComplete}
            disabled={loading}
            className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Mark Complete ✓"}
          </button>
        </div>
      )}
    </div>
  );
}
