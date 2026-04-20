"use client";

import { useState, useRef, useEffect } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
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
  const [algorithmLog, setAlgorithmLog] = useState<any>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

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
      if ("log" in result && result.log) setAlgorithmLog(result.log);
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
                onClick={() => setTerminalOpen(true)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: "#C084FC",
                  boxShadow: "0 0 12px rgba(192,132,252,0.4), 0 0 30px rgba(192,132,252,0.15)",
                  animation: "purpleGlow 2s ease-in-out infinite alternate",
                }}
              >
                View Algorithm
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

        {/* Algorithm terminal — opens over current tab content */}
        {terminalOpen && data.groups.length > 0 && (
          <div className="mt-8">
            <AlgorithmStream
              groups={data.groups}
              studentMap={data.studentMap}
              circle1Counts={data.circle1Counts}
              circle2Counts={data.circle2Counts}
              algorithmLog={algorithmLog}
              onClose={() => setTerminalOpen(false)}
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

function isNearBottom(el: HTMLElement | null): boolean {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 60;
}

function AlgorithmStream({
  groups,
  studentMap,
  circle1Counts,
  circle2Counts,
  algorithmLog,
  onClose,
}: {
  groups: DashboardData["groups"];
  studentMap: DashboardData["studentMap"];
  circle1Counts: Record<string, number>;
  circle2Counts: Record<string, number>;
  algorithmLog: any;
  onClose: () => void;
}) {
  const [viewMode, setViewMode] = useState<"normal" | "raw">("normal");
  const [lines, setLines] = useState<Array<{ text: string; cls: string }>>([]);
  const [rawChars, setRawChars] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(speed);
  const outputRef = useRef<HTMLDivElement>(null);
  const rawRef = useRef<HTMLDivElement>(null);

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
    s.push({ text: "", cls: "", delay: 800 });
    s.push({ text: '"Have a great day" — AJ Rogers', cls: "easter", delay: 0 });

    return s;
  }

  async function runStream() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setLines([]);
    setRawChars(0);
    rawUserScrolled.current = false;

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

      // Auto-scroll only if user hasn't scrolled away
      if (outputRef.current && isNearBottom(outputRef.current)) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
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
    easter: "#A78BFA",
  };

  // Raw mode: typewriter for source code
  const rawFullText = RAW_SOURCE_LINES.map(l => l.code).join("\n");
  const rawTotalChars = rawFullText.length;

  // Drive raw typewriter — slower and more cinematic for non-technical viewers
  useEffect(() => {
    if (!running) return;
    let frame: number;
    let charIdx = 0;
    const tick = () => {
      // Vary speed: faster on whitespace/brackets, slower on keywords
      const ch = rawFullText[charIdx] ?? "";
      const isWhitespace = ch === " " || ch === "\n";
      const advance = isWhitespace ? 2 : 1;
      const delay = isWhitespace ? 12 : (28 + Math.random() * 18); // 28-46ms per visible char
      charIdx += advance;
      if (charIdx > rawTotalChars) charIdx = rawTotalChars;
      setRawChars(charIdx);
      if (charIdx < rawTotalChars && running) {
        frame = window.setTimeout(tick, delay / speedRef.current);
      }
    };
    frame = window.setTimeout(tick, 400);
    return () => clearTimeout(frame);
  }, [running, rawTotalChars]);

  // Compute which raw lines/chars to show
  const rawDisplayText = rawFullText.slice(0, rawChars);
  const rawDisplayLines = rawDisplayText.split("\n");

  // Auto-scroll raw only if user hasn't scrolled up
  const rawUserScrolled = useRef(false);
  useEffect(() => {
    const el = rawRef.current;
    if (!el) return;
    const handler = () => { rawUserScrolled.current = !isNearBottom(el); };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (viewMode === "raw" && running && !rawUserScrolled.current && rawRef.current) {
      rawRef.current.scrollTop = rawRef.current.scrollHeight;
    }
  }, [rawChars, viewMode, running]);

  function handleFullscreen() {
    terminalRef.current?.requestFullscreen?.();
  }

  return (
    <div ref={terminalRef} className="rounded-xl border border-[#2A2A2A] overflow-hidden" style={{ background: "#0A0A0A" }}>
      {/* Header with functional window buttons */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]" style={{ background: "#1A1A1A" }}>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="w-3 h-3 rounded-full border-0 cursor-pointer" style={{ background: "#F87171" }} title="Close" />
          <button type="button" onClick={onClose} className="w-3 h-3 rounded-full border-0 cursor-pointer" style={{ background: "#FBBF24" }} title="Minimize" />
          <button type="button" onClick={handleFullscreen} className="w-3 h-3 rounded-full border-0 cursor-pointer" style={{ background: "#4ADE80" }} title="Fullscreen" />
        </div>
        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#6A6A6A" }}>
          {viewMode === "raw" ? "invention-grouping.ts" : "VENTURE — Grouping Algorithm"}
        </span>
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

      {/* Normal mode — always rendered, hidden via display */}
      <div
        ref={outputRef}
        className="overflow-y-auto"
        style={{ height: "480px", padding: "16px", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.8, display: viewMode === "normal" ? "block" : "none" }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{
            color: colorMap[line.cls.replace(" typing", "")] ?? "#9A9A9A",
            fontWeight: line.cls.includes("final") || line.cls.includes("easter") ? 700 : 400,
            fontStyle: line.cls.includes("easter") ? "italic" : "normal",
          }}>
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

      {/* Raw mode — always rendered, hidden via display */}
      <div
        ref={rawRef}
        className="overflow-y-auto"
        style={{ height: "480px", padding: "12px 0", fontFamily: "monospace", fontSize: "11px", lineHeight: 1.7, display: viewMode === "raw" ? "block" : "none" }}
      >
        {rawChars === 0 && !running ? (
          <div style={{ padding: "16px", color: "#3A3A3A" }}>Click &ldquo;Run Algorithm&rdquo; to see the source code.</div>
        ) : (
          rawDisplayLines.map((line, i) => {
            const isLastLine = i === rawDisplayLines.length - 1;
            const isComplete = !isLastLine || rawChars >= rawTotalChars;
            return (
              <div key={i} style={{ padding: "0 12px", display: "flex", gap: "10px" }}>
                <span style={{ color: "#3A3A3A", width: "28px", textAlign: "right", flexShrink: 0, userSelect: "none", fontSize: "10px" }}>
                  {i + 1}
                </span>
                {isComplete ? (
                  <span style={{ whiteSpace: "pre", color: "#E8E8E8" }} dangerouslySetInnerHTML={{ __html: colorizeCode(line) || "&nbsp;" }} />
                ) : (
                  <span style={{ color: "#E8E8E8", whiteSpace: "pre" }}>
                    {line}
                    {running && rawChars < rawTotalChars && (
                      <span style={{ display: "inline-block", width: "6px", height: "13px", background: "#C084FC", marginLeft: "1px", verticalAlign: "text-bottom", animation: "blink 0.8s step-end infinite" }} />
                    )}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom bar — inside terminal: pill toggle + speed slider */}
      <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-[#2A2A2A]" style={{ background: "#1A1A1A" }}>
        {/* Speed slider */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#4A4A4A" }}>Speed</span>
          <input
            type="range"
            min={0}
            max={3}
            value={SPEEDS.indexOf(speed)}
            onChange={(e) => setSpeed(SPEEDS[parseInt(e.target.value)])}
            className="w-16 h-1 appearance-none rounded-full cursor-pointer"
            style={{ background: `linear-gradient(to right, #C084FC ${(SPEEDS.indexOf(speed) / 3) * 100}%, #2A2A2A ${(SPEEDS.indexOf(speed) / 3) * 100}%)`, accentColor: "#C084FC" }}
          />
        </div>

        {/* Normal / Raw toggle */}
        <div className="flex gap-1 rounded-md p-0.5" style={{ background: "#2A2A2A" }}>
          <button
            type="button"
            onClick={() => setViewMode("normal")}
            className="rounded px-3 py-1 transition-colors"
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: 500,
              background: viewMode === "normal" ? "#3A3A3A" : "transparent",
              color: viewMode === "normal" ? "#E8E8E8" : "#6A6A6A",
            }}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className="rounded px-3 py-1 transition-colors"
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              fontWeight: 500,
              background: viewMode === "raw" ? "#3A3A3A" : "transparent",
              color: viewMode === "raw" ? "#E8E8E8" : "#6A6A6A",
            }}
          >
            Raw
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes purpleGlow {
          0% { box-shadow: 0 0 12px rgba(192,132,252,0.3), 0 0 30px rgba(192,132,252,0.1); }
          100% { box-shadow: 0 0 18px rgba(192,132,252,0.5), 0 0 45px rgba(192,132,252,0.2); }
        }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #C084FC; cursor: pointer; }
        input[type="range"]::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: #C084FC; border: none; cursor: pointer; }
      ` }} />
    </div>
  );
}

// ── Raw Source View — syntax-highlighted algorithm source with step highlighting ──

const RAW_SOURCE_LINES: Array<{ code: string; step: number }> = [
  { code: 'import [REDACTED];', step: -1 },
  { code: 'import { createClient } from [REDACTED];', step: -1 },
  { code: '', step: -1 },
  { code: '// Invention Mode Grouping Algorithm', step: -1 },
  { code: '// Five-step sort: category \u2192 archetype \u2192 chips \u2192 scale \u2192 voice', step: -1 },
  { code: '', step: -1 },
  { code: 'const VISUAL_CHIPS = ["Draw it", "Build a prototype", "Build a slide or poster"];', step: -1 },
  { code: 'const VERBAL_CHIPS = ["Explain it out loud", "Write it out"];', step: -1 },
  { code: 'const TARGET_ARCHETYPES = ["builder", "empath", "systems_thinker"];', step: -1 },
  { code: '', step: -1 },
  { code: 'export async function runGroupingAlgorithm(classCode, groupSize = 5) {', step: 0 },
  { code: '  const db = await createClient();', step: 0 },
  { code: '  const { data: sessions } = await db', step: 0 },
  { code: '    .from("invention_sessions")', step: 0 },
  { code: '    .select("student_id, circle_1_category, ...")', step: 0 },
  { code: '    .eq("class_code", classCode)', step: 0 },
  { code: '    .not("completed_at", "is", null);', step: 0 },
  { code: '', step: -1 },
  { code: '  // \u2500\u2500 Step 1: Primary sort on Circle 1 (category pools) \u2500\u2500', step: 1 },
  { code: '  const pools = new Map();', step: 1 },
  { code: '  for (const s of students) {', step: 1 },
  { code: '    const pool = pools.get(s.circle_1_category) ?? [];', step: 1 },
  { code: '    pool.push(s);', step: 1 },
  { code: '    pools.set(s.circle_1_category, pool);', step: 1 },
  { code: '  }', step: 1 },
  { code: '', step: -1 },
  { code: '  // \u2500\u2500 Step 2: Form groups \u2014 archetype distribution \u2500\u2500', step: 2 },
  { code: '  for (const [category, pool] of pools) {', step: 2 },
  { code: '    const remaining = [...pool];', step: 2 },
  { code: '    while (remaining.length > 0) {', step: 2 },
  { code: '      if (remaining.length < 3) { /* merge into last group */ }', step: 2 },
  { code: '      for (const archetype of TARGET_ARCHETYPES) {', step: 2 },
  { code: '        const idx = remaining.findIndex(s => s.archetype === archetype);', step: 2 },
  { code: '        if (idx !== -1) group.push(remaining.splice(idx, 1)[0]);', step: 2 },
  { code: '      }', step: 2 },
  { code: '      // Fill remaining \u2014 prioritize archetype diversity', step: 2 },
  { code: '      while (group.length < targetSize && remaining.length > 0) {', step: 2 },
  { code: '        const diverse = remaining.findIndex(s => !used.has(s.archetype));', step: 2 },
  { code: '        if (diverse !== -1) group.push(remaining.splice(diverse, 1)[0]);', step: 2 },
  { code: '        else group.push(remaining.shift());', step: 2 },
  { code: '      }', step: 2 },
  { code: '    }', step: 2 },
  { code: '  }', step: 2 },
  { code: '', step: -1 },
  { code: '  // \u2500\u2500 Step 3: Chip diversity scoring \u2500\u2500', step: 3 },
  { code: '  const allChips = group.flatMap(s => s.circle_3_chips);', step: 3 },
  { code: '  const chipDiversity = new Set(allChips).size / allChips.length;', step: 3 },
  { code: '', step: -1 },
  { code: '  // \u2500\u2500 Step 4: Scale balance check \u2500\u2500', step: 4 },
  { code: '  const scaleDist = {};', step: 4 },
  { code: '  for (const s of group)', step: 4 },
  { code: '    scaleDist[s.scale] = (scaleDist[s.scale] ?? 0) + 1;', step: 4 },
  { code: '  const balanced = Object.values(scaleDist).every(c => c <= 3);', step: 4 },
  { code: '', step: -1 },
  { code: '  // \u2500\u2500 Step 5: Voice coverage & cross-group swaps \u2500\u2500', step: 5 },
  { code: '  const hasVisual = group.some(s =>', step: 5 },
  { code: '    s.voice.some(v => VISUAL_CHIPS.includes(v)));', step: 5 },
  { code: '  const hasVerbal = group.some(s =>', step: 5 },
  { code: '    s.voice.some(v => VERBAL_CHIPS.includes(v)));', step: 5 },
  { code: '  // Cross-group swaps for voice coverage', step: 5 },
  { code: '  for (const group of poolGroups) {', step: 5 },
  { code: '    if (group.has_visual && group.has_verbal) continue;', step: 5 },
  { code: '    const swapId = group.student_ids[j];', step: 5 },
  { code: '    group.student_ids[j] = candidateId;', step: 5 },
  { code: '    other.student_ids[i] = swapId;', step: 5 },
  { code: '  }', step: 5 },
  { code: '', step: -1 },
  { code: '  // \u2500\u2500 Write results to database \u2500\u2500', step: 6 },
  { code: '  await db.from([REDACTED]).delete().eq("class_code", classCode);', step: 6 },
  { code: '  for (const group of allGroups) {', step: 6 },
  { code: '    await db.from([REDACTED]).insert({', step: 6 },
  { code: '      class_code, group_number, student_ids, composition_log', step: 6 },
  { code: '    });', step: 6 },
  { code: '    for (const studentId of group.student_ids) {', step: 6 },
  { code: '      await db.from([REDACTED])', step: 6 },
  { code: '        .update({ group_number }).eq("student_id", studentId);', step: 6 },
  { code: '    }', step: 6 },
  { code: '  }', step: 6 },
  { code: '  return { log };', step: -1 },
  { code: '}', step: -1 },
];

// Syntax colorizer for raw view — cinematic, not a real parser
function colorizeCode(line: string): string {
  if (!line) return "";
  // Escape HTML first
  let s = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // If it's a comment line, color the whole thing and return early
  if (s.trimStart().startsWith("//")) {
    return `<span style="color:#8B8B8B;font-style:italic">${s}</span>`;
  }

  // [REDACTED] markers — bright red
  s = s.replace(/(\[REDACTED\])/g, '<span style="color:#F87171;font-weight:600">$1</span>');

  // Strings — purple (before keywords so keywords inside strings don't get colored)
  s = s.replace(/(&quot;(?:[^&]|&[^q]|&q[^u])*?&quot;|"(?:[^"\\]|\\.)*")/g, '<span style="color:#C4B5FD">$1</span>');

  // Keywords — bright purple
  s = s.replace(/\b(import|export|from|const|let|var|function|async|await|return|if|else|for|while|of|in|new|continue)\b/g, '<span style="color:#D8B4FE">$1</span>');

  // Types / builtins — blue
  s = s.replace(/\b(Map|Set|Object|null|true|false|undefined)\b/g, '<span style="color:#93C5FD">$1</span>');

  // Numbers — amber
  s = s.replace(/\b(\d+)\b/g, '<span style="color:#FCD34D">$1</span>');

  // Method calls — teal (only color the method name, not parens)
  s = s.replace(/\.(findIndex|flatMap|some|includes|every|splice|push|shift|get|set|from|select|eq|not|delete|insert|update|values|reverse|find|filter|has|length)\b/g,
    '.<span style="color:#5EEAD4">$1</span>');

  // Standalone function calls
  s = s.replace(/\b(createClient)\b/g, '<span style="color:#5EEAD4">$1</span>');

  return s;
}
