"use client";

import { useState, useEffect } from "react";
import { getLessonHealthScores, deactivateLesson, reactivateLesson, flagLesson, type LessonHealth } from "./impact-actions";

interface Props {
  orgId: string;
}

function formatTime(seconds: number): string {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function HealthDot({ score }: { score: number }) {
  const color = score < 50 ? "#DC2626" : score < 75 ? "#D97706" : "#059669";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-sm font-medium text-[var(--text-primary)]">{score}</span>
    </span>
  );
}

export default function LessonHealthTable({ orgId }: Props) {
  const [lessons, setLessons] = useState<LessonHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagTarget, setFlagTarget] = useState<string | null>(null);
  const [flagNotes, setFlagNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    getLessonHealthScores(orgId)
      .then((data) => setLessons(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleDeactivate(lessonId: string) {
    setActionLoading(lessonId);
    const result = await deactivateLesson(orgId, lessonId);
    if (result.success) {
      setLessons((prev) => prev.map((l) => l.lessonId === lessonId ? { ...l, isActive: false } : l));
    }
    setActionLoading(null);
  }

  async function handleReactivate(lessonId: string) {
    setActionLoading(lessonId);
    const result = await reactivateLesson(orgId, lessonId);
    if (result.success) {
      setLessons((prev) => prev.map((l) => l.lessonId === lessonId ? { ...l, isActive: true } : l));
    }
    setActionLoading(null);
  }

  async function handleFlag(lessonId: string) {
    if (!flagNotes.trim()) return;
    setActionLoading(lessonId);
    const result = await flagLesson(orgId, lessonId, flagNotes.trim());
    if (result.success) {
      setFlagTarget(null);
      setFlagNotes("");
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-[var(--bg-muted)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] py-4">No lesson data yet</p>;
  }

  const active = lessons.filter((l) => l.isActive);
  const deactivated = lessons.filter((l) => !l.isActive);
  const sorted = [...active, ...deactivated];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Lesson</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Health</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Completion</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] hidden md:table-cell">Drop-off</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] hidden md:table-cell">Avg Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((lesson) => (
            <tr
              key={lesson.lessonId}
              className={`border-b border-[var(--border)] ${!lesson.isActive ? "opacity-50" : ""}`}
            >
              <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                {lesson.moduleSequence}.{lesson.lessonSequence} {lesson.title}
              </td>
              <td className="px-4 py-3">
                <HealthDot score={lesson.healthScore} />
              </td>
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                {Math.round(lesson.completionRate * 100)}%
              </td>
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">
                {Math.round(lesson.dropOffRate * 100)}%
              </td>
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)] hidden md:table-cell">
                {formatTime(lesson.avgSessionSeconds)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {lesson.isActive && lesson.healthScore < 75 && (
                    <button
                      onClick={() => handleDeactivate(lesson.lessonId)}
                      disabled={actionLoading === lesson.lessonId}
                      className="rounded-lg px-2 py-1 text-xs font-medium border border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                  {!lesson.isActive && (
                    <button
                      onClick={() => handleReactivate(lesson.lessonId)}
                      disabled={actionLoading === lesson.lessonId}
                      className="rounded-lg px-2 py-1 text-xs font-medium border border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors disabled:opacity-50"
                    >
                      Reactivate
                    </button>
                  )}
                  {flagTarget === lesson.lessonId ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={flagNotes}
                        onChange={(e) => setFlagNotes(e.target.value)}
                        placeholder="Notes..."
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text-primary)] w-32"
                        onKeyDown={(e) => { if (e.key === "Enter") handleFlag(lesson.lessonId); }}
                      />
                      <button
                        onClick={() => handleFlag(lesson.lessonId)}
                        disabled={actionLoading === lesson.lessonId || !flagNotes.trim()}
                        className="rounded-lg px-2 py-1 text-xs font-medium bg-[var(--primary)] text-white transition-colors disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setFlagTarget(null); setFlagNotes(""); }}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setFlagTarget(lesson.lessonId)}
                      className="rounded-lg px-2 py-1 text-xs font-medium border border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      Flag
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
