"use client";

import { useState, useRef, useEffect } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import RawView from "./RawView";
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
  const [tab, setTab] = useState<"overview" | "groups" | "algorithm">("overview");
  const [rawViewOpen, setRawViewOpen] = useState(false);
  const [algorithmLog, setAlgorithmLog] = useState<any>(null);

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
      // Store the algorithm log for Raw View replay
      if (result.log) setAlgorithmLog(result.log);
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
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
            {data.groups.length > 0 && (
              <button
                type="button"
                onClick={() => setTab("algorithm")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === "algorithm" ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                }`}
              >
                Algorithm
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        {tab === "overview" && (
          <div className="mt-8 space-y-8">
            {/* Shareable link */}
            <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-5">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-2">Shareable Link</p>
              <p className="text-sm text-[var(--text-secondary)] mb-3">Send this to participants, schools, or parents. It&apos;s the single entry point for all students.</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/venture` : "/venture"}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-mono text-[var(--text-primary)] outline-none"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/venture`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-dark)] transition-colors shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>

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

            {/* Raw View toggle */}
            {data.groups.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setRawViewOpen(!rawViewOpen)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    rawViewOpen
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  {rawViewOpen ? "Hide Raw View" : "Raw View"}
                </button>
                {rawViewOpen && (
                  <div className="mt-4">
                    <RawView algorithmLog={algorithmLog} />
                  </div>
                )}
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

                      {/* Staff suggestions for gaps */}
                      {!comp.all_criteria_met && (
                        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Staff support suggestions</p>
                          {(comp.missing_archetypes ?? []).map((arch: string) => (
                            <p key={arch} className="text-xs text-blue-600">
                              {arch === "builder" && "Assign a staff mentor with prototyping/maker skills to help this group turn ideas into tangible models."}
                              {arch === "empath" && "Assign a staff mentor who can guide empathy exercises — help this group interview real users and understand their needs."}
                              {arch === "systems_thinker" && "Assign a staff mentor with root-cause analysis skills — help this group map the system around their problem before jumping to solutions."}
                              {arch === "connector" && "Assign a staff mentor with cross-disciplinary knowledge — help this group find existing solutions they can adapt."}
                              {arch === "storyteller" && "Assign a staff mentor who can coach presentation skills — help this group frame their invention as a compelling story."}
                            </p>
                          ))}
                          {!comp.has_visual && (
                            <p className="text-xs text-blue-600">
                              No visual communicator — assign a staff mentor who can help with sketching, prototyping, or poster design.
                            </p>
                          )}
                          {!comp.has_verbal && (
                            <p className="text-xs text-blue-600">
                              No verbal communicator — assign a staff mentor who can coach this group on pitching and writing out their concept.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Algorithm stream tab */}
        {tab === "algorithm" && data.groups.length > 0 && (
          <div className="mt-8">
            <AlgorithmStream
              groups={data.groups}
              studentMap={data.studentMap}
              circle1Counts={data.circle1Counts}
              circle2Counts={data.circle2Counts}
            />
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

// ── Algorithm Stream Terminal ──

function AlgorithmStream({
  groups,
  studentMap,
  circle1Counts,
  circle2Counts,
}: {
  groups: DashboardData["groups"];
  studentMap: DashboardData["studentMap"];
  circle1Counts: Record<string, number>;
  circle2Counts: Record<string, number>;
}) {
  const [lines, setLines] = useState<Array<{ text: string; cls: string }>>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5x, 1x, 2x, 4x
  const speedRef = useRef(speed);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  function buildScript(): Array<{ text: string; cls: string; delay: number }> {
    const s: Array<{ text: string; cls: string; delay: number }> = [];
    const totalStudents = groups.reduce((sum, g) => sum + g.student_ids.length, 0);

    s.push({ text: "$ venture-group --class VENTURE --run", cls: "data", delay: 500 });
    s.push({ text: "", cls: "", delay: 300 });
    s.push({ text: `Initializing grouping algorithm for VENTURE...`, cls: "", delay: 250 });
    s.push({ text: `Loading ${totalStudents} student profiles...`, cls: "", delay: 400 });
    s.push({ text: `Configuration: group_size=5, threshold=80%`, cls: "", delay: 200 });
    s.push({ text: "", cls: "", delay: 250 });

    // Step 1
    s.push({ text: "── Step 1: Sorting by invention category (The Wish) ──", cls: "step", delay: 500 });
    for (const [cat, count] of Object.entries(circle1Counts).sort((a, b) => b[1] - a[1])) {
      const label = CATEGORY_LABELS[cat] ?? cat;
      s.push({ text: `  ${label.padEnd(30)} — ${count} students identified`, cls: "data", delay: 150 });
    }
    s.push({ text: `  ✓ ${Object.keys(circle1Counts).length} category pools formed`, cls: "pass", delay: 350 });
    s.push({ text: "", cls: "", delay: 250 });

    // Step 2
    s.push({ text: "── Step 2: Distributing archetypes (The Mind) ──", cls: "step", delay: 500 });
    s.push({ text: "  Target per group: Builder + Empath + Systems Thinker (minimum)", cls: "", delay: 250 });
    s.push({ text: "", cls: "", delay: 150 });

    for (const group of groups) {
      const comp = group.composition_log ?? {};
      s.push({ text: `  Group ${group.group_number} (${CATEGORY_LABELS[comp.category] ?? comp.category ?? "mixed"}):`, cls: "data", delay: 250 });
      for (const sid of group.student_ids) {
        const name = (studentMap[sid]?.name ?? "Unknown").padEnd(20);
        const archIdx = (comp.archetypes ?? [])[ group.student_ids.indexOf(sid) ];
        s.push({ text: `    ${name} → ${ARCHETYPE_LABELS[archIdx] ?? archIdx ?? "—"}`, cls: "", delay: 80 });
      }
      const missing = comp.missing_archetypes ?? [];
      if (missing.length === 0) {
        s.push({ text: "    ✓ Builder + Empath + Systems Thinker present", cls: "pass", delay: 250 });
      } else {
        s.push({ text: `    ⚠ Missing: ${missing.map((m: string) => ARCHETYPE_LABELS[m] ?? m).join(", ")}`, cls: "warn", delay: 300 });
      }
      s.push({ text: "", cls: "", delay: 100 });
    }

    // Step 3
    s.push({ text: "── Step 3: Evaluating chip diversity (The Lens) ──", cls: "step", delay: 500 });
    for (const group of groups) {
      const comp = group.composition_log ?? {};
      const div = Math.round((comp.chip_diversity ?? 0) * 100);
      s.push({ text: `  Group ${group.group_number}: ${div}% chip diversity`, cls: div >= 60 ? "pass" : "", delay: 150 });
    }
    s.push({ text: "", cls: "", delay: 250 });

    // Step 4
    s.push({ text: "── Step 4: Checking scale balance (The Scale) ──", cls: "step", delay: 500 });
    for (const group of groups) {
      const comp = group.composition_log ?? {};
      const dist = comp.scale_distribution ?? {};
      const balanced = Object.values(dist).every((v: any) => v <= 3);
      if (balanced) {
        s.push({ text: `  Group ${group.group_number}: ✓ balanced`, cls: "pass", delay: 150 });
      } else {
        const over = Object.entries(dist).find(([, v]) => (v as number) > 3);
        s.push({ text: `  Group ${group.group_number}: ⚠ ${over?.[0]} overrepresented (${over?.[1]}×) — accepted with note`, cls: "warn", delay: 300 });
      }
    }
    s.push({ text: "", cls: "", delay: 250 });

    // Step 5
    s.push({ text: "── Step 5: Checking voice coverage (The Voice) ──", cls: "step", delay: 500 });
    for (const group of groups) {
      const comp = group.composition_log ?? {};
      const vis = comp.has_visual ? "✓" : "✗";
      const verb = comp.has_verbal ? "✓" : "✗";
      const cls = comp.has_visual && comp.has_verbal ? "pass" : "warn";
      s.push({ text: `  Group ${group.group_number}: visual ${vis}  verbal ${verb}`, cls, delay: 200 });
    }
    s.push({ text: "", cls: "", delay: 300 });

    // Summary
    s.push({ text: "═══════════════════════════════════════════════════", cls: "step", delay: 250 });
    s.push({ text: "", cls: "", delay: 150 });
    const allMet = groups.filter(g => g.composition_log?.all_criteria_met).length;
    const withNotes = groups.length - allMet;
    s.push({ text: `Algorithm complete. ${groups.length} groups formed.`, cls: "final", delay: 400 });
    s.push({ text: `${allMet} groups met all 5 criteria.`, cls: "final", delay: 250 });
    if (withNotes > 0) {
      s.push({ text: `${withNotes} groups accepted with notes.`, cls: "warn", delay: 250 });
    }
    s.push({ text: "", cls: "", delay: 150 });
    s.push({ text: "Groups written to invention_groups. Ready for admin review.", cls: "final", delay: 400 });

    return s;
  }

  async function runStream() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setLines([]);

    const script = buildScript();

    for (const line of script) {
      const delay = line.delay / speedRef.current;
      if (line.text === "") {
        setLines(prev => [...prev, { text: "\u00A0", cls: "" }]);
        await new Promise(r => setTimeout(r, delay));
      } else {
        // Typewriter: add chars progressively
        for (let c = 1; c <= line.text.length; c++) {
          setLines(prev => {
            const copy = [...prev];
            if (copy.length > 0 && copy[copy.length - 1].cls === line.cls + " typing") {
              copy[copy.length - 1] = { text: line.text.slice(0, c), cls: line.cls + " typing" };
            } else {
              copy.push({ text: line.text.slice(0, c), cls: line.cls + " typing" });
            }
            return copy;
          });
          await new Promise(r => setTimeout(r, (20 + Math.random() * 15) / speedRef.current));
        }
        // Finalize line (remove typing marker)
        setLines(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { text: line.text, cls: line.cls };
          return copy;
        });
        await new Promise(r => setTimeout(r, delay));
      }

      // Auto-scroll
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }

    setRunning(false);
    setDone(true);
  }

  const SPEEDS = [0.5, 1, 2, 4];

  const colorMap: Record<string, string> = {
    step: "#C084FC",
    data: "#F0EDE8",
    pass: "#4ADE80",
    warn: "#FBBF24",
    final: "#C084FC",
  };

  return (
    <div>
      {/* Terminal */}
      <div className="rounded-xl border border-[#2A2A2A] overflow-hidden" style={{ background: "#0A0A0A" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]" style={{ background: "#1A1A1A" }}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "#F87171" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#FBBF24" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#4ADE80" }} />
          </div>
          <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#6A6A6A" }}>VENTURE — Grouping Algorithm</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={runStream}
              disabled={running}
              className="rounded px-3 py-1 text-xs font-medium border transition-colors"
              style={{
                fontFamily: "monospace",
                borderColor: running ? "#2A2A2A" : "#C084FC",
                color: running ? "#4A4A4A" : "#C084FC",
                background: "#1A1A1A",
                cursor: running ? "not-allowed" : "pointer",
              }}
            >
              {running ? "Running..." : done ? "Replay" : "Run Algorithm"}
            </button>
          </div>
        </div>

        {/* Output */}
        <div
          ref={outputRef}
          className="overflow-y-auto"
          style={{ height: "480px", padding: "16px", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.8 }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ color: colorMap[line.cls.replace(" typing", "")] ?? "#9A9A9A", fontWeight: line.cls.includes("final") ? 700 : 400 }}>
              {line.text}
              {i === lines.length - 1 && running && (
                <span style={{ display: "inline-block", width: "7px", height: "14px", background: "#C084FC", marginLeft: "2px", verticalAlign: "text-bottom", animation: "blink 0.8s step-end infinite" }} />
              )}
            </div>
          ))}
          {lines.length === 0 && !running && (
            <div style={{ color: "#3A3A3A" }}>Click &ldquo;Run Algorithm&rdquo; to see the grouping process.</div>
          )}
        </div>
      </div>

      {/* Speed controls */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <span className="text-xs text-[var(--text-muted)]">Speed:</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              speed === s
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }` }} />
    </div>
  );
}
