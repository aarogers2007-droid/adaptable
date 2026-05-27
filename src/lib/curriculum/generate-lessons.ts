import "server-only";

/**
 * CURRICULUM LESSON GENERATOR
 *
 * Reads structured knowledge_base entries for an org and generates
 * lesson proposals using Claude Sonnet. Produces LessonPlan-shaped
 * JSON that can be reviewed and approved by org admins.
 *
 * Critical: Lessons are generated ONLY from the provided curriculum
 * content. The system prompt explicitly forbids adding external knowledge.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { MODELS } from "@/lib/model-config";
import type { LessonPlan } from "@/lib/lesson-plans";

// ── System prompt ──

const LESSON_GEN_SYSTEM_PROMPT = `You are a lesson plan architect for an entrepreneurship education platform.
Your job is to design conversational lessons from structured curriculum content.

CRITICAL RULES:
1. Generate lessons ONLY from the provided curriculum content. Do not add external knowledge.
2. Use {{niche}}, {{business_name}}, {{target_customer}}, {{name}} as personalization tokens
   where the student's business context should appear.
3. Each lesson should teach ONE clear concept through Socratic conversation.
4. Checkpoints are questions the AI mentor asks to gauge understanding — they should
   feel natural, not like a quiz.
5. The opener should hook the student and connect to their specific business.
6. mastery_signal describes what a GOOD student response looks like (for AI evaluation).
7. Lessons should build on each other within a module.

Respond with valid JSON matching this schema:
{
  "lessons": [
    {
      "module_name": "Module title",
      "module_sequence": 1,
      "lesson_sequence": 1,
      "title": "Lesson title",
      "objective": "What the student should be able to do after",
      "opener": "The AI mentor's first message (use {{name}}, {{business_name}}, {{niche}} tokens)",
      "checkpoints": [
        {
          "id": "unique-id",
          "concept": "What this checkpoint tests",
          "question": "The question the AI asks (use personalization tokens)",
          "mastery_signal": "What a good response demonstrates"
        }
      ],
      "completion_criteria": "What mastery looks like for this lesson",
      "personalization_hooks": ["niche", "business_name", "target_customer"],
      "lesson_tags": ["tag-1", "tag-2"]
    }
  ]
}

Design 8-15 lessons organized into 2-4 modules. Each lesson should have 2-4 checkpoints.
Modules should follow a logical learning progression (e.g., understand → apply → evaluate).`;

// ── Main function ──

/**
 * Generate lesson proposals from an org's knowledge base entries.
 * Reads all KB entries for the org, sends them to Claude Sonnet,
 * and inserts the generated lessons into curriculum_draft_lessons.
 */
export async function generateLessons(
  orgId: string,
  onProgress: (msg: string) => void
): Promise<number> {
  const admin = createAdminClient();
  const anthropic = new Anthropic();

  // Fetch all knowledge_base entries for this org
  const { data: kbEntries, error: fetchError } = await admin
    .from("knowledge_base")
    .select("title, topic, key_principles, concrete_examples, quotes, student_friendly_summary, lesson_tags")
    .eq("org_id", orgId)
    .order("created_at");

  if (fetchError || !kbEntries || kbEntries.length === 0) {
    onProgress("No knowledge base entries found — cannot generate lessons");
    return 0;
  }

  onProgress(`Found ${kbEntries.length} knowledge base entries — generating lesson proposals...`);

  // Format KB entries for the prompt
  const kbSummary = kbEntries
    .map((entry, i) => {
      const principles = (entry.key_principles as { principle: string; explanation: string }[])
        .map((p) => `  - ${p.principle}: ${p.explanation}`)
        .join("\n");
      const examples = (entry.concrete_examples as { example: string; business_type: string; lesson: string }[])
        .map((e) => `  - ${e.example} (${e.business_type})`)
        .join("\n");

      return `### Entry ${i + 1}: ${entry.title}
Topic: ${entry.topic}
Tags: ${(entry.lesson_tags as string[]).join(", ")}
Summary: ${entry.student_friendly_summary}
Key Principles:
${principles}
Examples:
${examples}`;
    })
    .join("\n\n---\n\n");

  const userPrompt = `Design a complete lesson plan curriculum from the following knowledge base entries.
Each lesson should map to specific knowledge base entries via lesson_tags.

Use the existing lesson_tags from the entries to link lessons to their source content.

KNOWLEDGE BASE CONTENT:
${kbSummary}`;

  try {
    const response = await anthropic.messages.create({
      model: MODELS.SONNET,
      max_tokens: 8192,
      system: LESSON_GEN_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const rawJson = textBlock?.text ?? "";

    // Extract JSON from response
    const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, rawJson];
    const parsed: { lessons: GeneratedLesson[] } = JSON.parse(jsonMatch[1]?.trim() ?? rawJson.trim());

    if (!parsed.lessons || parsed.lessons.length === 0) {
      onProgress("AI returned no lessons — check knowledge base content quality");
      return 0;
    }

    onProgress(`Generated ${parsed.lessons.length} lesson proposals — saving to database...`);

    let savedCount = 0;

    for (const lesson of parsed.lessons) {
      // Build the full LessonPlan shape
      const lessonPlan: Omit<LessonPlan, "lesson_id" | "module_id"> & {
        lesson_id: number;
        module_id: number;
      } = {
        lesson_id: lesson.lesson_sequence,
        module_id: lesson.module_sequence,
        title: lesson.title,
        objective: lesson.objective,
        opener: lesson.opener,
        checkpoints: lesson.checkpoints.map((cp, idx) => ({
          id: cp.id || `${lesson.module_sequence}-${lesson.lesson_sequence}-${idx + 1}`,
          concept: cp.concept,
          question: cp.question,
          mastery_signal: cp.mastery_signal,
        })),
        completion_criteria: lesson.completion_criteria,
        personalization_hooks: lesson.personalization_hooks,
        lesson_tags: lesson.lesson_tags,
      };

      const { error: insertError } = await admin
        .from("curriculum_draft_lessons")
        .insert({
          org_id: orgId,
          module_name: lesson.module_name,
          module_sequence: lesson.module_sequence,
          lesson_sequence: lesson.lesson_sequence,
          title: lesson.title,
          ai_generated_plan: lessonPlan,
          lesson_tags: lesson.lesson_tags,
          status: "draft",
        });

      if (insertError) {
        console.error(`[curriculum/generate-lessons] Insert failed for "${lesson.title}":`, insertError.message);
        onProgress(`Warning: Failed to save "${lesson.title}" — ${insertError.message}`);
      } else {
        savedCount++;
      }
    }

    onProgress(`Saved ${savedCount}/${parsed.lessons.length} lesson proposals`);
    return savedCount;
  } catch (err) {
    console.error("[curriculum/generate-lessons] Generation failed:", err instanceof Error ? err.message : err);
    onProgress(`Error: Lesson generation failed — ${err instanceof Error ? err.message : "unknown error"}`);
    return 0;
  }
}

// ── Internal types ──

interface GeneratedLesson {
  module_name: string;
  module_sequence: number;
  lesson_sequence: number;
  title: string;
  objective: string;
  opener: string;
  checkpoints: {
    id: string;
    concept: string;
    question: string;
    mastery_signal: string;
  }[];
  completion_criteria: string;
  personalization_hooks: string[];
  lesson_tags: string[];
}
