/**
 * KB gap filler for Modules 1 & 2 (Find Your Niche + Know Your Customer).
 * Same pipeline as generate-kb-entries.ts: generate → evaluate → insert → embed.
 */
import { readFileSync } from "fs";
import path from "path";

const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  let val = t.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1);
  process.env[t.slice(0, eq).trim()] = val;
}

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic();
const openai = new OpenAI();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface PlannedEntry {
  topic: string;
  lesson_tags: string[];
  covers: string[];
  focus: string;
}

// M1L1 needs 3 entries. Tags: [why, purpose, ikigai, golden-circle, getting-started, mindset]
// M1L2 needs 1 entry.  Tags: [niche-validation, validation, product-market-fit, lean-startup, business-model]
// M1L4 needs 2 entries. Tags: [target-customer, customer-personas, jobs-to-be-done, niche-selection, value-proposition]
// M2L1 needs 1 entry.  Tags: [customer-interviews, validation, talking-to-users]
// M2L3 needs 1 entry.  Tags: [pricing, set-your-price, revenue-model, pricing-confidence]

const PLANNED: PlannedEntry[] = [
  // ── M1L1: Welcome to Adaptable (needs 3) ──
  {
    topic: "Starting With Why: Finding Your Purpose Before Your Product",
    lesson_tags: ["why", "purpose", "ikigai", "golden-circle", "mindset"],
    covers: ["M1L1"],
    focus: "Why starting with your personal WHY matters more than starting with a product idea. The Golden Circle concept: why → how → what. How Ikigai connects passion, skill, need, and income. Why teens who know their WHY persist longer than those chasing trends. The difference between 'I want to make money' and 'I want to solve this problem.'",
  },
  {
    topic: "The Entrepreneurial Mindset: What Makes a Founder Different",
    lesson_tags: ["mindset", "getting-started", "purpose", "why", "growth-mindset"],
    covers: ["M1L1"],
    focus: "The growth mindset applied to entrepreneurship. Why discomfort is a signal you're learning, not failing. The difference between a student mindset and a founder mindset. Why the best time to start is before you feel ready. How constraints (no money, no experience) force creativity.",
  },
  {
    topic: "From Ikigai to Action: Turning Self-Knowledge Into a Business Direction",
    lesson_tags: ["ikigai", "getting-started", "purpose", "niche-validation", "mindset"],
    covers: ["M1L1", "M1L2"],
    focus: "How to translate your Ikigai circles into a concrete business direction. The difference between something you love and something someone will pay for. Why the intersection of passion and need creates sustainable businesses. How to test whether your idea is a real opportunity or just a hobby.",
  },

  // ── M1L2: What Makes a Good Business Niche? (needs 1 — entry above covers it too) ──
  {
    topic: "Niche Selection: Finding the Smallest Market You Can Win",
    lesson_tags: ["niche-validation", "validation", "product-market-fit", "business-model", "lean-startup"],
    covers: ["M1L2"],
    focus: "Why going narrow beats going broad for first-time entrepreneurs. How to define a niche by customer, problem, and solution. The difference between a niche and a category. How to validate demand before building anything. Signs your niche is too broad vs. too narrow.",
  },

  // ── M1L4: Define Your Target Customer (needs 2) ──
  {
    topic: "Building Your First Customer Profile: Who Actually Pays?",
    lesson_tags: ["target-customer", "customer-personas", "jobs-to-be-done", "value-proposition", "validation"],
    covers: ["M1L4"],
    focus: "How to describe your target customer as a real person, not a demographic. The Jobs-to-be-Done framework: what job is your customer hiring your product to do? Why 'everyone' is not a target customer. How to identify the person who would pay first — not eventually, but this week. The difference between who wants it and who pays for it.",
  },
  {
    topic: "Understanding What Your Customer Actually Wants vs. What They Say",
    lesson_tags: ["target-customer", "customer-personas", "niche-selection", "customer-interviews", "validation"],
    covers: ["M1L4", "M2L1"],
    focus: "Why what customers say they want and what they actually do are different things. How to observe behavior instead of asking opinions. The Mom Test principle applied to understanding customer needs. How to identify the real problem behind the stated problem. Why your closest friends are your worst test customers.",
  },

  // ── M2L1: The Customer Interview (needs 1 — entry above covers it too) ──
  {
    topic: "The Mom Test: How to Talk to Customers Without Leading the Witness",
    lesson_tags: ["customer-interviews", "validation", "talking-to-users", "target-customer"],
    covers: ["M2L1"],
    focus: "The core Mom Test principle: ask about their life, not your idea. How to ask behavior questions instead of opinion questions. Why 'would you buy this?' is the worst question you can ask. How to interview someone in 5 minutes without it feeling like a survey. What to do with the answers — pattern recognition across conversations.",
  },

  // ── M2L3: Set Your Price (needs 1) ──
  {
    topic: "Setting Your First Price: Revenue Models for Teen Businesses",
    lesson_tags: ["pricing", "set-your-price", "revenue-model", "pricing-confidence"],
    covers: ["M2L3"],
    focus: "Common revenue models translated for teens: per-item, per-session, per-hour, subscription, commission. How to pick the right model for your type of business. Why your first price is a hypothesis, not a commitment. The relationship between your price, your time, and your costs. How to raise your price after your first few sales without losing customers.",
  },
];

async function generateEntry(plan: PlannedEntry): Promise<Record<string, unknown> | null> {
  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `You are creating a knowledge base entry for a teen entrepreneurship platform called Adaptable.

Topic: "${plan.topic}"
Focus: ${plan.focus}

ABSOLUTE RULES:
- DO NOT cite any specific statistics with numbers
- DO NOT attribute quotes to named individuals
- DO NOT reference named businesses or case studies
- Use ONLY: principle explanations, framework descriptions, generic teen-scale illustrations, and paraphrased common wisdom
- Quotes should be expressed as principles attributed to framework names or "common business principle"

Return ONLY a JSON object with: title, key_principles (4-5), concrete_examples (3), quotes (2-3 paraphrased principles only), student_friendly_summary, challenge_qa (2)`,
      }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
  } catch (e) {
    console.log(`    GENERATE ERROR: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function evaluate(parsed: Record<string, unknown>): Promise<{ pass: boolean; issues: string[] }> {
  try {
    const res = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Fact-check for the Adaptable Factual Floor. Principles and generic illustrations OK. Statistics, named attributions, named case studies must be verifiable by a 16-year-old in 60 seconds. Return ONLY valid JSON: {"pass": true/false, "likely_hallucinated": number, "issues": []}\n\nEntry: ${JSON.stringify(parsed)}`,
      }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const evalParsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    return {
      pass: evalParsed.pass === true && (evalParsed.likely_hallucinated ?? 0) === 0,
      issues: evalParsed.issues || [],
    };
  } catch (e) {
    return { pass: false, issues: [`Eval parse error: ${e instanceof Error ? e.message : e}`] };
  }
}

async function embed(id: string, parsed: Record<string, unknown>): Promise<boolean> {
  try {
    const principles = (parsed.key_principles as { principle: string; explanation: string }[])
      .map((p) => `${p.principle}: ${p.explanation}`).join(" ");
    const text = `${parsed.title} ${principles} ${parsed.student_friendly_summary}`;
    const res = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
    await supabase.from("knowledge_base").update({ embedding: JSON.stringify(res.data[0].embedding) }).eq("id", id);
    return true;
  } catch (e) {
    console.log(`    EMBED ERROR: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

async function main() {
  console.log("=== M1/M2 KNOWLEDGE BASE GAP FILLER ===");
  console.log(`Entries planned: ${PLANNED.length}`);
  console.log("");

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < PLANNED.length; i++) {
    const plan = PLANNED[i];
    console.log(`[${i + 1}/${PLANNED.length}] ${plan.topic}`);
    console.log(`  Covers: ${plan.covers.join(", ")}`);

    // Generate
    process.stdout.write("  Generating... ");
    const parsed = await generateEntry(plan);
    if (!parsed) { console.log("FAILED"); failed++; continue; }
    console.log(`OK (${(parsed.key_principles as unknown[]).length} principles)`);

    // Evaluate — retry once on parse error
    let evalResult: { pass: boolean; issues: string[] } | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      process.stdout.write(attempt === 0 ? "  Evaluating... " : "  Retrying eval... ");
      evalResult = await evaluate(parsed);
      if (evalResult.pass || !evalResult.issues.some((i) => i.includes("parse"))) break;
    }
    if (!evalResult!.pass) {
      console.log(`FAILED — ${evalResult!.issues.join("; ")}`);
      failed++;
      continue;
    }
    console.log("PASSED");

    // Insert
    process.stdout.write("  Inserting... ");
    const { data: ins, error } = await supabase
      .from("knowledge_base")
      .insert({
        topic: plan.topic,
        title: parsed.title as string,
        lesson_tags: plan.lesson_tags,
        source_type: "framework",
        key_principles: parsed.key_principles,
        concrete_examples: parsed.concrete_examples,
        quotes: parsed.quotes,
        student_friendly_summary: parsed.student_friendly_summary,
        challenge_qa: parsed.challenge_qa,
        verified: true,
      })
      .select("id")
      .single();
    if (error || !ins) { console.log(`ERROR: ${error?.message}`); failed++; continue; }
    console.log(`OK (${ins.id})`);

    // Embed
    process.stdout.write("  Embedding... ");
    const ok = await embed(ins.id, parsed);
    console.log(ok ? "OK" : "FAILED (entry still inserted)");

    inserted++;
    console.log(`  ✅ ${inserted}/${PLANNED.length} inserted, ${failed} failed\n`);
  }

  const { count } = await supabase.from("knowledge_base").select("id", { count: "exact", head: true });
  console.log("=== SUMMARY ===");
  console.log(`Inserted: ${inserted}/${PLANNED.length}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total KB entries: ${count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
