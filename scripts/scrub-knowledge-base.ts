/**
 * SURGICAL SCRUB — for each unverified knowledge_base entry, identify
 * every LIKELY HALLUCINATED claim and DELETE it from the entry. Don't
 * try to replace, don't try to find a "close enough" real version. Just
 * cut the unverifiable claims out.
 *
 * The result: entries that may be slightly less specific but in which
 * every word is verifiable.
 *
 * Per the outside-voice editorial review on 2026-04-08, the test is:
 * "can a skeptical teenager verify it in 60 seconds." If a citation
 * fails that test, it has to go.
 *
 * This script:
 *   1. Loads all unverified entries
 *   2. For each, sends to Opus with the prompt: "audit every named person,
 *      named business, and specific number; return the entry with every
 *      LIKELY_HALLUCINATED claim REMOVED (not replaced)"
 *   3. Updates the entry in place — same id, same lesson_tags, same topic,
 *      cleaned content fields
 *   4. Leaves verified=false until the next eval pass confirms ~0%
 *
 * Usage: npx tsx scripts/scrub-knowledge-base.ts
 */

import { readFileSync } from "fs";
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

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY not found");
  process.exit(1);
}

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const SCRUB_MODEL = "claude-opus-4-6"; // use the same judge that flagged the issues

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  verified: boolean;
}

interface ScrubResult {
  key_principles: { principle: string; explanation: string }[];
  concrete_examples: { example: string; business_type: string; lesson: string }[];
  quotes: { quote: string; source: string; context?: string }[];
  student_friendly_summary: string;
  challenge_qa: { question: string; answer: string }[];
  removed: { type: "principle" | "example" | "quote" | "summary_phrase" | "qa"; what: string; why: string }[];
}

function stripCodeFences(s: string): string {
  let clean = s.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) clean = clean.slice(first, last + 1);
  return clean;
}

async function scrubEntry(entry: KBEntry): Promise<ScrubResult | null> {
  const prompt = `You are an editorial fact-checker for a teen entrepreneurship education platform whose stated mission is "confidence in their knowledge should be facts-based." Your job is to surgically REMOVE any unverifiable specific claims from a knowledge base entry.

THE FACTUAL FLOOR (you MUST enforce this):
A claim survives if and only if a skeptical 16-year-old could independently verify it in under 60 seconds via Google. If you cannot confidently verify it, you MUST cut it.

Specifically REMOVE:
1. Any named teen entrepreneur with specific outcomes (e.g., "Tiana Soto, 15, jewelry maker from Phoenix — 200 followers, $180 revenue") — these are fabrications. Cut the entire example/principle/quote.
2. Any specific statistic attributed to a real person if you cannot verify the EXACT statistic was actually said by them (e.g., "Gary Vaynerchuk's data shows 340% more engagement" — Gary is real, the 340% is fabricated, cut it).
3. Any "marketing expert," "growth strategist," or other unnamed authority paired with a specific claim. Cut.
4. Any study citation ("a study of 10,000 SaaS companies found...") that isn't accompanied by a real, checkable source.
5. Any quote attributed to a real person if you can't confirm the EXACT phrasing came from them. (Paraphrases of well-known general principles are OK if attributed to "the general consensus" or similar; specific quoted words attributed to a name are not.)

KEEP:
- Real, well-known frameworks and principles (Lean Canvas, Jobs-to-be-Done, Mom Test, Golden Circle, etc.)
- Real, well-known companies as illustrations (Glossier, Spanx, Warby Parker, etc.) — but only with claims you can verify
- General "imagine a teen who..." hypotheticals — these are clearly labeled as illustration, not as fact
- Mechanism explanations ("when you lower a price, conversion increases" — the principle, not a specific percentage)

OUTPUT INSTRUCTIONS:
Return the FULL entry content with the unverifiable items REMOVED. Do not try to replace them. Do not invent better citations. Just delete the offending principle/example/quote and return what's left.

If a key_principle contains an unverifiable specific, EITHER (a) remove the entire principle if the specific was the core, OR (b) keep the principle but rewrite the explanation to remove the unverifiable claim while keeping the general truth. Use your judgment.

If a concrete_example contains an unverifiable specific (especially fabricated teens), DELETE THE ENTIRE EXAMPLE.

If a quote is unverifiable, DELETE THE ENTIRE QUOTE.

If the student_friendly_summary mentions an unverifiable claim, REWRITE that sentence to be general (e.g., "studies show value-based pricing generates 2x revenue" → "value-based pricing tends to generate more revenue than cost-plus pricing").

If a challenge_qa answer cites an unverifiable claim, rewrite the answer to remove that specific claim while keeping the spirit.

ENTRY TO SCRUB:

TITLE: ${entry.title}
TOPIC: ${entry.topic}

KEY PRINCIPLES (${entry.key_principles.length}):
${entry.key_principles.map((p, i) => `${i}. ${p.principle}: ${p.explanation}`).join("\n")}

CONCRETE EXAMPLES (${entry.concrete_examples.length}):
${entry.concrete_examples.map((e, i) => `${i}. ${e.example} (${e.business_type}): ${e.lesson}`).join("\n")}

QUOTES (${entry.quotes.length}):
${entry.quotes.map((q, i) => `${i}. "${q.quote}" — ${q.source}${q.context ? ` (${q.context})` : ""}`).join("\n")}

STUDENT-FRIENDLY SUMMARY:
${entry.student_friendly_summary}

CHALLENGE Q&A (${entry.challenge_qa.length}):
${entry.challenge_qa.map((qa, i) => `${i}. Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")}

Return ONLY a JSON object with this exact shape (the cleaned versions of every field):
{
  "key_principles": [{"principle": "...", "explanation": "..."}],
  "concrete_examples": [{"example": "...", "business_type": "...", "lesson": "..."}],
  "quotes": [{"quote": "...", "source": "...", "context": "..."}],
  "student_friendly_summary": "...",
  "challenge_qa": [{"question": "...", "answer": "..."}],
  "removed": [{"type": "principle|example|quote|summary_phrase|qa", "what": "<what was removed>", "why": "<why it failed the factual floor>"}]
}

If nothing in the entry needs to be removed, return the original content unchanged with an empty removed array.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await anthropic.messages.create({
        model: SCRUB_MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      return JSON.parse(stripCodeFences(text)) as ScrubResult;
    } catch (e) {
      if (attempt === 2) {
        console.log(`  scrub failed: ${e instanceof Error ? e.message.slice(0, 80) : "?"}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  return null;
}

(async () => {
  const { data: entries, error } = await sb
    .from("knowledge_base")
    .select("*")
    .eq("verified", false);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  const list = (entries ?? []) as KBEntry[];
  console.log(`\nScrubbing ${list.length} unverified entries against the Adaptable Factual Floor\n`);

  let totalRemoved = 0;
  let updated = 0;

  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    process.stdout.write(`[${i + 1}/${list.length}] ${entry.title.slice(0, 55)}... `);

    const scrubbed = await scrubEntry(entry);
    if (!scrubbed) {
      console.log("X");
      continue;
    }

    const removedCount = scrubbed.removed?.length ?? 0;
    totalRemoved += removedCount;

    const { error: updateErr } = await sb
      .from("knowledge_base")
      .update({
        key_principles: scrubbed.key_principles,
        concrete_examples: scrubbed.concrete_examples,
        quotes: scrubbed.quotes,
        student_friendly_summary: scrubbed.student_friendly_summary,
        challenge_qa: scrubbed.challenge_qa,
      })
      .eq("id", entry.id);

    if (updateErr) {
      console.log(`X update: ${updateErr.message}`);
    } else {
      updated++;
      console.log(`✓ removed ${removedCount}`);
      if (scrubbed.removed && scrubbed.removed.length > 0) {
        for (const r of scrubbed.removed.slice(0, 3)) {
          console.log(`     - [${r.type}] ${r.what.slice(0, 90)}`);
        }
        if (scrubbed.removed.length > 3) {
          console.log(`     ... and ${scrubbed.removed.length - 3} more`);
        }
      }
    }
  }

  console.log(`\nDone. ${updated}/${list.length} entries scrubbed. ${totalRemoved} unverifiable claims removed.`);
  console.log("\nNext: re-run scripts/eval-knowledge-base.ts to confirm hallucination rate is ~0%.");
  console.log("If it passes, run scripts/promote-regenerated.ts to mark entries verified=true.");
})();
