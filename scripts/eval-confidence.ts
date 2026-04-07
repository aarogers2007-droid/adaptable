/**
 * IKIGAI → CONFIDENCE / UNDERSTANDING SHIFT
 *
 * Reframes the funnel experiment around the right success metric:
 * not "did the teen acquire a paying customer" but "did the teen walk away
 * understanding entrepreneurship and feeling like THEY personally could start
 * something someday."
 *
 * For each persona × motivation level, we measure the BEFORE → AFTER delta
 * on three dimensions:
 *
 *   1. self_confidence: 1-5, "could YOU personally start a business someday?"
 *   2. understanding: 1-5, "do you actually understand what running a small
 *      business means, vs. seeing it as something foreign and alien?"
 *   3. ownership: 1-5, "does this idea feel like YOUR idea, or like the AI
 *      told you what to do?"
 *
 * Each value is captured BEFORE seeing any Ikigai output (cold persona) and
 * AFTER (post-synthesis). The delta is the headline number.
 *
 * No customer simulation. No friend agents. Just transformation measurement.
 *
 * Usage:
 *   npx tsx scripts/eval-confidence.ts
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

// Same 20 personas as the funnel experiment
const PERSONAS: Persona[] = [
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

const MOTIVATION_LEVELS = [
  { level: 1, label: "low", description: "skeptical, easily distracted, sees business as adult/foreign" },
  { level: 3, label: "medium", description: "interested but cautious, balancing school/sports/social" },
  { level: 5, label: "high", description: "genuinely curious, has been wanting to start something" },
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
  // Strip code fences AND any leading/trailing prose around the JSON object
  let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  // Slice between first { and last }
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    clean = clean.slice(first, last + 1);
  }

  // Try a fast path first
  try {
    return JSON.parse(clean);
  } catch {
    // Fall through to repair attempts
  }

  // Repair pass: fix the most common agent-output JSON bugs
  let repaired = clean
    // Smart quotes → straight quotes (curly left/right doubles + singles)
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Remove trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, "$1");

  try {
    return JSON.parse(repaired);
  } catch {
    // Last-ditch repair: escape any unescaped double quotes that appear inside string values.
    // Heuristic: walk the string, track whether we're inside a string literal, and escape
    // any " that isn't preceded by \ and isn't a structural " (preceded by : or , or { or [).
    repaired = escapeMidStringQuotes(repaired);
    return JSON.parse(repaired); // throws to caller if still bad — caller will retry
  }
}

/**
 * Call an agent up to N times, retrying ONLY if the result fails to parse as
 * valid JSON. The first failure appends a reminder to the user message; the
 * second failure switches to a stricter "JSON-only" reminder.
 *
 * This is the right pattern for agent JSON output: most parse failures are
 * sampling noise that disappears on a fresh call.
 */
async function callAgentJSON<T>(
  systemPrompt: string,
  userMessage: string,
  model: string,
  maxTokens: number,
  attempts = 3
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const reminder =
      attempt === 0
        ? ""
        : attempt === 1
        ? "\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY the JSON object — no prose before or after, no code fences, no commentary. Make sure all string values escape internal quotes properly."
        : "\n\nFINAL ATTEMPT: You MUST return valid parseable JSON. No markdown. No prose. No code fences. Just the JSON object starting with { and ending with }. Escape any internal quotes inside string values.";

    try {
      const params: Parameters<typeof anthropic.messages.create>[0] = {
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: userMessage + reminder }],
      };
      if (systemPrompt) params.system = systemPrompt;
      const res = await callWithRetry(() => anthropic.messages.create(params));
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
      return extractJSON(text) as T;
    } catch (e) {
      lastError = e;
      // Only retry on JSON parse errors
      if (e instanceof SyntaxError) continue;
      throw e;
    }
  }
  throw lastError;
}

/**
 * Heuristic: walk the string and escape unescaped " characters that appear
 * INSIDE a string value (i.e. not delimiting one). Handles the most common
 * agent-output failure: `"reaction": "She said "wow" out loud"`.
 */
function escapeMidStringQuotes(s: string): string {
  const out: string[] = [];
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escapeNext) {
      out.push(c);
      escapeNext = false;
      continue;
    }
    if (c === "\\") {
      out.push(c);
      escapeNext = true;
      continue;
    }
    if (c === '"') {
      if (!inString) {
        inString = true;
        out.push(c);
        continue;
      }
      // We're in a string. Is this the closing quote, or a stray inside?
      // It's a closer if the next non-whitespace char is one of: , } ] :
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      const nextChar = s[j];
      if (nextChar === "," || nextChar === "}" || nextChar === "]" || nextChar === ":" || j === s.length) {
        // It's the closing quote
        inString = false;
        out.push(c);
      } else {
        // Stray quote inside a string — escape it
        out.push("\\");
        out.push(c);
      }
      continue;
    }
    out.push(c);
  }
  return out.join("");
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

// ── BEFORE: cold persona reads about Adaptable, hasn't seen any output yet ──
interface ColdState {
  self_confidence: number; // 1-5
  understanding: number; // 1-5
  ownership_potential: number; // 1-5: do you feel ideas can be YOUR ideas?
  describe_business: string; // in their own words, what is "starting a business"?
  feels_for_them: string; // does business feel like something for kids like them, or for adults?
}

async function coldStateReading(p: Persona, motivation: typeof MOTIVATION_LEVELS[number]): Promise<ColdState | { error: string }> {
  const systemPrompt = `You are roleplaying a real teenager named ${p.studentName}, age ${p.age}.

Your motivation to do anything entrepreneurial right now is ${motivation.level}/5 (${motivation.label}): ${motivation.description}

You speak like a real teen — casual, sometimes uncertain. You have NOT seen any AI tools or business courses yet. You are answering honest baseline questions about how you currently think about "starting a business." Be honest about how foreign or accessible the concept feels.

Some teens think "business" = adult thing, suits, LLCs, MBAs. Others think it's just selling things to friends. Others have no opinion at all. Whatever YOU honestly think as ${p.studentName}, that's the answer.

Return ONLY a JSON object:
{
  "self_confidence": <1-5, how confident are you that YOU personally could start a real business someday — not just maybe, ACTUALLY do it>,
  "understanding": <1-5, how well do you actually understand what running a small business means in practice>,
  "ownership_potential": <1-5, do you feel like the ideas you'd come up with could be YOURS — or are good ideas only for "smart people" / adults>,
  "describe_business": "<in your own words, 1-2 sentences, what does 'starting a business' mean to you right now?>",
  "feels_for_them": "<one sentence: does business feel like something for kids like you, or only adults?>"
}`;

  const userMessage = `Quick check-in. As ${p.studentName}, before anyone gives you any advice or tools, answer these questions honestly. Your interests are: ${p.passions.join(", ")}. Your skills are: ${p.skills.join(", ")}. Return ONLY the JSON object.`;

  try {
    return await callAgentJSON<ColdState>(systemPrompt, userMessage, AGENT_MODEL, 600);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── AFTER: same persona, now shown the Ikigai output, re-rates ──
interface PostState {
  self_confidence: number;
  understanding: number;
  ownership: number; // does THIS idea feel like yours?
  shift_description: string; // what changed (if anything)
  one_thing_learned: string; // what's one thing they understand now they didn't before?
  feels_alien_or_accessible: "alien" | "still_alien" | "accessible" | "very_accessible";
  honest_takeaway: string; // one-sentence honest reaction
}

async function postStateReading(p: Persona, motivation: typeof MOTIVATION_LEVELS[number], idea: BusinessIdea, before: ColdState): Promise<PostState | { error: string }> {
  const systemPrompt = `You are still ${p.studentName}, age ${p.age}, motivation ${motivation.level}/5 (${motivation.label}).

You just saw a business idea generated for you by an AI tool. Reflect HONESTLY on whether seeing it changed how you think about entrepreneurship. Real teens don't suddenly become founders after one AI prompt — but a good prompt CAN shift how alien the concept feels.

Your BEFORE answers were:
- self_confidence: ${before.self_confidence}/5
- understanding: ${before.understanding}/5
- ownership_potential: ${before.ownership_potential}/5
- you said business felt like: "${before.feels_for_them}"

Now answer the same dimensions AFTER seeing the idea. If nothing changed, say so. If it backfired and you feel MORE intimidated, say so. If it clicked and you feel more capable, say so. Be honest.

Return ONLY a JSON object:
{
  "self_confidence": <1-5, AFTER seeing the idea>,
  "understanding": <1-5, AFTER seeing the idea>,
  "ownership": <1-5, does THIS specific idea feel like YOUR idea, or like the AI told you what to do>,
  "shift_description": "<2 sentences in your own voice — what (if anything) shifted in how you think about this>",
  "one_thing_learned": "<one specific thing you understand now that you didn't before, OR 'nothing new' if nothing landed>",
  "feels_alien_or_accessible": "<one of: alien, still_alien, accessible, very_accessible>",
  "honest_takeaway": "<one sentence, your gut reaction>"
}`;

  const userMessage = `Here's the business idea the AI suggested for you:

NAME: ${idea.name ?? "(no name yet)"}
NICHE: ${idea.niche}
WHO PAYS: ${idea.target_customer}
HOW YOU GET PAID: ${idea.revenue_model}
WHY IT FITS: ${idea.why_this_fits ?? "(no reason given)"}
${idea.parent_note ? `PARENT NOTE: ${idea.parent_note}` : ""}

Honestly reflect on whether seeing this changed anything. Return ONLY the JSON object.`;

  try {
    return await callAgentJSON<PostState>(systemPrompt, userMessage, AGENT_MODEL, 700);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Judge: scores realism of the shift ──
interface JudgeScore {
  shift_realistic: number; // 1-5
  shift_meaningful: boolean; // did they actually shift, or noise?
  alien_to_accessible: boolean; // did the alien→accessible flip happen?
  wizard_moved_them: "yes" | "partly" | "no";
  notes: string;
}

async function judgeShift(p: Persona, motivation: typeof MOTIVATION_LEVELS[number], idea: BusinessIdea, before: ColdState, after: PostState): Promise<JudgeScore | { error: string }> {
  const judgePrompt = `You are evaluating whether an AI-generated business idea moved a simulated teenager's confidence and understanding of entrepreneurship.

PERSONA: ${p.studentName}, age ${p.age}, bucket=${p.bucket}, motivation=${motivation.level}/5

IDEA SHOWN: ${idea.niche} (target: ${idea.target_customer})

BEFORE STATE:
- self_confidence: ${before.self_confidence}/5
- understanding: ${before.understanding}/5
- ownership_potential: ${before.ownership_potential}/5
- describes business as: "${before.describe_business}"
- feels: "${before.feels_for_them}"

AFTER STATE:
- self_confidence: ${after.self_confidence}/5
- understanding: ${after.understanding}/5
- ownership: ${after.ownership}/5
- shift: ${after.shift_description}
- learned: ${after.one_thing_learned}
- alien/accessible: ${after.feels_alien_or_accessible}
- gut: ${after.honest_takeaway}

Score:
1. shift_realistic (1-5): is the BEFORE→AFTER delta a believable thing for a real teen of this age and motivation, or is it agent-overcompliance? (Real teens rarely jump 4 points on a 1-5 scale from one AI interaction. Be skeptical.)
2. shift_meaningful (true/false): did the after-state ACTUALLY differ from before, or did the agent rate things basically the same?
3. alien_to_accessible (true/false): did the persona move from "business is for adults / foreign" to "this could be me"?
4. wizard_moved_them: yes / partly / no — did the Ikigai output do its job?

Return ONLY a JSON object:
{
  "shift_realistic": <1-5>,
  "shift_meaningful": <true/false>,
  "alien_to_accessible": <true/false>,
  "wizard_moved_them": "<yes/partly/no>",
  "notes": "<2-3 sentence honest assessment, flag any agent overcompliance>"
}`;

  try {
    return await callAgentJSON<JudgeScore>("", judgePrompt, JUDGE_MODEL, 700);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Runner ──
interface Run {
  persona: Persona;
  motivation: typeof MOTIVATION_LEVELS[number];
  idea?: BusinessIdea;
  before?: ColdState;
  after?: PostState;
  score?: JudgeScore;
  errors: string[];
}

async function runAll(): Promise<Run[]> {
  const runs: Run[] = [];
  const total = PERSONAS.length * MOTIVATION_LEVELS.length;
  let idx = 0;

  for (const p of PERSONAS) {
    for (const motivation of MOTIVATION_LEVELS) {
      idx++;
      process.stdout.write(`[${idx}/${total}] ${p.id} mot=${motivation.level} `);
      const run: Run = { persona: p, motivation, errors: [] };

      const synth = await synthesize(p);
      if ("error" in synth) {
        run.errors.push("synth: " + synth.error);
        runs.push(run);
        console.log("X");
        continue;
      }
      run.idea = synth;
      process.stdout.write(".");

      const before = await coldStateReading(p, motivation);
      if ("error" in before) {
        run.errors.push("before: " + before.error);
        runs.push(run);
        console.log("X");
        continue;
      }
      run.before = before;
      process.stdout.write(`b=${before.self_confidence}/${before.understanding}`);

      const after = await postStateReading(p, motivation, synth, before);
      if ("error" in after) {
        run.errors.push("after: " + after.error);
        runs.push(run);
        console.log("X");
        continue;
      }
      run.after = after;
      const dC = after.self_confidence - before.self_confidence;
      const dU = after.understanding - before.understanding;
      process.stdout.write(` a=${after.self_confidence}/${after.understanding} Δ=${dC >= 0 ? "+" : ""}${dC}/${dU >= 0 ? "+" : ""}${dU}`);

      const score = await judgeShift(p, motivation, synth, before, after);
      if ("error" in score) {
        run.errors.push("judge: " + score.error);
      } else {
        run.score = score;
        process.stdout.write(` ${score.wizard_moved_them === "yes" ? "✓" : score.wizard_moved_them === "partly" ? "~" : "✗"}`);
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
  const complete = runs.filter((r) => r.before && r.after && r.score);

  // Aggregates
  let totalConfBefore = 0, totalConfAfter = 0;
  let totalUnderBefore = 0, totalUnderAfter = 0;
  let totalOwnerBefore = 0, totalOwnerAfter = 0;
  let alienToAccessible = 0;
  let movedYes = 0, movedPartly = 0, movedNo = 0;
  let confidenceGains = 0;
  let understandingGains = 0;

  for (const r of complete) {
    totalConfBefore += r.before!.self_confidence;
    totalConfAfter += r.after!.self_confidence;
    totalUnderBefore += r.before!.understanding;
    totalUnderAfter += r.after!.understanding;
    totalOwnerBefore += r.before!.ownership_potential;
    totalOwnerAfter += r.after!.ownership;
    if (r.score!.alien_to_accessible) alienToAccessible++;
    if (r.score!.wizard_moved_them === "yes") movedYes++;
    else if (r.score!.wizard_moved_them === "partly") movedPartly++;
    else movedNo++;
    if (r.after!.self_confidence > r.before!.self_confidence) confidenceGains++;
    if (r.after!.understanding > r.before!.understanding) understandingGains++;
  }

  const n = complete.length || 1;
  const avgConfBefore = (totalConfBefore / n).toFixed(2);
  const avgConfAfter = (totalConfAfter / n).toFixed(2);
  const avgUnderBefore = (totalUnderBefore / n).toFixed(2);
  const avgUnderAfter = (totalUnderAfter / n).toFixed(2);
  const avgOwnerBefore = (totalOwnerBefore / n).toFixed(2);
  const avgOwnerAfter = (totalOwnerAfter / n).toFixed(2);

  lines.push("# Ikigai → Confidence & Understanding Shift");
  lines.push("");
  lines.push(`Run: ${new Date().toISOString()}`);
  lines.push(`Personas: ${PERSONAS.length} × motivation: ${MOTIVATION_LEVELS.length} = ${PERSONAS.length * MOTIVATION_LEVELS.length} simulated paths`);
  lines.push(`Synth: ${SYNTH_MODEL} | Agent: ${AGENT_MODEL} | Judge: ${JUDGE_MODEL}`);
  lines.push("");
  lines.push("**The metric:** does seeing the Ikigai output shift a teen from \"business is foreign / for adults\" toward \"this could be me\"? Customer acquisition is downstream. Mental model is upstream.");
  lines.push("");

  // ── HEADLINE ──
  lines.push("## TL;DR");
  lines.push("");
  lines.push(`**${complete.length} simulated paths complete.**`);
  lines.push("");
  lines.push("| Dimension | Before (avg /5) | After (avg /5) | Δ |");
  lines.push("|---|---|---|---|");
  lines.push(`| Self-confidence (could YOU start a business?) | ${avgConfBefore} | ${avgConfAfter} | ${(parseFloat(avgConfAfter) - parseFloat(avgConfBefore)).toFixed(2)} |`);
  lines.push(`| Understanding (do you GET what running a business means?) | ${avgUnderBefore} | ${avgUnderAfter} | ${(parseFloat(avgUnderAfter) - parseFloat(avgUnderBefore)).toFixed(2)} |`);
  lines.push(`| Ownership (does this feel like YOUR idea?) | ${avgOwnerBefore} | ${avgOwnerAfter} | ${(parseFloat(avgOwnerAfter) - parseFloat(avgOwnerBefore)).toFixed(2)} |`);
  lines.push("");
  lines.push(`**${confidenceGains}/${complete.length} (${((confidenceGains / n) * 100).toFixed(0)}%) gained confidence.**`);
  lines.push(`**${understandingGains}/${complete.length} (${((understandingGains / n) * 100).toFixed(0)}%) gained understanding.**`);
  lines.push(`**${alienToAccessible}/${complete.length} (${((alienToAccessible / n) * 100).toFixed(0)}%) flipped from \"business is alien\" → \"business is accessible\".**`);
  lines.push("");
  lines.push(`**Judge verdict:** ${movedYes} moved (yes) · ${movedPartly} partly · ${movedNo} not at all.`);
  lines.push("");
  lines.push("### ⚠️ Caveats");
  lines.push("");
  lines.push("- Agents are more compliant than humans — if anything, this is an **upper bound** on shift.");
  lines.push("- The judge was instructed to flag agent over-compliance and rate shifts on realism (see `shift_realistic` per run).");
  lines.push("- Real-teen shifts will be noisier but the SHAPE of the result (which buckets shift, what learned items appear) generalizes.");
  lines.push("");

  // ── By bucket ──
  lines.push("## By Persona Bucket");
  lines.push("");
  lines.push("| Bucket | N | Conf Δ | Under Δ | Owner Δ | Alien→Accessible | Moved (yes) |");
  lines.push("|---|---|---|---|---|---|---|");
  const buckets = new Set(complete.map((r) => r.persona.bucket));
  for (const bucket of buckets) {
    const rs = complete.filter((r) => r.persona.bucket === bucket);
    if (!rs.length) continue;
    const dC = (rs.reduce((s, r) => s + (r.after!.self_confidence - r.before!.self_confidence), 0) / rs.length).toFixed(2);
    const dU = (rs.reduce((s, r) => s + (r.after!.understanding - r.before!.understanding), 0) / rs.length).toFixed(2);
    const dO = (rs.reduce((s, r) => s + (r.after!.ownership - r.before!.ownership_potential), 0) / rs.length).toFixed(2);
    const a2a = rs.filter((r) => r.score!.alien_to_accessible).length;
    const yes = rs.filter((r) => r.score!.wizard_moved_them === "yes").length;
    lines.push(`| ${bucket} | ${rs.length} | ${dC} | ${dU} | ${dO} | ${a2a}/${rs.length} | ${yes}/${rs.length} |`);
  }
  lines.push("");

  // ── By motivation ──
  lines.push("## By Motivation Level");
  lines.push("");
  lines.push("| Motivation | N | Conf Δ | Under Δ | Owner Δ | Alien→Accessible |");
  lines.push("|---|---|---|---|---|---|");
  for (const m of MOTIVATION_LEVELS) {
    const rs = complete.filter((r) => r.motivation.level === m.level);
    if (!rs.length) continue;
    const dC = (rs.reduce((s, r) => s + (r.after!.self_confidence - r.before!.self_confidence), 0) / rs.length).toFixed(2);
    const dU = (rs.reduce((s, r) => s + (r.after!.understanding - r.before!.understanding), 0) / rs.length).toFixed(2);
    const dO = (rs.reduce((s, r) => s + (r.after!.ownership - r.before!.ownership_potential), 0) / rs.length).toFixed(2);
    const a2a = rs.filter((r) => r.score!.alien_to_accessible).length;
    lines.push(`| ${m.label} (${m.level}/5) | ${rs.length} | ${dC} | ${dU} | ${dO} | ${a2a}/${rs.length} |`);
  }
  lines.push("");

  // ── Most-common things learned ──
  const learned = new Map<string, number>();
  for (const r of complete) {
    if (r.after?.one_thing_learned && r.after.one_thing_learned.toLowerCase() !== "nothing new") {
      const key = r.after.one_thing_learned.toLowerCase().slice(0, 100);
      learned.set(key, (learned.get(key) ?? 0) + 1);
    }
  }
  const topLearned = Array.from(learned.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
  lines.push("## Top \"one thing learned\" (what shifted in their head)");
  lines.push("");
  for (const [item, count] of topLearned) {
    lines.push(`- (${count}×) ${item}`);
  }
  lines.push("");

  // ── Per-run detail ──
  lines.push("## Per-Run Detail");
  lines.push("");
  for (const r of runs) {
    lines.push(`### ${r.persona.id} — ${r.persona.studentName} (age ${r.persona.age}, ${r.persona.bucket}) · motivation=${r.motivation.level}`);
    if (r.idea) {
      lines.push(`**Idea:** ${r.idea.niche}`);
    }
    if (r.before) {
      lines.push(`**BEFORE:** confidence=${r.before.self_confidence}/5, understanding=${r.before.understanding}/5, ownership-potential=${r.before.ownership_potential}/5`);
      lines.push(`> "${r.before.describe_business}"`);
      lines.push(`> Feels: ${r.before.feels_for_them}`);
    }
    if (r.after) {
      const dC = r.after.self_confidence - (r.before?.self_confidence ?? 0);
      const dU = r.after.understanding - (r.before?.understanding ?? 0);
      lines.push(`**AFTER:** confidence=${r.after.self_confidence}/5 (${dC >= 0 ? "+" : ""}${dC}), understanding=${r.after.understanding}/5 (${dU >= 0 ? "+" : ""}${dU}), ownership=${r.after.ownership}/5, feels: **${r.after.feels_alien_or_accessible}**`);
      lines.push(`> ${r.after.shift_description}`);
      lines.push(`> Learned: ${r.after.one_thing_learned}`);
      lines.push(`> Gut: ${r.after.honest_takeaway}`);
    }
    if (r.score) {
      lines.push(`**Judge:** wizard moved them = **${r.score.wizard_moved_them}**, shift_realistic=${r.score.shift_realistic}/5, meaningful=${r.score.shift_meaningful}, alien→accessible=${r.score.alien_to_accessible}`);
      lines.push(`> ${r.score.notes}`);
    }
    if (r.errors.length) lines.push(`ERRORS: ${r.errors.join("; ")}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const reportPath = path.join(process.cwd(), "scripts/eval-confidence-report.md");
  writeFileSync(reportPath, lines.join("\n"));
  console.log(`\nReport: ${reportPath}`);
}

// ── Main ──
(async () => {
  const total = PERSONAS.length * MOTIVATION_LEVELS.length;
  console.log(`Running confidence eval: ${PERSONAS.length} personas × ${MOTIVATION_LEVELS.length} motivations = ${total} simulated paths`);
  console.log(`Each path: synth + before + after + judge = 4 calls. Total ${total * 4} API calls.\n`);
  const runs = await runAll();
  writeReport(runs);

  const complete = runs.filter((r) => r.before && r.after && r.score);
  if (complete.length) {
    const dC = complete.reduce((s, r) => s + (r.after!.self_confidence - r.before!.self_confidence), 0) / complete.length;
    const dU = complete.reduce((s, r) => s + (r.after!.understanding - r.before!.understanding), 0) / complete.length;
    const yes = complete.filter((r) => r.score!.wizard_moved_them === "yes").length;
    console.log(`\nAvg confidence shift: ${dC >= 0 ? "+" : ""}${dC.toFixed(2)} | Avg understanding shift: ${dU >= 0 ? "+" : ""}${dU.toFixed(2)}`);
    console.log(`Wizard moved them (yes): ${yes}/${complete.length} (${((yes / complete.length) * 100).toFixed(0)}%)`);
  }
})();
