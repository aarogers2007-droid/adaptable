"use client";

import { useState, useEffect } from "react";
import { getStudentInterventions } from "./agency-actions";

interface InterventionHistoryProps {
  studentId: string;
  classId: string;
}

const ACTION_LABELS: Record<string, { icon: string; label: string }> = {
  message_sent: { icon: "💬", label: "Message sent" },
  nudge_sent: { icon: "👋", label: "Nudge sent" },
  alert_resolved: { icon: "✓", label: "Alert resolved" },
  alert_acknowledged: { icon: "👁", label: "Alert acknowledged" },
  comment_left: { icon: "📝", label: "Comment left" },
  comment_deleted: { icon: "🗑", label: "Comment removed" },
  flag_set: { icon: "🚩", label: "Flagged for follow-up" },
  flag_resolved: { icon: "✓", label: "Follow-up resolved" },
};

export default function InterventionHistory({ studentId, classId }: InterventionHistoryProps) {
  const [entries, setEntries] = useState<Array<{
    id: string;
    action_type: string;
    details: Record<string, unknown> | null;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentInterventions(studentId, classId).then((data) => {
      setEntries(data as typeof entries);
      setLoading(false);
    });
  }, [studentId, classId]);

  if (loading) {
    return <div className="py-4 text-xs text-[var(--text-muted)]">Loading history...</div>;
  }

  if (entries.length === 0) {
    return (
      <p className="py-4 text-xs text-[var(--text-muted)]">
        No interventions recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {entries.map((entry) => {
        const action = ACTION_LABELS[entry.action_type] ?? { icon: "•", label: entry.action_type };
        const details = entry.details as Record<string, string> | null;
        const preview = details?.message_preview || details?.comment_preview || details?.note || "";

        return (
          <div key={entry.id} className="flex gap-2 text-xs">
            <span className="shrink-0 mt-0.5">{action.icon}</span>
            <div className="flex-1">
              <span className="font-medium text-[var(--text-primary)]">{action.label}</span>
              {preview && (
                <p className="text-[var(--text-muted)] mt-0.5 line-clamp-2">{preview}</p>
              )}
            </div>
            <span className="shrink-0 text-[var(--text-muted)]">
              {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
