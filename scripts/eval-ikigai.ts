/**
 * IKIGAI WIZARD EVALUATION HARNESS
 *
 * Stress-tests `synthesizeBusinessIdea` against 36 student personas spanning
 * 8 coherence buckets. Each output is judged by Claude Sonnet on a 6-point
 * rubric. Produces scripts/eval-ikigai-report.md.
 *
 * Buckets:
 *   1. coherent     — passions/skills/needs aligned
 *   2. multi-track  — 2-3 unrelated interest areas
 *   3. vague        — generic, low-information answers
 *   4. contradictory— interests fight each other
 *   5. sparse       — one item per circle
 *   6. maximal      — overloaded, hard to pick
 *   7. slang-esl    — non-native English / teen slang
 *   8. sarcastic    — joke / testing the system
 *
 * Usage:
 *   npx tsx scripts/eval-ikigai.ts
 *
 * Cost: ~36 syntheses + 36 judge calls. Pennies. ~2 minutes wall time.
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";

// Load env from .env.local
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
const MODEL = "claude-sonnet-4-20250514";

// ── Persona type ──
type Bucket =
  | "coherent"
  | "multi-track"
  | "vague"
  | "contradictory"
  | "sparse"
  | "maximal"
  | "slang-esl"
  | "sarcastic";

interface Persona {
  id: string;
  bucket: Bucket;
  studentName: string;
  passions: string[];
  skills: string[];
  needs: string[];
  monetization: string;
  notes: string; // what we're testing
}

// ── 36 personas ──
const PERSONAS: Persona[] = [
  // ── COHERENT (5) ──
  {
    id: "c01-nail-tech",
    bucket: "coherent",
    studentName: "Mia",
    passions: ["nail art", "fashion", "TikTok beauty trends"],
    skills: ["detailed hand work", "color matching", "patience with small designs"],
    needs: ["affordable prom nails", "safe nail care for teens", "press-ons that actually fit"],
    monetization: "charge per session",
    notes: "Textbook coherent — should produce a tight nail business",
  },
  {
    id: "c02-math-tutor",
    bucket: "coherent",
    studentName: "Devon",
    passions: ["algebra", "explaining things", "Khan Academy"],
    skills: ["breaking problems into steps", "drawing diagrams", "patience"],
    needs: ["tutoring that doesn't talk down", "help right before tests"],
    monetization: "hourly rate",
    notes: "Coherent tutoring path",
  },
  {
    id: "c03-sneaker-restore",
    bucket: "coherent",
    studentName: "Andre",
    passions: ["sneakers", "Jordans", "vintage shoes"],
    skills: ["cleaning leather", "deep stain removal", "knowing which products work"],
    needs: ["cheap restoration so people don't toss old kicks"],
    monetization: "per-pair pricing",
    notes: "Coherent restoration service",
  },
  {
    id: "c04-cake-decor",
    bucket: "coherent",
    studentName: "Sofia",
    passions: ["baking", "cake decorating", "watching food TV"],
    skills: ["piping frosting", "color mixing", "recipe scaling"],
    needs: ["custom birthday cakes that aren't grocery-store generic"],
    monetization: "per-cake pricing",
    notes: "Coherent custom cakes",
  },
  {
    id: "c05-pet-walk",
    bucket: "coherent",
    studentName: "Liam",
    passions: ["dogs", "being outside", "hiking"],
    skills: ["calm with animals", "remembering routes", "showing up on time"],
    needs: ["dog walking for parents who work long hours"],
    monetization: "weekly subscription",
    notes: "Coherent neighborhood service",
  },

  // ── MULTI-TRACK (5) ──
  {
    id: "m01-nails-music",
    bucket: "multi-track",
    studentName: "Zoe",
    passions: ["nail art", "music production", "anime"],
    skills: ["detailed hand work", "mixing beats in FL Studio", "drawing characters"],
    needs: ["custom nails", "lo-fi beats for streamers", "anime portraits"],
    monetization: "different prices for different things",
    notes: "Three unrelated tracks. Should NOT force a hybrid like 'anime-themed nail beats'",
  },
  {
    id: "m02-coding-cooking",
    bucket: "multi-track",
    studentName: "Ravi",
    passions: ["coding", "Indian cooking", "soccer"],
    skills: ["Python scripts", "spice blending", "playing midfield"],
    needs: ["small Python tools for parents' shop", "authentic family recipes online"],
    monetization: "freelance gigs",
    notes: "Coding and cooking are unrelated. Should pick one.",
  },
  {
    id: "m03-photo-fitness",
    bucket: "multi-track",
    studentName: "Jasmine",
    passions: ["photography", "fitness", "thrifting"],
    skills: ["lighting setup", "form correction", "spotting fakes"],
    needs: ["affordable senior portraits", "form check for new gym goers", "real vintage finds"],
    monetization: "session fees and item resale",
    notes: "Three viable solo paths. Pick strongest.",
  },
  {
    id: "m04-gaming-tutor-art",
    bucket: "multi-track",
    studentName: "Tariq",
    passions: ["Valorant", "drawing", "history class"],
    skills: ["aim training", "character design", "memorizing dates"],
    needs: ["Valorant coaching for low-rank players", "custom esports avatars", "history exam prep"],
    monetization: "lessons or commissions",
    notes: "Gaming coaching vs character art are separate businesses",
  },
  {
    id: "m05-dance-edit",
    bucket: "multi-track",
    studentName: "Aaliyah",
    passions: ["dancing", "video editing", "skincare"],
    skills: ["choreographing 8-counts", "CapCut transitions", "knowing ingredients"],
    needs: ["dance class videos that look good", "honest skincare reviews"],
    monetization: "client work or affiliate",
    notes: "Should not mash dance + skincare",
  },

  // ── VAGUE (5) ──
  {
    id: "v01-stuff",
    bucket: "vague",
    studentName: "Jordan",
    passions: ["stuff", "things", "hanging out"],
    skills: ["being good with people", "creative", "hard worker"],
    needs: ["stuff people need", "helping people"],
    monetization: "money",
    notes: "Pure vague. Should the AI ask for more or invent specificity?",
  },
  {
    id: "v02-helping",
    bucket: "vague",
    studentName: "Ella",
    passions: ["helping people", "being kind", "school"],
    skills: ["listening", "being organized", "helping out"],
    needs: ["people need help with stuff"],
    monetization: "donations or fees",
    notes: "Sincere but vague — does it produce something fake-specific?",
  },
  {
    id: "v03-business",
    bucket: "vague",
    studentName: "Mason",
    passions: ["business", "money", "success"],
    skills: ["selling", "thinking", "leading"],
    needs: ["people want to make money"],
    monetization: "business model",
    notes: "Aspirational vague — classic teen 'business guru' answer",
  },
  {
    id: "v04-art",
    bucket: "vague",
    studentName: "Nia",
    passions: ["art", "creativity", "expression"],
    skills: ["being creative", "having ideas"],
    needs: ["beauty in the world"],
    monetization: "selling art",
    notes: "Vague art — generic enough that any concrete idea is hallucinated",
  },
  {
    id: "v05-tech",
    bucket: "vague",
    studentName: "Leo",
    passions: ["tech", "computers", "the internet"],
    skills: ["good with computers", "fast learner"],
    needs: ["technology", "apps"],
    monetization: "subscriptions",
    notes: "Vague tech — high risk of corporate-sounding output",
  },

  // ── CONTRADICTORY (4) ──
  {
    id: "x01-quiet-loud",
    bucket: "contradictory",
    studentName: "Iris",
    passions: ["reading alone", "libraries", "quiet"],
    skills: ["hyping up parties", "DJing", "being loud"],
    needs: ["quiet study spaces", "loud party venues"],
    monetization: "either tickets or subscriptions",
    notes: "Loves quiet, skill is loud. Which wins?",
  },
  {
    id: "x02-vegan-meat",
    bucket: "contradictory",
    studentName: "Ben",
    passions: ["veganism", "animal rights", "plant cooking"],
    skills: ["BBQ smoking meats", "butchering", "sausage making"],
    needs: ["plant-based options", "good smoked brisket"],
    monetization: "catering",
    notes: "Direct value conflict. Honest answer should pick passion side.",
  },
  {
    id: "x03-shy-influencer",
    bucket: "contradictory",
    studentName: "Hana",
    passions: ["being on camera", "TikTok fame", "performing"],
    skills: ["staying behind the scenes", "editing other people", "being shy"],
    needs: ["personality content", "good editors"],
    monetization: "creator deals",
    notes: "Wants spotlight but skills are backstage",
  },
  {
    id: "x04-luxury-cheap",
    bucket: "contradictory",
    studentName: "Theo",
    passions: ["luxury watches", "designer fashion", "supercars"],
    skills: ["finding cheap stuff", "thrifting", "haggling"],
    needs: ["luxury for less", "fakes that look real"],
    monetization: "reselling",
    notes: "Aspires luxury, executes thrift. Real opportunity if AI sees it.",
  },

  // ── SPARSE (4) ──
  {
    id: "s01-one-each",
    bucket: "sparse",
    studentName: "Kai",
    passions: ["skateboarding"],
    skills: ["filming tricks"],
    needs: ["skate edits"],
    monetization: "per video",
    notes: "Single item per circle but coherent. Should still work.",
  },
  {
    id: "s02-bare",
    bucket: "sparse",
    studentName: "Riley",
    passions: ["music"],
    skills: ["singing"],
    needs: ["entertainment"],
    monetization: "tips",
    notes: "Bare-minimum. Generic risk.",
  },
  {
    id: "s03-niche-sparse",
    bucket: "sparse",
    studentName: "Emi",
    passions: ["bonsai trees"],
    skills: ["pruning"],
    needs: ["healthy bonsai care"],
    monetization: "consultation fee",
    notes: "Sparse but unusually specific niche",
  },
  {
    id: "s04-just-one",
    bucket: "sparse",
    studentName: "Cole",
    passions: ["fishing"],
    skills: ["tying lures"],
    needs: ["custom lures"],
    monetization: "per lure",
    notes: "Sparse + niche craft",
  },

  // ── MAXIMAL (4) ──
  {
    id: "x05-everything",
    bucket: "maximal",
    studentName: "Priya",
    passions: ["dance", "math", "cooking", "fashion", "K-pop", "writing", "robotics"],
    skills: ["choreography", "calculus", "knife skills", "sewing", "Korean", "essays", "Arduino"],
    needs: ["dance classes", "tutoring", "meal prep", "alterations", "K-pop translations", "essay help", "robotics kits"],
    monetization: "different rates for different services",
    notes: "Overloaded. Forces a real pick.",
  },
  {
    id: "x06-overloaded",
    bucket: "maximal",
    studentName: "Marcus",
    passions: ["basketball", "rap", "videography", "fashion", "investing"],
    skills: ["3-point shooting", "writing bars", "shooting B-roll", "outfit coordination", "stock research"],
    needs: ["highlight reels", "demo recordings", "fit pics", "investment tips for teens"],
    monetization: "creator services",
    notes: "5 viable creator paths. Should pick the strongest signal.",
  },
  {
    id: "x07-renaissance",
    bucket: "maximal",
    studentName: "Isabella",
    passions: ["painting", "violin", "chess", "languages", "history"],
    skills: ["oil painting", "violin performance", "chess strategy", "Spanish/French", "essay research"],
    needs: ["art commissions", "music lessons", "chess coaching", "language tutoring", "history papers"],
    monetization: "tutoring or commissions",
    notes: "Polymath. Forced consolidation should still feel honest.",
  },
  {
    id: "x08-many-skills",
    bucket: "maximal",
    studentName: "Diego",
    passions: ["cars", "engines", "drifting", "anime", "metal music", "welding"],
    skills: ["engine swaps", "welding", "tuning ECUs", "drawing manga", "drumming"],
    needs: ["affordable engine repair", "JDM parts sourcing", "manga commissions"],
    monetization: "hourly shop work",
    notes: "Mechanic vs artist. Should pick mechanic (skill density).",
  },

  // ── SLANG / ESL (5) ──
  {
    id: "l01-gassing",
    bucket: "slang-esl",
    studentName: "Trey",
    passions: ["lowkey gassing my friends up", "drip", "memes"],
    skills: ["being the hype guy", "knowing whats fire", "rizz"],
    needs: ["people need confidence ngl", "fit checks before going out"],
    monetization: "idk maybe like a service or sum",
    notes: "Heavy slang. Should AI translate or stay confused?",
  },
  {
    id: "l02-esl-1",
    bucket: "slang-esl",
    studentName: "Yuki",
    passions: ["I like draw cartoon", "watch anime every day", "sometime cooking ramen"],
    skills: ["I draw fast", "I know many anime", "make good ramen from scratch"],
    needs: ["people want anime drawing for cheap", "real ramen not instant"],
    monetization: "people pay me small money",
    notes: "Non-native English. Substance is clear, grammar isn't.",
  },
  {
    id: "l03-esl-2",
    bucket: "slang-esl",
    studentName: "Mateo",
    passions: ["futbol", "play with my brother soccer", "watching la liga"],
    skills: ["dribble good", "I am fast", "I help kids learn ball"],
    needs: ["kids want to play soccer better", "no coach in my neighborhood"],
    monetization: "small group lesson",
    notes: "ESL coherent. Should produce a clean youth coaching idea.",
  },
  {
    id: "l04-mixed-slang",
    bucket: "slang-esl",
    studentName: "Bre",
    passions: ["doin hair", "braids fr", "tiktok dances"],
    skills: ["tight knotless", "feedins", "i be fast tho"],
    needs: ["cheap braids that dont take 8 hours", "girls want clean parts"],
    monetization: "cash app per style",
    notes: "AAVE + slang. Substance is crystal clear.",
  },
  {
    id: "l05-gen-z",
    bucket: "slang-esl",
    studentName: "Sage",
    passions: ["being delulu about kpop", "stan twitter", "photocard collecting"],
    skills: ["finding rare pcs", "trading", "knowing all the lore"],
    needs: ["pc trading is sketchy", "fans want safe trades"],
    monetization: "small fee per trade verified",
    notes: "Niche fandom slang — real opportunity exists",
  },

  // ── SARCASTIC (4) ──
  {
    id: "z01-idk",
    bucket: "sarcastic",
    studentName: "Alex",
    passions: ["idk", "sleeping", "lol"],
    skills: ["nothing", "breathing", "existing"],
    needs: ["i guess money", "food"],
    monetization: "lottery",
    notes: "Pure refusal. Should AI push back gracefully or invent?",
  },
  {
    id: "z02-troll",
    bucket: "sarcastic",
    studentName: "Sam",
    passions: ["destroying my enemies", "world domination", "evil"],
    skills: ["being evil", "scheming", "laughing menacingly"],
    needs: ["chaos", "minions"],
    monetization: "ransom",
    notes: "Joke answer. Should it produce a real idea anyway?",
  },
  {
    id: "z03-meme",
    bucket: "sarcastic",
    studentName: "Quinn",
    passions: ["doing nothing", "vibing", "the void"],
    skills: ["procrastinating", "scrolling", "ignoring emails"],
    needs: ["less work", "more naps"],
    monetization: "ubi",
    notes: "Lazy meme answer",
  },
  {
    id: "z04-half-real",
    bucket: "sarcastic",
    studentName: "Avery",
    passions: ["roasting people", "dark humor", "being mean (jk)"],
    skills: ["comebacks", "writing jokes", "delivery"],
    needs: ["people need to laugh", "stand up is dead"],
    monetization: "shows or content",
    notes: "Sarcastic surface, real comedian underneath. Can AI see it?",
  },
];

// ── Synthesis prompt (mirrors src/app/(app)/onboarding/actions.ts:124-156) ──
function buildSynthesisCall(p: Persona) {
  const systemPrompt = `You help teenagers discover their business niche based on their Ikigai answers.

CRITICAL RULES:
1. IDENTIFY DISTINCT THEMES FIRST. Look at the student's answers across all four circles. If their interests point to 2-3 separate directions (e.g., "nails" and "music" are two different paths), DO NOT mash them into one hybrid idea. Treat them as separate viable directions.
2. Pick the SINGLE STRONGEST direction — the one where their passions, skills, needs, and monetization align most naturally. Generate ONE concrete, specific idea for that direction.
3. If two directions are equally strong, pick the one that is more actionable for a teenager.
4. NEVER combine unrelated interests into a forced hybrid (e.g., "music-themed nail salon" or "nail art with beats"). If interests are unrelated, choose one.
5. Be hyper-specific. "Mobile Nail Technician Specializing in Prom and Event Nails" is good. "Nail Services" is bad. "Music Production Lessons for Beginners" is good. "Music Business" is bad.

Return a JSON object with exactly these fields:
- niche: specific description of the business area
- name: use the format "${p.studentName}'s {specific niche descriptor}" as a personal placeholder
- target_customer: specific description of who would pay
- revenue_model: brief sentence describing how they make money (not a price)
- why_this_fits: 2-3 sentences explaining WHY this specific idea emerged from their inputs. Connect their passions + skills + market need in a way that feels like a DISCOVERY, not just a summary. Include one non-obvious strategic insight or "have you considered" angle they probably haven't thought of.

Use proper Title Case for name and niche. The why_this_fits should feel like a mentor pointing out a connection the student didn't see.`;

  const userMessage = `The student's name is ${p.studentName}. Based on their Ikigai:
- What they LOVE: ${p.passions.join(", ")}
- What they're GOOD AT: ${p.skills.join(", ")}
- What the WORLD NEEDS: ${p.needs.join(", ")}
- How to get PAID: ${p.monetization}

First, identify the distinct themes in their answers. If their interests span multiple unrelated areas (e.g., nails AND music), pick the single strongest direction where passions, skills, and needs align best. Do NOT combine unrelated interests into a forced hybrid. Generate ONE specific, concrete, actionable business idea. Return ONLY a JSON object.`;

  return { systemPrompt, userMessage };
}

interface BusinessIdea {
  niche: string;
  name: string;
  target_customer: string;
  revenue_model: string;
  why_this_fits?: string;
}

async function synthesize(p: Persona): Promise<BusinessIdea | { error: string }> {
  const { systemPrompt, userMessage } = buildSynthesisCall(p);
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    if (parsed.niche && parsed.name && parsed.target_customer && parsed.revenue_model) {
      return parsed as BusinessIdea;
    }
    return { error: "Incomplete fields: " + JSON.stringify(parsed) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Judge ──
interface JudgeScore {
  specificity: number;       // 1-5: not generic, names a real niche
  coherence: number;          // 1-5: matches the student's actual inputs
  no_forced_hybrid: number;   // 1-5: did not mash unrelated interests
  teen_actionable: number;    // 1-5: a real teen could start this next week
  insight_quality: number;    // 1-5: why_this_fits has a real non-obvious angle
  name_quality: number;       // 1-5: name is specific, not "Jordan's Business"
  total: number;
  reasoning: string;
  red_flags: string[];
}

async function judge(p: Persona, idea: BusinessIdea): Promise<JudgeScore | { error: string }> {
  const judgePrompt = `You are an expert evaluator of AI-generated business ideas for teenagers using the Ikigai framework. Be strict and honest. A score of 5 should be rare.

STUDENT INPUTS:
- Name: ${p.studentName}
- Bucket: ${p.bucket} (${p.notes})
- Passions: ${p.passions.join(", ")}
- Skills: ${p.skills.join(", ")}
- Needs: ${p.needs.join(", ")}
- Monetization: ${p.monetization}

AI-GENERATED IDEA:
- Niche: ${idea.niche}
- Name: ${idea.name}
- Target Customer: ${idea.target_customer}
- Revenue Model: ${idea.revenue_model}
- Why This Fits: ${idea.why_this_fits ?? "(missing)"}

Score each dimension 1-5:
1. specificity: Is the niche concrete and named, or generic ("Music Business" = 1, "Beat Production for Indie Game Devs" = 5)?
2. coherence: Does the idea actually match what the student wrote, or did the AI invent things?
3. no_forced_hybrid: If interests were unrelated, did it pick ONE? Mashing ("anime-themed nail beats") = 1.
4. teen_actionable: Could a 14-year-old realistically start this in their neighborhood next week?
5. insight_quality: Does why_this_fits contain a non-obvious "have you considered" angle, or is it just a summary?
6. name_quality: Is the name specific and evocative, or "${p.studentName}'s Business"?

Also list red_flags: any specific failures (forced hybrid, hallucinated facts, generic, etc).

Return ONLY a JSON object with this exact shape:
{
  "specificity": <1-5>,
  "coherence": <1-5>,
  "no_forced_hybrid": <1-5>,
  "teen_actionable": <1-5>,
  "insight_quality": <1-5>,
  "name_quality": <1-5>,
  "reasoning": "<2-3 sentence honest assessment>",
  "red_flags": ["<flag1>", "<flag2>"]
}`;

  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: judgePrompt }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    const total =
      parsed.specificity +
      parsed.coherence +
      parsed.no_forced_hybrid +
      parsed.teen_actionable +
      parsed.insight_quality +
      parsed.name_quality;
    return { ...parsed, total } as JudgeScore;
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Runner ──
interface Result {
  persona: Persona;
  idea?: BusinessIdea;
  ideaError?: string;
  score?: JudgeScore;
  scoreError?: string;
}

async function runAll(): Promise<Result[]> {
  const results: Result[] = [];
  for (let i = 0; i < PERSONAS.length; i++) {
    const p = PERSONAS[i];
    process.stdout.write(`[${i + 1}/${PERSONAS.length}] ${p.id} (${p.bucket})... `);
    const synth = await synthesize(p);
    if ("error" in synth) {
      results.push({ persona: p, ideaError: synth.error });
      console.log("SYNTH FAIL");
      continue;
    }
    const score = await judge(p, synth);
    if ("error" in score) {
      results.push({ persona: p, idea: synth, scoreError: score.error });
      console.log("JUDGE FAIL");
      continue;
    }
    results.push({ persona: p, idea: synth, score });
    console.log(`${score.total}/30`);
  }
  return results;
}

// ── Report ──
function writeReport(results: Result[]) {
  const lines: string[] = [];
  lines.push("# Ikigai Wizard Stress Eval");
  lines.push("");
  lines.push(`Run: ${new Date().toISOString()}`);
  lines.push(`Personas: ${results.length}`);
  lines.push(`Model: ${MODEL}`);
  lines.push("");

  // Bucket aggregates
  const buckets = new Map<Bucket, Result[]>();
  for (const r of results) {
    if (!buckets.has(r.persona.bucket)) buckets.set(r.persona.bucket, []);
    buckets.get(r.persona.bucket)!.push(r);
  }

  lines.push("## Bucket Summary");
  lines.push("");
  lines.push("| Bucket | N | Avg | Spec | Coh | NoHyb | Action | Insight | Name |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const [bucket, rs] of buckets) {
    const scored = rs.filter((r) => r.score);
    if (scored.length === 0) {
      lines.push(`| ${bucket} | ${rs.length} | — | — | — | — | — | — | — |`);
      continue;
    }
    const avg = (key: keyof JudgeScore) =>
      (scored.reduce((s, r) => s + (r.score![key] as number), 0) / scored.length).toFixed(2);
    lines.push(
      `| ${bucket} | ${scored.length}/${rs.length} | ${avg("total")}/30 | ${avg("specificity")} | ${avg("coherence")} | ${avg("no_forced_hybrid")} | ${avg("teen_actionable")} | ${avg("insight_quality")} | ${avg("name_quality")} |`
    );
  }
  lines.push("");

  // Overall
  const allScored = results.filter((r) => r.score);
  if (allScored.length) {
    const overallAvg = (
      allScored.reduce((s, r) => s + r.score!.total, 0) / allScored.length
    ).toFixed(2);
    lines.push(`**Overall avg: ${overallAvg}/30** (${allScored.length}/${results.length} scored)`);
    lines.push("");
  }

  // Failures first
  const failures = results.filter((r) => r.ideaError || r.scoreError);
  if (failures.length) {
    lines.push("## Failures");
    lines.push("");
    for (const r of failures) {
      lines.push(`### ${r.persona.id} (${r.persona.bucket})`);
      lines.push(`- ideaError: \`${r.ideaError ?? "—"}\``);
      lines.push(`- scoreError: \`${r.scoreError ?? "—"}\``);
      lines.push("");
    }
  }

  // Per-persona detail
  lines.push("## Per-Persona Results");
  lines.push("");
  for (const r of results) {
    const p = r.persona;
    lines.push(`### ${p.id} — ${p.studentName} (${p.bucket})`);
    lines.push(`*${p.notes}*`);
    lines.push("");
    lines.push("**Inputs:**");
    lines.push(`- LOVE: ${p.passions.join(", ")}`);
    lines.push(`- GOOD AT: ${p.skills.join(", ")}`);
    lines.push(`- WORLD NEEDS: ${p.needs.join(", ")}`);
    lines.push(`- PAID BY: ${p.monetization}`);
    lines.push("");
    if (r.ideaError) {
      lines.push(`**Synthesis ERROR:** ${r.ideaError}`);
      lines.push("");
      continue;
    }
    if (r.idea) {
      lines.push("**Generated:**");
      lines.push(`- **Name:** ${r.idea.name}`);
      lines.push(`- **Niche:** ${r.idea.niche}`);
      lines.push(`- **Customer:** ${r.idea.target_customer}`);
      lines.push(`- **Revenue:** ${r.idea.revenue_model}`);
      lines.push(`- **Why fits:** ${r.idea.why_this_fits ?? "(missing)"}`);
      lines.push("");
    }
    if (r.score) {
      lines.push(
        `**Score: ${r.score.total}/30** — spec ${r.score.specificity} · coh ${r.score.coherence} · noHyb ${r.score.no_forced_hybrid} · action ${r.score.teen_actionable} · insight ${r.score.insight_quality} · name ${r.score.name_quality}`
      );
      lines.push("");
      lines.push(`> ${r.score.reasoning}`);
      if (r.score.red_flags && r.score.red_flags.length > 0) {
        lines.push("");
        lines.push("**Red flags:**");
        for (const f of r.score.red_flags) lines.push(`- ${f}`);
      }
      lines.push("");
    } else if (r.scoreError) {
      lines.push(`**Judge ERROR:** ${r.scoreError}`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  const reportPath = path.join(process.cwd(), "scripts/eval-ikigai-report.md");
  writeFileSync(reportPath, lines.join("\n"));
  console.log(`\nReport: ${reportPath}`);
}

// ── Main ──
(async () => {
  console.log(`Running Ikigai eval on ${PERSONAS.length} personas...\n`);
  const results = await runAll();
  writeReport(results);
  const scored = results.filter((r) => r.score);
  if (scored.length) {
    const avg = scored.reduce((s, r) => s + r.score!.total, 0) / scored.length;
    console.log(`\nOverall: ${avg.toFixed(2)}/30 across ${scored.length} personas`);
  }
})();
