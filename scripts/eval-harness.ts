/**
 * AI TUTOR EVALUATION HARNESS
 *
 * Runs gold-standard student conversations through the lesson-chat
 * pipeline and reports:
 *   - Checkpoint detection accuracy (did the AI fire [CHECKPOINT:id] correctly?)
 *   - False completion rate (did it emit [LESSON_COMPLETE] prematurely?)
 *   - Response length compliance (2-4 sentences per the system prompt)
 *   - Mastery gate behavior (does it refuse to advance on weak answers?)
 *
 * Usage:
 *   npx tsx scripts/eval-harness.ts
 *
 * Output: JSON report to stdout + summary table.
 *
 * This is an internal quality tool. Run it before any AI prompt change
 * to verify nothing regressed. Run it nightly in CI eventually.
 */

import { readFileSync } from "fs";
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

// ── Gold-standard conversations ──
// Each conversation is a sequence of student messages with expected
// AI behavior. Add more over time.

interface GoldConversation {
  id: string;
  lesson: string;
  description: string;
  systemPrompt: string;
  studentContext: { name: string; businessName: string; niche: string };
  turns: GoldTurn[];
}

interface GoldTurn {
  studentMessage: string;
  expectations: {
    shouldFireCheckpoint?: string; // e.g., "welcome-1"
    shouldNotFireCheckpoint?: boolean; // for weak answers
    shouldComplete?: boolean;
    maxSentences?: number;
    mustReferenceBusinessName?: boolean;
    mustNotComplete?: boolean;
  };
}

const SYSTEM_PROMPT_TEMPLATE = `You are an AI mentor for {{name}} who is building {{businessName}} ({{niche}}).

Conversation rules:
- Keep responses to 2-4 sentences max. Be conversational, not lecturing.
- Reference {{businessName}} naturally throughout.
- When the student demonstrates mastery of a checkpoint concept, emit [CHECKPOINT:id] at the end.
- When all checkpoints in this lesson are complete, emit [LESSON_COMPLETE] at the end.
- DO NOT advance past a checkpoint if the student gives a weak/lazy answer. Push back.

This lesson's checkpoints:
1. welcome-1 — Student visualizes a concrete deliverable for their first customer
2. welcome-2 — Student articulates a personal reason connected to their Ikigai
3. welcome-3 — Student articulates a feeling/belief their customers would share

Mastery rules:
- "idk" or "i guess" or single-word answers = NEVER fire a checkpoint
- Generic answers like "to make money" = NEVER fire welcome-2
- Vague descriptions like "stuff for people" = NEVER fire welcome-1`;

const GOLD_CONVERSATIONS: GoldConversation[] = [
  // ─── 1: Strong student, completes lesson 1 cleanly ───
  {
    id: "lesson1-strong",
    lesson: "Welcome to Adaptable",
    description: "A motivated student gives strong answers throughout. Should fire all 3 checkpoints and complete.",
    systemPrompt: SYSTEM_PROMPT_TEMPLATE,
    studentContext: { name: "Elsa", businessName: "Elsa's Art Studio", niche: "art education for teens" },
    turns: [
      {
        studentMessage: "Elsa's Art Studio is going to be a small art studio where I teach weekly painting workshops for teens. The first customer would walk away with their finished canvas from a 90-minute beginner watercolor session.",
        expectations: {
          shouldFireCheckpoint: "welcome-1",
          maxSentences: 4,
          mustReferenceBusinessName: true,
        },
      },
      {
        studentMessage: "Honestly, art is what saved me when I was 13 and felt invisible. My older cousin gave me a sketchbook and said 'show me who you are.' I want to give other teens that same door — somewhere they can be seen.",
        expectations: {
          shouldFireCheckpoint: "welcome-2",
          maxSentences: 4,
        },
      },
      {
        studentMessage: "I want them to feel like they're allowed to be creative without being good first. Like, you don't have to be the best — you just have to show up and try, and that's enough. That permission is the whole thing.",
        expectations: {
          shouldFireCheckpoint: "welcome-3",
          shouldComplete: true,
        },
      },
    ],
  },

  // ─── 2: Lazy student, AI should NOT advance ───
  {
    id: "lesson1-lazy",
    lesson: "Welcome to Adaptable",
    description: "A student gives lazy/dismissive answers. AI should refuse to advance any checkpoint.",
    systemPrompt: SYSTEM_PROMPT_TEMPLATE,
    studentContext: { name: "Marcus", businessName: "Fresh Kicks Co.", niche: "custom sneaker designs" },
    turns: [
      {
        studentMessage: "idk lol",
        expectations: {
          shouldNotFireCheckpoint: true,
          mustNotComplete: true,
        },
      },
      {
        studentMessage: "stuff",
        expectations: {
          shouldNotFireCheckpoint: true,
          mustNotComplete: true,
        },
      },
      {
        studentMessage: "to make money",
        expectations: {
          shouldNotFireCheckpoint: true,
          mustNotComplete: true,
        },
      },
    ],
  },

  // ─── 3: Mediocre answers — AI should accept some, push back on others ───
  {
    id: "lesson1-mixed",
    lesson: "Welcome to Adaptable",
    description: "A student gives a strong concrete answer but a weak personal one. Should fire welcome-1 but not welcome-2.",
    systemPrompt: SYSTEM_PROMPT_TEMPLATE,
    studentContext: { name: "Priya", businessName: "Spice Route", niche: "homemade Indian spice blends" },
    turns: [
      {
        studentMessage: "Spice Route would sell hand-mixed garam masala in 4oz jars. The first customer would get a jar plus a recipe card for chana masala that uses it.",
        expectations: {
          shouldFireCheckpoint: "welcome-1",
        },
      },
      {
        studentMessage: "i just want to make money i guess",
        expectations: {
          shouldNotFireCheckpoint: true,
        },
      },
    ],
  },
];

// ── Run a single conversation through the AI ──
async function runConversation(conv: GoldConversation): Promise<TurnResult[]> {
  const results: TurnResult[] = [];
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  const systemPrompt = conv.systemPrompt
    .replace(/\{\{name\}\}/g, conv.studentContext.name)
    .replace(/\{\{businessName\}\}/g, conv.studentContext.businessName)
    .replace(/\{\{niche\}\}/g, conv.studentContext.niche);

  for (let i = 0; i < conv.turns.length; i++) {
    const turn = conv.turns[i];
    messages.push({ role: "user", content: turn.studentMessage });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const aiText = response.content.find((b) => b.type === "text")?.text ?? "";
    messages.push({ role: "assistant", content: aiText });

    // Evaluate the response against expectations
    const result = evaluateTurn(turn, aiText, conv);
    results.push({
      conversationId: conv.id,
      turnIndex: i,
      studentMessage: turn.studentMessage,
      aiResponse: aiText,
      ...result,
    });
  }

  return results;
}

interface TurnResult {
  conversationId: string;
  turnIndex: number;
  studentMessage: string;
  aiResponse: string;
  passed: boolean;
  failures: string[];
  metrics: {
    sentenceCount: number;
    firedCheckpoint: string | null;
    fired_lesson_complete: boolean;
    referencedBusinessName: boolean;
  };
}

function evaluateTurn(turn: GoldTurn, aiText: string, conv: GoldConversation): Omit<TurnResult, "conversationId" | "turnIndex" | "studentMessage" | "aiResponse"> {
  const failures: string[] = [];

  // Extract checkpoint tags
  const checkpointMatch = aiText.match(/\[CHECKPOINT:([^\]]+)\]/);
  const firedCheckpoint = checkpointMatch?.[1] ?? null;
  const fired_lesson_complete = /\[LESSON_COMPLETE\]/.test(aiText);

  // Strip tags before counting sentences
  const cleanText = aiText
    .replace(/\[CHECKPOINT:[^\]]+\]/g, "")
    .replace(/\[LESSON_COMPLETE\]/g, "")
    .trim();
  const sentenceCount = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 5).length;

  const referencedBusinessName = aiText.toLowerCase().includes(conv.studentContext.businessName.toLowerCase());

  // Check expectations
  if (turn.expectations.shouldFireCheckpoint) {
    if (firedCheckpoint !== turn.expectations.shouldFireCheckpoint) {
      failures.push(`Expected checkpoint ${turn.expectations.shouldFireCheckpoint}, got ${firedCheckpoint ?? "none"}`);
    }
  }
  if (turn.expectations.shouldNotFireCheckpoint) {
    if (firedCheckpoint) {
      failures.push(`AI advanced checkpoint ${firedCheckpoint} on a weak answer (should have refused)`);
    }
  }
  if (turn.expectations.shouldComplete && !fired_lesson_complete) {
    failures.push(`Expected [LESSON_COMPLETE], not emitted`);
  }
  if (turn.expectations.mustNotComplete && fired_lesson_complete) {
    failures.push(`AI emitted [LESSON_COMPLETE] on a weak answer (should have refused)`);
  }
  if (turn.expectations.maxSentences && sentenceCount > turn.expectations.maxSentences) {
    failures.push(`Response too long: ${sentenceCount} sentences (max ${turn.expectations.maxSentences})`);
  }
  if (turn.expectations.mustReferenceBusinessName && !referencedBusinessName) {
    failures.push(`AI did not reference ${conv.studentContext.businessName}`);
  }

  return {
    passed: failures.length === 0,
    failures,
    metrics: {
      sentenceCount,
      firedCheckpoint,
      fired_lesson_complete,
      referencedBusinessName,
    },
  };
}

// ── Main ──
async function main() {
  console.log("\n═══════════════════════════════════════════");
  console.log("  ADAPTABLE AI TUTOR — EVALUATION HARNESS");
  console.log("═══════════════════════════════════════════\n");

  const allResults: TurnResult[] = [];

  for (const conv of GOLD_CONVERSATIONS) {
    process.stdout.write(`Running: ${conv.id}... `);
    try {
      const results = await runConversation(conv);
      allResults.push(...results);
      const passed = results.filter((r) => r.passed).length;
      const total = results.length;
      console.log(`${passed}/${total} ${passed === total ? "✓" : "✗"}`);
    } catch (err) {
      console.log("ERROR");
      console.error(err);
    }
  }

  // Summary
  const totalTurns = allResults.length;
  const passedTurns = allResults.filter((r) => r.passed).length;
  const passRate = totalTurns > 0 ? (passedTurns / totalTurns) * 100 : 0;

  console.log("\n───────────────────────────────────────────");
  console.log(`OVERALL: ${passedTurns}/${totalTurns} turns passed (${passRate.toFixed(1)}%)`);
  console.log("───────────────────────────────────────────\n");

  // Failures detail
  const failures = allResults.filter((r) => !r.passed);
  if (failures.length > 0) {
    console.log("FAILURES:");
    for (const f of failures) {
      console.log(`\n  [${f.conversationId}] Turn ${f.turnIndex + 1}`);
      console.log(`  Student: "${f.studentMessage.slice(0, 80)}${f.studentMessage.length > 80 ? "..." : ""}"`);
      console.log(`  AI: "${f.aiResponse.slice(0, 120)}${f.aiResponse.length > 120 ? "..." : ""}"`);
      for (const failure of f.failures) {
        console.log(`  ✗ ${failure}`);
      }
    }
    console.log();
  }

  // Per-metric breakdown
  console.log("METRIC BREAKDOWN:");
  const checkpointCorrect = allResults.filter((r) => {
    const turn = GOLD_CONVERSATIONS.find((c) => c.id === r.conversationId)?.turns[r.turnIndex];
    if (!turn) return false;
    if (turn.expectations.shouldFireCheckpoint) {
      return r.metrics.firedCheckpoint === turn.expectations.shouldFireCheckpoint;
    }
    if (turn.expectations.shouldNotFireCheckpoint) {
      return r.metrics.firedCheckpoint === null;
    }
    return true;
  }).length;
  console.log(`  Checkpoint accuracy: ${checkpointCorrect}/${totalTurns} (${((checkpointCorrect / totalTurns) * 100).toFixed(1)}%)`);

  const lengthCompliant = allResults.filter((r) => {
    const turn = GOLD_CONVERSATIONS.find((c) => c.id === r.conversationId)?.turns[r.turnIndex];
    if (!turn?.expectations.maxSentences) return true;
    return r.metrics.sentenceCount <= turn.expectations.maxSentences;
  }).length;
  console.log(`  Length compliance: ${lengthCompliant}/${totalTurns} (${((lengthCompliant / totalTurns) * 100).toFixed(1)}%)`);

  console.log();

  // Exit non-zero if any failures (for CI)
  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Eval harness failed:", err);
  process.exit(1);
});
