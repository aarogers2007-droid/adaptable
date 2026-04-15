/**
 * UNIFIED EVAL RUNNER — `npm run eval:run`
 *
 * The primary regression gate for Adaptable's Ikigai synthesis prompt. Run this
 * before shipping any change to the synthesis prompt in actions.ts or eval-ikigai-v3.ts.
 * It tests three baselines — age-12 Capital Required (zero-startup-capital rule),
 * multi-interest Insight Quality (dominant-interest insight depth), and multi-interest
 * No Forced Hybrids (anti-hybrid self-check) — by calling the existing regression
 * scripts as subprocesses, parsing their scores, and failing with exit code 1 if any
 * score drops more than 10% below its baseline. Results are written to both console
 * and evals/results/[timestamp].json for CI tracking. Faithfulness is excluded from
 * this runner for speed; run `npm run eval:faithfulness` separately for RAG evaluation.
 *
 * Usage:
 *   npx tsx scripts/run-eval.ts           # run all Ikigai regressions
 *   npx tsx scripts/run-eval.ts --quick   # skip slow tests (future use)
 *
 * Exit code:
 *   0 = all baselines pass
 *   1 = one or more baselines regressed beyond 10%
 */

import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";
import path from "path";

// ── Baselines (10% regression threshold = score × 0.90) ──

interface Baseline {
  name: string;
  key: string;
  score: number;
  floor: number; // score × 0.90
  script: string;
  parseRegex: RegExp;
}

const BASELINES: Baseline[] = [
  {
    name: "age-12 × Capital Required",
    key: "age12_capital_required",
    score: 4.50,
    floor: 4.05,
    script: "scripts/eval-age12-regression.ts",
    parseRegex: /Overall capital_required avg: ([\d.]+)\/5/,
  },
  {
    name: "multi-interest × Insight Quality",
    key: "multi_interest_insight_quality",
    score: 4.10,
    floor: 3.69,
    script: "scripts/eval-multi-interest-regression.ts",
    parseRegex: /insight_quality avg: ([\d.]+)\/5/,
  },
  {
    name: "multi-interest × No Forced Hybrids",
    key: "multi_interest_no_forced_hybrids",
    score: 4.60,
    floor: 4.14,
    script: "scripts/eval-multi-interest-regression.ts",
    parseRegex: /no_forced_hybrid avg: ([\d.]+)\/5/,
  },
];

// Group by script so we only run each script once
const SCRIPTS = [...new Set(BASELINES.map((b) => b.script))];

// ── Runner ──

interface TestResult {
  name: string;
  key: string;
  baseline: number;
  floor: number;
  actual: number | null;
  delta: number | null;
  pass: boolean;
  error?: string;
}

function runScript(scriptPath: string): { stdout: string; exitCode: number; durationMs: number } {
  const start = Date.now();
  try {
    const stdout = execSync(`npx tsx ${scriptPath}`, {
      encoding: "utf-8",
      timeout: 600_000, // 10 min max per script
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env },
    });
    return { stdout, exitCode: 0, durationMs: Date.now() - start };
  } catch (e: unknown) {
    // execSync throws on non-zero exit — capture stdout anyway
    const err = e as { stdout?: string; status?: number };
    return {
      stdout: err.stdout ?? "",
      exitCode: err.status ?? 1,
      durationMs: Date.now() - start,
    };
  }
}

function parseScore(stdout: string, regex: RegExp): number | null {
  const match = stdout.match(regex);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return isNaN(val) ? null : val;
}

// ── Main ──

function main() {
  const startTime = Date.now();
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║         ADAPTABLE EVAL RUNNER                ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");
  console.log(`Baselines: ${BASELINES.length}`);
  console.log(`Scripts: ${SCRIPTS.length}`);
  console.log(`Regression threshold: 10% of baseline score`);
  console.log(`Faithfulness: excluded (run scripts/eval-faithfulness.ts separately)`);
  console.log("");

  // Run each script and capture output
  const scriptOutputs = new Map<string, { stdout: string; exitCode: number; durationMs: number }>();

  for (const script of SCRIPTS) {
    console.log(`── Running ${script} ──`);
    const result = runScript(script);
    scriptOutputs.set(script, result);
    const mins = (result.durationMs / 60000).toFixed(1);
    console.log(`   Done in ${mins}m (exit ${result.exitCode})`);
    console.log("");
  }

  // Parse scores and check baselines
  const results: TestResult[] = [];

  for (const baseline of BASELINES) {
    const output = scriptOutputs.get(baseline.script);
    if (!output) {
      results.push({
        name: baseline.name,
        key: baseline.key,
        baseline: baseline.score,
        floor: baseline.floor,
        actual: null,
        delta: null,
        pass: false,
        error: "Script not found in outputs",
      });
      continue;
    }

    const actual = parseScore(output.stdout, baseline.parseRegex);
    if (actual === null) {
      results.push({
        name: baseline.name,
        key: baseline.key,
        baseline: baseline.score,
        floor: baseline.floor,
        actual: null,
        delta: null,
        pass: false,
        error: "Could not parse score from stdout",
      });
      continue;
    }

    const delta = actual - baseline.score;
    const pass = actual >= baseline.floor;

    results.push({
      name: baseline.name,
      key: baseline.key,
      baseline: baseline.score,
      floor: baseline.floor,
      actual,
      delta,
      pass,
    });
  }

  const totalDurationMs = Date.now() - startTime;
  const allPass = results.every((r) => r.pass);

  // ── Console output ──

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║                RESULTS                       ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");
  console.log("| Baseline | Score | Floor | Actual | Delta | Status |");
  console.log("|---|---|---|---|---|---|");
  for (const r of results) {
    const actualStr = r.actual !== null ? r.actual.toFixed(2) : "ERR";
    const deltaStr = r.delta !== null ? (r.delta >= 0 ? `+${r.delta.toFixed(2)}` : r.delta.toFixed(2)) : "—";
    const status = r.error ? `ERROR: ${r.error}` : r.pass ? "PASS" : "FAIL";
    const emoji = r.error ? "💥" : r.pass ? "✅" : "❌";
    console.log(`| ${r.name} | ${r.baseline.toFixed(2)} | ${r.floor.toFixed(2)} | ${actualStr} | ${deltaStr} | ${emoji} ${status} |`);
  }

  console.log("");
  console.log(`Total runtime: ${(totalDurationMs / 1000).toFixed(0)}s`);
  console.log("");

  if (allPass) {
    console.log("✅ ALL BASELINES PASS — safe to ship prompt changes");
  } else {
    const failures = results.filter((r) => !r.pass);
    console.log(`❌ ${failures.length} BASELINE(S) REGRESSED — do not ship`);
    for (const f of failures) {
      if (f.error) {
        console.log(`   ${f.name}: ${f.error}`);
      } else {
        console.log(`   ${f.name}: ${f.actual!.toFixed(2)} < floor ${f.floor.toFixed(2)} (baseline ${f.baseline.toFixed(2)})`);
      }
    }
  }

  // ── JSON output ──

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonResult = {
    timestamp: new Date().toISOString(),
    runtime_seconds: Math.round(totalDurationMs / 1000),
    all_pass: allPass,
    regression_threshold: "10% of baseline score",
    faithfulness_included: false,
    results: results.map((r) => ({
      name: r.name,
      key: r.key,
      baseline: r.baseline,
      floor: r.floor,
      actual: r.actual,
      delta: r.delta !== null ? Math.round(r.delta * 100) / 100 : null,
      pass: r.pass,
      error: r.error ?? null,
    })),
    scripts: Object.fromEntries(
      [...scriptOutputs.entries()].map(([script, output]) => [
        script,
        {
          exit_code: output.exitCode,
          duration_ms: output.durationMs,
        },
      ])
    ),
  };

  const resultsDir = path.join(process.cwd(), "evals/results");
  const jsonPath = path.join(resultsDir, `${timestamp}.json`);
  writeFileSync(jsonPath, JSON.stringify(jsonResult, null, 2));
  console.log(`\nResults written to: ${jsonPath}`);

  process.exit(allPass ? 0 : 1);
}

main();
