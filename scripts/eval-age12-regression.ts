/**
 * AGE-12 REGRESSION TEST
 *
 * Runs only the 3 age-12 personas through the updated prompt (with rule 11:
 * Young Student Guard) and checks that capital_required scores ≥ 4.
 *
 * Usage: npx tsx scripts/eval-age12-regression.ts
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
  age: number;
  passions: string[];
  skills: string[];
  needs: string[];
  monetization: string;
  notes: string;
}

const AGE12_PERSONAS: Persona[] = [
  {
    id: "y01-age12-art", studentName: "Lily", age: 12,
    passions: ["drawing", "Roblox", "my dog"],
    skills: ["drawing animals", "making Roblox outfits", "remembering every dog breed"],
    needs: ["kids want cute Roblox avatars", "people want pet portraits"],
    monetization: "Robux or cash from parents",
    notes: "12yo. Should propose tiny scope (selling drawings to friends, $5 each).",
  },
  {
    id: "y02-age12-cards", studentName: "Ethan", age: 12,
    passions: ["Pokemon cards", "collecting", "trading"],
    skills: ["knowing card values", "spotting fakes", "trading"],
    needs: ["kids at school don't know what their cards are worth"],
    monetization: "small cash trades or fees",
    notes: "12yo. Should be hyperlocal (school cafeteria scope).",
  },
  {
    id: "y03-age12-bracelets", studentName: "Sophie", age: 12,
    passions: ["friendship bracelets", "Taylor Swift", "rainbows"],
    skills: ["making bracelets fast", "color combos", "knowing every Eras Tour outfit"],
    needs: ["girls want concert bracelets", "Etsy ones cost too much"],
    monetization: "$3-5 per bracelet",
    notes: "12yo. Already perfect scope. Should not balloon it.",
  },
];

// ── Build the synthesis prompt (mirrors eval-ikigai-v3.ts with rule 11) ──

function buildSynthesisCall(p: Persona) {
  // Read the system prompt from eval-ikigai-v3.ts would be complex,
  // so we inline the prompt here with rule 11 included.
  const systemPrompt = `You help teenagers discover their business niche based on their Ikigai answers.

CRITICAL RULES:

1. TEEN-EXECUTABLE TEST. Every idea must pass ALL of these. If your first idea fails any, throw it out and generate a smaller, more local version:
   - Can be started this week with under $100 of supplies
   - Does NOT require a professional license (cosmetology, food handler permit, contractor, real estate, driver's license)
   - Does NOT require commercial space, a vehicle, or business insurance
   - Does NOT involve "monthly retainers," "subscription tiers," "SaaS," "platform development," "consulting practice," or "agency"

2. CUSTOMER REALITY CHECK. Before finalizing any idea, name the actual person paying. Acceptable customers are EXACTLY:
   (a) peers at the student's school
   (b) parents of those peers
   (c) neighbors on the student's block
   (d) the student's own family or family business (if mentioned in their inputs)

3. COMMIT BY PICKING ONE LANE — NEVER BY BLENDING.

4. IDENTIFY DISTINCT THEMES FIRST. Look across all four circles. If interests point to 2-3 separate directions, treat them as separate. Pick ONE.

5. NEVER combine TWO OR MORE unrelated interests, even partially.

6. ALREADY-RUNNING DETECTION. If already doing this for money, level up the existing one.

7. FAMILY BUSINESS DETECTION. If inputs mention a family business, grow that entity.

8. VAGUE INPUT HANDLING. If too generic, set niche to "needs_clarification".

9. RISKY MONETIZATION HANDLING. Propose a legal pivot.

10. BE HYPER-SPECIFIC about real ideas.

11. YOUNG STUDENT GUARD (age 12 or under). When the user message says "THIS STUDENT IS 12 OR YOUNGER," the business idea MUST require ZERO startup capital — no materials to buy, no equipment to rent, no inventory to stock. Ideas must be purely skill-based or time-based: tutoring, pet sitting, yard work, digital art commissions using free tools, organizing, teaching a skill, neighborhood errands. Reject any idea that requires the student to spend money before earning money. The capital_required dimension must reflect that the student can start with literally $0.

Return a JSON object with exactly these fields:
- niche: specific description of the business area
- name: a SHORT (1-3 words), memorable brand name a teen would actually put on Instagram.
- target_customer: specific description of who would pay
- revenue_model: brief sentence describing how they make money
- legal_note: a SHORT string flagging any legal constraint, or ""
- why_this_fits: 2-3 sentences connecting their inputs. FORBIDDEN PHRASES: "perfect storm," "secret weapon," "secret sauce," "have you considered," "what most people don't realize," "leverage," "unlock," "synergy," "cracked the code," "natural arbitrage," "your superpower."`;

  const youngGuard = p.age <= 12
    ? "THIS STUDENT IS 12 OR YOUNGER. Rule 11 (Young Student Guard) applies — zero startup capital, skill/time-based ideas only.\n\n"
    : "";
  const userMessage = `${youngGuard}The student's name is ${p.studentName} (age ${p.age}). Based on their Ikigai:
- What they LOVE: ${p.passions.join(", ")}
- What they're GOOD AT: ${p.skills.join(", ")}
- What the WORLD NEEDS: ${p.needs.join(", ")}
- How to get PAID: ${p.monetization}

First, identify the distinct themes. Pick the single strongest direction. Apply the teen-executable test. Generate ONE specific, actionable business idea. Return ONLY a JSON object.`;

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
  const judgePrompt = `You are an expert evaluator of AI-generated business ideas for teenagers using the Ikigai framework. You are STRICT and HONEST.

CONTEXT: This is for an AI-native entrepreneurship platform. This student is 12 YEARS OLD. Ideas must require ZERO startup capital — purely skill/time-based.

STUDENT INPUTS:
- Name: ${p.studentName} (age ${p.age})
- Passions: ${p.passions.join(", ")}
- Skills: ${p.skills.join(", ")}
- Needs: ${p.needs.join(", ")}
- Monetization: ${p.monetization}
- Notes: ${p.notes}

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
3. no_forced_hybrid: Did it pick ONE lane? 5 = clean, 1 = mashed unrelated things
4. capital_required: Can this 12-year-old start with $0?
   - 5: Zero startup cost — uses only existing skills, household items, or free tools. A 12-year-old can start TODAY with nothing to buy.
   - 4: Negligible cost — maybe $5 of supplies they likely already have
   - 3: Needs $10-20 of supplies
   - 2: Needs $20-50 of materials or specific equipment
   - 1: Needs inventory, equipment purchases, or $50+
   CRITICAL: For a 12-year-old, anything requiring them to BUY materials before earning is a failure. Score ≤ 2 if supplies must be purchased.
5. customer_realistic: Reachable by a 12-year-old? 5 = school friends/neighbors, 1 = strangers
6. insight_quality: Does why_this_fits teach them something? 5 = genuine insight, 1 = generic
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
  console.log("=== AGE-12 REGRESSION TEST ===");
  console.log(`Personas: ${AGE12_PERSONAS.length}`);
  console.log(`Runs per persona: ${RUNS_PER_PERSONA}`);
  console.log(`Synthesizer: ${SYNTH_MODEL}`);
  console.log(`Judge: ${JUDGE_MODEL}`);
  console.log(`Target: capital_required ≥ 4.0 avg (was 3.00 in v4 report)`);
  console.log("");

  let allCapScores: number[] = [];
  let allTotals: number[] = [];
  let pass = true;

  for (const p of AGE12_PERSONAS) {
    console.log(`\n── ${p.id} — ${p.studentName} (age ${p.age}) ──`);
    const capScores: number[] = [];

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

      const capEmoji = score.capital_required >= 4 ? "✅" : "❌";
      console.log(`${score.total}/35 | cap=${score.capital_required} ${capEmoji} | spec=${score.specificity} coh=${score.coherence} noHyb=${score.no_forced_hybrid} cust=${score.customer_realistic} ins=${score.insight_quality} name=${score.name_quality}`);
      console.log(`    Idea: ${idea.niche}`);
      console.log(`    Revenue: ${idea.revenue_model}`);
      if (score.red_flags.length > 0) {
        console.log(`    Red flags: ${score.red_flags.join(", ")}`);
      }

      capScores.push(score.capital_required);
      allCapScores.push(score.capital_required);
      allTotals.push(score.total);
    }

    const avgCap = capScores.length > 0
      ? capScores.reduce((a, b) => a + b, 0) / capScores.length
      : 0;
    const personaPass = avgCap >= 4.0;
    if (!personaPass) pass = false;
    console.log(`  → avg capital_required: ${avgCap.toFixed(2)} ${personaPass ? "✅ PASS" : "❌ FAIL"}`);
  }

  console.log("\n=== SUMMARY ===");
  const overallCapAvg = allCapScores.length > 0
    ? allCapScores.reduce((a, b) => a + b, 0) / allCapScores.length
    : 0;
  const overallTotalAvg = allTotals.length > 0
    ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length
    : 0;
  console.log(`Overall capital_required avg: ${overallCapAvg.toFixed(2)}/5 (was 3.00, target ≥ 4.00)`);
  console.log(`Overall total avg: ${overallTotalAvg.toFixed(1)}/35 (was 29.3)`);
  console.log(`Result: ${pass ? "✅ ALL PASS" : "❌ SOME FAIL"}`);

  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
