"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Raw View — synchronized source code highlighting + live log stream
 * showing the grouping algorithm executing step by step.
 *
 * This is a visual replay of the AlgorithmLog, not live execution.
 * The algorithm has already run; this presents it cinematically.
 */

// ── Step line ranges in invention-grouping.ts ──
const STEP_RANGES = [
  { step: 0, label: "Initialization", start: 57, end: 84 },
  { step: 1, label: "Step 1: Category Pools", start: 86, end: 92 },
  { step: 2, label: "Step 2: Archetype Distribution", start: 94, end: 177 },
  { step: 3, label: "Step 3: Chip Diversity", start: 179, end: 182 },
  { step: 4, label: "Step 4: Scale Balance", start: 184, end: 189 },
  { step: 5, label: "Step 5: Voice Coverage & Swaps", start: 239, end: 320 },
  { step: 6, label: "Database Writes", start: 322, end: 346 },
];

// ── Minimal TypeScript syntax highlighter ──
function highlightLine(line: string): string {
  return line
    // Comments
    .replace(/(\/\/.*$)/gm, '<span style="color:#6B7280">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6B7280">$1</span>')
    // Strings
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span style="color:#A78BFA">$1</span>')
    // Keywords
    .replace(/\b(import|export|from|const|let|var|function|async|await|return|if|else|for|while|of|in|new|interface|type|class|extends|implements)\b/g, '<span style="color:#C084FC">$1</span>')
    // Types/Generics
    .replace(/\b(string|number|boolean|void|null|undefined|true|false|Record|Map|Set|Promise|Array)\b/g, '<span style="color:#60A5FA">$1</span>')
    // Function calls
    .replace(/\b(\w+)\s*\(/g, '<span style="color:#2DD4BF">$1</span>(');
}

// ── The algorithm source code (embedded at build time) ──
const SOURCE_CODE = `import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Invention Mode Grouping Algorithm
 *
 * Five-step sort:
 *   1. Primary: Circle 1 category (same category = same group pool)
 *   2. Secondary: Circle 2 archetype (aim for Builder + Empath + Systems Thinker minimum)
 *   3. Tertiary: Circle 3 chips (maximize diversity within groups)
 *   4. Balance: Circle 4 scale (no more than 3 of same scale per group)
 *   5. Role mapping: Circle 5 voice (visual + verbal coverage)
 */

interface Student {
  id: string;
  circle_1_category: string;
  circle_2_archetype: string;
  circle_3_chips: string[];
  circle_4_scale: string;
  circle_5_voice: string[];
}

interface GroupResult {
  group_number: number;
  student_ids: string[];
  composition: {
    category: string;
    archetypes: string[];
    missing_archetypes: string[];
    chip_diversity: number;
    scale_distribution: Record<string, number>;
    has_visual: boolean;
    has_verbal: boolean;
    all_criteria_met: boolean;
    compromises: string[];
  };
}

const VISUAL_CHIPS = ["Draw it", "Build a prototype", "Build a slide or poster"];
const VERBAL_CHIPS = ["Explain it out loud to someone", "Write it out"];
const TARGET_ARCHETYPES = ["builder", "empath", "systems_thinker"];

export async function runGroupingAlgorithm(
  classCode: string,
  groupSize: number = 5
): Promise<{ log: AlgorithmLog; error?: string }> {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from("invention_sessions")
    .select("student_id, circle_1_category, circle_2_archetype, ...")
    .eq("class_code", classCode)
    .not("completed_at", "is", null);

  const students: Student[] = sessions.map((s) => ({
    id: s.student_id,
    circle_1_category: s.circle_1_category ?? "wildcard",
    circle_2_archetype: s.circle_2_archetype ?? "builder",
    circle_3_chips: s.circle_3_chips ?? [],
    circle_4_scale: s.circle_4_scale ?? "community",
    circle_5_voice: s.circle_5_voice ?? [],
  }));

  // ── Step 1: Primary sort on Circle 1 (category pools) ──
  const pools = new Map<string, Student[]>();
  for (const s of students) {
    const pool = pools.get(s.circle_1_category) ?? [];
    pool.push(s);
    pools.set(s.circle_1_category, pool);
  }

  // ── Step 2-5: Form groups within each pool ──
  const allGroups: GroupResult[] = [];
  let groupCounter = 1;

  for (const [category, pool] of pools) {
    const remaining = [...pool];

    while (remaining.length > 0) {
      // Merge small remainders into last group
      if (remaining.length < 3 && allGroups.length > 0) { /* ... */ }

      const group: Student[] = [];
      const targetSize = Math.min(groupSize, remaining.length);

      // Pick one of each target archetype first
      for (const archetype of TARGET_ARCHETYPES) {
        if (group.length >= targetSize) break;
        const idx = remaining.findIndex((s) => s.circle_2_archetype === archetype);
        if (idx !== -1) group.push(remaining.splice(idx, 1)[0]);
      }

      // Fill remaining — prioritize archetype diversity
      const usedArchetypes = new Set(group.map((s) => s.circle_2_archetype));
      while (group.length < targetSize && remaining.length > 0) {
        const diverseIdx = remaining.findIndex(
          (s) => !usedArchetypes.has(s.circle_2_archetype)
        );
        if (diverseIdx !== -1) {
          const s = remaining.splice(diverseIdx, 1)[0];
          usedArchetypes.add(s.circle_2_archetype);
          group.push(s);
        } else {
          group.push(remaining.shift()!);
        }
      }

      // Step 3: chip diversity scoring
      const allChips = group.flatMap((s) => s.circle_3_chips);
      const chipDiversity = allChips.length > 0
        ? new Set(allChips).size / allChips.length : 0;

      // Step 4: scale balance check
      const scaleDist: Record<string, number> = {};
      for (const s of group)
        scaleDist[s.circle_4_scale] = (scaleDist[s.circle_4_scale] ?? 0) + 1;
      const scaleBalanced = Object.values(scaleDist).every((c) => c <= 3);

      // Step 5: voice coverage
      const hasVisual = group.some((s) =>
        s.circle_5_voice.some((v) => VISUAL_CHIPS.includes(v)));
      const hasVerbal = group.some((s) =>
        s.circle_5_voice.some((v) => VERBAL_CHIPS.includes(v)));

      allGroups.push({ group_number: groupCounter, /* ... */ });
      groupCounter++;
    }
  }

  // ── Cross-group voice swaps ──
  for (const [, pool] of pools) {
    // ... swap logic for voice coverage gaps ...
    for (const group of poolGroups) {
      if (group.composition.has_visual && group.composition.has_verbal) continue;
      // Find candidate in other group, verify swap safety
      const swapId = group.student_ids[j];
      group.student_ids[j] = candidateId;
      other.student_ids[i] = swapId;
    }
  }

  // ── Write results to database ──
  await supabase.from("invention_groups").delete().eq("class_code", classCode);

  for (const group of allGroups) {
    await supabase.from("invention_groups").insert({
      class_code: classCode,
      group_number: group.group_number,
      student_ids: group.student_ids,
      composition_log: group.composition,
    });

    for (const studentId of group.student_ids) {
      await supabase.from("invention_sessions")
        .update({ group_number: group.group_number })
        .eq("student_id", studentId);
    }
  }

  return { log };
}`;

interface AlgorithmLog {
  ran_at: string;
  total_students: number;
  total_groups: number;
  groups_meeting_all_criteria: number;
  groups_with_compromises: number;
  details: Array<{
    group_number: number;
    student_ids: string[];
    composition: {
      category: string;
      archetypes: string[];
      missing_archetypes: string[];
      chip_diversity: number;
      scale_distribution: Record<string, number>;
      has_visual: boolean;
      has_verbal: boolean;
      all_criteria_met: boolean;
      compromises: string[];
    };
  }>;
}

interface LogLine {
  text: string;
  color: string;
  bold?: boolean;
  step: number;
  delay: number;
}

function buildLogLines(log: AlgorithmLog): LogLine[] {
  const L: LogLine[] = [];
  const d = (text: string, color: string, step: number, delay: number, bold?: boolean) =>
    L.push({ text, color, step, delay, bold });

  d("$ venture-group --run", "#F0EDE8", 0, 400, true);
  d("", "#9A9A9A", 0, 200);
  d(`Initializing grouping algorithm...`, "#9A9A9A", 0, 250);
  d(`Loading ${log.total_students} student profiles...`, "#9A9A9A", 0, 350);
  d(`Configuration: group_size=5, threshold=80%`, "#9A9A9A", 0, 200);
  d("", "#9A9A9A", 0, 200);

  // Step 1
  d("── Step 1: Sorting by invention category (The Wish) ──", "#C084FC", 1, 500, true);
  const cats = new Map<string, number>();
  for (const g of log.details) {
    const cat = g.composition.category;
    cats.set(cat, (cats.get(cat) ?? 0) + g.student_ids.length);
  }
  for (const [cat, count] of cats) {
    d(`  ${cat.padEnd(28)} — ${count} students`, "#F0EDE8", 1, 150);
  }
  d(`  ✓ ${cats.size} category pools formed`, "#4ADE80", 1, 300);
  d("", "#9A9A9A", 1, 200);

  // Step 2
  d("── Step 2: Distributing archetypes (The Mind) ──", "#C084FC", 2, 500, true);
  d("  Target: Builder + Empath + Systems Thinker per group", "#9A9A9A", 2, 200);
  for (const g of log.details) {
    d(`  Group ${g.group_number} (${g.composition.category}):`, "#F0EDE8", 2, 250);
    for (const arch of g.composition.archetypes) {
      d(`    → ${arch}`, "#60A5FA", 2, 60);
    }
    if (g.composition.missing_archetypes.length === 0) {
      d("    ✓ Core archetypes present", "#4ADE80", 2, 200);
    } else {
      d(`    ⚠ Missing: ${g.composition.missing_archetypes.join(", ")}`, "#FBBF24", 2, 300);
    }
  }
  d("", "#9A9A9A", 2, 200);

  // Step 3
  d("── Step 3: Evaluating chip diversity (The Lens) ──", "#C084FC", 3, 500, true);
  for (const g of log.details) {
    const pct = Math.round(g.composition.chip_diversity * 100);
    d(`  Group ${g.group_number}: ${pct}% diversity`, pct >= 40 ? "#4ADE80" : "#9A9A9A", 3, 120);
  }
  d("", "#9A9A9A", 3, 200);

  // Step 4
  d("── Step 4: Checking scale balance (The Scale) ──", "#C084FC", 4, 500, true);
  for (const g of log.details) {
    const balanced = Object.values(g.composition.scale_distribution).every(v => v <= 3);
    if (balanced) {
      d(`  Group ${g.group_number}: ✓ balanced`, "#4ADE80", 4, 120);
    } else {
      const over = Object.entries(g.composition.scale_distribution).find(([, v]) => v > 3);
      d(`  Group ${g.group_number}: ⚠ ${over?.[0]} overrepresented (${over?.[1]}×)`, "#FBBF24", 4, 250);
    }
  }
  d("", "#9A9A9A", 4, 200);

  // Step 5
  d("── Step 5: Checking voice coverage (The Voice) ──", "#C084FC", 5, 500, true);
  for (const g of log.details) {
    const vis = g.composition.has_visual ? "✓" : "✗";
    const verb = g.composition.has_verbal ? "✓" : "✗";
    const ok = g.composition.has_visual && g.composition.has_verbal;
    d(`  Group ${g.group_number}: visual ${vis}  verbal ${verb}`, ok ? "#4ADE80" : "#FBBF24", 5, 150);
  }
  d("", "#9A9A9A", 5, 200);

  // Step 6
  d("── Writing results to database ──", "#C084FC", 6, 500, true);
  d(`  Clearing existing groups...`, "#9A9A9A", 6, 300);
  for (const g of log.details) {
    d(`  Group ${g.group_number}: ${g.student_ids.length} students → invention_groups`, "#9A9A9A", 6, 100);
  }
  d(`  Updating group_number for ${log.total_students} students...`, "#9A9A9A", 6, 300);
  d("", "#9A9A9A", 6, 300);

  // Final
  d("═══════════════════════════════════════════", "#C084FC", 6, 200);
  d(`Algorithm complete. ${log.total_groups} groups formed.`, "#C084FC", 6, 400, true);
  d(`${log.groups_meeting_all_criteria} groups met all criteria. ${log.groups_with_compromises} with compromises.`, "#4ADE80", 6, 300);

  return L;
}

export default function RawView({ algorithmLog }: { algorithmLog: AlgorithmLog | null }) {
  const [logLines, setLogLines] = useState<Array<{ text: string; color: string; bold?: boolean }>>([]);
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);

  const sourceLines = SOURCE_CODE.split("\n");

  function getStepForLine(lineNum: number): number {
    for (const range of STEP_RANGES) {
      // Map source display lines (0-indexed) to step ranges
      if (lineNum + 1 >= range.start - 56 && lineNum + 1 <= range.end - 56) return range.step;
    }
    return -1;
  }

  const replay = useCallback(async () => {
    if (!algorithmLog || running) return;
    setRunning(true);
    setDone(false);
    setLogLines([]);
    setActiveStep(-1);

    const lines = buildLogLines(algorithmLog);
    let lastStep = -1;

    for (const line of lines) {
      // Update step highlighting
      if (line.step !== lastStep) {
        setActiveStep(line.step);
        lastStep = line.step;

        // Scroll source to the step range
        if (sourceRef.current) {
          const range = STEP_RANGES.find(r => r.step === line.step);
          if (range) {
            const lineEl = sourceRef.current.querySelector(`[data-line="${range.start - 57}"]`);
            lineEl?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }

      if (line.text === "") {
        setLogLines(prev => [...prev, { text: "\u00A0", color: line.color }]);
        await new Promise(r => setTimeout(r, line.delay));
      } else {
        // Typewriter
        for (let c = 1; c <= line.text.length; c++) {
          setLogLines(prev => {
            const copy = [...prev];
            const entry = { text: line.text.slice(0, c), color: line.color, bold: line.bold };
            if (copy.length > 0 && copy[copy.length - 1].color === line.color && copy[copy.length - 1].text !== "\u00A0" && copy[copy.length - 1].text.length < line.text.length) {
              copy[copy.length - 1] = entry;
            } else {
              copy.push(entry);
            }
            return copy;
          });
          await new Promise(r => setTimeout(r, 18));
        }
        await new Promise(r => setTimeout(r, line.delay));
      }

      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }

    setActiveStep(-1);
    setRunning(false);
    setDone(true);
  }, [algorithmLog, running]);

  // Auto-start replay when algorithmLog arrives
  useEffect(() => {
    if (algorithmLog && !done && !running) {
      replay();
    }
  }, [algorithmLog]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!algorithmLog) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Run the algorithm to see the raw view.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Source code */}
        <div
          ref={sourceRef}
          className="rounded-xl border border-[#2A2A2A] overflow-auto"
          style={{ background: "#0A0A0A", maxHeight: "520px", fontFamily: "'Space Mono', monospace", fontSize: "11px", lineHeight: 1.7 }}
        >
          <div style={{ padding: "12px 0" }}>
            {sourceLines.map((line, i) => {
              const inActiveRange = activeStep >= 0 && STEP_RANGES.some(
                r => r.step === activeStep && i >= (r.start - 57) && i <= (r.end - 57)
              );
              return (
                <div
                  key={i}
                  data-line={i}
                  style={{
                    padding: "0 12px",
                    display: "flex",
                    gap: "12px",
                    background: inActiveRange ? "rgba(192, 132, 252, 0.12)" : "transparent",
                    transition: "background 0.4s ease",
                  }}
                >
                  <span style={{ color: "#3A3A3A", width: "28px", textAlign: "right", flexShrink: 0, userSelect: "none" }}>
                    {i + 1}
                  </span>
                  <span
                    style={{ color: "#D1D5DB", whiteSpace: "pre" }}
                    dangerouslySetInnerHTML={{ __html: highlightLine(line) || "&nbsp;" }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Log stream */}
        <div className="rounded-xl border border-[#2A2A2A] overflow-hidden" style={{ background: "#0A0A0A" }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A2A2A]" style={{ background: "#1A1A1A" }}>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F87171" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FBBF24" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4ADE80" }} />
            </div>
            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#4A4A4A" }}>algorithm output</span>
          </div>
          <div
            ref={logRef}
            className="overflow-y-auto"
            style={{ height: "480px", padding: "12px", fontFamily: "'Space Mono', monospace", fontSize: "11px", lineHeight: 1.8 }}
          >
            {logLines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.color,
                  fontWeight: line.bold ? 700 : 400,
                  textShadow: i === logLines.length - 1 && done && line.bold ? `0 0 8px ${line.color}40` : "none",
                }}
              >
                {line.text}
                {i === logLines.length - 1 && running && (
                  <span style={{
                    display: "inline-block", width: "6px", height: "13px",
                    background: "#C084FC", marginLeft: "2px", verticalAlign: "text-bottom",
                    animation: "rawview-blink 0.8s step-end infinite",
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Replay button */}
      {done && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => { setDone(false); replay(); }}
            className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Replay
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes rawview-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }` }} />
    </div>
  );
}
