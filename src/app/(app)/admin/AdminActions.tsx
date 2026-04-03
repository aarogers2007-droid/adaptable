"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  resetAllProgress,
  resetIkigai,
  resetSingleLesson,
  unlockAllLessons,
} from "./actions";

export default function AdminActions({
  hasBusinessIdea,
}: {
  hasBusinessIdea: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleAction(
    action: () => Promise<{ success?: boolean; error?: string }>,
    name: string
  ) {
    if (!confirm(`Are you sure you want to ${name}?`)) return;
    setLoading(name);
    setMessage(null);
    const result = await action();
    setLoading(null);
    if (result.success) {
      setMessage(`${name}: done`);
      router.refresh();
    } else {
      setMessage(`${name}: ${result.error}`);
    }
  }

  return (
    <div className="mt-6">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Quick Actions
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            handleAction(resetAllProgress, "Reset all lesson progress")
          }
          disabled={loading !== null}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {loading === "Reset all lesson progress"
            ? "Resetting..."
            : "Reset All Lesson Progress"}
        </button>

        {hasBusinessIdea && (
          <button
            onClick={() => handleAction(resetIkigai, "Reset Ikigai + business idea")}
            disabled={loading !== null}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {loading === "Reset Ikigai + business idea"
              ? "Resetting..."
              : "Reset Ikigai & Business Idea"}
          </button>
        )}

        <button
          onClick={() =>
            handleAction(unlockAllLessons, "Mark all lessons in-progress")
          }
          disabled={loading !== null}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          {loading === "Mark all lessons in-progress"
            ? "Unlocking..."
            : "Unlock All Lessons"}
        </button>

        <button
          onClick={() => {
            const lessonId = prompt("Enter lesson ID to reset:");
            if (lessonId) {
              handleAction(
                () => resetSingleLesson(lessonId),
                `Reset lesson ${lessonId}`
              );
            }
          }}
          disabled={loading !== null}
          className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] disabled:opacity-50 transition-colors"
        >
          Reset Single Lesson
        </button>
      </div>

      {message && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">{message}</p>
      )}
    </div>
  );
}
