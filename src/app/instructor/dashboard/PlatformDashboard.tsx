"use client";

import { useState, useEffect } from "react";
import {
  getOrgImpactReport,
  getAtRiskStudents,
  getStudentRoster,
  exportOrgImpactCSV,
  type OrgImpactReport,
  type AtRiskStudent,
  type RosterStudent,
} from "./impact-actions";
import LessonHealth from "./LessonHealth";
import StudentSegments from "./StudentSegments";

interface Props {
  orgId: string;
  totalStudents: number;
}

function StatCard({ label, value, delta, context, sparkColor }: {
  label: string;
  value: string | number;
  delta?: { value: string; direction: "up" | "down" };
  context?: string;
  sparkColor?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow">
      <p className="text-[13px] font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-[family-name:var(--font-display)] text-[28px] font-bold text-[var(--text-primary)] leading-tight">{typeof value === "number" ? value.toLocaleString() : value}</span>
        {delta && (
          <span className={`text-[13px] font-semibold ${delta.direction === "up" ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
            {delta.direction === "up" ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
      {context && <p className="text-[13px] text-[var(--text-muted)] mt-1">{context}</p>}
      {sparkColor && (
        <div className="h-6 mt-2">
          <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-6">
            <polyline points="0,22 15,20 30,17 45,14 55,12 65,10 75,8 85,6 100,4" fill="none" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

const GRADE_LABELS: Record<string, string> = {
  high_school: "High School",
  high: "High School",
  middle_school: "Middle School",
  middle: "Middle School",
  upper_elementary: "Upper Elementary",
  elementary: "Elementary",
  unknown: "Unknown",
};

const STATUS_STYLES = {
  active: { bg: "rgba(5,150,105,0.1)", color: "var(--success)", label: "Active" },
  "at-risk": { bg: "rgba(239,68,68,0.1)", color: "var(--error)", label: "At Risk" },
  inactive: { bg: "var(--bg-muted)", color: "var(--text-muted)", label: "Inactive" },
} as const;

export default function PlatformDashboard({ orgId, totalStudents }: Props) {
  const [report, setReport] = useState<OrgImpactReport | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      getOrgImpactReport(orgId),
      getAtRiskStudents(orgId),
      getStudentRoster(orgId),
    ]).then(([r, a, s]) => {
      setReport(r);
      setAtRisk(a);
      setRoster(s);
      setLoading(false);
    }).catch((err) => {
      console.error("[PlatformDashboard] failed to load:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
      setLoading(false);
    });
  }, [orgId]);

  async function handleExportCSV() {
    const includeEmails = window.confirm(
      "This export can include student email addresses for verification purposes.\n\nInclude emails? Click OK to include, Cancel to mask them."
    );
    setExportStatus("Generating...");
    const result = await exportOrgImpactCSV(orgId, includeEmails);
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
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--bg-muted)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5 p-6 text-center">
        <p className="text-sm font-medium text-[var(--error)]">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-dark)] transition-colors">
          Refresh
        </button>
      </div>
    );
  }

  const filteredRoster = searchQuery
    ? roster.filter((s) =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.businessName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : roster;

  const businessIdeasCount = roster.filter((s) => s.businessName).length;

  return (
    <div>
      {/* Export */}
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={handleExportCSV}
          disabled={exportStatus === "Generating..."}
          className="rounded-lg px-4 py-2.5 text-sm font-medium border border-[var(--primary)] text-[var(--primary)] bg-[var(--bg)] hover:bg-[rgba(13,148,136,0.06)] transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {exportStatus ?? "Export CSV"}
        </button>
      </div>

      {/* Stat Grid */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Students"
            value={report.studentsActiveLast30Days}
            delta={{ value: "last 30d", direction: "up" }}
            context={`of ${totalStudents} total (${totalStudents > 0 ? Math.round((report.studentsActiveLast30Days / totalStudents) * 100) : 0}% active)`}
            sparkColor="#0D9488"
          />
          <StatCard
            label="Lessons Completed"
            value={report.lessonsCompletedTotal}
            delta={report.lessonsCompletedLast30Days > 0 ? { value: `${report.lessonsCompletedLast30Days} this month`, direction: "up" } : undefined}
            context={`${report.avgLessonsPerActiveStudent} avg per active student`}
            sparkColor="#0D9488"
          />
          <StatCard
            label="Business Ideas"
            value={businessIdeasCount}
            context={`${totalStudents > 0 ? Math.round((businessIdeasCount / totalStudents) * 100) : 0}% of students generated an idea`}
            sparkColor="#0D9488"
          />
          <StatCard
            label="AI Exchanges"
            value={report.totalAiExchangesAllTime}
            context={`${report.studentsActiveLast30Days > 0 ? Math.round(report.totalAiExchangesAllTime / report.studentsActiveLast30Days) : 0} avg per active student`}
            sparkColor="#0D9488"
          />
        </div>
      )}

      {/* Grade Breakdown */}
      {report && Object.keys(report.studentGradeBreakdown).length > 0 && (
        <div className="mt-6">
          <p className="text-[13px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">Students by Grade Level</p>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(report.studentGradeBreakdown).map(([grade, count]) => (
              <div key={grade} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-5 py-3 text-center flex-1 min-w-[100px]">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">{count}</p>
                <p className="text-[13px] text-[var(--text-muted)] capitalize mt-0.5">{GRADE_LABELS[grade] ?? grade}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Idea Distribution */}
      <div className="mt-8 border-t border-[var(--border)] pt-8">
        <p className="text-[13px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-4">Business Idea Distribution</p>
        <StudentSegments orgId={orgId} />
      </div>

      {/* Lesson Health */}
      <div className="mt-8 border-t border-[var(--border)] pt-8">
        <p className="text-[13px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-4">Lesson Health</p>
        <LessonHealth orgId={orgId} />
      </div>

      {/* At-risk banner */}
      {atRisk.length > 0 && (
        <div className="mt-8 rounded-xl border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.04)] p-4 flex items-center gap-3 flex-wrap">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--error)] shrink-0 animate-pulse" />
          <p className="text-sm text-[var(--text-primary)] flex-1">
            <strong>{atRisk.length} student{atRisk.length !== 1 ? "s" : ""}</strong> inactive for 3+ days with incomplete progress
          </p>
        </div>
      )}

      {/* Student Roster */}
      <div className="mt-8 border-t border-[var(--border)] pt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-[13px] font-medium text-[var(--text-muted)] uppercase tracking-wide">All Students</p>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm outline-none w-full sm:w-[260px] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-colors"
          />
        </div>
        <div className="overflow-x-auto -mx-1 px-1" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Name", "Grade", "Business Idea", "Progress", "Last Active", "Status"].map((h) => (
                  <th key={h} className="text-left text-[13px] font-medium text-[var(--text-muted)] px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((s) => {
                const style = STATUS_STYLES[s.status];
                const pct = s.totalLessons > 0 ? Math.round((s.lessonsCompleted / s.totalLessons) * 100) : 0;
                const lastDate = s.lastActive ? new Date(s.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
                return (
                  <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] sticky left-0 bg-[var(--bg)]">{s.fullName}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] capitalize">{GRADE_LABELS[s.gradeTier] ?? s.gradeTier}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{s.businessName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-[60px] h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{s.lessonsCompleted}/{s.totalLessons}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{lastDate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: style.bg, color: style.color }}>
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredRoster.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                    {searchQuery ? "No students match your search" : "No students yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
