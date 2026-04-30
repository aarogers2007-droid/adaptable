/**
 * MULTI-INTEREST REGRESSION TEST
 *
 * Runs the 5 multi-track personas through the updated prompt (rules 4-5
 * updated for dominant-interest selection + insight quality guidance) and
 * checks that insight_quality scores improve from 3.80 baseline.
 *
 * Usage: npx tsx scripts/eval-multi-interest-regression.ts
 */

import { readFileSync } from "fs";
import path from "path";

// Load env
const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
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

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const SYNTH_MODEL = "claude-sonnet-4-20250514";
const JUDGE_MODEL = "claude-opus-4-6";

interface Persona {
  id: string;
  studentName: string;
  passions: string[];
  skills: string[];
  needs: string[];
  monetization: string;
  notes: string;
}

const MULTI_PERSONAS: Persona[] = [
  {
    id: "m01-nails-music", studentName: "Zoe",
    passions: ["nail art", "music production", "anime"],
    skills: ["detailed hand work", "mixing beats in FL Studio", "drawing characters"],
    needs: ["custom nails", "lo-fi beats for streamers", "anime portraits"],
    monetization: "different prices for different things",
    notes: "Three unrelated tracks. Should NOT force a hybrid like 'anime-themed nail beats'",
  },
  {
    id: "m02-coding-cooking", studentName: "Ravi",
    passions: ["coding", "Indian cooking", "soccer"],
    skills: ["Python scripts", "spice blending", "playing midfield"],
    needs: ["small Python tools for parents' shop", "authentic family recipes online"],
    monetization: "freelance gigs",
    notes: "Coding and cooking unrelated. Pick one.",
  },
  {
    id: "m03-photo-fitness", studentName: "Jasmine",
    passions: ["photography", "fitness", "thrifting"],
    skills: ["lighting setup", "form correction", "spotting fakes"],
    needs: ["affordable senior portraits", "form check for new gym goers", "real vintage finds"],
    monetization: "session fees and item resale",
    notes: "Three viable solo paths.",
  },
  {
    id: "m04-gaming-tutor-art", studentName: "Tariq",
    passions: ["Valorant", "drawing", "history class"],
    skills: ["aim training", "character design", "memorizing dates"],
    needs: ["Valorant coaching for low-rank players", "custom esports avatars", "history exam prep"],
    monetization: "lessons or commissions",
    notes: "Gaming coaching vs character art.",
  },
  {
    id: "m05-dance-edit", studentName: "Aaliyah",
    passions: ["dancing", "video editing", "skincare"],
    skills: ["choreographing 8-counts", "CapCut transitions", "knowing ingredients"],
    needs: ["dance class videos that look good", "honest skincare reviews"],
    monetization: "client work or affiliate",
    notes: "Should not mash dance + skincare",
  },
];

function buildSynthesisCall(p: Persona) {
  const systemPrompt = `You help teenagers discover their business niche based on their Ikigai answers.

CRITICAL RULES:

1. TEEN-EXECUTABLE TEST. Every idea must pass ALL of these. If your first idea fails any, throw it out and generate a smaller, more local version:
   - Can be started this week with under $100 of supplies
   - Does NOT require a professional license (cosmetology, food handler permit, contractor, real estate, driver's license)
   - Does NOT require commercial space, a vehicle, or business insurance
   - Does NOT involve "monthly retainers," "subscription tiers," "SaaS," "platform development," "consulting practice," or "agency"

2. CUSTOMER REALITY CHECK. Acceptable customers are EXACTLY:
   (a) peers at the student's school
   (b) parents of those peers
   (c) neighbors on the student's block
   (d) the student's own family or family business (if mentioned in their inputs)

3. COMMIT BY PICKING ONE LANE — NEVER BY BLENDING. If inputs are CONCRETE but contain tension, DO NOT return needs_clarification AND DO NOT blend the lanes into a fake hybrid. Pick the SINGLE more teen-executable lane, build the idea entirely inside that one lane, and write ONE sentence in why_this_fits explicitly retiring the other lane(s).

4. IDENTIFY DISTINCT THEMES FIRST. Look across all four circles. If interests point to 2-3 separate directions, treat them as separate. Pick the DOMINANT one — the interest where the student's language is most specific, emotional, or experienced (e.g., "I'm obsessed with" beats "I like," naming specific tools/brands beats generic categories). The dominant interest drives the core idea COMPLETELY — the niche, name, target customer, and revenue model must all be about this ONE interest.

5. NEVER combine TWO OR MORE unrelated interests — not in the niche, not in the name, not in the product description, not anywhere in the idea itself. The ONLY place secondary interests may appear is in why_this_fits, where you explain how a transferable SKILL (not the interest itself) from that other domain gives them an edge. Example: "your steady hand from drawing anime characters means you can paint detail work most nail artists can't" — but the niche is STILL just "custom press-on nails," NOT "anime-themed nails." CONCRETE BAD EXAMPLES — NEVER generate ideas like these: "anime-themed nail art," "music-themed tutoring," "gaming-themed cooking," "dance fitness skincare," "coding-inspired recipe app." These are forced hybrids. Each smashes two interests together in the product. Instead, pick the dominant interest and build a clean idea around it alone.
   SELF-CHECK: After generating your idea, ask yourself: "If I removed the secondary interest from this student's profile, would the niche description need to change at all?" If yes, you have a forced hybrid — throw it out and regenerate using ONLY the dominant interest. A student who loves Valorant AND drawing should get EITHER a Valorant coaching idea OR a character art commission idea — NOT "Valorant character art" which requires both. This rule overrides rule 3.

6. ALREADY-RUNNING DETECTION. If already doing this for money, level up the existing one.

7. FAMILY BUSINESS DETECTION. If inputs mention a family business, grow that entity.

8. VAGUE INPUT HANDLING. If too generic, set niche to "needs_clarification".

9. RISKY MONETIZATION HANDLING. Propose a legal pivot.

10. BE HYPER-SPECIFIC about real ideas.

Return a JSON object with exactly these fields:
- niche: specific description of the business area
- name: a SHORT (1-3 words), memorable brand name a teen would actually put on Instagram. NEVER use "[Name]'s [Service]" format.
- target_customer: specific description of who would pay
- revenue_model: brief sentence describing how they make money
- legal_note: a SHORT string flagging any legal constraint, or ""
- why_this_fits: 2-3 sentences explaining why THIS student is the right person to build this and not someone else. Write like a 25-year-old founder talking to a 15-year-old, not like a LinkedIn post. Name a SPECIFIC skill, tool, or experience from their inputs that gives them an unfair advantage — something concrete like "you already know FL Studio" or "you've done 47 sales on Depop," not vague like "you're passionate about this." If the student has secondary interests with a genuine transferable skill (e.g., drawing anime → steady hands for nail detail), explain that specific connection. If there is no natural cross-skill connection, go deeper within the chosen lane instead — identify a non-obvious market gap, timing advantage, or customer insight the student hasn't articulated yet. Never force a connection between unrelated skills. FORBIDDEN PHRASES: "perfect storm," "secret weapon," "secret sauce," "have you considered," "what most people don't realize," "leverage," "unlock," "synergy," "cracked the code," "natural arbitrage," "your superpower."`;

  const userMessage = `The student's name is ${p.studentName}. Based on their Ikigai:
- What they LOVE: ${p.passions.join(", ")}
- What they're GOOD AT: ${p.skills.join(", ")}
- What the WORLD NEEDS: ${p.needs.join(", ")}
- How to get PAID: ${p.monetization}

First, identify the distinct themes. Pick the single strongest direction where the student's language shows the most passion and specificity. Apply the teen-executable test. Generate ONE specific, actionable business idea. Return ONLY a JSON object.`;

  return { systemPrompt, userMessage };
}

interface BusinessIdea {
  niche: string;
  name: string | null;
  target_customer: string;
  revenue_model: string;
  why_this_fits?: string;
  legal_note?: string;
}

interface JudgeScore {
  specificity: number;
  coherence: number;
  no_forced_hybrid: number;
  capital_required: number;
  customer_realistic: number;
  insight_quality: number;
  name_quality: number;
  total: number;
  reasoning: string;
  red_flags: string[];
}

async function callWithRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error("call timeout 60s")), 60000)),
      ]);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Connection") || msg.includes("rate") || msg.includes("timeout") || msg.includes("529") || msg.includes("503")) {
        const wait = 2000 * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function synthesize(p: Persona): Promise<BusinessIdea | { error: string }> {
  const { systemPrompt, userMessage } = buildSynthesisCall(p);
  try {
    const res = await callWithRetry(() =>
      anthropic.messages.create({
        model: SYNTH_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      })
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    if (parsed.niche && parsed.target_customer && parsed.revenue_model) {
      return {
        niche: parsed.niche,
        name: parsed.name ?? null,
        target_customer: parsed.target_customer,
        revenue_model: parsed.revenue_model,
        why_this_fits: parsed.why_this_fits,
        legal_note: typeof parsed.legal_note === "string" ? parsed.legal_note : undefined,
      };
    }
    return { error: "Incomplete fields: " + JSON.stringify(parsed) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function judge(p: Persona, idea: BusinessIdea): Promise<JudgeScore | { error: string }> {
  const judgePrompt = `You are an expert evaluator of AI-generated business ideas for teenagers using the Ikigai framework. You are STRICT and HONEST. A score of 5 should be rare. Default to 3 unless the output is clearly above or below average.

CONTEXT: This is a multi-interest student with unrelated passions. The platform wants the AI to pick ONE dominant lane and build a deep, specific insight around it. Secondary interests should NOT drive the core idea but CAN inform the insight about what makes this student uniquely positioned.

STUDENT INPUTS:
- Name: ${p.studentName}
- Bucket: multi-track (${p.notes})
- Passions: ${p.passions.join(", ")}
- Skills: ${p.skills.join(", ")}
- Needs: ${p.needs.join(", ")}
- Monetization: ${p.monetization}

AI-GENERATED IDEA:
- Niche: ${idea.niche}
- Name: ${idea.name ?? "(null)"}
- Target Customer: ${idea.target_customer}
- Revenue Model: ${idea.revenue_model}
- Why This Fits: ${idea.why_this_fits ?? "(missing)"}
- Legal Note: ${idea.legal_note && idea.legal_note.length > 0 ? idea.legal_note : "(none)"}

Score each dimension 1-5:

1. specificity: Is the niche concrete? 5 = hyper-specific, 1 = generic
2. coherence: Does it match inputs? 5 = all inputs reflected, 1 = hallucinated
3. no_forced_hybrid: Did it pick ONE lane?
   - 5: cleanly picked one dominant interest; others not in the niche/name/customer
   - 4: picked one lane but a secondary interest subtly informs the style or insight (this is CORRECT behavior)
   - 3: picked one direction but mentioned the others as side notes in the niche
   - 1: mashed two unrelated things together in the core idea
4. capital_required: Can a teen start with under $100? 5 = under $100, 1 = $1000+
5. customer_realistic: Reachable by a teen? 5 = peers/neighbors, 1 = strangers/B2B
6. insight_quality: Does why_this_fits contain a GENUINE, NON-OBVIOUS insight specific to THIS student?
   - 5: Names a specific skill, tool, or experience from inputs and connects it to a business advantage the student hasn't articulated. References concrete details (tool names, specific experiences, named skills).
   - 4: Clear, student-specific observation that goes beyond restating inputs. Shows understanding of what makes this person different. This includes deep single-lane insights (identifying a market gap, timing advantage, or customer psychology the student missed).
   - 3: Summarizes the inputs without real insight. Could apply to anyone with similar interests. Generic.
   - 2: Vague motivational language. "You're passionate about X and that matters."
   - 1: Contains banned slop phrases or is completely generic.
   NOTE: Do NOT penalize for unused secondary interests. If the insight goes deep within the chosen lane (e.g., identifies a market gap, pricing psychology, or timing advantage specific to the student's situation), that is equally valuable as cross-interest insight. Only score 3 if the insight is genuinely generic — "you're passionate about this" or restating inputs without adding value.
7. name_quality: Good teen brand name? 5 = memorable, 1 = generic template

Return ONLY a JSON object:
{
  "specificity": <1-5>,
  "coherence": <1-5>,
  "no_forced_hybrid": <1-5>,
  "capital_required": <1-5>,
  "customer_realistic": <1-5>,
  "insight_quality": <1-5>,
  "name_quality": <1-5>,
  "reasoning": "<2-3 sentence assessment>",
  "red_flags": ["<flag1>", "<flag2>"]
}`;

  try {
    const res = await callWithRetry(() =>
      anthropic.messages.create({
        model: JUDGE_MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: judgePrompt }],
      })
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    const total =
      parsed.specificity + parsed.coherence + parsed.no_forced_hybrid +
      parsed.capital_required + parsed.customer_realistic +
      parsed.insight_quality + parsed.name_quality;
    return { ...parsed, total } as JudgeScore;
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Main ──

const RUNS_PER_PERSONA = 2;

async function main() {
  console.log("=== MULTI-INTEREST REGRESSION TEST ===");
  console.log(`Personas: ${MULTI_PERSONAS.length}`);
  console.log(`Runs per persona: ${RUNS_PER_PERSONA}`);
  console.log(`Synthesizer: ${SYNTH_MODEL}`);
  console.log(`Judge: ${JUDGE_MODEL}`);
  console.log(`Target: insight_quality ≥ 4.0 avg (was 3.80 in v4 report)`);
  console.log(`Target: no_forced_hybrid ≥ 4.5 avg (was 3.90 in v4 report)`);
  console.log("");

  const allInsightScores: number[] = [];
  const allHybridScores: number[] = [];
  const allTotals: number[] = [];

  for (const p of MULTI_PERSONAS) {
    console.log(`\n── ${p.id} — ${p.studentName} ──`);
    console.log(`   Passions: ${p.passions.join(", ")}`);
    const insightScores: number[] = [];
    const hybridScores: number[] = [];

    for (let r = 0; r < RUNS_PER_PERSONA; r++) {
      process.stdout.write(`  Run ${r + 1}: synthesizing... `);
      const idea = await synthesize(p);
      if ("error" in idea) {
        console.log(`ERROR: ${idea.error}`);
        continue;
      }
      process.stdout.write(`judging... `);
      const score = await judge(p, idea);
      if ("error" in score) {
        console.log(`JUDGE ERROR: ${score.error}`);
        continue;
      }

      const insEmoji = score.insight_quality >= 4 ? "✅" : "❌";
      const hybEmoji = score.no_forced_hybrid >= 4 ? "✅" : "❌";
      console.log(`${score.total}/35 | ins=${score.insight_quality} ${insEmoji} | noHyb=${score.no_forced_hybrid} ${hybEmoji} | spec=${score.specificity} coh=${score.coherence} cap=${score.capital_required} cust=${score.customer_realistic} name=${score.name_quality}`);
      console.log(`    Niche: ${idea.niche}`);
      console.log(`    Insight: ${(idea.why_this_fits ?? "").slice(0, 150)}...`);
      if (score.red_flags.length > 0) {
        console.log(`    Red flags: ${score.red_flags.join(", ")}`);
      }

      insightScores.push(score.insight_quality);
      hybridScores.push(score.no_forced_hybrid);
      allInsightScores.push(score.insight_quality);
      allHybridScores.push(score.no_forced_hybrid);
      allTotals.push(score.total);
    }

    const avgIns = insightScores.length > 0
      ? insightScores.reduce((a, b) => a + b, 0) / insightScores.length : 0;
    const avgHyb = hybridScores.length > 0
      ? hybridScores.reduce((a, b) => a + b, 0) / hybridScores.length : 0;
    console.log(`  → avg insight: ${avgIns.toFixed(2)} | avg noHyb: ${avgHyb.toFixed(2)}`);
  }

  console.log("\n=== SUMMARY ===");
  const overallInsAvg = allInsightScores.length > 0
    ? allInsightScores.reduce((a, b) => a + b, 0) / allInsightScores.length : 0;
  const overallHybAvg = allHybridScores.length > 0
    ? allHybridScores.reduce((a, b) => a + b, 0) / allHybridScores.length : 0;
  const overallTotalAvg = allTotals.length > 0
    ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length : 0;

  console.log(`insight_quality avg: ${overallInsAvg.toFixed(2)}/5 (was 3.80, target ≥ 4.00)`);
  console.log(`no_forced_hybrid avg: ${overallHybAvg.toFixed(2)}/5 (was 3.90)`);
  console.log(`overall total avg: ${overallTotalAvg.toFixed(1)}/35 (was 29.1)`);

  const insightPass = overallInsAvg >= 4.0;
  const hybridPass = overallHybAvg >= 4.5;
  console.log(`\nInsight Quality: ${insightPass ? "✅ PASS (≥ 4.0)" : "❌ FAIL (< 4.0)"}`);
  console.log(`No Forced Hybrid: ${hybridPass ? "✅ PASS (≥ 4.5)" : "❌ FAIL (< 4.5)"}`);

  process.exit(insightPass && hybridPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
