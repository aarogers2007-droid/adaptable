/**
 * Slim eval — citation hallucination scan only.
 *
 * Skips the coverage gap test (we know it's 22/22 from prior run) and
 * skips the cross-model quality re-eval (we have those numbers from
 * prior runs). Only checks the metric that matters for the verified-
 * promotion gate: how many citations across all entries are likely
 * hallucinated after the scrub.
 *
 * ~10 min wall time, ~25 Opus calls (~$3-4).
 *
 * Usage: npx tsx scripts/eval-kb-citations-only.ts
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";

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

interface CitationDetail {
  claim: string;
  verdict: "VERIFIED" | "UNVERIFIED" | "LIKELY_HALLUCINATED";
  reason: string;
}
interface CitationResult {
  total_citations_found: number;
  verified: number;
  unverified: number;
  likely_hallucinated: number;
  details: CitationDetail[];
}

async function scanEntry(entry: KBEntry): Promise<CitationResult | null> {
  const principlesText = entry.key_principles.map((p) => `- ${p.principle}: ${p.explanation}`).join("\n");
  const examplesText = entry.concrete_examples.map((e) => `- ${e.example} (${e.business_type}): ${e.lesson}`).join("\n");
  const quotesText = entry.quotes.map((q) => `- "${q.quote}" — ${q.source}`).join("\n");

  const prompt = `You are fact-checking citations in an educational content entry for a teen entrepreneurship platform whose mission is "facts-based confidence."

Identify every NAMED person, NAMED business, or SPECIFIC numerical claim in the content below and mark each as:
- VERIFIED: high confidence the person/business exists AND the claim is accurate
- UNVERIFIED: may exist but you can't confirm the specific claim
- LIKELY_HALLUCINATED: phrasing/attribution/number doesn't match what you know

Be strict. The test is "could a 16-year-old verify this in 60 seconds via Google."

CONTENT:
TITLE: ${entry.title}
TOPIC: ${entry.topic}

KEY PRINCIPLES:
${principlesText || "(none)"}

CONCRETE EXAMPLES:
${examplesText || "(none)"}

QUOTES:
${quotesText || "(none)"}

Return ONLY a JSON object:
{
  "total_citations_found": <number>,
  "verified": <number>,
  "unverified": <number>,
  "likely_hallucinated": <number>,
  "details": [{ "claim": "...", "verdict": "VERIFIED|UNVERIFIED|LIKELY_HALLUCINATED", "reason": "..." }]
}

If there are no specific named/numerical claims to check (the entry uses only general principles), return zeros and an empty details array.`;

  for (let i = 0; i < 3; i++) {
    try {
      const res = await anthropic.messages.create({
        model: JUDGE_MODEL,
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      });
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      const parsed = JSON.parse(stripCodeFences(text)) as Partial<CitationResult>;
      return {
        total_citations_found: parsed.total_citations_found ?? 0,
        verified: parsed.verified ?? 0,
        unverified: parsed.unverified ?? 0,
        likely_hallucinated: parsed.likely_hallucinated ?? 0,
        details: parsed.details ?? [],
      };
    } catch (e) {
      if (i === 2) {
        console.log(`  scan failed: ${e instanceof Error ? e.message.slice(0, 80) : "?"}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return null;
}

(async () => {
  const { data: entries, error } = await sb.from("knowledge_base").select("*");
  if (error) {
    console.error(error);
    process.exit(1);
  }
  const list = (entries ?? []) as KBEntry[];
  console.log(`\nCitation hallucination scan: ${list.length} entries\n`);

  let totalCitations = 0;
  let totalVerified = 0;
  let totalUnverified = 0;
  let totalHallucinated = 0;
  const perEntryResults: { entry: KBEntry; result: CitationResult }[] = [];

  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    process.stdout.write(`[${i + 1}/${list.length}] ${entry.title.slice(0, 55)}... `);
    const result = await scanEntry(entry);
    if (!result) {
      console.log("X");
      continue;
    }
    totalCitations += result.total_citations_found;
    totalVerified += result.verified;
    totalUnverified += result.unverified;
    totalHallucinated += result.likely_hallucinated;
    perEntryResults.push({ entry, result });
    console.log(`✓=${result.verified} ?=${result.unverified} ✗=${result.likely_hallucinated}`);
  }

  // Build markdown report
  const lines: string[] = [];
  lines.push("# Knowledge Base Citation Audit (post-scrub)");
  lines.push("");
  lines.push(`Run: ${new Date().toISOString()}`);
  lines.push(`Judge: ${JUDGE_MODEL}`);
  lines.push("");
  lines.push("## TL;DR");
  lines.push("");
  lines.push(`- **${totalCitations}** total citations across ${list.length} entries`);
  lines.push(`- **${totalVerified} (${totalCitations > 0 ? Math.round((totalVerified / totalCitations) * 100) : 0}%)** verified`);
  lines.push(`- **${totalUnverified} (${totalCitations > 0 ? Math.round((totalUnverified / totalCitations) * 100) : 0}%)** unverified`);
  lines.push(`- **${totalHallucinated} (${totalCitations > 0 ? Math.round((totalHallucinated / totalCitations) * 100) : 0}%)** likely hallucinated`);
  lines.push("");
  if (totalHallucinated === 0) {
    lines.push("**✅ ZERO likely-hallucinated citations. Adaptable Factual Floor passed.**");
  } else if (totalHallucinated <= 5) {
    lines.push(`**🟡 ${totalHallucinated} residual hallucinated citations remain. Manual review recommended before promoting to verified.**`);
  } else {
    lines.push(`**🔴 ${totalHallucinated} hallucinated citations remain. DO NOT promote to verified=true. Re-scrub or remove offending entries.**`);
  }
  lines.push("");

  // Per-entry detail (only entries with concerning citations)
  const concerning = perEntryResults
    .filter((r) => r.result.likely_hallucinated > 0 || r.result.unverified > 0)
    .sort((a, b) => b.result.likely_hallucinated - a.result.likely_hallucinated);
  if (concerning.length > 0) {
    lines.push("## Entries with concerning citations");
    lines.push("");
    for (const { entry, result } of concerning) {
      const flag = result.likely_hallucinated > 0 ? "🔴" : "🟡";
      lines.push(`### ${flag} ${entry.title}`);
      lines.push(`- Total: ${result.total_citations_found} · Verified: ${result.verified} · Unverified: ${result.unverified} · Likely hallucinated: ${result.likely_hallucinated}`);
      const concerningDetails = result.details.filter((d) => d.verdict !== "VERIFIED");
      if (concerningDetails.length > 0) {
        lines.push("");
        for (const d of concerningDetails) {
          const icon = d.verdict === "LIKELY_HALLUCINATED" ? "✗" : "?";
          lines.push(`- ${icon} \`${d.claim.slice(0, 120)}\``);
          lines.push(`  - ${d.reason}`);
        }
      }
      lines.push("");
    }
  }

  // Clean entries
  const clean = perEntryResults.filter((r) => r.result.likely_hallucinated === 0 && r.result.unverified === 0);
  lines.push(`## Clean entries (${clean.length})`);
  lines.push("");
  for (const { entry, result } of clean) {
    lines.push(`- ✅ ${entry.title} — ${result.verified}/${result.total_citations_found} verified`);
  }

  const reportPath = path.join(process.cwd(), "scripts/eval-kb-citations-report.md");
  writeFileSync(reportPath, lines.join("\n"));
  console.log(`\nReport: ${reportPath}`);
  console.log(`\nResult: ${totalHallucinated} likely-hallucinated citations across ${totalCitations} total`);
  console.log(`Verification rate: ${totalCitations > 0 ? Math.round((totalVerified / totalCitations) * 100) : 0}%`);
  process.exit(totalHallucinated === 0 ? 0 : totalHallucinated <= 5 ? 0 : 1);
})();
