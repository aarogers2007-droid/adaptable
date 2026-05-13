"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data fetching pattern */
import { useState, useEffect } from "react";
import { getScenarioSponsorReport, type SponsorReport } from "@/app/(app)/scenarios/sponsor-report-actions";

interface ScenarioOption {
  id: string;
  title: string;
  sponsor_name: string | null;
  is_sponsored: boolean;
}

export default function SponsorReports({ scenarios }: { scenarios: ScenarioOption[] }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [report, setReport] = useState<SponsorReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) { setReport(null); return; }
    setLoading(true);
    getScenarioSponsorReport(selectedId)
      .then((r) => { setReport(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className="space-y-4">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
      >
        <option value="">Select a scenario...</option>
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}{s.is_sponsored && s.sponsor_name ? ` (${s.sponsor_name})` : ""}
          </option>
        ))}
      </select>

      {loading && <p className="text-sm text-[var(--text-muted)]">Loading report...</p>}

      {report && (
        <div className="space-y-4">
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2">
              <p className="text-xs text-[var(--text-muted)]">Attempted</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{report.totals.total_students_attempted}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2">
              <p className="text-xs text-[var(--text-muted)]">Completed</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{report.totals.total_students_completed}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2">
              <p className="text-xs text-[var(--text-muted)]">Completion Rate</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{(report.totals.overall_completion_rate * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2">
              <p className="text-xs text-[var(--text-muted)]">Avg Exchanges</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{report.totals.avg_exchanges_all_grades.toFixed(1)}</p>
            </div>
          </div>

          {/* Grade breakdown table */}
          {report.per_grade_breakdown.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Grade Level", "Attempted", "Completed", "Rate", "Avg Exchanges", "L1", "L2", "L3"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.per_grade_breakdown.map((row) => (
                    <tr key={row.grade_level} className="border-b border-[var(--border)]">
                      <td className="px-3 py-2 text-sm font-medium text-[var(--text-primary)] capitalize">{row.grade_level}</td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{row.students_attempted}</td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{row.students_completed}</td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{(row.completion_rate * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{row.avg_exchanges.toFixed(1)}</td>
                      <td className="px-3 py-2 text-sm text-[var(--text-muted)]">{row.badge_level_distribution.level_1}</td>
                      <td className="px-3 py-2 text-sm text-[var(--text-muted)]">{row.badge_level_distribution.level_2}</td>
                      <td className="px-3 py-2 text-sm text-[var(--text-muted)]">{row.badge_level_distribution.level_3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.per_grade_breakdown.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No sessions recorded for this scenario yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
