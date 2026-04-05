"use client";

import { useState, useTransition } from "react";
import { acknowledgeAlert, acknowledgeAllAlerts, resolveAlert } from "./actions";
import type { TeacherAlert } from "@/lib/types";

const ALERT_ICONS: Record<string, string> = {
  content_flag: "!",
  emotional: "~",
  stuck: "...",
  inactive: "z",
};

const SEVERITY_STYLES: Record<string, string> = {
  urgent: "border-red-300 bg-red-50",
  warning: "border-amber-300 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
};

const SEVERITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-600",
};

interface AlertPanelProps {
  alerts: (TeacherAlert & { student_name: string })[];
  classIds: string[];
  onMessageStudent?: (studentId: string, studentName: string) => void;
}

export default function AlertPanel({
  alerts: initialAlerts,
  classIds,
  onMessageStudent,
}: AlertPanelProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isPending, startTransition] = useTransition();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-6 py-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">No active alerts.</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Your class is running smoothly.
        </p>
      </div>
    );
  }

  function handleAcknowledge(alertId: string) {
    startTransition(async () => {
      const result = await acknowledgeAlert(alertId);
      if (result.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    });
  }

  function handleResolve(alertId: string) {
    startTransition(async () => {
      const result = await resolveAlert(alertId, resolution || undefined);
      if (result.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        setResolvingId(null);
        setResolution("");
      }
    });
  }

  function handleAcknowledgeAll() {
    startTransition(async () => {
      for (const classId of classIds) {
        await acknowledgeAllAlerts(classId);
      }
      setAlerts([]);
    });
  }

  // Sort: urgent first, then warning, then info
  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { urgent: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const urgentCount = alerts.filter((a) => a.severity === "urgent").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--text-primary)]">
            Alerts
          </h2>
          <span className="text-sm text-[var(--text-muted)]">
            {alerts.length} active
            {urgentCount > 0 && (
              <span className="ml-1 text-red-600">({urgentCount} urgent)</span>
            )}
            {warningCount > 0 && urgentCount === 0 && (
              <span className="ml-1 text-amber-600">({warningCount} warning)</span>
            )}
          </span>
        </div>
        <button
          onClick={handleAcknowledgeAll}
          disabled={isPending}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
        >
          Dismiss all
        </button>
      </div>

      <div className="space-y-2">
        {sortedAlerts.map((alert) => (
          <div key={alert.id}>
            <div
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                SEVERITY_STYLES[alert.severity] ?? ""
              }`}
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--text-secondary)]">
                {ALERT_ICONS[alert.alert_type] ?? "?"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[var(--text-primary)]">
                    {alert.student_name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      SEVERITY_BADGE[alert.severity] ?? ""
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                    {alert.alert_type.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{alert.message}</p>
                {alert.context && (alert.context as Record<string, unknown>).type === "checkin_quality" && (
                  <div className="mt-1.5 rounded bg-[var(--bg-muted)] px-2.5 py-1.5">
                    {((alert.context as Record<string, unknown>).recent_responses as string[] ?? []).map((r, i) => (
                      <p key={i} className="text-xs text-[var(--text-muted)] italic">&ldquo;{r}&rdquo;</p>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {new Date(alert.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onMessageStudent && (
                  <button
                    onClick={() => onMessageStudent(alert.student_id, alert.student_name)}
                    disabled={isPending}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Message
                  </button>
                )}
                <button
                  onClick={() => {
                    setResolvingId(resolvingId === alert.id ? null : alert.id);
                    setResolution("");
                  }}
                  disabled={isPending}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--success)] hover:bg-white transition-colors disabled:opacity-50"
                >
                  Resolve
                </button>
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={isPending}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Resolve form */}
            {resolvingId === alert.id && (
              <div className="mt-1 ml-10 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                <input
                  type="text"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Resolution note (optional)..."
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={isPending}
                  className="rounded-md bg-[var(--success)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "..." : "Confirm"}
                </button>
                <button
                  onClick={() => setResolvingId(null)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
