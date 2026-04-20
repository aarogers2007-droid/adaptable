"use client";

import { useState } from "react";
import { triggerGrouping, revealGroups, moveStudent, loadInventionDashboard } from "./actions";

interface DashboardData {
  classCode: string;
  adminLevel: "platform_owner" | "instructor" | "co_admin" | null;
  totalEnrolled: number;
  completedCount: number;
  inProgressCount: number;
  circle1Counts: Record<string, number>;
  circle2Counts: Record<string, number>;
  studentMap: Record<string, { name: string; email: string }>;
  groups: Array<{ group_number: number; student_ids: string[]; composition_log: any }>;
  groupingThreshold: number;
  groupsRevealed: boolean;
  inProgressStudents: Array<{
    id: string; name: string;
    hasCircle1: boolean; hasCircle2: boolean; hasCircle3: boolean; hasCircle4: boolean; hasCircle5: boolean;
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  physical: "Physical product",
  digital: "Digital tool/app",
  medical: "Medical/health",
  learning: "Learning tool",
  environmental: "Environmental",
  social: "Social/community",
  transport: "Transportation",
  wildcard: "Something new",
};

const ARCHETYPE_LABELS: Record<string, string> = {
  builder: "Builder",
  empath: "Empath",
  systems_thinker: "Systems Thinker",
  connector: "Connector",
  storyteller: "Storyteller",
};

export default function InventionDashboard({
  classId,
  initialData,
}: {
  classId: string;
  initialData: DashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [groupingInProgress, setGroupingInProgress] = useState(false);
  const [revealConfirm, setRevealConfirm] = useState(false);
  const [moveState, setMoveState] = useState<{ studentId: string; fromGroup: number } | null>(null);
  const [moveTarget, setMoveTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "groups">("overview");

  const completionPct = data.totalEnrolled > 0
    ? Math.round((data.completedCount / data.totalEnrolled) * 100)
    : 0;

  const thresholdMet = completionPct >= data.groupingThreshold;

  async function handleRunGrouping() {
    setGroupingInProgress(true);
    setError(null);
    const result = await triggerGrouping(classId);
    if (result.error) {
      setError(result.error);
    } else {
      // Reload data
      const fresh = await loadInventionDashboard(classId);
      if (!fresh.error) setData(fresh as DashboardData);
    }
    setGroupingInProgress(false);
  }

  async function handleReveal() {
    const result = await revealGroups(classId);
    if (result.error) {
      setError(result.error);
    } else {
      setData({ ...data, groupsRevealed: true });
      setRevealConfirm(false);
    }
  }

  async function handleMove() {
    if (!moveState || moveTarget === null) return;
    const result = await moveStudent(classId, moveState.studentId, moveState.fromGroup, moveTarget);
    if (result.error) {
      setError(result.error);
    } else {
      const fresh = await loadInventionDashboard(classId);
      if (!fresh.error) setData(fresh as DashboardData);
    }
    setMoveState(null);
    setMoveTarget(null);
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-8">
      <div className="mx-auto max-w-[1000px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D9488" }}>
              Invention Mode
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              {data.classCode} Dashboard
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "overview" ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab("groups")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "groups" ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        {tab === "overview" && (
          <div className="mt-8 space-y-8">
            {/* Completion meter */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Wizard Completion</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {data.completedCount} of {data.totalEnrolled} students ({completionPct}%)
                </p>
              </div>
              <div className="h-3 rounded-full bg-[var(--bg-muted)]">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${completionPct}%`,
                    background: "linear-gradient(90deg, #F5E642, #A8DB5A, #F4A79D, #6DD5D0)",
                  }}
                />
              </div>
              <div className="mt-2 flex gap-4 text-xs text-[var(--text-muted)]">
                <span>{data.completedCount} completed</span>
                <span>{data.inProgressCount} in progress</span>
                <span>{data.totalEnrolled - data.completedCount - data.inProgressCount} not started</span>
              </div>
            </div>

            {/* Circle breakdowns */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Circle 1 */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">
                  Circle 1 — Invention Type
                </p>
                <div className="space-y-2">
                  {Object.entries(data.circle1Counts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-primary)]">{CATEGORY_LABELS[cat] ?? cat}</span>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Circle 2 */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-4">
                  Circle 2 — Archetype Distribution
                </p>
                <div className="space-y-2">
                  {Object.entries(data.circle2Counts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([arch, count]) => (
                      <div key={arch} className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-primary)]">{ARCHETYPE_LABELS[arch] ?? arch}</span>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* In-progress students */}
            {data.inProgressStudents.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
                  Started but not completed ({data.inProgressStudents.length})
                </p>
                <div className="space-y-2">
                  {data.inProgressStudents.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-[var(--text-primary)]">{s.name}</span>
                      <div className="flex gap-1">
                        {[s.hasCircle1, s.hasCircle2, s.hasCircle3, s.hasCircle4, s.hasCircle5].map((done, i) => (
                          <div
                            key={i}
                            className="h-2 w-4 rounded-full"
                            style={{ background: done ? "#0D9488" : "#E5E7EB" }}
                            title={`Circle ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grouping trigger — hidden for co-admins */}
            {data.adminLevel === "co_admin" ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  {data.groups.length > 0
                    ? "Groups have been generated."
                    : "Grouping is managed by the platform administrator."}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Grouping threshold: {data.groupingThreshold}% — currently at {completionPct}%
                </p>
                <button
                  type="button"
                  onClick={handleRunGrouping}
                  disabled={!thresholdMet || groupingInProgress}
                  className="rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
                >
                  {groupingInProgress ? "Running algorithm..." : thresholdMet ? "Run Grouping Algorithm" : `Waiting for ${data.groupingThreshold}% completion`}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "groups" && (
          <div className="mt-8 space-y-6">
            {/* Print options — only visible when groups exist */}
            {data.groups.length > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <span className="text-sm font-medium text-[var(--text-primary)]">Print:</span>
                <a
                  href={`/instructor/invention/${classId}/print/roster`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                >
                  Print Group Roster
                </a>
                <a
                  href={`/instructor/invention/${classId}/print/slips`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                >
                  Print Student Slips
                </a>
              </div>
            )}

            {data.groups.length === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-8 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  No groups yet. Run the grouping algorithm from the Overview tab.
                </p>
              </div>
            ) : (
              <>
                {/* Reveal button */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {data.groups.length} groups &middot; {data.groupsRevealed ? "Visible to students" : "Hidden from students"}
                  </p>
                  {!data.groupsRevealed && (
                    revealConfirm ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">Are you sure?</span>
                        <button
                          type="button"
                          onClick={handleReveal}
                          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Yes, reveal groups
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevealConfirm(false)}
                          className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRevealConfirm(true)}
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
                      >
                        Reveal Groups to Students
                      </button>
                    )
                  )}
                </div>

                {/* Group cards */}
                {data.groups.map((group) => {
                  const comp = group.composition_log ?? {};
                  return (
                    <div key={group.group_number} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          Group {group.group_number}
                          <span className="ml-2 text-xs text-[var(--text-muted)]">
                            {CATEGORY_LABELS[comp.category] ?? comp.category}
                          </span>
                        </h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          comp.all_criteria_met
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {comp.all_criteria_met ? "All criteria met" : "Needs review"}
                        </span>
                      </div>

                      {/* Students */}
                      <div className="space-y-1 mb-4">
                        {group.student_ids.map((sid: string) => (
                          <div key={sid} className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-primary)]">
                              {data.studentMap[sid]?.name ?? sid.slice(0, 8)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setMoveState({ studentId: sid, fromGroup: group.group_number })}
                              className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)]"
                            >
                              Move
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Composition metrics */}
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-[var(--text-muted)]">Archetypes</p>
                          <p className={comp.missing_archetypes?.length === 0 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                            {comp.missing_archetypes?.length === 0 ? "Pass" : "Gap"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[var(--text-muted)]">Diversity</p>
                          <p className="font-medium text-[var(--text-primary)]">{Math.round((comp.chip_diversity ?? 0) * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[var(--text-muted)]">Scale</p>
                          <p className={Object.values(comp.scale_distribution ?? {}).every((v: any) => v <= 3) ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                            {Object.values(comp.scale_distribution ?? {}).every((v: any) => v <= 3) ? "Pass" : "Review"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[var(--text-muted)]">Visual</p>
                          <p className={comp.has_visual ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                            {comp.has_visual ? "Pass" : "Missing"}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[var(--text-muted)]">Verbal</p>
                          <p className={comp.has_verbal ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                            {comp.has_verbal ? "Pass" : "Missing"}
                          </p>
                        </div>
                      </div>

                      {/* Compromises */}
                      {comp.compromises?.length > 0 && (
                        <div className="mt-3 text-xs text-amber-600">
                          {comp.compromises.map((c: string, i: number) => (
                            <p key={i}>{c}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Move student modal */}
        {moveState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="rounded-xl bg-[var(--bg)] p-6 shadow-lg max-w-sm w-full mx-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Move {data.studentMap[moveState.studentId]?.name ?? "Student"}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Currently in Group {moveState.fromGroup}. Select new group:
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.groups
                  .filter((g) => g.group_number !== moveState.fromGroup)
                  .map((g) => (
                    <button
                      key={g.group_number}
                      type="button"
                      onClick={() => setMoveTarget(g.group_number)}
                      className={`rounded-lg border px-4 py-2 text-sm ${
                        moveTarget === g.group_number
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 font-semibold"
                          : "border-[var(--border)]"
                      }`}
                    >
                      Group {g.group_number}
                    </button>
                  ))}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setMoveState(null); setMoveTarget(null); }}
                  className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMove}
                  disabled={moveTarget === null}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
