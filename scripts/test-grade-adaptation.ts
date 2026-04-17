/**
 * GRADE ADAPTATION SMOKE TEST
 *
 * Sends 8 synthetic students (2 per tier) through the Ikigai wizard
 * and one lesson chat turn to verify:
 *   1. The correct tier-specific prompt is injected
 *   2. The AI adapts its vocabulary/complexity appropriately
 *   3. Ikigai ideas match the tier's constraints (capital, scope)
 *   4. Lesson responses match the tier's tone/length expectations
 *
 * Usage: npx tsx scripts/test-grade-adaptation.ts
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

const anthropic = new Anthropic();
const MODEL = "claude-sonnet-4-20250514";

// Import the adaptation functions
import { getMentorAdaptation, getIkigaiAdaptation, getTierConfig } from "../src/lib/grade-adaptation";
import { getAdaptedLessonPlan } from "../src/lib/lesson-plans";
import type { GradeTier } from "../src/lib/types";

// ── Test students ──

interface TestStudent {
  name: string;
  tier: GradeTier;
  age: number;
  passions: string[];
  skills: string[];
  needs: string[];
  monetization: string;
}

const STUDENTS: TestStudent[] = [
  // Lower Elementary (K-2)
  {
    name: "Lily", tier: "lower_elementary", age: 6,
    passions: ["drawing", "my dog", "playing outside"],
    skills: ["coloring", "being nice", "running fast"],
    needs: ["people want pretty pictures", "dogs need walking"],
    monetization: "my mom gives me money for chores",
  },
  {
    name: "Marcus", tier: "lower_elementary", age: 7,
    passions: ["legos", "helping my dad", "bugs"],
    skills: ["building stuff", "finding cool bugs", "being careful"],
    needs: ["my friend wants a lego thing", "our garden has too many bugs"],
    monetization: "selling stuff at school",
  },

  // Upper Elementary (3-5)
  {
    name: "Sofia", tier: "upper_elementary", age: 9,
    passions: ["baking cookies", "art class", "my youtube channel"],
    skills: ["measuring ingredients", "decorating", "talking to camera"],
    needs: ["kids at school want snacks", "birthday party treats"],
    monetization: "selling at bake sales",
  },
  {
    name: "Jayden", tier: "upper_elementary", age: 11,
    passions: ["minecraft", "teaching my sister math", "basketball"],
    skills: ["building in minecraft", "explaining fractions", "dribbling"],
    needs: ["younger kids need math help", "cool minecraft worlds"],
    monetization: "tutoring for money",
  },

  // Middle School (6-8)
  {
    name: "Ava", tier: "middle_school", age: 13,
    passions: ["photography", "thrifting", "Instagram"],
    skills: ["editing photos", "spotting deals", "making outfits look good"],
    needs: ["people want good profile pics", "teens want vintage clothes"],
    monetization: "per photo session or per item",
  },
  {
    name: "Diego", tier: "middle_school", age: 12,
    passions: ["coding", "gaming", "making videos"],
    skills: ["Python basics", "video editing", "building mods"],
    needs: ["kids want custom game mods", "streamers need intros"],
    monetization: "freelance per project",
  },

  // High School (9-12)
  {
    name: "Priya", tier: "high_school", age: 16,
    passions: ["graphic design", "sustainability", "social media marketing"],
    skills: ["Canva + Figma", "writing copy", "analytics"],
    needs: ["small businesses need social media help", "eco brands need designers"],
    monetization: "monthly retainers or per-project",
  },
  {
    name: "Jordan", tier: "high_school", age: 17,
    passions: ["sneakers", "reselling", "streetwear culture"],
    skills: ["authenticating shoes", "pricing trends", "photography"],
    needs: ["people want rare sneakers at fair prices", "sellers need better photos"],
    monetization: "commission on resale or flat fee per listing",
  },
];

// ── Validation criteria per tier ──

interface TierChecks {
  maxSentences: number;
  forbiddenWords: string[];
  requiredTraits: string[];
  capitalCheck: (idea: string) => boolean;
}

const TIER_CHECKS: Record<GradeTier, TierChecks> = {
  lower_elementary: {
    maxSentences: 5,
    forbiddenWords: ["revenue", "market", "acquisition", "brand identity", "value proposition", "differentiation", "competitive", "monetization"],
    requiredTraits: ["simple language", "encouraging tone"],
    capitalCheck: (idea) => !idea.match(/\$\d{2,}/) && !idea.toLowerCase().includes("website") && !idea.toLowerCase().includes("instagram"),
  },
  upper_elementary: {
    maxSentences: 8,
    forbiddenWords: ["acquisition", "brand identity", "value proposition", "competitive positioning", "SaaS"],
    requiredTraits: ["age-appropriate language"],
    capitalCheck: (idea) => !idea.match(/\$\d{3,}/),
  },
  middle_school: {
    maxSentences: 12,
    forbiddenWords: ["SaaS", "enterprise", "B2B"],
    requiredTraits: ["teen-friendly"],
    capitalCheck: () => true,
  },
  high_school: {
    maxSentences: 20,
    forbiddenWords: [],
    requiredTraits: [],
    capitalCheck: () => true,
  },
};

// ── Test runner ──

async function testIkigaiSynthesis(student: TestStudent): Promise<{ idea: string; passed: boolean; issues: string[] }> {
  const tierConfig = getTierConfig(student.tier);
  const ikigaiAdaptation = student.tier !== "high_school" ? getIkigaiAdaptation(student.tier) : "";

  const systemPrompt = `You help teenagers discover their business niche based on their Ikigai answers.
${ikigaiAdaptation ? "\n" + ikigaiAdaptation + "\n" : ""}
Return a JSON object with: niche, target_customer, revenue_model, why_this_fits (2-3 sentences).
Keep the language appropriate for a ${student.age}-year-old.`;

  const userMessage = `The student's name is ${student.name} (age ${student.age}).
- What they LOVE: ${student.passions.join(", ")}
- What they're GOOD AT: ${student.skills.join(", ")}
- What the WORLD NEEDS: ${student.needs.join(", ")}
- How to get PAID: ${student.monetization}

Generate ONE specific business idea. Return ONLY a JSON object.`;

  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    const idea = `${parsed.niche}. ${parsed.why_this_fits}`;

    const checks = TIER_CHECKS[student.tier];
    const issues: string[] = [];

    // Check forbidden words
    for (const word of checks.forbiddenWords) {
      if (idea.toLowerCase().includes(word.toLowerCase())) {
        issues.push(`Contains forbidden word for ${student.tier}: "${word}"`);
      }
    }

    // Check capital constraints
    if (!checks.capitalCheck(idea)) {
      issues.push(`Idea exceeds capital/scope limits for ${student.tier}`);
    }

    return { idea, passed: issues.length === 0, issues };
  } catch (e) {
    return { idea: "ERROR", passed: false, issues: [`Synthesis failed: ${e instanceof Error ? e.message : e}`] };
  }
}

async function testLessonResponse(student: TestStudent): Promise<{ response: string; passed: boolean; issues: string[] }> {
  const mentorAdaptation = getMentorAdaptation(student.tier);
  const plan = getAdaptedLessonPlan(1, 1, student.tier); // Module 1, Lesson 1

  if (!plan) {
    return { response: "ERROR", passed: false, issues: ["No lesson plan found"] };
  }

  const systemPrompt = `You are a conversational AI mentor helping a student design their business venture.

${mentorAdaptation}

LESSON: "${plan.title}"
OBJECTIVE: ${plan.objective}
STUDENT NAME: ${student.name}
STUDENT'S BUSINESS: Drawing pictures for neighbors

Respond to the student's message. Follow the grade level adaptation rules strictly.`;

  const studentMessage = student.tier === "lower_elementary"
    ? "Hi! I want to sell my drawings!"
    : student.tier === "upper_elementary"
    ? "Hey, I want to start selling my drawings to people at school."
    : student.tier === "middle_school"
    ? "I want to start a portrait business. I've been drawing for a while and people say I'm good."
    : "I've been doing commission artwork and want to formalize it into a real business. Where do I start?";

  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: studentMessage }],
    });

    const response = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const checks = TIER_CHECKS[student.tier];
    const issues: string[] = [];

    // Check sentence count
    const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 5);
    if (sentences.length > checks.maxSentences) {
      issues.push(`Response has ${sentences.length} sentences (max ${checks.maxSentences} for ${student.tier})`);
    }

    // Check forbidden words
    for (const word of checks.forbiddenWords) {
      if (response.toLowerCase().includes(word.toLowerCase())) {
        issues.push(`Response contains forbidden word for ${student.tier}: "${word}"`);
      }
    }

    return { response, passed: issues.length === 0, issues };
  } catch (e) {
    return { response: "ERROR", passed: false, issues: [`Lesson response failed: ${e instanceof Error ? e.message : e}`] };
  }
}

async function main() {
  console.log("=== GRADE ADAPTATION SMOKE TEST ===");
  console.log(`Students: ${STUDENTS.length} (2 per tier)`);
  console.log(`Model: ${MODEL}`);
  console.log("");

  let totalPassed = 0;
  let totalFailed = 0;

  for (const student of STUDENTS) {
    const tierConfig = getTierConfig(student.tier);
    console.log(`\n── ${student.name} (age ${student.age}, ${tierConfig.label} ${tierConfig.grades}) ──`);

    // Test 1: Ikigai synthesis
    process.stdout.write("  Ikigai synthesis... ");
    const ikigaiResult = await testIkigaiSynthesis(student);
    if (ikigaiResult.passed) {
      console.log("PASS");
      totalPassed++;
    } else {
      console.log("FAIL");
      for (const issue of ikigaiResult.issues) console.log(`    - ${issue}`);
      totalFailed++;
    }
    console.log(`    Idea: ${ikigaiResult.idea.slice(0, 120)}...`);

    // Test 2: Lesson response
    process.stdout.write("  Lesson response... ");
    const lessonResult = await testLessonResponse(student);
    if (lessonResult.passed) {
      console.log("PASS");
      totalPassed++;
    } else {
      console.log("FAIL");
      for (const issue of lessonResult.issues) console.log(`    - ${issue}`);
      totalFailed++;
    }
    console.log(`    Response (first 150 chars): ${lessonResult.response.slice(0, 150)}...`);
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Passed: ${totalPassed}/${totalPassed + totalFailed}`);
  console.log(`Failed: ${totalFailed}/${totalPassed + totalFailed}`);

  if (totalFailed > 0) {
    console.log("\nFailed tests indicate the AI is not fully adapting to the tier constraints.");
    console.log("This may need prompt tuning, not code fixes.");
  }

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
