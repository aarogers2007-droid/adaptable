"use client";

import { useState, useEffect } from "react";
import { getOrgImpactReport, getAtRiskStudents, exportOrgImpactCSV, type OrgImpactReport, type AtRiskStudent } from "./impact-actions";

interface Props {
  orgId: string;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

const RISK_LABELS: Record<string, { label: string; color: string }> = {
  stuck: { label: "Stuck", color: "#F59E0B" },
  not_completing: { label: "Not Completing", color: "#EF4444" },
  lapsing: { label: "Lapsing", color: "#8B5CF6" },
};

export default function ImpactTab({ orgId }: Props) {
  const [tab, setTab] = useState<"impact" | "at_risk">("impact");
  const [report, setReport] = useState<OrgImpactReport | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getOrgImpactReport(orgId),
      getAtRiskStudents(orgId),
    ]).then(([r, a]) => {
      setReport(r);
      setAtRisk(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orgId]);

  async function handleExportCSV() {
    setExportStatus("Generating...");
    const result = await exportOrgImpactCSV(orgId);
    if (result.error || !result.csv) {
      setExportStatus(result.error ?? "Export failed");
      setTimeout(() => setExportStatus(null), 3000);
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename ?? "impact-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportStatus(null);
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)] py-8">Loading impact data...</p>;
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 items-center">
        <button
          onClick={() => setTab("impact")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "impact" ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
          }`}
        >
          Impact
        </button>
        <button
          onClick={() => setTab("at_risk")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "at_risk" ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
          }`}
        >
          Students to Check In With {atRisk.length > 0 && `(${atRisk.length})`}
        </button>
        <div className="ml-auto">
          <button
            onClick={handleExportCSV}
            disabled={exportStatus === "Generating..."}
            className="rounded-lg px-3 py-1.5 text-sm font-medium border border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors disabled:opacity-50"
          >
            {exportStatus ?? "Export CSV"}
          </button>
        </div>
      </div>

      {/* Impact tab */}
      {tab === "impact" && report && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Active Students (30d)" value={report.studentsActiveLast30Days} />
            <StatCard label="Lessons Completed" value={report.lessonsCompletedTotal} sub={`${report.lessonsCompletedLast30Days} in last 30 days`} />
            <StatCard label="Avg Lessons / Student" value={report.avgLessonsPerActiveStudent} sub="active students, last 30 days" />
            <StatCard label="Scenarios Completed" value={report.scenariosCompletedTotal} />
            <StatCard label="Total AI Exchanges" value={report.totalAiExchangesAllTime.toLocaleString()} sub="all time" />
            {report.mostCompletedLesson && (
              <StatCard label="Most Completed Lesson" value={report.mostCompletedLesson.title} sub={`${report.mostCompletedLesson.count} completions`} />
            )}
            {report.mostDroppedLesson && (
              <StatCard label="Most Dropped Lesson" value={report.mostDroppedLesson.title} sub={`${report.mostDroppedLesson.count} drop-offs`} />
            )}
          </div>

          {/* Grade breakdown */}
          {Object.keys(report.studentGradeBreakdown).length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Students by Grade Level</p>
              <div className="flex gap-3">
                {Object.entries(report.studentGradeBreakdown).map(([grade, count]) => (
                  <div key={grade} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-center">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{count}</p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">{grade}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* At-risk tab */}
      {tab === "at_risk" && (
        <div>
          {atRisk.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-8 text-center">
              No at-risk students right now. Great news.
            </p>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Student", "Risk", "Days Inactive", "Current Lesson"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((s) => {
                    const risk = RISK_LABELS[s.risk_reason] ?? { label: s.risk_reason, color: "#999" };
                    return (
                      <tr key={`${s.student_id}-${s.risk_reason}`} className="border-b border-[var(--border)]">
                        <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{s.first_name || "Student"}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: risk.color }}>
                            {risk.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{s.days_since_last_activity}d</td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{s.current_lesson_title ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
