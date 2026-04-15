/**
 * DIMENSION-LEVEL FAILURE ANALYSIS
 *
 * Parses eval-ikigai-v4-report.md, cross-tabs rubric scores against
 * grouped persona types, and outputs:
 *   - scripts/eval-dimension-crosstab.json  (granular + aggregated)
 *   - scripts/eval-dimension-crosstab.md    (readable table + top 3 failures)
 *
 * Persona grouping:
 *   coherent       → coherent + success-guard
 *   multi-interest → multi-track
 *   ESL            → slang-esl
 *   age-12         → age-12
 *   existing-business → already-running + family-business
 *   other          → everything else
 *
 * Usage: npx tsx scripts/eval-dimension-analysis.ts
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";

const REPORT_PATH = path.join(process.cwd(), "scripts/eval-ikigai-v4-report.md");
const report = readFileSync(REPORT_PATH, "utf-8");

// ── Types ──

type Bucket =
  | "coherent" | "multi-track" | "vague" | "contradictory" | "sparse"
  | "maximal" | "slang-esl" | "sarcastic" | "identity" | "risky-monetization"
  | "already-running" | "family-business" | "rural" | "prompt-injection"
  | "age-12" | "age-18" | "success-guard";

type PersonaGroup = "coherent" | "multi-interest" | "ESL" | "age-12" | "existing-business" | "other";

const DIMENSIONS = ["spec", "coh", "noHyb", "cap", "cust", "insight", "name"] as const;
type Dimension = typeof DIMENSIONS[number];

const DIMENSION_LABELS: Record<Dimension, string> = {
  spec: "Specificity",
  coh: "Coherence",
  noHyb: "No Forced Hybrids",
  cap: "Capital Required",
  cust: "Customer Realism",
  insight: "Insight Quality",
  name: "Brand Name Quality",
};

interface RunScore {
  personaId: string;
  bucket: Bucket;
  group: PersonaGroup;
  run: number;
  total: number;
  scores: Record<Dimension, number>;
}

// ── Bucket → Group mapping ──

function bucketToGroup(bucket: Bucket): PersonaGroup {
  switch (bucket) {
    case "coherent":
    case "success-guard":
      return "coherent";
    case "multi-track":
      return "multi-interest";
    case "slang-esl":
      return "ESL";
    case "age-12":
      return "age-12";
    case "already-running":
    case "family-business":
      return "existing-business";
    default:
      return "other";
  }
}

// ── Parse the report ──

const runs: RunScore[] = [];
let currentPersonaId = "";
let currentBucket: Bucket = "coherent";
let runCounter = 0;

const personaHeaderRe = /^### ([a-z]\d+-[\w-]+) — .+\(([^)]+)\)$/;
const scoreRe = /\*\*Score: (\d+)\/35\*\* — spec (\d) · coh (\d) · noHyb (\d) · cap (\d) · cust (\d) · insight (\d) · name (\d)/;

for (const line of report.split("\n")) {
  const headerMatch = line.match(personaHeaderRe);
  if (headerMatch) {
    currentPersonaId = headerMatch[1];
    // Extract bucket — handle "age 12" → "age-12" etc.
    let rawBucket = headerMatch[2].trim();
    // Normalize: the header says e.g. "age 12" but bucket type is "age-12"
    rawBucket = rawBucket.replace(/\s+/g, "-").replace("age-12", "age-12").replace("age-18", "age-18");
    // Map known display names to bucket keys
    if (rawBucket === "multi-track") currentBucket = "multi-track";
    else if (rawBucket === "slang-esl") currentBucket = "slang-esl";
    else currentBucket = rawBucket as Bucket;
    runCounter = 0;
    continue;
  }

  const scoreMatch = line.match(scoreRe);
  if (scoreMatch) {
    runCounter++;
    runs.push({
      personaId: currentPersonaId,
      bucket: currentBucket,
      group: bucketToGroup(currentBucket),
      run: runCounter,
      total: parseInt(scoreMatch[1]),
      scores: {
        spec: parseInt(scoreMatch[2]),
        coh: parseInt(scoreMatch[3]),
        noHyb: parseInt(scoreMatch[4]),
        cap: parseInt(scoreMatch[5]),
        cust: parseInt(scoreMatch[6]),
        insight: parseInt(scoreMatch[7]),
        name: parseInt(scoreMatch[8]),
      },
    });
  }
}

console.log(`Parsed ${runs.length} runs across ${new Set(runs.map(r => r.personaId)).size} personas`);

// ── Build cross-tab ──

const GROUP_ORDER: PersonaGroup[] = ["coherent", "multi-interest", "ESL", "age-12", "existing-business", "other"];

interface CellStats {
  avg: number;
  min: number;
  max: number;
  n: number;
  belowThreshold: boolean;
}

type CrossTab = Record<PersonaGroup, Record<Dimension, CellStats>>;

const crossTab: CrossTab = {} as CrossTab;
const groupTotals: Record<PersonaGroup, { sum: number; n: number }> = {} as any;

for (const group of GROUP_ORDER) {
  crossTab[group] = {} as Record<Dimension, CellStats>;
  groupTotals[group] = { sum: 0, n: 0 };
  for (const dim of DIMENSIONS) {
    const groupRuns = runs.filter(r => r.group === group);
    const values = groupRuns.map(r => r.scores[dim]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    crossTab[group][dim] = {
      avg: Math.round(avg * 100) / 100,
      min: Math.min(...values),
      max: Math.max(...values),
      n: values.length,
      belowThreshold: avg < 3.5,
    };
    groupTotals[group].sum += values.reduce((a, b) => a + b, 0);
    groupTotals[group].n += values.length;
  }
}

// ── Find top 3 worst dimension-persona combos ──

const allCells: { group: PersonaGroup; dimension: Dimension; avg: number; label: string }[] = [];
for (const group of GROUP_ORDER) {
  for (const dim of DIMENSIONS) {
    allCells.push({
      group,
      dimension: dim,
      avg: crossTab[group][dim].avg,
      label: DIMENSION_LABELS[dim],
    });
  }
}
allCells.sort((a, b) => a.avg - b.avg);
const top3 = allCells.slice(0, 3);

// ── JSON output ──

const jsonOutput = {
  generated: new Date().toISOString(),
  source: "scripts/eval-ikigai-v4-report.md",
  totalRuns: runs.length,
  totalPersonas: new Set(runs.map(r => r.personaId)).size,
  scale: "1-5 per dimension",
  threshold: 3.5,
  groupMapping: {
    coherent: ["coherent", "success-guard"],
    "multi-interest": ["multi-track"],
    ESL: ["slang-esl"],
    "age-12": ["age-12"],
    "existing-business": ["already-running", "family-business"],
    other: ["vague", "contradictory", "sparse", "maximal", "sarcastic", "identity", "risky-monetization", "rural", "prompt-injection", "age-18"],
  },
  crossTab,
  top3Failures: top3.map((c, idx) => ({
    rank: idx + 1,
    group: c.group,
    dimension: c.label,
    avg: c.avg,
    n: crossTab[c.group][c.dimension].n,
  })),
  perRun: runs,
};

writeFileSync(
  path.join(process.cwd(), "scripts/eval-dimension-crosstab.json"),
  JSON.stringify(jsonOutput, null, 2)
);

// ── Markdown output ──

const THRESHOLD = 3.5;

function fmtCell(cell: CellStats): string {
  const val = cell.avg.toFixed(2);
  return cell.belowThreshold ? `**${val}** 🔴` : val;
}

let md = `# Dimension × Persona Cross-Tab Analysis

Generated: ${new Date().toISOString()}
Source: eval-ikigai-v4-report.md (${runs.length} runs, ${new Set(runs.map(r => r.personaId)).size} personas)
Scale: 1–5 per dimension | Threshold: < ${THRESHOLD} flagged 🔴

## Group Mapping

| Group | Buckets | Runs |
|---|---|---|
`;

for (const group of GROUP_ORDER) {
  const buckets = jsonOutput.groupMapping[group as keyof typeof jsonOutput.groupMapping];
  const n = crossTab[group][DIMENSIONS[0]].n;
  md += `| ${group} | ${buckets.join(", ")} | ${n} |\n`;
}

md += `
## Cross-Tab Matrix

| Persona Type | ${DIMENSIONS.map(d => DIMENSION_LABELS[d]).join(" | ")} | Avg/35 |
|---|${DIMENSIONS.map(() => "---").join("|")}|---|
`;

for (const group of GROUP_ORDER) {
  const cells = DIMENSIONS.map(d => fmtCell(crossTab[group][d]));
  const groupAvg = (groupTotals[group].sum / (groupTotals[group].n / 7)).toFixed(1);
  md += `| ${group} | ${cells.join(" | ")} | ${groupAvg} |\n`;
}

md += `
## Top 3 Highest-Priority Prompt Fixes

These dimension–persona combinations have the lowest average scores and represent
the best opportunities for targeted prompt improvements.

`;

top3.forEach((item, idx) => {
  const cell = crossTab[item.group][item.dimension];
  md += `### ${idx + 1}. ${item.group} × ${item.label} — avg ${item.avg.toFixed(2)}/5 (n=${cell.n})
- Min: ${cell.min}, Max: ${cell.max}
- ${cell.belowThreshold ? "⚠️  BELOW THRESHOLD — targeted prompt fix needed" : "Above threshold but still the weakest cell"}

`;
});

// Per-group breakdown of "other" since it's a catch-all
md += `## "Other" Group Breakdown

Since "other" aggregates many diverse buckets, here's the per-bucket detail:

| Bucket | ${DIMENSIONS.map(d => DIMENSION_LABELS[d]).join(" | ")} | Runs |
|---|${DIMENSIONS.map(() => "---").join("|")}|---|
`;

const otherBuckets: Bucket[] = ["vague", "contradictory", "sparse", "maximal", "sarcastic", "identity", "risky-monetization", "rural", "prompt-injection", "age-18"];
for (const bucket of otherBuckets) {
  const bucketRuns = runs.filter(r => r.bucket === bucket);
  if (bucketRuns.length === 0) continue;
  const cells = DIMENSIONS.map(dim => {
    const values = bucketRuns.map(r => r.scores[dim]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg < THRESHOLD ? `**${avg.toFixed(2)}** 🔴` : avg.toFixed(2);
  });
  md += `| ${bucket} | ${cells.join(" | ")} | ${bucketRuns.length} |\n`;
}

md += `\n---\n*Generated by scripts/eval-dimension-analysis.ts*\n`;

writeFileSync(path.join(process.cwd(), "scripts/eval-dimension-crosstab.md"), md);

console.log("\nOutputs written:");
console.log("  scripts/eval-dimension-crosstab.json");
console.log("  scripts/eval-dimension-crosstab.md");
console.log(`\nTop 3 failures:`);
top3.forEach((item, idx) => {
  console.log(`  ${idx + 1}. ${item.group} × ${item.label} = ${item.avg.toFixed(2)}/5 (n=${crossTab[item.group][item.dimension].n})`);
});
