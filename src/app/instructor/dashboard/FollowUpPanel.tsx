"use client";

import { useState } from "react";
import { resolveFlag } from "./agency-actions";

interface Flag {
  id: string;
  student_id: string;
  priority: string;
  note: string | null;
  due_date: string | null;
  created_at: string;
  profiles: { full_name: string | null; business_idea: { name: string } | null } | null;
}

interface FollowUpPanelProps {
  flags: Flag[];
  onRefresh?: () => void;
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-[var(--error)]/10", text: "text-[var(--error)]", label: "High" },
  medium: { bg: "bg-[var(--accent)]/10", text: "text-[var(--accent)]", label: "Medium" },
  low: { bg: "bg-[var(--bg-muted)]", text: "text-[var(--text-muted)]", label: "Low" },
};

export default function FollowUpPanel({ flags, onRefresh }: FollowUpPanelProps) {
  const [resolving, setResolving] = useState<string | null>(null);

  async function handleResolve(flagId: string) {
    setResolving(flagId);
    await resolveFlag(flagId);
    setResolving(null);
    onRefresh?.();
  }

  if (flags.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
          No active follow-ups
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Flag students from the student detail view when they need a check-in.
        </p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-3">
      {flags.map((flag) => {
        const priority = PRIORITY_COLORS[flag.priority] ?? PRIORITY_COLORS.low;
        const studentName = (flag.profiles as { full_name: string | null } | null)?.full_name ?? "Student";
        const businessName = (flag.profiles as { business_idea: { name: string } | null } | null)?.business_idea?.name;
        const isOverdue = flag.due_date && new Date(flag.due_date) < now;
        const dueLabel = flag.due_date
          ? new Date(flag.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null;

        return (
          <div
            key={flag.id}
            className={`rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 ${isOverdue ? "border-l-4 border-l-[var(--error)]" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priority.bg} ${priority.text}`}>
                    {priority.label}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{studentName}</span>
                  {businessName && (
                    <span className="text-xs text-[var(--text-muted)]">— {businessName}</span>
                  )}
                </div>
                {flag.note && (
                  <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{flag.note}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  {dueLabel && (
                    <span className={isOverdue ? "text-[var(--error)] font-medium" : ""}>
                      {isOverdue ? "Overdue: " : "Due: "}{dueLabel}
                    </span>
                  )}
                  <span>Flagged {new Date(flag.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
              <button
                onClick={() => handleResolve(flag.id)}
                disabled={resolving === flag.id}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] disabled:opacity-50"
              >
                {resolving === flag.id ? "..." : "Resolve"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
