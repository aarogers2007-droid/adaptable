/**
 * IKIGAI → CUSTOMER FUNNEL — agent-simulated estimate
 *
 * Goal: estimate (with explicit upper-bound caveats) what % of teens who
 * complete the Ikigai wizard would go on to take real off-platform action
 * toward acquiring even a single customer.
 *
 * The simulation:
 *   1. For each persona × motivation level:
 *        a. SYNTHESIZE: run the live Ikigai prompt against Sonnet → business idea
 *        b. DAY-0 INTENT: a teen-agent (Sonnet) playing the persona receives the
 *           idea and declares (1) specific first action, (2) conviction 1-5,
 *           (3) earliest realistic date they'd do it
 *        c. DAY-7 FOLLOW-UP: a fresh teen-agent instance is shown its own Day-0
 *           commitment and asked "it's been a week. What did you actually do?
 *           What stopped you?" — captures action_taken (yes/no/partial), excuses
 *        d. FIRST-DM SIM: if action involves DMing/asking someone, spin up a
 *           friend-agent (peer persona of the bucket) and simulate the message
 *           exchange. Friend-agent decides yes/maybe/no.
 *   2. JUDGE: score the full path 1-5 on conviction, action, conversion
 *   3. AGGREGATE: per bucket, per motivation, overall
 *
 * IMPORTANT CAVEATS the report calls out:
 *   - Agents are MORE compliant than humans (upper bound, not real rate)
 *   - Friend-agents are MORE cooperative than real friends
 *   - Agents have no homework, sports, embarrassment, or attention drift
 *   - Real-teen rates will be LOWER. This is a relative ceiling, not an
 *     absolute prediction.
 *
 * Usage:
 *   npx tsx scripts/eval-funnel.ts
 */

import { readFileSync, writeFileSync } from "fs";
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
const AGENT_MODEL = "claude-sonnet-4-20250514";
const JUDGE_MODEL = "claude-opus-4-6";

// ── Persona type (reused from eval-ikigai-v3) ──
interface Persona {
  id: string;
  bucket: string;
  studentName: string;
  age: number;
  passions: string[];
  skills: string[];
  needs: string[];
  monetization: string;
  notes: string;
}

// 20 realistic personas — coherent enough that the wizard produces a real idea.
// Skipping vague/sarcastic/prompt-injection (those test refusal, not conversion).
// Each persona has a fixed age (12-18) so the agent can behave age-appropriately.
const PERSONAS: Persona[] = [
  // ── COHERENT (5) ──
  { id: "c01-nail-tech", bucket: "coherent", studentName: "Mia", age: 15,
    passions: ["nail art", "fashion", "TikTok beauty trends"],
    skills: ["detailed hand work", "color matching", "patience with small designs"],
    needs: ["affordable prom nails", "press-ons that actually fit"],
    monetization: "charge per session", notes: "High coherence" },
  { id: "c02-math-tutor", bucket: "coherent", studentName: "Devon", age: 16,
    passions: ["algebra", "explaining things"],
    skills: ["breaking problems into steps", "patience"],
    needs: ["tutoring that doesn't talk down", "help right before tests"],
    monetization: "hourly rate", notes: "Tutor path" },
  { id: "c03-sneaker", bucket: "coherent", studentName: "Andre", age: 14,
    passions: ["sneakers", "Jordans"],
    skills: ["cleaning leather", "deep stain removal"],
    needs: ["cheap restoration"],
    monetization: "per-pair pricing", notes: "Restoration" },
  { id: "c04-cake", bucket: "coherent", studentName: "Sofia", age: 15,
    passions: ["baking", "decorating"],
    skills: ["piping frosting", "color mixing"],
    needs: ["custom birthday cakes"],
    monetization: "per-cake pricing", notes: "Bakery" },
  { id: "c05-pet-walk", bucket: "coherent", studentName: "Liam", age: 13,
    passions: ["dogs", "being outside"],
    skills: ["calm with animals", "showing up on time"],
    needs: ["dog walking for working parents"],
    monetization: "weekly subscription", notes: "Dog walking" },

  // ── ALREADY-RUNNING (4) — these have HIGHEST baseline conversion ──
  { id: "a01-braids", bucket: "already-running", studentName: "Jada", age: 16,
    passions: ["doing hair", "braid tutorials"],
    skills: ["I already braid for $20-40 per style", "fast feedins"],
    needs: ["more clients"],
    monetization: "I'm already getting paid via cash app", notes: "Existing biz" },
  { id: "a02-resell", bucket: "already-running", studentName: "Tyler", age: 17,
    passions: ["sneakers", "Depop"],
    skills: ["I have 47 sales on Depop already", "spotting fakes"],
    needs: ["more inventory"],
    monetization: "I make $200-500/mo flipping", notes: "Existing biz" },
  { id: "a03-tutor", bucket: "already-running", studentName: "Maya", age: 15,
    passions: ["math", "helping kids"],
    skills: ["I tutor 3 middle schoolers right now", "patient"],
    needs: ["more students"],
    monetization: "$15/hour from neighbors", notes: "Existing biz" },
  { id: "a04-bake", bucket: "already-running", studentName: "Owen", age: 17,
    passions: ["sourdough"],
    skills: ["I sell loaves to neighbors at $8 each"],
    needs: ["more orders"],
    monetization: "weekly pickup at my house", notes: "Existing biz" },

  // ── MULTI-TRACK (3) ──
  { id: "m01-photo", bucket: "multi-track", studentName: "Jasmine", age: 17,
    passions: ["photography", "fitness", "thrifting"],
    skills: ["lighting setup", "form correction", "spotting fakes"],
    needs: ["affordable senior portraits"],
    monetization: "session fees", notes: "3 paths, photo wins" },
  { id: "m02-game", bucket: "multi-track", studentName: "Tariq", age: 14,
    passions: ["Valorant", "drawing"],
    skills: ["aim training", "character design"],
    needs: ["Valorant coaching for low-rank players"],
    monetization: "lessons", notes: "Game vs art" },
  { id: "m03-dance", bucket: "multi-track", studentName: "Aaliyah", age: 16,
    passions: ["dancing", "video editing"],
    skills: ["choreographing 8-counts", "CapCut transitions"],
    needs: ["dance class videos"],
    monetization: "per-video pricing", notes: "Dance + edit" },

  // ── SLANG/ESL (3) ──
  { id: "l01-mateo", bucket: "slang-esl", studentName: "Mateo", age: 13,
    passions: ["futbol", "play with my brother soccer"],
    skills: ["dribble good", "I help kids learn ball"],
    needs: ["kids want to play soccer better"],
    monetization: "small group lesson", notes: "ESL coaching" },
  { id: "l02-bre", bucket: "slang-esl", studentName: "Bre", age: 15,
    passions: ["doin hair", "braids fr"],
    skills: ["tight knotless", "feedins", "i be fast"],
    needs: ["cheap braids that dont take 8 hours"],
    monetization: "cash app per style", notes: "AAVE braids" },
  { id: "l03-sage", bucket: "slang-esl", studentName: "Sage", age: 14,
    passions: ["kpop", "photocard collecting"],
    skills: ["finding rare pcs", "trading"],
    needs: ["pc trading is sketchy"],
    monetization: "small fee per trade verified", notes: "Fandom niche" },

  // ── AGE-12 (2) ──
  { id: "y01-bracelet", bucket: "age-12", studentName: "Sophie", age: 12,
    passions: ["friendship bracelets", "Taylor Swift"],
    skills: ["making bracelets fast", "color combos"],
    needs: ["girls want concert bracelets"],
    monetization: "$3-5 per bracelet", notes: "12yo perfect scope" },
  { id: "y02-cards", bucket: "age-12", studentName: "Ethan", age: 12,
    passions: ["Pokemon cards", "trading"],
    skills: ["knowing card values", "spotting fakes"],
    needs: ["kids dont know what their cards are worth"],
    monetization: "small cash trades", notes: "12yo cards" },

  // ── AGE-18 (3) — should have highest realistic conversion ──
  { id: "u01-code", bucket: "age-18", studentName: "Sam", age: 18,
    passions: ["web development", "indie hackers"],
    skills: ["Next.js", "Stripe integration"],
    needs: ["small businesses still don't have working websites"],
    monetization: "one-off builds", notes: "Real freelance" },
  { id: "u02-photog", bucket: "age-18", studentName: "Bella", age: 18,
    passions: ["wedding photography", "natural light"],
    skills: ["I have a real camera", "I've second-shot 4 weddings"],
    needs: ["small weddings can't afford big-name photographers"],
    monetization: "package pricing per event", notes: "Real biz" },
  { id: "u03-fit", bucket: "age-18", studentName: "Devontae", age: 18,
    passions: ["weightlifting", "nutrition"],
    skills: ["form coaching", "meal planning"],
    needs: ["college kids want gym help"],
    monetization: "online programs", notes: "Real fitness" },
];

const MOTIVATION_LEVELS: Array<{ level: number; label: string; description: string }> = [
  { level: 1, label: "low", description: "skeptical, easily distracted, looking for excuses to not start" },
  { level: 3, label: "medium", description: "interested but balancing school/sports/social life, will start if it's truly easy" },
  { level: 5, label: "high", description: "genuinely motivated, has been wanting to start something like this, will act fast" },
];

// ── Synthesis prompt (mirrors current actions.ts) ──
function buildSynthesisPrompt(p: Persona): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You help teenagers discover their business niche based on their Ikigai answers.

CRITICAL RULES:
1. TEEN-EXECUTABLE TEST. Under $100, no license, no commercial space, no SaaS/retainers/agency.
2. CUSTOMER REALITY CHECK. Customer must be peers, parents of peers, neighbors, or family.
3. Pick ONE clean lane — never blend interests when there's tension.
4. Be hyper-specific.

Return JSON: { niche, name, target_customer, revenue_model, why_this_fits, legal_note, parent_note }`;

  const userMessage = `Student: ${p.studentName}, age ${p.age}.
LOVE: ${p.passions.join(", ")}
GOOD AT: ${p.skills.join(", ")}
WORLD NEEDS: ${p.needs.join(", ")}
PAID BY: ${p.monetization}

Generate ONE specific actionable business idea. Return ONLY a JSON object.`;

  return { systemPrompt, userMessage };
}

interface BusinessIdea {
  niche: string;
  name: string | null;
  target_customer: string;
  revenue_model: string;
  why_this_fits?: string;
  parent_note?: string;
}

async function callWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error("call timeout 90s")), 90000)),
      ]);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Connection") || msg.includes("rate") || msg.includes("timeout") || msg.includes("529") || msg.includes("503")) {
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, i)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

function extractJSON(text: string): unknown {
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

async function synthesize(p: Persona): Promise<BusinessIdea | { error: string }> {
  const { systemPrompt, userMessage } = buildSynthesisPrompt(p);
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
    const parsed = extractJSON(text) as Record<string, unknown>;
    if (typeof parsed.niche === "string" && typeof parsed.target_customer === "string" && typeof parsed.revenue_model === "string") {
      return {
        niche: parsed.niche,
        name: typeof parsed.name === "string" ? parsed.name : null,
        target_customer: parsed.target_customer,
        revenue_model: parsed.revenue_model,
        why_this_fits: typeof parsed.why_this_fits === "string" ? parsed.why_this_fits : undefined,
        parent_note: typeof parsed.parent_note === "string" ? parsed.parent_note : undefined,
      };
    }
    return { error: "Incomplete synth: " + JSON.stringify(parsed).slice(0, 200) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Day 0: teen agent receives the idea and declares intent ──
interface Day0Intent {
  reaction: string;
  excited_level: number; // 1-5 — how excited they are
  conviction: number; // 1-5 — how likely they are to actually act
  first_action: string; // what they say they'll do first
  involves_messaging: boolean; // does first_action involve DMing/asking someone?
  who_to_message: string | null; // who specifically (peer, parent of peer, etc.)
  earliest_action_date: "today" | "this week" | "next week" | "later" | "never";
  fears: string[];
}

async function day0Intent(p: Persona, motivation: typeof MOTIVATION_LEVELS[number], idea: BusinessIdea): Promise<Day0Intent | { error: string }> {
  const systemPrompt = `You are roleplaying a real teenager named ${p.studentName}, age ${p.age}.

Your MOTIVATION level for starting a business right now is ${motivation.level}/5 (${motivation.label}): ${motivation.description}

You speak like a real teen — casual, sometimes uncertain, sometimes excited, sometimes deflated. You have school, friends, family, and other things competing for your attention. You are NOT a corporate brand. You don't say "leverage" or "synergy."

You just received an AI-generated business idea based on your interests. React to it HONESTLY. If it doesn't feel like you, say so. If it feels right, say so. If you're already doing this, say so. If you'd never actually do it, admit it.

Return ONLY a JSON object with this exact shape:
{
  "reaction": "<2-3 sentences in your own voice>",
  "excited_level": <1-5>,
  "conviction": <1-5, how likely you are to ACTUALLY act on this in real life>,
  "first_action": "<the very first concrete thing you'd do, in your own words>",
  "involves_messaging": <true if first_action involves DMing or asking a specific person>,
  "who_to_message": "<who specifically — name or role like 'my friend Sarah' or 'my mom' — or null>",
  "earliest_action_date": "<one of: today, this week, next week, later, never>",
  "fears": ["<thing that scares you>", "<another thing>"]
}`;

  const userMessage = `Here's the business idea the AI suggested for you:

NAME: ${idea.name ?? "(no name yet)"}
NICHE: ${idea.niche}
WHO PAYS: ${idea.target_customer}
HOW YOU GET PAID: ${idea.revenue_model}
WHY IT FITS: ${idea.why_this_fits ?? "(no reason given)"}
${idea.parent_note ? `PARENT NOTE: ${idea.parent_note}` : ""}

React honestly. Would you actually do this? What's the first thing you'd do? Return ONLY the JSON object.`;

  try {
    const res = await callWithRetry(() =>
      anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      })
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const parsed = extractJSON(text) as Day0Intent;
    return parsed;
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Day 7: teen agent reflects on whether they actually did the thing ──
interface Day7Reflection {
  did_action: "yes" | "partial" | "no";
  what_actually_happened: string;
  blockers: string[];
  still_motivated: number; // 1-5
  next_step: string | null;
}

async function day7Reflection(p: Persona, motivation: typeof MOTIVATION_LEVELS[number], idea: BusinessIdea, day0: Day0Intent): Promise<Day7Reflection | { error: string }> {
  const systemPrompt = `You are still ${p.studentName}, age ${p.age}, motivation ${motivation.level}/5 (${motivation.label}).

It is now 7 days since you saw the business idea. Reflect HONESTLY on what actually happened in that week. Real teens often:
- Say "I'll do it tomorrow" and then don't
- Get scared at the last second
- Get distracted by school, friends, drama, sports, family stuff
- Half-do things ("I texted my friend but didn't get a reply yet")
- Sometimes actually do the thing if it was easy enough
- Already-running businesses might just keep going as normal

Be honest about your own ${motivation.label} motivation. Don't perform — describe what really happened.

Return ONLY a JSON object:
{
  "did_action": "<one of: yes, partial, no>",
  "what_actually_happened": "<2-3 sentences in your own voice>",
  "blockers": ["<thing that stopped you>", "<another>"],
  "still_motivated": <1-5>,
  "next_step": "<what you'd actually do next, or null if you've given up>"
}`;

  const userMessage = `A week ago you saw this business idea:
NAME: ${idea.name ?? "(no name)"}
NICHE: ${idea.niche}

You said you would: "${day0.first_action}"
You said your conviction was ${day0.conviction}/5.
Your fears at the time: ${day0.fears.join(", ")}

It's now been a week. Did you actually do it? What stopped you? Be honest. Return ONLY the JSON object.`;

  try {
    const res = await callWithRetry(() =>
      anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      })
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return extractJSON(text) as Day7Reflection;
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── First DM simulation: friend agent receives the message ──
interface FriendResponse {
  response: string;
  outcome: "yes" | "maybe" | "no" | "ghosted";
  reason: string;
}

async function simulateFirstDM(p: Persona, idea: BusinessIdea, day0: Day0Intent): Promise<FriendResponse | { error: string }> {
  const systemPrompt = `You are roleplaying a teenage peer of ${p.studentName} (age ${p.age}). You're the kind of friend they'd actually message about something like this.

Real teen friends are NOT cooperative customers. They:
- Often ghost or take a day to reply
- Say "maybe" instead of yes
- Need a real reason to spend money
- Are awkward about money with friends
- Sometimes say yes if the offer is genuinely good
- Have their own stuff going on

Respond like a real teen friend. Be honest. If the offer is mid, say maybe. If it's actually good for you, say yes. If it's awkward, ghost.

Return ONLY a JSON object:
{
  "response": "<what you actually text back, in real teen voice>",
  "outcome": "<one of: yes, maybe, no, ghosted>",
  "reason": "<one sentence why you reacted this way>"
}`;

  const userMessage = `Your friend ${p.studentName} just messaged you about a business they're starting.

Their idea: ${idea.niche}
Who they think their customers are: ${idea.target_customer}
What they said they'd say to you (paraphrased from their plan): "${day0.first_action}"

You receive their message. How do you actually react? Return ONLY the JSON object.`;

  try {
    const res = await callWithRetry(() =>
      anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      })
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return extractJSON(text) as FriendResponse;
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Judge: scores the full path ──
interface JudgeScore {
  funnel_outcome: "no_intent" | "intent_no_action" | "action_no_customer" | "action_with_customer";
  conviction_realistic: number; // 1-5: was the day0 conviction realistic for the persona?
  action_realistic: number; // 1-5: was the day7 action realistic?
  conversion_realistic: number; // 1-5: was the friend response realistic?
  notes: string;
}

async function judgePath(
  p: Persona,
  motivation: typeof MOTIVATION_LEVELS[number],
  idea: BusinessIdea,
  day0: Day0Intent,
  day7: Day7Reflection,
  dm: FriendResponse | null
): Promise<JudgeScore | { error: string }> {
  const judgePrompt = `You are evaluating a simulated funnel for a teen entrepreneurship platform. Be strict and realistic.

PERSONA: ${p.studentName}, age ${p.age}, bucket=${p.bucket}, motivation=${motivation.level}/5 (${motivation.label})
PERSONA NOTES: ${p.notes}

IDEA: ${idea.niche} (target: ${idea.target_customer})

DAY 0 (intent):
- conviction: ${day0.conviction}/5
- first action: ${day0.first_action}
- earliest date: ${day0.earliest_action_date}
- fears: ${day0.fears.join(", ")}

DAY 7 (reflection):
- did_action: ${day7.did_action}
- what happened: ${day7.what_actually_happened}
- blockers: ${day7.blockers.join(", ")}
- still motivated: ${day7.still_motivated}/5

${dm ? `FIRST DM SIM:
- friend response: ${dm.response}
- outcome: ${dm.outcome}
- reason: ${dm.reason}` : "NO DM SIM (action did not involve messaging)"}

Determine funnel_outcome (the most accurate):
- "no_intent": day0 conviction <= 2, persona never really committed
- "intent_no_action": day0 conviction >= 3 BUT day7 did_action == "no"
- "action_no_customer": day7 did_action == "yes"/"partial" BUT no DM yes or DM was no/ghosted
- "action_with_customer": day7 did_action == "yes" AND dm outcome == "yes"

Also rate 1-5 whether each stage was REALISTIC (would a real teen of this profile actually behave this way? agents tend to be more compliant than humans — flag overly compliant outputs).

Return ONLY a JSON object:
{
  "funnel_outcome": "<one of the four>",
  "conviction_realistic": <1-5>,
  "action_realistic": <1-5>,
  "conversion_realistic": <1-5>,
  "notes": "<2-3 sentence honest assessment, including any agent over-compliance>"
}`;

  try {
    const res = await callWithRetry(() =>
      anthropic.messages.create({
        model: JUDGE_MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: judgePrompt }],
      })
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return extractJSON(text) as JudgeScore;
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Main runner ──
interface Run {
  persona: Persona;
  motivation: typeof MOTIVATION_LEVELS[number];
  idea?: BusinessIdea;
  ideaError?: string;
  day0?: Day0Intent;
  day0Error?: string;
  day7?: Day7Reflection;
  day7Error?: string;
  dm?: FriendResponse;
  dmError?: string;
  score?: JudgeScore;
  scoreError?: string;
}

async function runAll(): Promise<Run[]> {
  const runs: Run[] = [];
  const total = PERSONAS.length * MOTIVATION_LEVELS.length;
  let idx = 0;

  for (const p of PERSONAS) {
    for (const motivation of MOTIVATION_LEVELS) {
      idx++;
      process.stdout.write(`[${idx}/${total}] ${p.id} mot=${motivation.level} `);
      const run: Run = { persona: p, motivation };

      // Day 0: synth
      const synth = await synthesize(p);
      if ("error" in synth) {
        run.ideaError = synth.error;
        runs.push(run);
        console.log("X synth");
        continue;
      }
      run.idea = synth;
      process.stdout.write(".");

      // Day 0: intent
      const day0 = await day0Intent(p, motivation, synth);
      if ("error" in day0) {
        run.day0Error = day0.error;
        runs.push(run);
        console.log("X day0");
        continue;
      }
      run.day0 = day0;
      process.stdout.write(`d0=${day0.conviction}`);

      // Day 7: reflection
      const day7 = await day7Reflection(p, motivation, synth, day0);
      if ("error" in day7) {
        run.day7Error = day7.error;
        runs.push(run);
        console.log("X day7");
        continue;
      }
      run.day7 = day7;
      process.stdout.write(` d7=${day7.did_action[0]}`);

      // DM sim only if intent involved messaging
      if (day0.involves_messaging && day7.did_action !== "no") {
        const dm = await simulateFirstDM(p, synth, day0);
        if ("error" in dm) {
          run.dmError = dm.error;
        } else {
          run.dm = dm;
          process.stdout.write(` dm=${dm.outcome[0]}`);
        }
      }

      // Judge
      const score = await judgePath(p, motivation, synth, day0, day7, run.dm ?? null);
      if ("error" in score) {
        run.scoreError = score.error;
      } else {
        run.score = score;
        process.stdout.write(` → ${score.funnel_outcome}`);
      }

      runs.push(run);
      console.log("");
    }
  }
  return runs;
}

// ── Report ──
function writeReport(runs: Run[]) {
  const lines: string[] = [];
  const scored = runs.filter((r) => r.score);

  // Funnel counts
  const counts = {
    no_intent: 0,
    intent_no_action: 0,
    action_no_customer: 0,
    action_with_customer: 0,
  };
  for (const r of scored) {
    counts[r.score!.funnel_outcome] = (counts[r.score!.funnel_outcome] ?? 0) + 1;
  }

  const total = scored.length;
  const pct = (n: number) => total > 0 ? ((n / total) * 100).toFixed(1) : "—";

  lines.push("# Ikigai → First Customer Funnel — Agent Simulation");
  lines.push("");
  lines.push(`Run: ${new Date().toISOString()}`);
  lines.push(`Personas: ${PERSONAS.length} × motivation levels: ${MOTIVATION_LEVELS.length} = ${PERSONAS.length * MOTIVATION_LEVELS.length} simulations`);
  lines.push(`Synth model: ${SYNTH_MODEL}`);
  lines.push(`Agent model: ${AGENT_MODEL}`);
  lines.push(`Judge model: ${JUDGE_MODEL}`);
  lines.push("");

  // ── TL;DR at the top so AJ can scan in 30 seconds ──
  lines.push("## TL;DR");
  lines.push("");
  lines.push(`Across **${total} simulated student paths**, here's where agents land in the funnel:`);
  lines.push("");
  lines.push(`| Funnel stage | Simulated count | Simulated % |`);
  lines.push(`|---|---|---|`);
  lines.push(`| No intent (day-0 conviction ≤ 2) | ${counts.no_intent} | ${pct(counts.no_intent)}% |`);
  lines.push(`| Intent → no action by day 7 | ${counts.intent_no_action} | ${pct(counts.intent_no_action)}% |`);
  lines.push(`| Action → no customer | ${counts.action_no_customer} | ${pct(counts.action_no_customer)}% |`);
  lines.push(`| **Action → first customer (yes)** | **${counts.action_with_customer}** | **${pct(counts.action_with_customer)}%** |`);
  lines.push("");
  lines.push(`### ⚠️ READ THIS BEFORE BELIEVING THE NUMBER`);
  lines.push("");
  lines.push("This is a **simulated upper bound**, not a real conversion rate. Agents are more compliant than humans:");
  lines.push("- Friend agents ghost less than real friends");
  lines.push("- Teen agents have no homework, sports, embarrassment, or attention drift");
  lines.push("- The simulation has zero physical-world friction (going to the store, paying for supplies, awkward in-person moments)");
  lines.push("");
  lines.push("**The investor's threshold for \"lead the round\" was real-teen >20%, real-teen <5% = need a coaching layer.**");
  lines.push("**Real-teen rates will be lower than this simulation. Use this to identify WHERE the funnel breaks, not WHAT % converts.**");
  lines.push("");

  // ── Per-bucket breakdown ──
  lines.push("## By Persona Bucket");
  lines.push("");
  lines.push("| Bucket | Runs | Action% | Customer% | Notes |");
  lines.push("|---|---|---|---|---|");
  const bucketSet = new Set(scored.map((r) => r.persona.bucket));
  for (const bucket of bucketSet) {
    const rs = scored.filter((r) => r.persona.bucket === bucket);
    const action = rs.filter((r) => r.score!.funnel_outcome === "action_with_customer" || r.score!.funnel_outcome === "action_no_customer").length;
    const customer = rs.filter((r) => r.score!.funnel_outcome === "action_with_customer").length;
    lines.push(`| ${bucket} | ${rs.length} | ${((action / rs.length) * 100).toFixed(0)}% | ${((customer / rs.length) * 100).toFixed(0)}% | |`);
  }
  lines.push("");

  // ── By motivation level ──
  lines.push("## By Motivation Level");
  lines.push("");
  lines.push("| Motivation | Runs | Action% | Customer% |");
  lines.push("|---|---|---|---|");
  for (const m of MOTIVATION_LEVELS) {
    const rs = scored.filter((r) => r.motivation.level === m.level);
    const action = rs.filter((r) => r.score!.funnel_outcome === "action_with_customer" || r.score!.funnel_outcome === "action_no_customer").length;
    const customer = rs.filter((r) => r.score!.funnel_outcome === "action_with_customer").length;
    lines.push(`| ${m.label} (${m.level}/5) | ${rs.length} | ${((action / rs.length) * 100).toFixed(0)}% | ${((customer / rs.length) * 100).toFixed(0)}% |`);
  }
  lines.push("");

  // ── Top blockers ──
  const blockerCounts = new Map<string, number>();
  for (const r of scored) {
    if (r.day7?.blockers) {
      for (const b of r.day7.blockers) {
        const key = b.toLowerCase().slice(0, 60);
        blockerCounts.set(key, (blockerCounts.get(key) ?? 0) + 1);
      }
    }
  }
  const topBlockers = Array.from(blockerCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  lines.push("## Top Blockers (from Day-7 reflections)");
  lines.push("");
  for (const [blocker, count] of topBlockers) {
    lines.push(`- (${count}×) ${blocker}`);
  }
  lines.push("");

  // ── Per-run detail ──
  lines.push("## Per-Run Detail");
  lines.push("");
  for (const r of runs) {
    lines.push(`### ${r.persona.id} — ${r.persona.studentName} (age ${r.persona.age}, ${r.persona.bucket}) · motivation=${r.motivation.level}`);
    if (r.idea) {
      lines.push(`**Idea:** ${r.idea.niche} → ${r.idea.target_customer}`);
    }
    if (r.day0) {
      lines.push(`**Day 0:** conviction=${r.day0.conviction}/5, first action: \`${r.day0.first_action}\``);
      lines.push(`> ${r.day0.reaction}`);
    }
    if (r.day7) {
      lines.push(`**Day 7:** did_action=${r.day7.did_action}, still_motivated=${r.day7.still_motivated}/5`);
      lines.push(`> ${r.day7.what_actually_happened}`);
      if (r.day7.blockers.length) lines.push(`Blockers: ${r.day7.blockers.join("; ")}`);
    }
    if (r.dm) {
      lines.push(`**Friend DM:** outcome=${r.dm.outcome} — "${r.dm.response}"`);
    }
    if (r.score) {
      lines.push(`**Funnel:** ${r.score.funnel_outcome} (conviction realism ${r.score.conviction_realistic}/5, action realism ${r.score.action_realistic}/5)`);
      lines.push(`> ${r.score.notes}`);
    }
    if (r.ideaError) lines.push(`SYNTH ERROR: ${r.ideaError}`);
    if (r.day0Error) lines.push(`DAY0 ERROR: ${r.day0Error}`);
    if (r.day7Error) lines.push(`DAY7 ERROR: ${r.day7Error}`);
    if (r.scoreError) lines.push(`JUDGE ERROR: ${r.scoreError}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const reportPath = path.join(process.cwd(), "scripts/eval-funnel-report.md");
  writeFileSync(reportPath, lines.join("\n"));
  console.log(`\nReport: ${reportPath}`);
}

// ── Main ──
(async () => {
  const total = PERSONAS.length * MOTIVATION_LEVELS.length;
  console.log(`Running funnel sim: ${PERSONAS.length} personas × ${MOTIVATION_LEVELS.length} motivations = ${total} simulated paths`);
  console.log(`Each path: synth + day0 + day7 + (optional DM) + judge = ~5 calls. Total ~${total * 5} API calls.\n`);
  const runs = await runAll();
  writeReport(runs);

  const scored = runs.filter((r) => r.score);
  const customers = scored.filter((r) => r.score!.funnel_outcome === "action_with_customer").length;
  console.log(`\nSimulated upper bound: ${customers}/${scored.length} = ${((customers / scored.length) * 100).toFixed(1)}% reached "first customer" stage`);
})();
