"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitExercise } from "./actions";

interface LessonExerciseProps {
  lessonId: string;
  lessonTitle: string;
  progressId: string;
  exercisePrompt: string;
  isCompleted: boolean;
  nextLessonId: string | null;
  previousResponse: string;
  businessName: string;
  niche: string;
}

interface Feedback {
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export default function LessonExercise({
  lessonId,
  lessonTitle,
  progressId,
  exercisePrompt,
  isCompleted: initialCompleted,
  nextLessonId,
  previousResponse,
  businessName,
  niche,
}: LessonExerciseProps) {
  const [response, setResponse] = useState(previousResponse);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(initialCompleted);
  const router = useRouter();

  async function handleSubmit() {
    if (!response.trim() || loading) return;
    setLoading(true);
    setFeedback(null);

    const result = await submitExercise(
      progressId,
      lessonId,
      lessonTitle,
      exercisePrompt,
      response.trim(),
      businessName,
      niche
    );

    setLoading(false);

    if (result.feedback) {
      setFeedback(result.feedback);
      if (result.feedback.passed) {
        setCompleted(true);
        router.refresh();
      }
    } else if (result.error) {
      setFeedback({
        passed: false,
        feedback: result.error,
        strengths: [],
        improvements: ["Try submitting again."],
      });
    }
  }

  // Render exercise prompt as simple text
  const promptLines = exercisePrompt
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => l.replace(/^- /, "").replace(/^\d+\. /, ""));

  return (
    <div className="mt-12 border-t border-[var(--border)] pt-8">
      {/* Exercise header */}
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
        Your Exercise
      </h2>

      {/* Exercise requirements */}
      {promptLines.length > 0 && (
        <div className="mt-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] p-4">
          <ul className="space-y-2">
            {promptLines.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)] shrink-0">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Response area */}
      {!completed && (
        <div className="mt-6">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your response here..."
            rows={8}
            className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 resize-y"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              {response.length > 0 ? `${response.split(/\s+/).filter(Boolean).length} words` : "Write a thoughtful response to pass this exercise."}
            </p>
            <button
              onClick={handleSubmit}
              disabled={response.trim().length < 20 || loading}
              className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
            >
              {loading ? "Getting feedback..." : "Submit for Review"}
            </button>
          </div>
        </div>
      )}

      {/* Previous response (when completed) */}
      {completed && previousResponse && (
        <div className="mt-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] p-4">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Your response:</p>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{previousResponse}</p>
        </div>
      )}

      {/* AI Feedback */}
      {feedback && (
        <div className={`mt-6 rounded-lg border p-5 ${
          feedback.passed
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-lg ${feedback.passed ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
              {feedback.passed ? "✓" : "↻"}
            </span>
            <span className={`text-sm font-semibold ${feedback.passed ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
              {feedback.passed ? "Exercise Complete!" : "Almost there — revise and resubmit"}
            </span>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {feedback.feedback}
          </p>

          {feedback.strengths.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-[var(--success)] mb-1">What you did well:</p>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                    <span className="text-[var(--success)] shrink-0">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!feedback.passed && feedback.improvements.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-[var(--warning)] mb-1">To pass, address these:</p>
              <ul className="space-y-1">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                    <span className="text-[var(--warning)] shrink-0">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Completed: next lesson link */}
      {completed && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--success)]">✓ Lesson completed</p>
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
      )}
    </div>
  );
}
