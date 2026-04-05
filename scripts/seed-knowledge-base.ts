/**
 * Seed the knowledge base by running the 2-agent pipeline for each lesson topic.
 *
 * Usage: npx tsx scripts/seed-knowledge-base.ts
 *
 * Requires ANTHROPIC_API_KEY and Supabase env vars in .env.local
 */

import { readFileSync } from "fs";

// Load .env.local BEFORE anything else
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY not found in .env.local");
  process.exit(1);
}

// Now safe to import — env vars are set
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LESSON_TOPICS = [
  { topic: "Finding Your WHY — Simon Sinek's Golden Circle for teen entrepreneurs", tags: ["module-1-lesson-1", "general"] },
  { topic: "Evaluating a business niche — demand, credibility, willingness to pay", tags: ["module-1-lesson-2", "general"] },
  { topic: "Competitive research for first-time entrepreneurs — finding and analyzing competitors", tags: ["module-1-lesson-3"] },
  { topic: "Defining your target customer — creating vivid customer personas", tags: ["module-1-lesson-4"] },
  { topic: "The Mom Test — customer interviews that get honest answers, not polite lies", tags: ["module-2-lesson-1"] },
  { topic: "Extracting real insights from customer interviews — separating signal from noise", tags: ["module-2-lesson-2"] },
  { topic: "Pricing strategy for first-time entrepreneurs — value-based pricing, price as signal", tags: ["module-2-lesson-3", "general"] },
  { topic: "Finding your first 3 customers — doing things that don't scale, Paul Graham style", tags: ["module-2-lesson-4", "general"] },
];

async function research(topic: string, tags: string[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are an expert business education researcher building a knowledge base for an AI tutor that teaches teenagers (ages 12-18) entrepreneurship. For every topic provide:
1. KEY PRINCIPLES: 3-5 most important ideas with attribution
2. CONCRETE EXAMPLES: Real businesses, names, numbers, outcomes
3. MEMORABLE QUOTES: Exact quotes from credible sources
4. FRAMEWORKS: Step-by-step mental models

Be specific. Not "price based on value" but "Patrick Campbell at ProfitWell found value-based pricing generates 2x revenue."

Return ONLY valid JSON:
{"title":"...","source_type":"framework|article|case_study","key_principles":[{"principle":"...","explanation":"..."}],"concrete_examples":[{"example":"...","business_type":"...","lesson":"..."}],"quotes":[{"quote":"...","source":"...","context":"..."}]}`,
    messages: [{ role: "user", content: `Topic: ${topic}\nLesson tags: ${tags.join(", ")}\n\nSynthesize the best insights. Return ONLY valid JSON.` }],
  });
  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? "";
}

async function challenge(topic: string, researchOutput: string) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a skeptical, smart 16-year-old reviewing educational content. Ask 5 hard questions a real teen would ask, answer each using the research, and write a student-friendly summary a 14-year-old could act on. Return ONLY valid JSON:
{"student_friendly_summary":"2-3 paragraphs, casual, use 'you'","challenge_qa":[{"question":"...","answer":"..."}],"quality_score":1-10,"flags":["anything weak"]}`,
    messages: [{ role: "user", content: `Topic: ${topic}\n\nResearch:\n${researchOutput}\n\nChallenge this. Return ONLY valid JSON.` }],
  });
  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? "";
}

async function seedTopic(entry: { topic: string; tags: string[] }, index: number) {
  console.log(`\n[${index + 1}/${LESSON_TOPICS.length}] ${entry.topic}`);

  const researchOutput = await research(entry.topic, entry.tags);
  console.log(`  ✓ Research done`);

  const challengeOutput = await challenge(entry.topic, researchOutput);
  console.log(`  ✓ Challenge done`);

  try {
    const r = JSON.parse(researchOutput);
    const c = JSON.parse(challengeOutput);

    const { error } = await supabase.from("knowledge_base").insert({
      topic: entry.topic,
      lesson_tags: entry.tags,
      title: r.title ?? entry.topic,
      source_url: null,
      source_type: r.source_type ?? "framework",
      key_principles: r.key_principles ?? [],
      concrete_examples: r.concrete_examples ?? [],
      quotes: r.quotes ?? [],
      student_friendly_summary: c.student_friendly_summary ?? "",
      challenge_qa: c.challenge_qa ?? [],
    });

    if (error) console.log(`  ✗ DB error: ${error.message}`);
    else console.log(`  ✓ Saved: "${r.title}"`);
  } catch (e) {
    console.log(`  ✗ JSON parse failed: ${(e as Error).message}`);
  }
}

async function main() {
  console.log("Seeding knowledge base...");
  console.log(`API key: ${process.env.ANTHROPIC_API_KEY!.slice(0, 10)}...`);

  const { error } = await supabase.from("knowledge_base").select("id").limit(1);
  if (error) {
    console.error(`knowledge_base table not accessible: ${error.message}`);
    process.exit(1);
  }

  for (let i = 0; i < LESSON_TOPICS.length; i++) {
    await seedTopic(LESSON_TOPICS[i], i);
  }

  console.log("\nDone!");
}

main().catch(console.error);
