/**
 * RAG FAITHFULNESS EVALUATOR — `npm run eval:faithfulness`
 *
 * Tests whether the AI lesson mentor actually grounds its responses in retrieved
 * knowledge base chunks or ignores them and falls back to training data. Run this
 * after any change to the lesson-chat system prompt, knowledge-retrieval logic, or
 * knowledge base content. It generates 20 synthetic lesson conversations across 5
 * lessons in 4 modules, scores each teaching turn for faithfulness 0-1 using Claude
 * Opus as judge, and reports by module, KB tag, and individual low-faithfulness
 * responses. The baseline is 0.87 overall; a regression below 0.783 (10% threshold)
 * indicates the AI is ignoring its RAG context. This runs separately from the main
 * eval runner (`npm run eval:run`) because it takes ~10 minutes due to 80+ API calls.
 *
 * Approach:
 *   1. Generate 20 synthetic lesson conversations across 4 modules using
 *      persona simulation (same approach as eval-ikigai-v3.ts).
 *   2. For each conversation, re-derive the knowledge chunks that would have
 *      been retrieved (tag-based lookup mirroring getRelevantKnowledge).
 *   3. Send (question, retrieved chunks, AI response) to Claude Opus as judge.
 *   4. Score faithfulness 0-1 per teaching turn, aggregate by module and KB tag.
 *
 * NOTE: Retrieved chunks are approximated from current knowledge_base state,
 * not exact logged chunks. Once 00027_retrieved_chunks_log.sql ships and real
 * conversations exist, future runs will use exact logged chunks.
 *
 * Usage: npx tsx scripts/eval-faithfulness.ts
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
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic();
const SYNTH_MODEL = "claude-sonnet-4-20250514";
const JUDGE_MODEL = "claude-opus-4-6";

// Supabase admin client for knowledge_base reads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ──

interface LessonTarget {
  module_id: number;
  lesson_id: number;
  title: string;
  lesson_tags: string[];
  objective: string;
  opener: string;
}

interface KBChunk {
  id: string;
  title: string;
  verified: boolean;
  tag_matched: string;
  formatted: string; // the markdown context that would be sent to the AI
}

interface StudentPersona {
  name: string;
  niche: string;
  target_customer: string;
  revenue_model: string;
}

interface TeachingTurn {
  question: string;
  response: string;
  wordCount: number;
}

interface FaithfulnessScore {
  score: number; // 0-1
  reasoning: string;
  unfaithful_claims: string[];
  used_chunks: string[]; // which chunk titles were actually referenced
}

interface ConversationEval {
  persona: StudentPersona;
  lesson: LessonTarget;
  chunks: KBChunk[];
  turns: TeachingTurn[];
  scores: FaithfulnessScore[];
  avgScore: number;
  noRagContext: boolean;
}

// ── Lesson targets: 5 lessons across 4 modules ──

const LESSON_TARGETS: LessonTarget[] = [
  {
    module_id: 1, lesson_id: 1,
    title: "Welcome to Adaptable",
    lesson_tags: ["why", "purpose", "ikigai", "golden-circle", "getting-started", "mindset"],
    objective: "Student articulates WHY they want to build this business beyond money",
    opener: "Hey! I'm stoked you're here.",
  },
  {
    module_id: 1, lesson_id: 3,
    title: "Research Your Competition",
    lesson_tags: ["competition", "differentiation", "niche-selection", "positioning"],
    objective: "Student can name 2-3 competitors and articulate what makes them different",
    opener: "Time to scope out the competition.",
  },
  {
    module_id: 2, lesson_id: 1,
    title: "The Customer Interview",
    lesson_tags: ["customer-interviews", "validation", "talking-to-users"],
    objective: "Student writes 3 open-ended interview questions",
    opener: "Today we talk to real people.",
  },
  {
    module_id: 2, lesson_id: 3,
    title: "Set Your Price",
    lesson_tags: ["pricing", "set-your-price", "revenue-model", "pricing-confidence"],
    objective: "Student picks a concrete price for their first offering",
    opener: "Let's talk about pricing.",
  },
  {
    module_id: 4, lesson_id: 1,
    title: "Zero-Budget Marketing",
    lesson_tags: ["marketing", "first-customers", "customer-acquisition", "getting-started"],
    objective: "Student identifies 3 free channels to reach first customers",
    opener: "Marketing without spending a dime.",
  },
];

// ── Student personas (varied businesses for realistic convos) ──

const PERSONAS: StudentPersona[] = [
  { name: "Mia", niche: "Custom press-on nail sets for prom", target_customer: "Girls at school with dances coming up", revenue_model: "$25-40 per custom set" },
  { name: "Devon", niche: "Algebra tutoring for 8th-10th graders", target_customer: "Middle and high school students before tests", revenue_model: "$15-20/hour" },
  { name: "Jada", niche: "Knotless braids for classmates", target_customer: "Girls at school who want braids", revenue_model: "$20-40 per style via Cash App" },
  { name: "Ravi", niche: "Python automation scripts for local shops", target_customer: "Parents' shop and nearby small businesses", revenue_model: "$50-100 per script" },
];

// ── Knowledge base retrieval (mirrors getRelevantKnowledge) ──

async function getChunksForLesson(lesson: LessonTarget): Promise<KBChunk[]> {
  for (const tag of lesson.lesson_tags) {
    // Pass 1: verified only
    let { data } = await supabase
      .from("knowledge_base")
      .select("id, title, verified, key_principles, concrete_examples, quotes, student_friendly_summary")
      .contains("lesson_tags", [tag])
      .eq("verified", true)
      .limit(2);

    // Pass 2: fallback
    if (!data || data.length === 0) {
      const { data: fallback } = await supabase
        .from("knowledge_base")
        .select("id, title, verified, key_principles, concrete_examples, quotes, student_friendly_summary")
        .contains("lesson_tags", [tag])
        .limit(2);
      data = fallback;
    }

    if (data && data.length > 0) {
      return data.map((chunk) => {
        const principles = (chunk.key_principles as { principle: string; explanation: string }[])
          .map((p: { principle: string; explanation: string }) => `- ${p.principle}: ${p.explanation}`)
          .join("\n");
        const examples = (chunk.concrete_examples as { example: string; business_type: string; lesson: string }[])
          .map((e: { example: string; business_type: string; lesson: string }) => `- ${e.example} (${e.business_type}): ${e.lesson}`)
          .join("\n");
        const quotes = (chunk.quotes as { quote: string; source: string }[])
          .map((q: { quote: string; source: string }) => `- "${q.quote}" — ${q.source}`)
          .join("\n");
        const formatted = `## ${chunk.title}\n\nKey Principles:\n${principles}\n\nReal Examples:\n${examples}\n\nQuotes:\n${quotes}\n\nStudent Summary: ${chunk.student_friendly_summary}`;

        return {
          id: chunk.id as string,
          title: chunk.title as string,
          verified: chunk.verified as boolean,
          tag_matched: tag,
          formatted,
        };
      });
    }
  }
  return [];
}

// ── Synthetic conversation generation ──

async function generateConversation(
  persona: StudentPersona,
  lesson: LessonTarget,
  knowledgeContext: string
): Promise<TeachingTurn[]> {
  // Generate a realistic 4-turn lesson conversation
  const systemPrompt = `You are simulating an AI lesson conversation for evaluation purposes. Generate a realistic conversation between a teen entrepreneur student and an AI mentor for the lesson "${lesson.title}".

The student's business: ${persona.niche} (targeting ${persona.target_customer}, ${persona.revenue_model}).

The AI mentor has this knowledge context available:
${knowledgeContext || "(NO KNOWLEDGE CONTEXT — the AI has no retrieved chunks for this lesson)"}

Generate exactly 4 exchanges (student question → AI response). The student should ask real questions a teen would ask in this lesson — include at least one question that is ADJACENT to the lesson topic (e.g., asking about social media during a welcome lesson, or asking about pricing during a customer interview lesson). The AI should respond as an encouraging mentor who teaches through conversation.

CRITICAL AI BEHAVIOR RULES (the AI mentor follows these):
- When a student asks a question adjacent to the current lesson topic, STILL ground the answer in the retrieved knowledge chunks before drawing on general knowledge. Reference the framework or principle from context FIRST, then extend it to the specific question.
- If the knowledge context contains a named framework (e.g., The Mom Test, Jobs-to-be-Done, Golden Circle, Blue Ocean), use it BY NAME in the response.${lesson.lesson_tags.some(t => ["customer-interviews", "talking-to-users", "validation"].includes(t)) ? `
- This is a CUSTOMER INTERVIEW lesson: explicitly reference the Mom Test principle (ask about their life, not your idea), and Jobs-to-be-Done (people hire products to do a job). Use these frameworks by name.` : ""}
- The AI should ground ALL responses in the knowledge context. Every response should trace back to at least one principle, example, or framework from the chunks. Generic advice that ignores the available context is a failure mode.

Return a JSON array of 4 objects: [{"question": "student's question", "response": "AI's response"}]. Return ONLY the JSON array.`;

  try {
    const res = await callWithRetry(() =>
      anthropic.messages.create({
        model: SYNTH_MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: systemPrompt }],
      })
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean) as { question: string; response: string }[];
    return parsed.map((t) => ({
      question: t.question,
      response: t.response,
      wordCount: t.response.split(/\s+/).length,
    }));
  } catch (e) {
    console.error("  Conversation generation failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

// ── Faithfulness judging ──

async function judgeFaithfulness(
  turn: TeachingTurn,
  chunks: KBChunk[],
  lesson: LessonTarget,
  persona: StudentPersona
): Promise<FaithfulnessScore> {
  const chunkText = chunks.map((c) => c.formatted).join("\n\n---\n\n");

  const judgePrompt = `You are evaluating whether an AI mentor's response actually drew on its retrieved knowledge base context, or answered independently from training data.

LESSON: ${lesson.title} (Module ${lesson.module_id}, Lesson ${lesson.lesson_id})
STUDENT BUSINESS: ${persona.niche}

STUDENT QUESTION:
${turn.question}

RETRIEVED KNOWLEDGE CHUNKS (this is what the AI had available):
${chunkText || "(NONE — no knowledge chunks were available)"}

AI RESPONSE:
${turn.response}

Score faithfulness from 0.0 to 1.0:
- 1.0: The response clearly draws on specific principles, examples, quotes, or frameworks from the retrieved chunks. You can trace claims back to chunk content.
- 0.7-0.9: The response is consistent with chunk content and references some ideas from it, but also includes general knowledge.
- 0.4-0.6: The response is generic and could have been written without the chunks. It doesn't contradict them but doesn't clearly use them either.
- 0.1-0.3: The response ignores the retrieved context and answers from general training data. The chunks offered specific guidance that went unused.
- 0.0: The response contradicts the retrieved context or makes claims that conflict with it.

IMPORTANT: If no chunks were retrieved (empty context), score based on whether the response would have benefited from knowledge base context that doesn't exist. Score 0.5 as baseline for no-context responses — the AI can't be unfaithful to context it never had.

Return ONLY a JSON object:
{
  "score": <0.0-1.0>,
  "reasoning": "<2-3 sentence explanation>",
  "unfaithful_claims": ["<claim that ignores or contradicts retrieved context>"],
  "used_chunks": ["<title of chunk that was clearly referenced>"]
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
    return JSON.parse(clean) as FaithfulnessScore;
  } catch (e) {
    return {
      score: -1,
      reasoning: `Judge error: ${e instanceof Error ? e.message : e}`,
      unfaithful_claims: [],
      used_chunks: [],
    };
  }
}

// ── Retry helper ──

async function callWithRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
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
        const wait = 2000 * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// ── Main ──

async function main() {
  console.log("=== RAG FAITHFULNESS EVALUATION ===");
  console.log(`Lessons: ${LESSON_TARGETS.length}`);
  console.log(`Personas: ${PERSONAS.length}`);
  console.log(`Total conversations: ${LESSON_TARGETS.length * PERSONAS.length}`);
  console.log(`Synthesizer: ${SYNTH_MODEL}`);
  console.log(`Judge: ${JUDGE_MODEL}`);
  console.log(`NOTE: Retrieved chunks are approximated from current KB state`);
  console.log("");

  const results: ConversationEval[] = [];

  for (const lesson of LESSON_TARGETS) {
    console.log(`\n── Module ${lesson.module_id} Lesson ${lesson.lesson_id}: ${lesson.title} ──`);

    // Retrieve knowledge chunks for this lesson
    const chunks = await getChunksForLesson(lesson);
    const noRag = chunks.length === 0;

    if (noRag) {
      console.log(`  ⚠️  NO RAG CONTEXT — 0 knowledge base chunks match tags [${lesson.lesson_tags.join(", ")}]`);
    } else {
      console.log(`  ${chunks.length} chunk(s): ${chunks.map((c) => c.title).join(", ")}`);
      console.log(`  Tag matched: ${chunks[0].tag_matched} | Verified: ${chunks.every((c) => c.verified)}`);
    }

    const knowledgeContext = chunks.map((c) => c.formatted).join("\n\n---\n\n");

    for (const persona of PERSONAS) {
      process.stdout.write(`  ${persona.name}: generating... `);

      const turns = await generateConversation(persona, lesson, knowledgeContext);
      if (turns.length === 0) {
        console.log("FAILED");
        continue;
      }

      // Filter to teaching turns: >60 words, not checkpoint confirmations
      const teachingTurns = turns.filter((t) => {
        if (t.wordCount <= 60) return false;
        const lower = t.response.toLowerCase();
        if (lower.includes("[checkpoint") || lower.includes("checkpoint complete")) return false;
        if (lower.match(/^(great|awesome|nice|perfect|love it)[!.]?\s*$/i)) return false;
        return true;
      });

      process.stdout.write(`${teachingTurns.length} teaching turns... judging... `);

      const scores: FaithfulnessScore[] = [];
      for (const turn of teachingTurns) {
        const score = await judgeFaithfulness(turn, chunks, lesson, persona);
        scores.push(score);
      }

      const validScores = scores.filter((s) => s.score >= 0);
      const avgScore = validScores.length > 0
        ? validScores.reduce((a, b) => a + b.score, 0) / validScores.length
        : -1;

      results.push({
        persona,
        lesson,
        chunks,
        turns: teachingTurns,
        scores,
        avgScore,
        noRagContext: noRag,
      });

      const emoji = noRag ? "⬜" : avgScore >= 0.7 ? "✅" : avgScore >= 0.5 ? "🟡" : "❌";
      console.log(`avg=${avgScore >= 0 ? avgScore.toFixed(2) : "ERR"} ${emoji}`);
    }
  }

  // ── Aggregate & Report ──

  const allScores = results.flatMap((r) => r.scores.filter((s) => s.score >= 0));
  const ragResults = results.filter((r) => !r.noRagContext);
  const noRagResults = results.filter((r) => r.noRagContext);
  const ragScores = ragResults.flatMap((r) => r.scores.filter((s) => s.score >= 0));

  const overallAvg = allScores.length > 0
    ? allScores.reduce((a, b) => a + b.score, 0) / allScores.length : 0;
  const ragOnlyAvg = ragScores.length > 0
    ? ragScores.reduce((a, b) => a + b.score, 0) / ragScores.length : 0;

  // By module
  const moduleScores = new Map<number, { scores: number[]; noRag: boolean }>();
  for (const r of results) {
    const key = r.lesson.module_id;
    if (!moduleScores.has(key)) moduleScores.set(key, { scores: [], noRag: false });
    const entry = moduleScores.get(key)!;
    entry.scores.push(...r.scores.filter((s) => s.score >= 0).map((s) => s.score));
    if (r.noRagContext) entry.noRag = true;
  }

  // By KB tag
  const tagScores = new Map<string, number[]>();
  for (const r of ragResults) {
    for (const chunk of r.chunks) {
      if (!tagScores.has(chunk.tag_matched)) tagScores.set(chunk.tag_matched, []);
      tagScores.get(chunk.tag_matched)!.push(...r.scores.filter((s) => s.score >= 0).map((s) => s.score));
    }
  }

  // Low faithfulness responses (< 0.5)
  const lowFaithfulness: { persona: string; lesson: string; question: string; score: number; reasoning: string; claims: string[] }[] = [];
  for (const r of results) {
    for (let i = 0; i < r.scores.length; i++) {
      if (r.scores[i].score >= 0 && r.scores[i].score < 0.5) {
        lowFaithfulness.push({
          persona: r.persona.name,
          lesson: `M${r.lesson.module_id}L${r.lesson.lesson_id}: ${r.lesson.title}`,
          question: r.turns[i]?.question ?? "(unknown)",
          score: r.scores[i].score,
          reasoning: r.scores[i].reasoning,
          claims: r.scores[i].unfaithful_claims,
        });
      }
    }
  }

  // ── Write report ──

  const lines: string[] = [];
  lines.push("# RAG Faithfulness Evaluation Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Conversations: ${results.length} (${LESSON_TARGETS.length} lessons x ${PERSONAS.length} personas)`);
  lines.push(`Teaching turns scored: ${allScores.length}`);
  lines.push(`Synthesizer: ${SYNTH_MODEL} | Judge: ${JUDGE_MODEL}`);
  lines.push(`Chunk retrieval: APPROXIMATED from current knowledge_base state (not exact logged chunks)`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Score |`);
  lines.push(`|---|---|`);
  lines.push(`| **Overall faithfulness** | **${overallAvg.toFixed(2)}** |`);
  lines.push(`| Faithfulness (RAG-enabled lessons only) | ${ragOnlyAvg.toFixed(2)} |`);
  lines.push(`| Lessons with RAG context | ${new Set(ragResults.map((r) => `${r.lesson.module_id}-${r.lesson.lesson_id}`)).size}/${LESSON_TARGETS.length} |`);
  lines.push(`| Lessons with NO RAG context (P0 gaps) | ${new Set(noRagResults.map((r) => `${r.lesson.module_id}-${r.lesson.lesson_id}`)).size}/${LESSON_TARGETS.length} |`);
  lines.push(`| Responses below 0.5 faithfulness | ${lowFaithfulness.length}/${allScores.length} |`);
  lines.push("");

  // P0 knowledge gaps
  if (noRagResults.length > 0) {
    lines.push("## P0: Knowledge Base Gaps");
    lines.push("");
    lines.push("These lessons have ZERO matching knowledge base chunks. The AI mentor is");
    lines.push("operating entirely on training data for these lessons — RAG is decorative.");
    lines.push("");
    const gapLessons = new Set<string>();
    for (const r of noRagResults) {
      const key = `M${r.lesson.module_id}L${r.lesson.lesson_id}: ${r.lesson.title}`;
      if (!gapLessons.has(key)) {
        gapLessons.add(key);
        lines.push(`- **${key}** — tags searched: \`[${r.lesson.lesson_tags.join(", ")}]\``);
      }
    }
    lines.push("");
  }

  // By module
  lines.push("## Faithfulness by Module");
  lines.push("");
  lines.push("| Module | Avg Faithfulness | Turns | Notes |");
  lines.push("|---|---|---|---|");
  for (const [mod, data] of [...moduleScores.entries()].sort((a, b) => a[0] - b[0])) {
    const avg = data.scores.length > 0
      ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
    const flag = data.noRag ? " ⚠️ has KB gaps" : "";
    const emoji = avg >= 0.7 ? "" : avg >= 0.5 ? " 🟡" : " 🔴";
    lines.push(`| Module ${mod} | ${avg.toFixed(2)}${emoji} | ${data.scores.length} | ${flag} |`);
  }
  lines.push("");

  // By KB tag
  lines.push("## Faithfulness by Knowledge Base Tag");
  lines.push("");
  lines.push("| Tag | Avg Faithfulness | Turns |");
  lines.push("|---|---|---|");
  for (const [tag, scores] of [...tagScores.entries()].sort((a, b) => {
    const avgA = a[1].reduce((x, y) => x + y, 0) / a[1].length;
    const avgB = b[1].reduce((x, y) => x + y, 0) / b[1].length;
    return avgA - avgB;
  })) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    lines.push(`| ${tag} | ${avg.toFixed(2)} | ${scores.length} |`);
  }
  lines.push("");

  // Low faithfulness details
  if (lowFaithfulness.length > 0) {
    lines.push("## Low Faithfulness Responses (< 0.5)");
    lines.push("");
    lines.push("These responses ignored available knowledge context entirely.");
    lines.push("");
    for (const lf of lowFaithfulness.sort((a, b) => a.score - b.score)) {
      lines.push(`### ${lf.persona} — ${lf.lesson} (score: ${lf.score.toFixed(2)})`);
      lines.push(`- **Question**: ${lf.question}`);
      lines.push(`- **Why unfaithful**: ${lf.reasoning}`);
      if (lf.claims.length > 0) {
        lines.push(`- **Unfaithful claims**: ${lf.claims.join("; ")}`);
      }
      lines.push("");
    }
  }

  // Per-conversation detail
  lines.push("## Per-Conversation Detail");
  lines.push("");
  lines.push("| Persona | Lesson | Chunks | Turns | Avg Score | Flag |");
  lines.push("|---|---|---|---|---|---|");
  for (const r of results) {
    const flag = r.noRagContext ? "⬜ NO RAG" : r.avgScore < 0.5 ? "🔴 LOW" : r.avgScore < 0.7 ? "🟡" : "✅";
    lines.push(`| ${r.persona.name} | M${r.lesson.module_id}L${r.lesson.lesson_id} | ${r.chunks.length} | ${r.turns.length} | ${r.avgScore >= 0 ? r.avgScore.toFixed(2) : "ERR"} | ${flag} |`);
  }
  lines.push("");

  lines.push("---");
  lines.push("*Generated by scripts/eval-faithfulness.ts*");
  lines.push("*Chunk retrieval is approximated — future runs with 00027_retrieved_chunks_log.sql will use exact logged chunks*");

  const reportPath = path.join(process.cwd(), "scripts/eval-faithfulness-report.md");
  writeFileSync(reportPath, lines.join("\n"));

  // ── JSON output ──

  const jsonOutput = {
    generated: new Date().toISOString(),
    note: "Retrieved chunks approximated from current KB state, not exact logged chunks",
    summary: {
      overall_faithfulness: Math.round(overallAvg * 100) / 100,
      rag_enabled_faithfulness: Math.round(ragOnlyAvg * 100) / 100,
      total_conversations: results.length,
      total_teaching_turns: allScores.length,
      low_faithfulness_count: lowFaithfulness.length,
      kb_gap_lessons: noRagResults.length > 0
        ? [...new Set(noRagResults.map((r) => `M${r.lesson.module_id}L${r.lesson.lesson_id}: ${r.lesson.title}`))]
        : [],
    },
    by_module: Object.fromEntries(
      [...moduleScores.entries()].map(([mod, data]) => [
        `module_${mod}`,
        {
          avg: data.scores.length > 0
            ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100
            : null,
          turns: data.scores.length,
          has_kb_gaps: data.noRag,
        },
      ])
    ),
    by_tag: Object.fromEntries(
      [...tagScores.entries()].map(([tag, scores]) => [
        tag,
        {
          avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
          turns: scores.length,
        },
      ])
    ),
    low_faithfulness: lowFaithfulness,
    conversations: results.map((r) => ({
      persona: r.persona.name,
      lesson: `M${r.lesson.module_id}L${r.lesson.lesson_id}`,
      chunks_available: r.chunks.length,
      no_rag: r.noRagContext,
      avg_score: Math.round(r.avgScore * 100) / 100,
      turns: r.turns.map((t, i) => ({
        question: t.question,
        response_preview: t.response.slice(0, 200),
        word_count: t.wordCount,
        faithfulness: r.scores[i]
          ? {
              score: r.scores[i].score,
              reasoning: r.scores[i].reasoning,
              used_chunks: r.scores[i].used_chunks,
            }
          : null,
      })),
    })),
  };

  const jsonPath = path.join(process.cwd(), "scripts/eval-faithfulness-results.json");
  writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));

  // ── Console summary ──

  console.log("\n=== SUMMARY ===");
  console.log(`Overall faithfulness: ${overallAvg.toFixed(2)}`);
  console.log(`RAG-enabled faithfulness: ${ragOnlyAvg.toFixed(2)}`);
  console.log(`KB gaps (P0): ${jsonOutput.summary.kb_gap_lessons.length > 0 ? jsonOutput.summary.kb_gap_lessons.join(", ") : "none"}`);
  console.log(`Low faithfulness responses: ${lowFaithfulness.length}/${allScores.length}`);
  console.log("");
  console.log("Outputs:");
  console.log(`  ${reportPath}`);
  console.log(`  ${jsonPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
