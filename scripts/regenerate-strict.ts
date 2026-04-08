/**
 * MAXIMALLY-STRICT REGENERATION (Option B from the 2026-04-08 KB sweep).
 *
 * After two scrub passes, residual hallucination is at 12% — mostly real
 * direct quotes from real people whose exact wording the model can't
 * verify, plus invented dollar figures in "imagine a teen" hypotheticals.
 *
 * This regen pass enforces a maximally-strict prompt:
 *   - ZERO direct quotes attributed to a real person (even Sara Blakely)
 *   - ZERO specific dollar figures in hypotheticals (use vague language)
 *   - ZERO editorialized framing words (disrupted, revolutionized, stalled, etc.)
 *   - Real company names allowed ONLY as factual identifiers, not as case
 *     studies with specific claimed outcomes
 *   - Principles, frameworks, and mechanism explanations only
 *
 * The result: entries that may be less vivid but every word is defensible
 * against a 60-second Google verification.
 *
 * Usage: npx tsx scripts/regenerate-strict.ts
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

const RESEARCHER_SYSTEM = `You are an expert business education researcher building a knowledge base for an AI tutor that teaches teenagers (ages 12-18) entrepreneurship. The platform's stated mission is "facts-based confidence." Your job is to produce content where EVERY word survives a 60-second Google verification.

═══════════════════════════════════════════════════════════════════
🚨 MAXIMALLY-STRICT FACTUAL FLOOR 🚨
═══════════════════════════════════════════════════════════════════

These rules are non-negotiable. Violating any of them is a worse outcome than producing a less specific entry.

1. **ZERO DIRECT QUOTES from real people. Period.**
   You may NOT include any text in quotation marks attributed to any named person, no matter how famous. No Sara Blakely quotes, no Reid Hoffman quotes, no Marty Neumeier quotes, no Jeff Bezos quotes, NO QUOTES FROM ANYONE. The "quotes" array in your output should be EMPTY.

   Why: even widely-circulated quotes are often paraphrases, misattributions, or inventions of internet folklore. We have no way to verify exact wording without hyperlink-checkable primary sources, which we don't have. The safe move is no quotes.

   If you want to share a person's idea, paraphrase the principle in general language WITHOUT naming a quote: "the idea that businesses succeed by starting with WHY (the purpose), not WHAT (the product), is widely associated with several writers in the leadership space."

2. **ZERO specific dollar figures in hypotheticals.**
   You may NOT write "imagine a teen who charges $25 because materials cost $2." You may NOT write "lawn care packages: Basic $30, Premium $50, Deluxe $70." You may NOT invent specific prices for fictional teens.

   If you need to illustrate pricing concepts, use VAGUE language: "a few dollars," "roughly minimum wage," "low double digits per session," "a small amount." If you need to illustrate a markup concept, say "if the materials cost X and you charge 3X" — variable, not numeric.

3. **ZERO editorialized framing words.**
   Do NOT write that any company "disrupted," "revolutionized," "transformed," "stalled," "failed," "killed," "destroyed," "took over," "dominated," or "saved" anything. These are hype words that fail the factual-floor test because they're subjective characterizations dressed up as facts.

   Use neutral language: "Glossier sells beauty products direct to consumers" not "Glossier disrupted beauty." "Warby Parker launched in 2010 and sells eyewear online" not "Warby Parker disrupted the eyewear industry."

4. **Real company names allowed ONLY as factual identifiers.**
   You may say "Glossier is a cosmetics brand" or "Stripe is a payment processor." You may NOT say "Stripe processed $1 trillion in payments in 2023" unless you can cite a hyperlink-checkable source. You may NOT attribute specific outcomes to specific companies.

   If you want to illustrate a principle with a "company example," use HYPOTHETICAL framing: "imagine a coffee shop that..." or "a small bakery might..."

5. **Real frameworks and principles are encouraged.**
   You SHOULD reference: Lean Canvas, Business Model Canvas, Jobs-to-be-Done, Mom Test, Golden Circle, MVP, Build-Measure-Learn, customer development, value-based pricing. These are real concepts from real authors that any 16-year-old can verify in 60 seconds. You can NAME the framework. You can NAME the author of the framework (Eric Ries wrote The Lean Startup, Clayton Christensen formalized JTBD, etc.). What you can't do is QUOTE them.

6. **NO fabricated teen case studies.**
   Same rule as before. No "Tiana Soto, 15, jewelry maker." No "Marcus, 16, lawn care service." Use "imagine a teen who..." framing if you need an illustration, and keep the illustration general (no specific names, locations, follower counts, or revenue figures).

7. **WHEN IN DOUBT, GENERALIZE OR OMIT.**
   A short principle that's 100% verifiable is more useful than a vivid principle with one shaky claim.

═══════════════════════════════════════════════════════════════════

OUTPUT JSON SHAPE:
{
  "title": "descriptive",
  "source_type": "framework | article | case_study | interview | essay | principle",
  "key_principles": [{"principle": "...", "explanation": "..."}],
  "concrete_examples": [{"example": "...", "business_type": "...", "lesson": "..."}],
  "quotes": [],   // ALWAYS EMPTY in this regeneration
  "student_friendly_summary": "..."
}

The "quotes" array MUST be empty. If you put anything in it, you have violated rule 1.`;

const CHALLENGER_SYSTEM = `You are a skeptical 16-year-old reviewing educational content. Your job: read the researcher's output and aggressively flag ANY claim that fails the 60-second Google verifiability test.

YOU MUST FLAG:
- Any direct quote attributed to anyone (the researcher was told NO QUOTES — if you see any, the entire output is a violation)
- Any specific dollar figure in a hypothetical example
- Any editorialized framing word (disrupted, revolutionized, stalled, transformed, dominated, killed, saved)
- Any company-specific outcome claim ("X had Y revenue", "X grew to Y users")
- Any specific statistic without a hyperlink-checkable source

Quality score is automatically capped at 5/10 if there are ANY flags.

Output JSON:
{
  "student_friendly_summary": "2-3 paragraphs in casual encouraging language. Use 'you' and 'your'. Reference principles from the research. Translate jargon. NO direct quotes. NO invented numbers.",
  "challenge_qa": [{"question": "hard teen question", "answer": "concrete answer that follows the same factual-floor rules"}],
  "quality_score": <1-10>,
  "flags": ["any rule violation in the researcher output"]
}`;

async function research(topic: string, lessonTags: string[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: RESEARCHER_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}
Lesson tags: ${lessonTags.join(", ")}

Generate the knowledge base entry. Follow ALL the maximally-strict rules. The "quotes" array MUST be empty. Return ONLY valid JSON.`,
      },
    ],
  });
  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? "";
}

async function challenge(topic: string, researchOutput: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: CHALLENGER_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}

Researcher output:
${researchOutput}

Flag any rule violations. Be ruthless. Return ONLY valid JSON.`,
      },
    ],
  });
  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? "";
}

(async () => {
  // Pull all entries (currently all are verified=false after the revert + scrub-all)
  const { data: entries, error } = await sb
    .from("knowledge_base")
    .select("*");
  if (error) {
    console.error("Failed to load entries:", error.message);
    process.exit(1);
  }
  const list = (entries ?? []) as KBEntry[];
  console.log(`\nMAXIMALLY-STRICT REGEN: ${list.length} entries\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    process.stdout.write(`[${i + 1}/${list.length}] ${entry.title.slice(0, 55)}... `);

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

      // Force quotes to empty regardless of what the model returned
      const cleanQuotes: { quote: string; source: string; context?: string }[] = [];

      const { error: updateError } = await sb
        .from("knowledge_base")
        .update({
          title: r.title ?? entry.title,
          source_type: r.source_type ?? entry.source_type,
          key_principles: r.key_principles ?? [],
          concrete_examples: r.concrete_examples ?? [],
          quotes: cleanQuotes,
          student_friendly_summary: c.student_friendly_summary ?? "",
          challenge_qa: c.challenge_qa ?? [],
          verified: false, // stay unverified until next eval confirms
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

  console.log(`\nDone. ${success}/${list.length} regenerated, ${failed} failed.`);
  console.log(`\nNext: re-run scripts/eval-kb-citations-only.ts to verify the residual.`);
})();
