/**
 * Regenerate the 16 hallucinated knowledge_base entries with a STRICT
 * no-fabrication prompt.
 *
 * Background: the citation hallucination scan in scripts/eval-knowledge-base.ts
 * found that 115 of 395 citations (29%) in the 16 entries seeded by the
 * 2-agent pipeline on 2026-04-07 are LIKELY HALLUCINATED. The original
 * researcher prompt told Sonnet to "be specific" and "cite real people and
 * real numbers" — and Sonnet complied by inventing them when it didn't have
 * real ones to cite.
 *
 * THE FIX: a stricter researcher prompt that EXPLICITLY BANS invented
 * specifics. The model is told to either cite real, well-known people and
 * frameworks it has high confidence about, or use generic illustrations
 * clearly marked as "imagine a teen who..." — never to fabricate named
 * teens, fake case studies, or made-up statistics.
 *
 * The challenger pass is also tightened: it now MUST flag any specific
 * person, business, or numerical claim it doesn't recognize, and
 * downgrade quality if any are present.
 *
 * REPLACEMENT STRATEGY: regenerate in place (same row id, replace the
 * content fields), then leave verified=false until the next eval pass
 * confirms hallucination rate is <5%. After that confirmation, a separate
 * UPDATE marks them verified=true.
 *
 * Usage: npx tsx scripts/regenerate-knowledge-base.ts
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
  console.error("ANTHROPIC_API_KEY not found in .env.local");
  process.exit(1);
}

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
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

function stripCodeFences(s: string): string {
  let clean = s.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) clean = clean.slice(first, last + 1);
  return clean;
}

// ── STRICT RESEARCHER ──
async function research(topic: string, lessonTags: string[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are an expert business education researcher building a knowledge base for an AI tutor that teaches teenagers (ages 12-18) entrepreneurship.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL: NO FABRICATION ALLOWED 🚨
═══════════════════════════════════════════════════════════════════

You MUST follow these rules. Violating any of them is worse than producing
a less specific entry.

1. NEVER invent named individuals. If you cite a person by name, you must be
   highly confident that:
   (a) the person is real and well-known in their field
   (b) the specific claim attributed to them is accurately stated
   You may cite: Sara Blakely, Reid Hoffman, Paul Graham, Marty Neumeier,
   Donald Miller, Clayton Christensen, Mike Michalowicz, Chris Voss, Daymond
   John, Reshma Saujani, Linda Babcock, Atul Gawande, Eric Ries, Steve Blank,
   Garry Tan, Peter Thiel, Tim Brown, Jeff Bezos, Simon Sinek, Rick Rubin,
   and other broadly recognized business writers and founders. You may NOT
   cite a "marketing expert" or "growth strategist" unless you can name a
   real one with confidence.

2. NEVER fabricate teen case studies. Do NOT write "Sofia Chen, 14, tutoring
   service in Vancouver — got 50 DMs from classmates' parents." That kid
   doesn't exist. If you want to illustrate with a teen example, write:
   "Imagine a 14-year-old who tutors classmates in algebra. She could..."
   The "imagine" framing is required. Specific names + specific outcomes for
   teens you cannot verify is FABRICATION.

3. NEVER invent specific statistics. Do NOT write "340% more engagement" or
   "10,000 SaaS companies analyzed" unless you have high confidence the
   exact number is real and accurately attributed. If you want to make a
   directional point, say "research consistently finds that posting daily
   beats sporadic posting" — without inventing a specific percentage.

4. NEVER invent named businesses. Real companies are fine to cite (Glossier,
   Spanx, Warby Parker, Disney, Stripe, Apple, Patagonia, FUBU). Made-up
   companies are not. "A bakery I worked with" is acceptable as a generic
   illustration; "Gilt Bakery in Brooklyn raised prices 40%" is fabrication
   unless you can confirm Gilt Bakery exists and made that change.

5. WHEN IN DOUBT, GENERALIZE. A generic-but-honest principle is more useful
   than a specific-but-fake claim. The AI tutor will not lose credibility for
   teaching a true general principle. It WILL lose credibility for citing
   "Marketing strategist Jasmine Star's analysis of 50,000 small business
   interactions" if Jasmine Star never did that analysis.

═══════════════════════════════════════════════════════════════════

Your output structure (return ONLY valid JSON):
- title: descriptive
- source_type: framework | article | case_study | interview | essay | principle
- key_principles: 3-5 ideas. Each should be a real principle you can teach
  without needing to cite a specific person or number. If you DO cite, the
  citation must pass rules 1-5.
- concrete_examples: 2-4 examples. Real well-known companies are fine.
  Hypothetical illustrations are fine if framed as "imagine a teen who..."
  Fabricated specific named teens with specific revenue are NOT fine.
- quotes: 1-3 quotes. Each must be from a person you are HIGHLY CONFIDENT
  said it, in something close to those exact words. If unsure, omit.

JSON shape:
{"title":"...","source_type":"...","key_principles":[{"principle":"...","explanation":"..."}],"concrete_examples":[{"example":"...","business_type":"...","lesson":"..."}],"quotes":[{"quote":"...","source":"...","context":"..."}]}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}
Lesson tags: ${lessonTags.join(", ")}

Generate the knowledge base entry. Follow ALL the no-fabrication rules. When you're tempted to invent a specific named teen or a specific statistic, GENERALIZE instead. Return ONLY valid JSON.`,
      },
    ],
  });
  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? "";
}

// ── STRICT CHALLENGER ──
async function challenge(topic: string, researchOutput: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a skeptical, smart 16-year-old reviewing educational content. You're TIRED of generic business advice — but you're ALSO tired of fake-sounding "case studies" that obviously aren't real.

Your job:
1. Read the researcher's output
2. FLAG any specific person, business, or number you don't recognize as real.
   Mark these in a flags array. This is the most important check.
3. Ask 5 hard questions a real teen would ask
4. Answer each using the research, in plain language
5. Write a student-friendly summary a 14-year-old could act on
6. Score quality 1-10. The score is automatically capped at 6 if there are
   ANY flagged-as-unverifiable specifics.

Return ONLY valid JSON:
{"student_friendly_summary":"2-3 paragraphs in casual encouraging language. Use 'you' and 'your'. Reference examples from the research. Translate jargon.","challenge_qa":[{"question":"hard question","answer":"concrete answer"}],"quality_score":<1-10>,"flags":["any specific named person, business, or number that smells fabricated"]}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}

Researcher output:
${researchOutput}

Flag anything that smells fabricated. Be aggressive. A specific named teen with a specific revenue number is a red flag. A "marketing expert" without a real name is a red flag. A precise percentage like "340% more engagement" without a known source is a red flag. Return ONLY valid JSON.`,
      },
    ],
  });
  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? "";
}

(async () => {
  // Pull all unverified entries
  const { data: unverified, error } = await sb
    .from("knowledge_base")
    .select("*")
    .eq("verified", false);
  if (error) {
    console.error("Failed to load unverified entries:", error.message);
    process.exit(1);
  }
  const entries = (unverified ?? []) as KBEntry[];
  console.log(`\nRegenerating ${entries.length} unverified knowledge_base entries\n`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    process.stdout.write(`[${i + 1}/${entries.length}] ${entry.title.slice(0, 55)}... `);

    let researchOutput: string;
    try {
      researchOutput = stripCodeFences(await research(entry.topic, entry.lesson_tags));
      JSON.parse(researchOutput);
      process.stdout.write("R");
    } catch (e) {
      console.log(` X research (${e instanceof Error ? e.message.slice(0, 50) : "fail"})`);
      failed++;
      continue;
    }

    let challengeOutput: string;
    try {
      challengeOutput = stripCodeFences(await challenge(entry.topic, researchOutput));
      JSON.parse(challengeOutput);
      process.stdout.write("C");
    } catch (e) {
      console.log(` X challenge (${e instanceof Error ? e.message.slice(0, 50) : "fail"})`);
      failed++;
      continue;
    }

    try {
      const r = JSON.parse(researchOutput);
      const c = JSON.parse(challengeOutput);

      // Update IN PLACE — keeps the same id and lesson_tags
      const { error: updateError } = await sb
        .from("knowledge_base")
        .update({
          title: r.title ?? entry.title,
          source_type: r.source_type ?? entry.source_type,
          key_principles: r.key_principles ?? [],
          concrete_examples: r.concrete_examples ?? [],
          quotes: r.quotes ?? [],
          student_friendly_summary: c.student_friendly_summary ?? "",
          challenge_qa: c.challenge_qa ?? [],
          // Stay verified=false until the eval re-run confirms <5% hallucination
          verified: false,
        })
        .eq("id", entry.id);

      if (updateError) {
        console.log(` X update: ${updateError.message}`);
        failed++;
      } else {
        const flags = (c.flags ?? []) as string[];
        const flagDisplay = flags.length > 0 ? ` [${flags.length} flags]` : "";
        console.log(` ✓ q=${c.quality_score ?? "?"}${flagDisplay}`);
        success++;
      }
    } catch (e) {
      console.log(` X parse: ${(e as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success}/${entries.length} regenerated, ${failed} failed.`);
  console.log(`\nNext step: re-run scripts/eval-knowledge-base.ts to verify`);
  console.log(`hallucination rate dropped. Then run 'UPDATE knowledge_base SET`);
  console.log(`verified = true WHERE verified = false;' if the eval passes.`);
})();
