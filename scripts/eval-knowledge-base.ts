/**
 * KNOWLEDGE BASE EVAL HARNESS
 *
 * Three tests in one pass:
 *   1. COVERAGE — for each of the 22 lessons, query KB by its lesson_tags
 *      and count hits. Flag any lesson with 0 hits (silent RAG failure)
 *      or only 1 hit (thin coverage).
 *   2. CITATIONS — for each of the 25 KB entries, extract every named person,
 *      claim, and study, send to Claude for verification. Mark VERIFIED,
 *      UNVERIFIED, or LIKELY_HALLUCINATED.
 *   3. QUALITY — cross-model judge (Opus 4.6) re-evaluates each entry on
 *      a 6-dim rubric: specificity, accuracy, age-appropriate for 12-18,
 *      actionability for a teen, source diversity, internal consistency.
 *      Same pattern as the wizard eval — Sonnet generated, Opus judges.
 *
 * Output: scripts/eval-knowledge-base-report.md
 *
 * Usage: npx tsx scripts/eval-knowledge-base.ts
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";

// Load env
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[t.slice(0, i).trim()] = v;
}

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { LESSON_PLANS } from "../src/lib/lesson-plans";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anthropic = new Anthropic();
const JUDGE_MODEL = "claude-opus-4-6";

interface KBEntry {
  id: string;
  topic: string;
  title: string;
  lesson_tags: string[];
  source_type: string;
  key_principles: { principle: string; explanation: string }[];
  concrete_examples: { example: string; business_type: string; lesson: string }[];
  quotes: { quote: string; source: string; context?: string }[];
  student_friendly_summary: string;
  challenge_qa: { question: string; answer: string }[];
}

function stripCodeFences(s: string): string {
  let clean = s.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) clean = clean.slice(first, last + 1);
  return clean;
}

async function callOpus<T>(prompt: string, maxTokens = 2000): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await anthropic.messages.create({
        model: JUDGE_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      });
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      return JSON.parse(stripCodeFences(text)) as T;
    } catch (e) {
      if (i === 2) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

// ── TEST 1: COVERAGE ──
interface CoverageResult {
  module_id: number;
  lesson_id: number;
  title: string;
  lesson_tags: string[];
  hits_per_tag: Record<string, number>;
  total_unique_hits: number;
  status: "uncovered" | "thin" | "solid";
  matched_titles: string[];
}

async function testCoverage(): Promise<CoverageResult[]> {
  console.log("[1/3] Running coverage gap test on all 22 lessons...");
  const results: CoverageResult[] = [];

  for (const plan of LESSON_PLANS) {
    const tags = plan.lesson_tags ?? [];
    const hits_per_tag: Record<string, number> = {};
    const matchedIds = new Set<string>();
    const matchedTitles = new Set<string>();

    for (const tag of tags) {
      const { data } = await sb
        .from("knowledge_base")
        .select("id, title")
        .contains("lesson_tags", [tag]);
      hits_per_tag[tag] = data?.length ?? 0;
      for (const row of data ?? []) {
        matchedIds.add(row.id as string);
        matchedTitles.add(row.title as string);
      }
    }

    const total = matchedIds.size;
    const status: CoverageResult["status"] =
      total === 0 ? "uncovered" : total === 1 ? "thin" : "solid";

    results.push({
      module_id: plan.module_id,
      lesson_id: plan.lesson_id,
      title: plan.title,
      lesson_tags: tags,
      hits_per_tag,
      total_unique_hits: total,
      status,
      matched_titles: Array.from(matchedTitles),
    });
  }

  const uncovered = results.filter((r) => r.status === "uncovered").length;
  const thin = results.filter((r) => r.status === "thin").length;
  const solid = results.filter((r) => r.status === "solid").length;
  console.log(`  → ${solid} solid, ${thin} thin, ${uncovered} uncovered (${results.length} total)`);

  return results;
}

// ── TEST 2: CITATION HALLUCINATION SCAN ──
interface CitationResult {
  entry_id: string;
  entry_title: string;
  total_citations_found: number;
  verified: number;
  unverified: number;
  likely_hallucinated: number;
  details: { claim: string; verdict: "VERIFIED" | "UNVERIFIED" | "LIKELY_HALLUCINATED"; reason: string }[];
}

async function scanCitations(entries: KBEntry[]): Promise<CitationResult[]> {
  console.log(`[2/3] Scanning ${entries.length} entries for hallucinated citations...`);
  const results: CitationResult[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    process.stdout.write(`  [${i + 1}/${entries.length}] ${entry.title.slice(0, 50)}... `);

    // Build a flat list of all citations to verify
    const principlesText = entry.key_principles
      .map((p) => `- ${p.principle}: ${p.explanation}`)
      .join("\n");
    const examplesText = entry.concrete_examples
      .map((e) => `- ${e.example} (${e.business_type}): ${e.lesson}`)
      .join("\n");
    const quotesText = entry.quotes
      .map((q) => `- "${q.quote}" — ${q.source}`)
      .join("\n");

    const prompt = `You are fact-checking citations in an educational content entry. The author claims specific people said specific things, or that specific businesses had specific outcomes.

Your job: identify every NAMED person, NAMED business, or SPECIFIC numerical claim in the content below, and mark each one as:
- VERIFIED: you have high confidence this person/business exists AND the claim attributed to them is plausibly accurate based on what you know
- UNVERIFIED: the person/business may exist but you can't confirm the specific claim
- LIKELY_HALLUCINATED: the specific phrasing, attribution, or numerical claim doesn't match what you know — possibly fabricated

CONTENT TO FACT-CHECK:

TITLE: ${entry.title}
TOPIC: ${entry.topic}

KEY PRINCIPLES:
${principlesText}

CONCRETE EXAMPLES:
${examplesText}

QUOTES:
${quotesText}

Be strict. A citation like "Patrick Campbell at ProfitWell analyzed 10,000 SaaS companies and found value-based pricing generates 2x revenue" needs to match BOTH the person AND the specific claim. If Patrick Campbell exists at ProfitWell but you can't confirm the 10,000-company analysis, mark UNVERIFIED. If the entire framing is unrecognizable, mark LIKELY_HALLUCINATED.

Return ONLY a JSON object:
{
  "total_citations_found": <number>,
  "verified": <number>,
  "unverified": <number>,
  "likely_hallucinated": <number>,
  "details": [
    { "claim": "<the exact claim>", "verdict": "VERIFIED|UNVERIFIED|LIKELY_HALLUCINATED", "reason": "<one sentence why>" }
  ]
}`;

    try {
      const result = await callOpus<Omit<CitationResult, "entry_id" | "entry_title">>(prompt, 3000);
      results.push({
        entry_id: entry.id,
        entry_title: entry.title,
        ...result,
      });
      console.log(`✓=${result.verified} ?=${result.unverified} ✗=${result.likely_hallucinated}`);
    } catch (e) {
      console.log(`X (${e instanceof Error ? e.message.slice(0, 40) : "fail"})`);
      results.push({
        entry_id: entry.id,
        entry_title: entry.title,
        total_citations_found: 0,
        verified: 0,
        unverified: 0,
        likely_hallucinated: 0,
        details: [],
      });
    }
  }

  return results;
}

// ── TEST 3: CROSS-MODEL QUALITY RE-EVAL ──
interface QualityScore {
  entry_id: string;
  entry_title: string;
  specificity: number;
  accuracy: number;
  age_appropriate: number;
  actionability: number;
  source_diversity: number;
  internal_consistency: number;
  total: number;
  notes: string;
  red_flags: string[];
}

async function rejudgeQuality(entries: KBEntry[]): Promise<QualityScore[]> {
  console.log(`[3/3] Cross-model quality re-eval (Opus 4.6) on ${entries.length} entries...`);
  const results: QualityScore[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    process.stdout.write(`  [${i + 1}/${entries.length}] ${entry.title.slice(0, 50)}... `);

    const principlesText = entry.key_principles.map((p) => `${p.principle}: ${p.explanation}`).join("\n");
    const examplesText = entry.concrete_examples.map((e) => `${e.example} — ${e.lesson}`).join("\n");
    const quotesText = entry.quotes.map((q) => `"${q.quote}" — ${q.source}`).join("\n");

    const prompt = `You are an independent expert evaluator (Claude Opus) reviewing a knowledge base entry written by Claude Sonnet for an AI tutor that teaches teenagers (ages 12-18) entrepreneurship. The entry will be injected as RAG context into the AI mentor's system prompt.

Score on 6 dimensions (1-5 each, 30 max). Be strict — a 5 should be rare.

ENTRY:
Title: ${entry.title}
Topic: ${entry.topic}
Lesson tags: ${entry.lesson_tags.join(", ")}

Key principles:
${principlesText}

Concrete examples:
${examplesText}

Quotes:
${quotesText}

Student-friendly summary:
${entry.student_friendly_summary}

Challenge Q&A count: ${entry.challenge_qa.length}

RUBRIC:
1. specificity (1-5): does the entry name real people, real businesses, real numbers — or is it generic motivational platitudes? 5 = "Patrick Campbell at ProfitWell, 10,000 SaaS companies, 2x revenue", 1 = "successful businesses focus on value"
2. accuracy (1-5): based on your training knowledge, are the named people and claims plausibly real and accurately attributed? 5 = every cited fact checks out, 1 = clearly fabricated names or numbers
3. age_appropriate (1-5): does this work for BOTH a 12-year-old and an 18-year-old? Too advanced (5 = "B2B SaaS unit economics") or too patronizing (1 = "remember to be nice") both lose points. 5 = a 14-year-old can act on it, an 18-year-old still finds it useful
4. actionability (1-5): can a teen do something with this TODAY? Concrete steps and scripts score 5; abstract frameworks with no application score 1
5. source_diversity (1-5): does the entry cite a diverse set of voices (gender, race, geography, industry)? 5 = cites multiple underrepresented founders or non-US examples, 1 = exclusively white male US founders
6. internal_consistency (1-5): does the entry contradict itself or the platform's broader voice (transformation not education, teen-executable, no SaaS-for-14yo)? 5 = perfectly consistent, 1 = contradicts itself or the platform mission

Also: list any red_flags — things that should be fixed before this gets shipped to a real teenager.

Return ONLY a JSON object:
{
  "specificity": <1-5>,
  "accuracy": <1-5>,
  "age_appropriate": <1-5>,
  "actionability": <1-5>,
  "source_diversity": <1-5>,
  "internal_consistency": <1-5>,
  "notes": "<2-3 sentence honest assessment>",
  "red_flags": ["<flag1>", "<flag2>"]
}`;

    try {
      const result = await callOpus<Omit<QualityScore, "entry_id" | "entry_title" | "total">>(prompt, 1500);
      const total =
        result.specificity +
        result.accuracy +
        result.age_appropriate +
        result.actionability +
        result.source_diversity +
        result.internal_consistency;
      results.push({
        entry_id: entry.id,
        entry_title: entry.title,
        ...result,
        total,
      });
      console.log(`${total}/30`);
    } catch (e) {
      console.log(`X (${e instanceof Error ? e.message.slice(0, 40) : "fail"})`);
    }
  }

  return results;
}

// ── REPORT WRITER ──
function writeReport(
  coverage: CoverageResult[],
  citations: CitationResult[],
  quality: QualityScore[]
) {
  const lines: string[] = [];

  lines.push("# Knowledge Base Eval Report");
  lines.push("");
  lines.push(`Run: ${new Date().toISOString()}`);
  lines.push(`Tests: coverage gap, citation hallucination scan, cross-model quality re-eval`);
  lines.push(`Judge: ${JUDGE_MODEL} (cross-model — entries written by Sonnet, judged by Opus)`);
  lines.push("");

  // ── HEADLINE ──
  const uncovered = coverage.filter((c) => c.status === "uncovered");
  const thin = coverage.filter((c) => c.status === "thin");
  const solid = coverage.filter((c) => c.status === "solid");

  const totalCitations = citations.reduce((s, c) => s + c.total_citations_found, 0);
  const totalVerified = citations.reduce((s, c) => s + c.verified, 0);
  const totalUnverified = citations.reduce((s, c) => s + c.unverified, 0);
  const totalHallucinated = citations.reduce((s, c) => s + c.likely_hallucinated, 0);

  const avgQuality =
    quality.length > 0
      ? quality.reduce((s, q) => s + q.total, 0) / quality.length
      : 0;
  const weakEntries = quality.filter((q) => q.total < 22).length;
  const strongEntries = quality.filter((q) => q.total >= 26).length;

  lines.push("## TL;DR");
  lines.push("");
  lines.push("### Coverage");
  lines.push(`- **${solid.length}/22** lessons have solid KB coverage (2+ entries)`);
  lines.push(`- **${thin.length}/22** lessons have thin coverage (only 1 entry)`);
  lines.push(`- **${uncovered.length}/22** lessons have ZERO KB coverage (silent RAG failure)`);
  lines.push("");
  lines.push("### Citations");
  lines.push(`- **${totalCitations}** total citations across all entries`);
  lines.push(`- **${totalVerified} (${totalCitations > 0 ? Math.round((totalVerified / totalCitations) * 100) : 0}%)** verified`);
  lines.push(`- **${totalUnverified} (${totalCitations > 0 ? Math.round((totalUnverified / totalCitations) * 100) : 0}%)** unverified (may be real, can't confirm)`);
  lines.push(`- **${totalHallucinated} (${totalCitations > 0 ? Math.round((totalHallucinated / totalCitations) * 100) : 0}%)** likely hallucinated — these need to be reviewed and either replaced or flagged`);
  lines.push("");
  lines.push("### Quality (cross-model Opus judge)");
  lines.push(`- **Average score: ${avgQuality.toFixed(2)}/30** across ${quality.length} entries`);
  lines.push(`- **${strongEntries}** entries scored 26+/30 (strong)`);
  lines.push(`- **${weakEntries}** entries scored <22/30 (weak — candidates for regeneration)`);
  lines.push("");

  // ── COVERAGE DETAIL ──
  lines.push("## Coverage Detail");
  lines.push("");
  if (uncovered.length > 0) {
    lines.push("### 🔴 UNCOVERED LESSONS (silent RAG failure — HIGH PRIORITY)");
    lines.push("");
    for (const c of uncovered) {
      lines.push(`- **M${c.module_id}.L${c.lesson_id} ${c.title}** — tags: \`[${c.lesson_tags.join(", ")}]\` — 0 KB hits`);
    }
    lines.push("");
  }
  if (thin.length > 0) {
    lines.push("### 🟡 THIN COVERAGE (only 1 entry)");
    lines.push("");
    for (const c of thin) {
      lines.push(`- **M${c.module_id}.L${c.lesson_id} ${c.title}** — tags: \`[${c.lesson_tags.join(", ")}]\` — 1 hit (\`${c.matched_titles[0]?.slice(0, 60)}\`)`);
    }
    lines.push("");
  }
  lines.push("### 🟢 SOLID COVERAGE");
  lines.push("");
  lines.push("| Module.Lesson | Title | Hits | Tags |");
  lines.push("|---|---|---|---|");
  for (const c of solid) {
    lines.push(
      `| M${c.module_id}.L${c.lesson_id} | ${c.title} | ${c.total_unique_hits} | ${c.lesson_tags.join(", ")} |`
    );
  }
  lines.push("");

  // ── CITATION DETAIL ──
  lines.push("## Citation Hallucination Scan");
  lines.push("");
  lines.push("Entries ordered by hallucination risk (most concerning first).");
  lines.push("");
  const sortedCitations = [...citations].sort((a, b) => b.likely_hallucinated - a.likely_hallucinated);
  for (const c of sortedCitations) {
    if (c.total_citations_found === 0) continue;
    const flag = c.likely_hallucinated > 0 ? "🔴" : c.unverified > 0 ? "🟡" : "🟢";
    lines.push(`### ${flag} ${c.entry_title}`);
    lines.push(`- Total citations: ${c.total_citations_found}`);
    lines.push(`- Verified: ${c.verified} · Unverified: ${c.unverified} · Likely hallucinated: ${c.likely_hallucinated}`);
    if (c.details.length > 0) {
      const concerning = c.details.filter((d) => d.verdict !== "VERIFIED");
      if (concerning.length > 0) {
        lines.push("");
        lines.push("**Concerning citations:**");
        for (const d of concerning) {
          const icon = d.verdict === "LIKELY_HALLUCINATED" ? "✗" : "?";
          lines.push(`- ${icon} \`${d.claim.slice(0, 120)}\``);
          lines.push(`  - ${d.reason}`);
        }
      }
    }
    lines.push("");
  }

  // ── QUALITY DETAIL ──
  lines.push("## Quality Re-Eval (Opus judge)");
  lines.push("");
  lines.push("Entries ordered by score (weakest first — these are the regeneration candidates).");
  lines.push("");
  const sortedQuality = [...quality].sort((a, b) => a.total - b.total);
  lines.push("| Score | Entry | Spec | Acc | Age | Action | Diverse | Consist |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const q of sortedQuality) {
    lines.push(
      `| **${q.total}/30** | ${q.entry_title.slice(0, 60)} | ${q.specificity} | ${q.accuracy} | ${q.age_appropriate} | ${q.actionability} | ${q.source_diversity} | ${q.internal_consistency} |`
    );
  }
  lines.push("");

  for (const q of sortedQuality) {
    lines.push(`### ${q.total}/30 — ${q.entry_title}`);
    lines.push(`> ${q.notes}`);
    if (q.red_flags && q.red_flags.length > 0) {
      lines.push("");
      lines.push("**Red flags:**");
      for (const f of q.red_flags) lines.push(`- ${f}`);
    }
    lines.push("");
  }

  const reportPath = path.join(process.cwd(), "scripts/eval-knowledge-base-report.md");
  writeFileSync(reportPath, lines.join("\n"));
  console.log(`\nReport: ${reportPath}`);
}

// ── MAIN ──
(async () => {
  // Pull all KB entries
  const { data: entriesRaw, error } = await sb
    .from("knowledge_base")
    .select("*");
  if (error) {
    console.error("Failed to load knowledge_base:", error.message);
    process.exit(1);
  }
  const entries = (entriesRaw ?? []) as KBEntry[];
  console.log(`\nLoaded ${entries.length} knowledge_base entries\n`);

  // Run all 3 tests
  const coverage = await testCoverage();
  const citations = await scanCitations(entries);
  const quality = await rejudgeQuality(entries);

  writeReport(coverage, citations, quality);

  // Exit summary
  const uncovered = coverage.filter((c) => c.status === "uncovered").length;
  const thin = coverage.filter((c) => c.status === "thin").length;
  const halluc = citations.reduce((s, c) => s + c.likely_hallucinated, 0);
  const avgQ = quality.length > 0 ? quality.reduce((s, q) => s + q.total, 0) / quality.length : 0;
  console.log(`\n══════════════════════════════════════════════════════════`);
  console.log(`  Coverage: ${22 - uncovered - thin} solid · ${thin} thin · ${uncovered} uncovered`);
  console.log(`  Citations: ${halluc} likely hallucinated across ${citations.length} entries`);
  console.log(`  Quality: ${avgQ.toFixed(2)}/30 average (${quality.length} entries)`);
  console.log(`══════════════════════════════════════════════════════════\n`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
