"use client";

/* eslint-disable react-hooks/set-state-in-effect -- data fetching pattern */

import { useState, useEffect } from "react";
import { fetchPlatformAnalytics, type PlatformAnalytics } from "./analytics-actions";

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold" style={{ color: color ?? "var(--text-primary)" }}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

export default function AJAnalytics() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  function refresh() {
    setLoading(true);
    fetchPlatformAnalytics().then((d) => {
      setData(d);
      setLoading(false);
      setLastRefresh(new Date());
    }).catch(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  if (loading && !data) {
    return <p className="text-sm text-[var(--text-muted)] py-8">Loading analytics...</p>;
  }

  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
          Platform Analytics
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)]">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="Total Students" value={data.totalStudents} />
        <Stat label="Active (24h)" value={data.activeLast24h} color={data.activeLast24h > 0 ? "#10B981" : undefined} />
        <Stat label="Active (7d)" value={data.activeLast7d} />
        <Stat label="Active (30d)" value={data.activeLast30d} />
        <Stat label="Total Orgs" value={data.totalOrgs} />
        <Stat label="Total Classes" value={data.totalClasses} />
      </div>

      {/* Lessons + Scenarios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <Stat label="Lessons Completed" value={data.lessonsCompletedTotal} sub={`${data.lessonsCompletedLast24h} in 24h`} />
        <Stat label="Scenarios Completed" value={data.scenariosCompletedTotal} />
        <Stat label="AI Exchanges (all time)" value={data.totalAiExchanges.toLocaleString()} />
        <Stat label="AI Exchanges (24h)" value={data.aiExchangesLast24h} />
      </div>

      {/* Cost tracking */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <Stat label="Total API Cost" value={`$${data.totalApiCost.toFixed(2)}`} />
        <Stat label="Cost (24h)" value={`$${data.apiCostLast24h.toFixed(2)}`} />
        <Stat label="Avg Cost / Student" value={`$${data.avgCostPerStudent.toFixed(3)}`} />
        <Stat label="Avg Cost / Exchange" value={`$${data.avgCostPerExchange.toFixed(4)}`} />
      </div>

      {/* Model usage breakdown */}
      {data.modelBreakdown.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Model Usage</p>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Model", "Calls", "Input Tokens", "Output Tokens", "Cost"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.modelBreakdown.map((m) => (
                  <tr key={m.model} className="border-b border-[var(--border)]">
                    <td className="px-3 py-2 text-xs font-mono text-[var(--text-primary)]">{m.model}</td>
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{m.calls.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{m.inputTokens.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{m.outputTokens.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">${m.cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ratings */}
      {data.ratings.total > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Student Ratings</p>
          <div className="flex gap-3 items-center">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{data.ratings.average.toFixed(1)}</span>
            <span className="text-sm text-[var(--text-muted)]">/ 5</span>
            <span className="text-xs text-[var(--text-muted)]">({data.ratings.total} ratings)</span>
            <div className="flex gap-1 ml-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="text-center">
                  <div className="text-[10px] text-[var(--text-muted)]">{star}★</div>
                  <div className="text-xs font-medium text-[var(--text-primary)]">{data.ratings.distribution[star] ?? 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Crisis alerts */}
      {data.crisisAlerts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">
            Crisis Alerts ({data.crisisAlerts.length})
          </p>
          <div className="space-y-2">
            {data.crisisAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-700">{alert.studentName}</span>
                  <span className="text-[10px] text-red-400">{new Date(alert.createdAt).toLocaleString()}</span>
                  {!alert.acknowledged && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>}
                </div>
                <p className="text-xs text-red-600 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* At-risk students */}
      {data.atRiskStudents.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">
            At-Risk Students ({data.atRiskStudents.length})
          </p>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Student", "Risk", "Days Inactive", "Lesson"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-medium text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.atRiskStudents.map((s, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="px-3 py-2 text-xs text-[var(--text-primary)]">{s.firstName}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white" style={{
                        background: s.risk === "stuck" ? "#F59E0B" : s.risk === "not_completing" ? "#EF4444" : "#8B5CF6"
                      }}>
                        {s.risk}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{s.daysInactive}d</td>
                    <td className="px-3 py-2 text-xs text-[var(--text-secondary)]">{s.currentLesson ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade breakdown */}
      {Object.keys(data.gradeBreakdown).length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Students by Grade</p>
          <div className="flex gap-3">
            {Object.entries(data.gradeBreakdown).map(([grade, count]) => (
              <div key={grade} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-center">
                <p className="text-lg font-bold text-[var(--text-primary)]">{count}</p>
                <p className="text-[10px] text-[var(--text-muted)] capitalize">{grade}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement stats */}
      {data.engagementStats.avgResponseTimeMs > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Stat label="Avg Response Time" value={`${(data.engagementStats.avgResponseTimeMs / 1000).toFixed(1)}s`} />
          <Stat label="Median Response Time" value={`${(data.engagementStats.medianResponseTimeMs / 1000).toFixed(1)}s`} />
          <Stat label="Avg Session Duration" value={`${Math.round(data.engagementStats.avgSessionDurationS / 60)}min`} />
          <Stat label="Avg Exchanges / Session" value={data.engagementStats.avgExchangesPerSession.toFixed(1)} />
        </div>
      )}
    </div>
  );
}
