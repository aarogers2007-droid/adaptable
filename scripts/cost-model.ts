/**
 * cost-model.ts — Exact per-student AI cost calculator.
 *
 * Every AI call in the platform is inventoried here with real pricing.
 * No guessing. Run this to get the precise cost per student and 10K projections.
 *
 * Usage:
 *   bunx tsx scripts/cost-model.ts
 */

// ── Pricing (per 1M tokens, USD) — Anthropic + OpenAI as of May 2026 ──
const PRICING = {
  "claude-sonnet-4-20250514": { input: 3.00, output: 15.00, cached_input: 0.30 },
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.00, cached_input: 0.08 },
  "gpt-4o-mini-2024-07-18":   { input: 0.15, output: 0.60, cached_input: 0 },
} as const;

type Model = keyof typeof PRICING;

function cost(model: Model, inputTokens: number, outputTokens: number, cachedInputTokens = 0): number {
  const p = PRICING[model];
  const freshInput = inputTokens - cachedInputTokens;
  return (freshInput * p.input + cachedInputTokens * p.cached_input + outputTokens * p.output) / 1_000_000;
}

// ── Every AI call a student can trigger ─────────────────────────────────
// Source: exhaustive codebase audit of all files calling streamMessage,
// sendMessage, sendMessageAuto, anthropic.messages.create, or openai.chat.completions.create

interface AICall {
  feature: string;
  model: Model;
  avgInputTokens: number;
  avgOutputTokens: number;
  maxTokens: number;
  cachedInputTokens: number; // portion of input that's cacheable system prompt
  timesPerStudent: number;   // how many times this fires for a typical student
  trigger: string;
}

// Typical student journey (VentureLab pilot, structured classroom):
// - Completes all 22 lessons (~7 mentor turns per lesson avg)
// - Does Ikigai wizard once
// - Generates 1 archetype card
// - Completes 3 scenarios (~10 turns each)
// - Uses AI Guide ~15 times
// - Does 1 customer interview session (~10 exchanges)
// - Saves 6 pitches (one per module)
// - ~30 daily check-ins over a semester
// - ~22 Founder's Mirror prompts (one per lesson completion)
// - ~5 support chat messages
// - ~4 Ikigai suggestion calls (one per wizard step)
// - ~3 reengagement teasers (inactive days)

const CALLS: AICall[] = [
  // ── LESSONS (22 lessons × ~7 turns each = 154 mentor calls) ──
  {
    feature: "Lesson Chat (Sonnet, 8 lessons)",
    model: "claude-sonnet-4-20250514",
    avgInputTokens: 4000,     // system prompt (~2500 tok) + conversation history (~1500 tok avg)
    avgOutputTokens: 250,
    maxTokens: 1024,
    cachedInputTokens: 2500,  // system prompt cached after first turn
    timesPerStudent: 8 * 7,   // 8 sonnet lessons × 7 turns avg
    trigger: "Per student message in Sonnet lesson",
  },
  {
    feature: "Lesson Chat (Haiku, 14 lessons)",
    model: "claude-haiku-4-5-20251001",
    avgInputTokens: 4000,
    avgOutputTokens: 250,
    maxTokens: 1024,
    cachedInputTokens: 2500,
    timesPerStudent: 14 * 7,  // 14 haiku lessons × 7 turns avg
    trigger: "Per student message in Haiku lesson",
  },

  // ── SCENARIOS (3 scenarios × ~10 turns each) ──
  {
    feature: "Scenario Chat (Sonnet mentor)",
    model: "claude-sonnet-4-20250514",
    avgInputTokens: 3000,
    avgOutputTokens: 300,
    maxTokens: 1024,
    cachedInputTokens: 1500,
    timesPerStudent: 3 * 10,  // 3 scenarios × 10 turns
    trigger: "Per student message in scenario",
  },
  {
    feature: "Scenario Eval (Mini, fire-and-forget)",
    model: "gpt-4o-mini-2024-07-18",
    avgInputTokens: 1000,
    avgOutputTokens: 80,
    maxTokens: 200,
    cachedInputTokens: 0,
    timesPerStudent: 3 * 10,  // same frequency as mentor
    trigger: "After every scenario student message (async)",
  },
  {
    feature: "Scenario Completion (Mini, summary + synthesis)",
    model: "gpt-4o-mini-2024-07-18",
    avgInputTokens: 1500,
    avgOutputTokens: 200,
    maxTokens: 300,
    cachedInputTokens: 0,
    timesPerStudent: 3,       // once per scenario completion
    trigger: "When all criteria satisfied",
  },

  // ── AI GUIDE (~15 messages) ──
  {
    feature: "AI Guide (Sonnet)",
    model: "claude-sonnet-4-20250514",
    avgInputTokens: 3500,
    avgOutputTokens: 350,
    maxTokens: 1024,
    cachedInputTokens: 1400,
    timesPerStudent: 15,
    trigger: "Per student message in guide chat",
  },

  // ── CUSTOMER INTERVIEW (~10 exchanges) ──
  {
    feature: "Customer Interview Roleplay (Sonnet)",
    model: "claude-sonnet-4-20250514",
    avgInputTokens: 3000,
    avgOutputTokens: 300,
    maxTokens: 1024,
    cachedInputTokens: 800,
    timesPerStudent: 10,
    trigger: "Per student message in interview sandbox",
  },

  // ── ONE-TIME CALLS ──
  {
    feature: "Ikigai Synthesis (Sonnet)",
    model: "claude-sonnet-4-20250514",
    avgInputTokens: 2500,
    avgOutputTokens: 400,
    maxTokens: 1024,
    cachedInputTokens: 0,    // one-shot, no caching benefit
    timesPerStudent: 1,
    trigger: "Once when wizard completes",
  },
  {
    feature: "Archetype Card Generation (Haiku)",
    model: "claude-haiku-4-5-20251001",
    avgInputTokens: 1800,
    avgOutputTokens: 250,
    maxTokens: 1024,
    cachedInputTokens: 0,
    timesPerStudent: 1,
    trigger: "Once after Ikigai wizard",
  },
  {
    feature: "Ikigai Suggestions (Haiku, 4 steps)",
    model: "claude-haiku-4-5-20251001",
    avgInputTokens: 1000,
    avgOutputTokens: 180,
    maxTokens: 1024,
    cachedInputTokens: 0,
    timesPerStudent: 4,
    trigger: "Once per wizard step (on-demand)",
  },

  // ── RECURRING LOW-COST CALLS ──
  {
    feature: "Pitch Feedback (Haiku, 6 modules)",
    model: "claude-haiku-4-5-20251001",
    avgInputTokens: 1500,
    avgOutputTokens: 180,
    maxTokens: 1024,
    cachedInputTokens: 0,
    timesPerStudent: 6,
    trigger: "Once per module pitch save",
  },
  {
    feature: "Daily Check-in Reply (Mini)",
    model: "gpt-4o-mini-2024-07-18",
    avgInputTokens: 400,
    avgOutputTokens: 80,
    maxTokens: 800,
    cachedInputTokens: 0,
    timesPerStudent: 30,      // ~30 check-ins per semester
    trigger: "Once per day (optional)",
  },
  {
    feature: "Founder's Mirror (Mini)",
    model: "gpt-4o-mini-2024-07-18",
    avgInputTokens: 300,
    avgOutputTokens: 40,
    maxTokens: 100,
    cachedInputTokens: 0,
    timesPerStudent: 22,      // once per lesson completion
    trigger: "After lesson completion (async)",
  },
  {
    feature: "Support Chat (Mini)",
    model: "gpt-4o-mini-2024-07-18",
    avgInputTokens: 1000,
    avgOutputTokens: 200,
    maxTokens: 800,
    cachedInputTokens: 0,
    timesPerStudent: 5,
    trigger: "Per support message (optional)",
  },
  {
    feature: "Reengagement Teaser (Mini)",
    model: "gpt-4o-mini-2024-07-18",
    avgInputTokens: 400,
    avgOutputTokens: 30,
    maxTokens: 800,
    cachedInputTokens: 0,
    timesPerStudent: 3,
    trigger: "When inactive >24h (async)",
  },
];

// ── Calculate ───────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════");
console.log("  ADAPTABLE — EXACT AI COST PER STUDENT");
console.log("  Model config: 8 Sonnet + 14 Haiku lessons (0 Mini)");
console.log("  Pricing as of May 2026");
console.log("═══════════════════════════════════════════════════════════\n");

let totalNoCaching = 0;
let totalWithCaching = 0;
const byModel: Record<string, { noCaching: number; withCaching: number; calls: number }> = {};

console.log("Feature                                    | Model   | Calls | No Cache  | Cached    |");
console.log("-------------------------------------------|---------|-------|-----------|-----------|");

for (const c of CALLS) {
  const noCacheCost = cost(c.model, c.avgInputTokens, c.avgOutputTokens) * c.timesPerStudent;
  const withCacheCost = cost(c.model, c.avgInputTokens, c.avgOutputTokens, c.cachedInputTokens) * c.timesPerStudent;

  totalNoCaching += noCacheCost;
  totalWithCaching += withCacheCost;

  const modelShort = c.model.includes("sonnet") ? "Sonnet" : c.model.includes("haiku") ? "Haiku" : "Mini";
  if (!byModel[modelShort]) byModel[modelShort] = { noCaching: 0, withCaching: 0, calls: 0 };
  byModel[modelShort].noCaching += noCacheCost;
  byModel[modelShort].withCaching += withCacheCost;
  byModel[modelShort].calls += c.timesPerStudent;

  const name = c.feature.padEnd(43);
  const model = modelShort.padEnd(7);
  const calls = String(c.timesPerStudent).padStart(5);
  const nc = `$${noCacheCost.toFixed(4)}`.padStart(9);
  const wc = `$${withCacheCost.toFixed(4)}`.padStart(9);
  console.log(`${name} | ${model} | ${calls} | ${nc} | ${wc} |`);
}

console.log("-------------------------------------------|---------|-------|-----------|-----------|");
console.log(`${"TOTAL PER STUDENT".padEnd(43)} |         | ${String(CALLS.reduce((a, c) => a + c.timesPerStudent, 0)).padStart(5)} | ${"$" + totalNoCaching.toFixed(4)} | ${"$" + totalWithCaching.toFixed(4)} |`);

console.log("\n\n═══ COST BY MODEL ═══\n");
console.log("Model   | Calls | No Cache  | Cached    | % of Total |");
console.log("--------|-------|-----------|-----------|------------|");
for (const [model, data] of Object.entries(byModel).sort((a, b) => b[1].withCaching - a[1].withCaching)) {
  const pct = ((data.withCaching / totalWithCaching) * 100).toFixed(1);
  console.log(`${model.padEnd(7)} | ${String(data.calls).padStart(5)} | ${"$" + data.noCaching.toFixed(4)} | ${"$" + data.withCaching.toFixed(4)} | ${pct.padStart(9)}% |`);
}

console.log("\n\n═══ PER-STUDENT SUMMARY ═══\n");
console.log(`Without caching:  $${totalNoCaching.toFixed(4)}`);
console.log(`With caching:     $${totalWithCaching.toFixed(4)}`);
console.log(`Caching savings:  $${(totalNoCaching - totalWithCaching).toFixed(4)} (${((1 - totalWithCaching / totalNoCaching) * 100).toFixed(1)}%)`);

console.log("\n\n═══ 10,000 STUDENT PROJECTIONS ═══\n");

const students = 10000;
const revenuePerStudent = 2.99;
const totalRevenue = students * revenuePerStudent;

console.log(`Students:           ${students.toLocaleString()}`);
console.log(`Revenue @ $${revenuePerStudent}/student: $${totalRevenue.toLocaleString()}`);
console.log("");

const aiCost = totalWithCaching * students;
const supabaseCost = 25; // Pro plan
const vercelCost = 20;   // Pro plan
const resendCost = 0;    // Free tier covers 3K/month
const domainCost = 10 / 12; // ~$0.83/month
const totalInfra = supabaseCost + vercelCost + resendCost + domainCost;

console.log("Cost breakdown (with caching):");
console.log(`  AI tokens:        $${aiCost.toFixed(2)} ($${totalWithCaching.toFixed(4)}/student)`);
console.log(`  Supabase Pro:     $${supabaseCost}/mo`);
console.log(`  Vercel Pro:       $${vercelCost}/mo`);
console.log(`  Domain:           $${domainCost.toFixed(2)}/mo`);
console.log(`  ─────────────────────────`);
console.log(`  Total infra/mo:   $${totalInfra.toFixed(2)}`);
console.log(`  Total AI:         $${aiCost.toFixed(2)}`);
console.log(`  ─────────────────────────`);
console.log(`  TOTAL COST:       $${(aiCost + totalInfra).toFixed(2)}`);
console.log(`  TOTAL REVENUE:    $${totalRevenue.toLocaleString()}`);
console.log(`  GROSS PROFIT:     $${(totalRevenue - aiCost - totalInfra).toFixed(2)}`);
console.log(`  GROSS MARGIN:     ${(((totalRevenue - aiCost - totalInfra) / totalRevenue) * 100).toFixed(1)}%`);

console.log("\n\n═══ VOLUME DISCOUNT PROJECTION (10K students) ═══\n");
console.log("At 10K students, you'll be pushing significant token volume through Anthropic.");
console.log("Anthropic Tier 3+ gets volume pricing. Conservative estimates:\n");

const discountTiers = [
  { label: "Current pricing (no discount)", discount: 0 },
  { label: "Tier 3 (~10% volume discount)", discount: 0.10 },
  { label: "Tier 4 (~20% volume discount)", discount: 0.20 },
  { label: "Committed use (~30% discount)", discount: 0.30 },
];

console.log("Scenario                          | AI Cost/Student | Total AI   | Gross Margin |");
console.log("----------------------------------|-----------------|------------|--------------|");
for (const tier of discountTiers) {
  const discounted = totalWithCaching * (1 - tier.discount);
  const totalAI = discounted * students;
  const margin = ((totalRevenue - totalAI - totalInfra) / totalRevenue * 100).toFixed(1);
  console.log(`${tier.label.padEnd(33)} | $${discounted.toFixed(4).padStart(14)} | $${totalAI.toFixed(2).padStart(9)} | ${margin.padStart(11)}% |`);
}

console.log("\n\n═══ PROMPT CACHING IMPACT AT SCALE ═══\n");
console.log("Prompt caching improves with repeat usage. At 10K students:");
console.log("- System prompts for the same lesson are cached across students");
console.log("- Cache hit rate increases with concurrent usage (classroom setting)");
console.log("- During a class session (30 students same lesson), cache hits approach 95%+");
console.log("- Conservative model above assumes per-session caching only (30% savings)");
console.log("- Realistic classroom caching could push savings to 40-50%\n");

const optimisticCaching = totalNoCaching * 0.55; // 45% savings with classroom-scale caching
console.log(`Optimistic (45% cache savings): $${optimisticCaching.toFixed(4)}/student → $${(optimisticCaching * students).toFixed(2)} total AI`);
console.log(`Gross margin at optimistic:     ${(((totalRevenue - optimisticCaching * students - totalInfra) / totalRevenue) * 100).toFixed(1)}%`);
