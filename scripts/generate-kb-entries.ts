/**
 * KNOWLEDGE BASE P0 GAP FILLER
 *
 * Generates new knowledge base entries for lessons with < 3 strict matches
 * in priority modules (5, 4, 6, 3). Uses the 2-agent research pipeline
 * with principles-over-anecdotes bias per CLAUDE.md rule 3.
 *
 * Each entry is:
 *   1. Generated via Claude Sonnet (researcher) + Claude Sonnet (challenger)
 *   2. Evaluated for hallucination via the Factual Floor pipeline
 *   3. Inserted into knowledge_base if it passes
 *   4. Immediately embedded via OpenAI text-embedding-3-small
 *
 * Usage: npx tsx scripts/generate-kb-entries.ts
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
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYNTH_MODEL = "claude-sonnet-4-20250514";

// ── Planned entries: designed to maximize cross-lesson coverage ──

interface PlannedEntry {
  id: number;
  topic: string;
  lesson_tags: string[];
  covers: string[]; // which lessons this entry helps
  focus: string; // what to generate about
}

const PLANNED_ENTRIES: PlannedEntry[] = [
  // ── Module 5: Run the Numbers ──
  {
    id: 1,
    topic: "Unit Economics and Cost Tracking for Teen Businesses",
    lesson_tags: ["financial-literacy", "costs", "unit-economics", "pricing", "profit-margins"],
    covers: ["M5L1", "M5L2"],
    focus: "How to calculate the true cost of delivering one unit of your product/service (materials, time, overhead). The difference between revenue and profit. How to track costs in a simple spreadsheet. Examples using teen-scale numbers ($5-50 range).",
  },
  {
    id: 2,
    topic: "Simple Bookkeeping Habits for First-Time Entrepreneurs",
    lesson_tags: ["financial-literacy", "bookkeeping", "tracking", "habit-building", "costs"],
    covers: ["M5L1", "M5L3"],
    focus: "How to set up a simple 4-column tracking system (date, in, out, balance). Weekly review habits. Why tracking matters before you have much money. How to separate personal and business money. Building the tracking habit with minimal friction.",
  },
  {
    id: 3,
    topic: "Pricing Psychology: What Your Price Signals to Customers",
    lesson_tags: ["pricing", "pricing-confidence", "unit-economics", "profit-margins", "costs"],
    covers: ["M5L1", "M5L2"],
    focus: "Why price is a signal, not just a number. What happens when you price too low (devaluation, burnout). Anchor pricing and comparison pricing for teens. The relationship between cost, margin, and sustainability. How to explain your price to a skeptical customer.",
  },

  // ── Module 4: Get Your First Customer ──
  {
    id: 4,
    topic: "TikTok and Instagram Content Strategy for Teen Service Businesses",
    lesson_tags: ["social-media", "content-marketing", "tiktok", "audience-building", "marketing"],
    covers: ["M4L2"],
    focus: "What to post when you have zero followers. The 1-1-1 content formula (1 educational, 1 behind-the-scenes, 1 result/testimonial). Why short-form video works for service businesses. How to show your work without being salesy. Platform-specific advice for teens.",
  },
  {
    id: 5,
    topic: "Referral Systems and Word of Mouth for Peer-to-Peer Businesses",
    lesson_tags: ["customer-acquisition", "first-customers", "marketing", "customer-experience"],
    covers: ["M4L3"],
    focus: "Why word of mouth is the primary growth engine for teen businesses. How to create a remarkable moment that gets people talking. Simple referral scripts. How to ask for referrals without being awkward. The difference between earned and asked-for referrals.",
  },
  {
    id: 6,
    topic: "Writing and Delivering Your First Business Pitch",
    lesson_tags: ["pitching", "storytelling", "elevator-pitch", "communication", "first-customers"],
    covers: ["M4L4"],
    focus: "The 4-part pitch structure: problem, solution, why you, ask. How to pitch in person vs. text vs. DM. Why the pitch should sound like you, not like a business plan. Common teen pitching mistakes (over-explaining, underselling). Practice techniques.",
  },

  // ── Module 6: Launch and Learn ──
  {
    id: 7,
    topic: "Shipping Your Minimum Viable Product Before You Feel Ready",
    lesson_tags: ["shipping", "getting-started", "mvp", "iteration", "constraints"],
    covers: ["M6L1"],
    focus: "Why perfectionism kills teen businesses. The MVP concept applied to service and product businesses. How to define the smallest version you can test. Shipping to one person as the first milestone. Using constraints (no budget, no experience) as creative advantages.",
  },
  {
    id: 8,
    topic: "Iteration and Learning Loops After Your First Sale",
    lesson_tags: ["iteration", "growth", "scaling", "mvp", "constraints"],
    covers: ["M6L1", "M6L4"],
    focus: "The build-measure-learn loop applied to teen businesses. What to do in the first 24 hours after a sale. How to decide what to change vs. what to keep. When to scale vs. when to refine. The difference between growth and scaling for a one-person business.",
  },
  {
    id: 9,
    topic: "Handling Your First Real Customer: Service Delivery Basics",
    lesson_tags: ["service-delivery", "customer-experience", "operations", "reliability"],
    covers: ["M6L2"],
    focus: "What happens between 'they said yes' and 'they're happy.' Confirmation messages, managing expectations, delivering on time. What to do when something goes wrong. Creating a remarkable delivery experience on zero budget. Building reliability as your competitive advantage.",
  },
  {
    id: 10,
    topic: "Getting and Using Customer Feedback as a Young Entrepreneur",
    lesson_tags: ["customer-interviews", "iteration", "validation", "growth-mindset"],
    covers: ["M6L3"],
    focus: "How to ask for feedback without fishing for compliments. The 2-question feedback framework. What to do with negative feedback. How to distinguish useful criticism from noise. Turning feedback into specific next actions rather than spiraling.",
  },
  {
    id: 11,
    topic: "Post-Sale Growth: Repeat Customers and Next Steps",
    lesson_tags: ["iteration", "growth", "scaling", "mindset", "growth-mindset"],
    covers: ["M6L4"],
    focus: "Why your first customer is your best sales tool. How to turn one sale into three. The repeat customer flywheel. When to raise prices. What 'scaling' actually means for a teen business (hint: it's not Silicon Valley scaling). Setting the next 30-day goal.",
  },

  // ── Module 3: Build Your Brand ──
  {
    id: 12,
    topic: "Finding Your Brand Voice as a Teen Entrepreneur",
    lesson_tags: ["branding", "brand-identity", "differentiation", "positioning"],
    covers: ["M3L1"],
    focus: "The difference between brand identity and visual identity. How to define your brand voice (what you sound like, what you don't sound like). Using your authentic personality as brand differentiation. Why consistency matters more than polish. The 'gut-feeling words' exercise.",
  },
  {
    id: 13,
    topic: "Naming Your Business: From Brainstorm to Decision",
    lesson_tags: ["naming", "branding", "visual-identity", "getting-started"],
    covers: ["M3L2"],
    focus: "What makes a good business name (short, memorable, not descriptive). How to brainstorm 10+ names in 15 minutes. Testing names with real people before committing. Common naming traps (too clever, too generic, already taken). The Instagram/TikTok handle test.",
  },
  {
    id: 14,
    topic: "Visual Identity on Zero Budget: Color, Font, and First Impression",
    lesson_tags: ["branding", "visual-identity", "customer-experience", "getting-started"],
    covers: ["M3L2", "M3L3"],
    focus: "The minimum viable visual identity: 1 color, 1 font category, 1 template. Free tools for creating consistent visuals. Why your first impression is your customer's last decision point. How to look professional without spending money. The 3-second test for social media profiles.",
  },
];

// ── Generation pipeline ──

interface KBEntry {
  topic: string;
  title: string;
  lesson_tags: string[];
  source_type: string;
  key_principles: { principle: string; explanation: string }[];
  concrete_examples: { example: string; business_type: string; lesson: string }[];
  quotes: { quote: string; source: string; context: string }[];
  student_friendly_summary: string;
  challenge_qa: { question: string; answer: string }[];
}

async function generateEntry(plan: PlannedEntry): Promise<KBEntry | null> {
  const researchPrompt = `You are a business education researcher creating a knowledge base entry for a teen entrepreneurship platform called Adaptable. The platform teaches students aged 12-18 to build real businesses.

Generate a knowledge base entry about: "${plan.topic}"

Focus: ${plan.focus}

CRITICAL RULES (Adaptable Factual Floor):
1. PRINCIPLES OVER ANECDOTES. Prefer mechanism explanations and well-known frameworks over named case studies. Use generic illustrations like "a teen charging $25 for a 2-hour tutoring session" rather than naming specific businesses.
2. NO FABRICATED CLAIMS. Do not invent statistics, study citations, or named individuals with specific outcomes. If you can't verify it, don't include it.
3. PARAPHRASED PRINCIPLES, NOT ATTRIBUTED QUOTES. Instead of fake quotes from named people, express the principle directly. "Starting before you're ready teaches more than planning ever could" is better than attributing it to someone.
4. CONCRETE AND TEEN-SCALE. All examples should use teen-appropriate numbers ($5-100 range), teen-accessible tools (phone, free apps, social media), and teen-realistic scenarios (school, neighborhood, friends).

Return a JSON object with exactly these fields:
{
  "title": "descriptive title",
  "key_principles": [{"principle": "short name", "explanation": "1-2 sentence explanation"}],
  "concrete_examples": [{"example": "description", "business_type": "type", "lesson": "what this teaches"}],
  "quotes": [{"quote": "paraphrased principle or well-known saying", "source": "framework name or 'common wisdom'", "context": "when this applies"}],
  "student_friendly_summary": "2-3 sentences a 14-year-old would understand",
  "challenge_qa": [{"question": "hard question a student might ask", "answer": "honest answer"}]
}

Include 4-5 key_principles, 3 concrete_examples, 2-3 quotes (paraphrased principles, not fabricated attributions), and 2 challenge_qa pairs.`;

  try {
    const res = await anthropic.messages.create({
      model: SYNTH_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: researchPrompt }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      topic: plan.topic,
      title: parsed.title,
      lesson_tags: plan.lesson_tags,
      source_type: "framework",
      key_principles: parsed.key_principles,
      concrete_examples: parsed.concrete_examples,
      quotes: parsed.quotes,
      student_friendly_summary: parsed.student_friendly_summary,
      challenge_qa: parsed.challenge_qa,
    };
  } catch (e) {
    console.log(`    GENERATE ERROR: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

// ── Hallucination evaluation (simplified Factual Floor check) ──

async function evaluateFactualFloor(entry: KBEntry): Promise<{ pass: boolean; issues: string[] }> {
  const evalPrompt = `You are a fact-checker for a teen entrepreneurship platform. The Factual Floor standard: "Any claim the AI mentor can surface to a student must be traceable to a source a 16-year-old could independently verify in under 60 seconds."

Evaluate this knowledge base entry for hallucinations, fabricated claims, and unverifiable assertions.

ENTRY:
Title: ${entry.title}
Principles: ${JSON.stringify(entry.key_principles)}
Examples: ${JSON.stringify(entry.concrete_examples)}
Quotes: ${JSON.stringify(entry.quotes)}
Summary: ${entry.student_friendly_summary}

CHECK EACH CLAIM:
1. Are any specific people named with specific outcomes? (These must be verifiable)
2. Are any statistics cited? (These must have a real source)
3. Are any quotes attributed to named individuals? (These must be real quotes)
4. Are examples using generic illustrations (OK) or claiming specific named businesses did specific things (must be verifiable)?
5. Are principles based on well-known frameworks (OK) or presenting opinion as fact (not OK)?

Principles, frameworks, and mechanism explanations do NOT require citations.
Generic illustrations ("a teen charging $25") do NOT require verification.
Paraphrased common wisdom ("starting before you're ready teaches more than planning") is FINE.

Return ONLY a JSON object:
{
  "pass": true/false,
  "likely_hallucinated": <count of unverifiable claims>,
  "issues": ["<specific issue>", ...]
}`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: evalPrompt }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      pass: parsed.pass === true && (parsed.likely_hallucinated ?? 0) === 0,
      issues: parsed.issues || [],
    };
  } catch (e) {
    return { pass: false, issues: [`Eval error: ${e instanceof Error ? e.message : e}`] };
  }
}

// ── Embedding helper ──

async function embedEntry(id: string, entry: KBEntry): Promise<boolean> {
  try {
    const text = `${entry.title}\n\n${entry.topic}\n\nKey Principles:\n${entry.key_principles.map((p) => `${p.principle}: ${p.explanation}`).join("\n")}\n\nExamples:\n${entry.concrete_examples.map((e) => `${e.example} (${e.business_type}): ${e.lesson}`).join("\n")}\n\nSummary: ${entry.student_friendly_summary}`;

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const { error } = await supabase
      .from("knowledge_base")
      .update({ embedding: JSON.stringify(response.data[0].embedding) })
      .eq("id", id);

    return !error;
  } catch (e) {
    console.log(`    EMBED ERROR: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

// ── Main ──

async function main() {
  console.log("=== KNOWLEDGE BASE P0 GAP FILLER ===");
  console.log(`Planned entries: ${PLANNED_ENTRIES.length}`);
  console.log(`Pipeline: Generate → Evaluate → Insert → Embed`);
  console.log("");

  let generated = 0;
  let passed = 0;
  let inserted = 0;
  let embedded = 0;
  let failed = 0;

  for (const plan of PLANNED_ENTRIES) {
    console.log(`[${plan.id}/${PLANNED_ENTRIES.length}] ${plan.topic}`);
    console.log(`  Covers: ${plan.covers.join(", ")} | Tags: [${plan.lesson_tags.slice(0, 3).join(", ")}...]`);

    // Step 1: Generate
    process.stdout.write("  Generating... ");
    const entry = await generateEntry(plan);
    if (!entry) {
      console.log("FAILED");
      failed++;
      continue;
    }
    generated++;
    console.log(`OK (${entry.key_principles.length} principles, ${entry.concrete_examples.length} examples)`);

    // Step 2: Evaluate
    process.stdout.write("  Evaluating (Factual Floor)... ");
    const evalResult = await evaluateFactualFloor(entry);
    if (!evalResult.pass) {
      console.log(`FAILED — ${evalResult.issues.length} issue(s):`);
      for (const issue of evalResult.issues) {
        console.log(`    - ${issue}`);
      }
      failed++;
      continue;
    }
    passed++;
    console.log("PASSED");

    // Step 3: Insert
    process.stdout.write("  Inserting... ");
    const { data: insertData, error: insertError } = await supabase
      .from("knowledge_base")
      .insert({
        topic: entry.topic,
        title: entry.title,
        lesson_tags: entry.lesson_tags,
        source_type: entry.source_type,
        key_principles: entry.key_principles,
        concrete_examples: entry.concrete_examples,
        quotes: entry.quotes,
        student_friendly_summary: entry.student_friendly_summary,
        challenge_qa: entry.challenge_qa,
        verified: true,
      })
      .select("id")
      .single();

    if (insertError || !insertData) {
      console.log(`ERROR: ${insertError?.message}`);
      failed++;
      continue;
    }
    inserted++;
    console.log(`OK (id: ${insertData.id})`);

    // Step 4: Embed
    process.stdout.write("  Embedding... ");
    const embedOk = await embedEntry(insertData.id, entry);
    if (embedOk) {
      embedded++;
      console.log("OK");
    } else {
      console.log("FAILED (entry still inserted, just not searchable via semantic)");
    }

    console.log(`  ✅ Progress: ${inserted}/${PLANNED_ENTRIES.length} inserted, ${failed} failed`);
    console.log("");
  }

  // Final count
  const { count } = await supabase
    .from("knowledge_base")
    .select("id", { count: "exact", head: true });

  console.log("=== SUMMARY ===");
  console.log(`Generated: ${generated}/${PLANNED_ENTRIES.length}`);
  console.log(`Passed Factual Floor: ${passed}/${generated}`);
  console.log(`Inserted: ${inserted}/${passed}`);
  console.log(`Embedded: ${embedded}/${inserted}`);
  console.log(`Failed/Discarded: ${failed}`);
  console.log(`Total KB entries: ${count} (was 15)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
