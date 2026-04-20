"use client";

import { useState, useRef } from "react";
import InventionIkigai from "@/components/InventionIkigai";

// Mock data for the admin dashboard
const MOCK_GROUPS = [
  { num: 1, cat: "Digital", students: ["Marcus W.", "Ethan P.", "Tyler N.", "Liam F.", "Jasmine L.", "Isaiah D."], pass: true, archetypes: "Pass", diversity: "33%", scale: "Review", visual: "Pass", verbal: "Pass" },
  { num: 2, cat: "Environmental", students: ["Aaliyah T.", "Jordan R.", "Caleb J.", "Aaliya H.", "Elijah B.", "Devon M."], pass: false, archetypes: "Pass", diversity: "30%", scale: "Review", visual: "Pass", verbal: "Pass" },
  { num: 3, cat: "Medical", students: ["Priya N.", "Sofia M.", "Zara A.", "Maya P.", "Fatima A.", "Connor W."], pass: true, archetypes: "Pass", diversity: "27%", scale: "Pass", visual: "Pass", verbal: "Pass" },
];

const LOG_LINES = [
  { t: "$ venture-group --class VENTURE --run", c: "#F0EDE8", d: 400, b: true },
  { t: "", c: "", d: 200 },
  { t: "Initializing grouping algorithm for VENTURE...", c: "#9A9A9A", d: 250 },
  { t: "Loading 30 student profiles...", c: "#9A9A9A", d: 350 },
  { t: "Configuration: group_size=5, threshold=80%", c: "#9A9A9A", d: 200 },
  { t: "", c: "", d: 200 },
  { t: "\u2500\u2500 Step 1: Sorting by invention category (The Wish) \u2500\u2500", c: "#C084FC", d: 500, b: true },
  { t: "  digital \u2014 6    environmental \u2014 6    medical \u2014 6", c: "#F0EDE8", d: 150 },
  { t: "  learning \u2014 5   social \u2014 7", c: "#F0EDE8", d: 150 },
  { t: "  \u2713 5 category pools formed", c: "#4ADE80", d: 300 },
  { t: "", c: "", d: 200 },
  { t: "\u2500\u2500 Step 2: Distributing archetypes (The Mind) \u2500\u2500", c: "#C084FC", d: 500, b: true },
  { t: "  Groups 1\u20135: \u2713 All core archetypes present", c: "#4ADE80", d: 300 },
  { t: "", c: "", d: 200 },
  { t: "\u2500\u2500 Step 3: Evaluating chip diversity (The Lens) \u2500\u2500", c: "#C084FC", d: 500, b: true },
  { t: "  G1: 33%  G2: 30%  G3: 27%  G4: 44%  G5: 45%", c: "#9A9A9A", d: 200 },
  { t: "", c: "", d: 200 },
  { t: "\u2500\u2500 Step 4: Checking scale balance (The Scale) \u2500\u2500", c: "#C084FC", d: 500, b: true },
  { t: "  Groups 1\u20132: \u26a0 scale overrepresented", c: "#FBBF24", d: 200 },
  { t: "  Groups 3\u20135: \u2713 balanced", c: "#4ADE80", d: 150 },
  { t: "", c: "", d: 200 },
  { t: "\u2500\u2500 Step 5: Checking voice coverage (The Voice) \u2500\u2500", c: "#C084FC", d: 500, b: true },
  { t: "  All groups: visual \u2713  verbal \u2713", c: "#4ADE80", d: 200 },
  { t: "", c: "", d: 300 },
  { t: "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550", c: "#C084FC", d: 200 },
  { t: "Algorithm complete. 5 groups formed.", c: "#C084FC", d: 400, b: true },
  { t: "2 groups met all criteria. 3 with compromises.", c: "#4ADE80", d: 300 },
];

export default function DemoInventionMode() {
  const [adminTab, setAdminTab] = useState<"overview" | "groups">("overview");
  const [termLines, setTermLines] = useState<Array<{ text: string; color: string; bold?: boolean }>>([]);
  const [termRunning, setTermRunning] = useState(false);
  const [termDone, setTermDone] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);

  async function runTerminal() {
    if (termRunning) return;
    setTermRunning(true);
    setTermDone(false);
    setTermLines([]);

    for (const line of LOG_LINES) {
      if (line.t === "") {
        setTermLines(prev => [...prev, { text: "\u00A0", color: "" }]);
        await new Promise(r => setTimeout(r, line.d));
      } else {
        for (let c = 1; c <= line.t.length; c++) {
          setTermLines(prev => {
            const copy = [...prev];
            const entry = { text: line.t.slice(0, c), color: line.c, bold: line.b };
            if (copy.length > 0 && copy[copy.length - 1].text.length < line.t.length && copy[copy.length - 1].color === line.c) {
              copy[copy.length - 1] = entry;
            } else if (c === 1) {
              copy.push(entry);
            } else {
              copy[copy.length - 1] = entry;
            }
            return copy;
          });
          await new Promise(r => setTimeout(r, 20));
        }
        await new Promise(r => setTimeout(r, line.d));
      }
      if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
    }

    setTermRunning(false);
    setTermDone(true);
  }

  return (
    <div style={{ padding: "89px 34px" }}>
      <div className="mx-auto max-w-[900px]">

        {/* ── Section 1: The Invention Ikigai ── */}
        <p className="font-[family-name:var(--font-display)]" style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C084FC" }}>
          Invention Mode
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] font-semibold" style={{ fontSize: "34px", lineHeight: 1.618, color: "var(--text-primary)" }}>
          A different kind of Ikigai
        </h2>
        <p className="mt-3 max-w-[600px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "var(--text-secondary)" }}>
          For invention events, students answer five questions that map how they think, what they know, and how they communicate. No business ideas. No AI synthesis. Pure data collection for intelligent group formation.
        </p>

        {/* Pentagon diagram */}
        <div className="mt-10 mx-auto" style={{ maxWidth: "360px" }}>
          <InventionIkigai completedCircles={[1, 2, 3, 4, 5]} />
        </div>

        {/* ── Section 2: Algorithm Breakdown ── */}
        <div className="mt-16">
          <p className="font-[family-name:var(--font-display)]" style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C084FC" }}>
            The Algorithm
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] font-semibold" style={{ fontSize: "34px", lineHeight: 1.618, color: "var(--text-primary)" }}>
            Five-step grouping
          </h2>
          <p className="mt-3 max-w-[600px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "var(--text-secondary)" }}>
            After students complete their circles, the algorithm sorts 165 students into balanced groups of 5. Each step optimizes for a different dimension.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { step: "1", name: "The Wish", desc: "Group by invention category. Same category = same group pool.", color: "#C084FC" },
              { step: "2", name: "The Mind", desc: "Distribute archetypes. Every group gets a Builder + Empath + Systems Thinker.", color: "#60A5FA" },
              { step: "3", name: "The Lens", desc: "Maximize knowledge diversity. Students who know different things go together.", color: "#2DD4BF" },
              { step: "4", name: "The Scale", desc: "Balance ambition levels. No group where everyone thinks too big or too small.", color: "#FBBF24" },
              { step: "5", name: "The Voice", desc: "Ensure communication coverage. Every group has a visual + verbal presenter.", color: "#F87171" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white" style={{ background: s.color }}>
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{s.name}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 3: Terminal ── */}
        <div className="mt-16">
          <p className="font-[family-name:var(--font-display)]" style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C084FC" }}>
            Live Execution
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] font-semibold" style={{ fontSize: "34px", lineHeight: 1.618, color: "var(--text-primary)" }}>
            Watch it run
          </h2>

          <div className="mt-8 rounded-xl border border-[#2A2A2A] overflow-hidden" style={{ background: "#0A0A0A" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]" style={{ background: "#1A1A1A" }}>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "#F87171" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#FBBF24" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#4ADE80" }} />
              </div>
              <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#6A6A6A" }}>Grouping Algorithm</span>
              <button
                onClick={runTerminal}
                disabled={termRunning}
                className="rounded px-3 py-1 text-xs font-medium border transition-colors"
                style={{ fontFamily: "monospace", borderColor: termRunning ? "#2A2A2A" : "#C084FC", color: termRunning ? "#4A4A4A" : "#C084FC", background: "#1A1A1A", cursor: termRunning ? "not-allowed" : "pointer" }}
              >
                {termRunning ? "Running..." : termDone ? "Replay" : "Run Algorithm"}
              </button>
            </div>
            {/* Body */}
            <div ref={termRef} className="overflow-y-auto" style={{ height: "340px", padding: "14px", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.8 }}>
              {termLines.map((line, i) => (
                <div key={i} style={{ color: line.color || "#9A9A9A", fontWeight: line.bold ? 700 : 400 }}>{line.text}</div>
              ))}
              {termLines.length === 0 && !termRunning && (
                <div style={{ color: "#3A3A3A" }}>Click &ldquo;Run Algorithm&rdquo; to see the grouping process.</div>
              )}
            </div>
            {/* Footer — speed + toggle */}
            <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-[#2A2A2A]" style={{ background: "#1A1A1A" }}>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#4A4A4A" }}>Speed</span>
                <input type="range" min={0} max={3} defaultValue={1} className="w-16 h-1 appearance-none rounded-full cursor-pointer" style={{ background: "#2A2A2A", accentColor: "#C084FC" }} />
              </div>
              <div className="flex gap-1 rounded-md p-0.5" style={{ background: "#2A2A2A" }}>
                <span className="rounded px-3 py-1 text-[10px] font-medium" style={{ fontFamily: "monospace", background: "#3A3A3A", color: "#E8E8E8" }}>Normal</span>
                <span className="rounded px-3 py-1 text-[10px] font-medium" style={{ fontFamily: "monospace", color: "#6A6A6A" }}>Raw</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 4: Admin Dashboard Mock ── */}
        <div className="mt-16">
          <p className="font-[family-name:var(--font-display)]" style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#C084FC" }}>
            Admin View
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] font-semibold" style={{ fontSize: "34px", lineHeight: 1.618, color: "var(--text-primary)" }}>
            Everything at a glance
          </h2>
          <p className="mt-3 max-w-[600px]" style={{ fontSize: "16px", lineHeight: 1.618, color: "var(--text-secondary)" }}>
            Admins see real-time completion, archetype distribution, and full group compositions with one-click overrides.
          </p>

          {/* Admin tabs */}
          <div className="mt-8 flex gap-2">
            <button onClick={() => setAdminTab("overview")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${adminTab === "overview" ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"}`}>Overview</button>
            <button onClick={() => setAdminTab("groups")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${adminTab === "groups" ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"}`}>Groups</button>
          </div>

          {/* Overview tab */}
          {adminTab === "overview" && (
            <div className="mt-6 space-y-4">
              {/* Completion meter */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Wizard Completion</span>
                  <span className="text-sm text-[var(--text-muted)]">138 / 165 (84%)</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-muted)]">
                  <div className="h-3 rounded-full" style={{ width: "84%", background: "linear-gradient(90deg, #C084FC, #60A5FA, #2DD4BF, #FBBF24, #F87171)" }} />
                </div>
                <div className="mt-2 flex gap-4 text-xs text-[var(--text-muted)]">
                  <span>138 completed</span><span>19 in progress</span><span>8 not started</span>
                </div>
              </div>

              {/* Breakdowns */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                  <p className="text-xs font-semibold text-[#C084FC] uppercase tracking-wider mb-3">Circle 1 — Invention Type</p>
                  {[["Environmental", 31], ["Medical", 28], ["Digital", 22], ["Social", 19], ["Physical", 16], ["Learning", 11]].map(([cat, n]) => (
                    <div key={cat as string} className="flex justify-between py-1 text-sm"><span className="text-[var(--text-primary)]">{cat}</span><span className="font-semibold text-[var(--text-primary)]">{n}</span></div>
                  ))}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                  <p className="text-xs font-semibold text-[#C084FC] uppercase tracking-wider mb-3">Circle 2 — Archetype</p>
                  {[["Builder", 38], ["Empath", 34], ["Systems Thinker", 29], ["Connector", 22], ["Storyteller", 15]].map(([arch, n]) => (
                    <div key={arch as string} className="flex justify-between py-1 text-sm"><span className="text-[var(--text-primary)]">{arch}</span><span className="font-semibold text-[var(--text-primary)]">{n}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Groups tab */}
          {adminTab === "groups" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">Print:</span>
                <span className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">Group Roster</span>
                <span className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-muted)] transition-colors">Student Slips</span>
              </div>

              {MOCK_GROUPS.map((g) => (
                <div key={g.num} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Group {g.num} <span className="ml-2 text-xs text-[var(--text-muted)]">{g.cat}</span>
                    </h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${g.pass ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {g.pass ? "All criteria met" : "Needs review"}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {g.students.map((s) => (
                      <div key={s} className="flex justify-between text-sm">
                        <span className="text-[var(--text-primary)]">{s}</span>
                        <span className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--primary)]">Move</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs text-center">
                    {[
                      ["Archetypes", g.archetypes],
                      ["Diversity", g.diversity],
                      ["Scale", g.scale],
                      ["Visual", g.visual],
                      ["Verbal", g.verbal],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-[var(--text-muted)]">{label}</p>
                        <p className={`font-medium ${val === "Pass" ? "text-green-600" : val === "Review" ? "text-amber-600" : "text-[var(--text-primary)]"}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-center text-sm text-[var(--text-muted)]">+ 2 more groups</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
