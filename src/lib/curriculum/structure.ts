import "server-only";

/**
 * CURRICULUM KNOWLEDGE STRUCTURER
 *
 * Converts raw curriculum chunks into structured knowledge_base entries
 * using Claude Sonnet. Groups chunks by source file and proximity, then
 * extracts key principles, examples, quotes, and summaries.
 *
 * Critical: The system prompt instructs Claude to ONLY use information
 * from the provided text — never supplement with external knowledge.
 * This upholds the Factual Floor standard.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { MODELS } from "@/lib/model-config";

// ── Types ──

export interface ChunkWithMeta {
  content: string;
  sourceFile: string;
  sourcePage: number | null;
  chunkIndex: number;
}

interface StructuredEntry {
  title: string;
  topic: string;
  key_principles: { principle: string; explanation: string }[];
  concrete_examples: { example: string; business_type: string; lesson: string }[];
  quotes: { quote: string; source: string }[];
  student_friendly_summary: string;
  lesson_tags: string[];
}

// ── Config ──

const TARGET_GROUPS_MIN = 15;
const TARGET_GROUPS_MAX = 25;
const MAX_CHUNKS_PER_GROUP = 8;

// ── System prompt ──

const STRUCTURE_SYSTEM_PROMPT = `You are a curriculum analyst for an entrepreneurship education platform.
Your job is to extract structured knowledge from curriculum text provided by an organization.

CRITICAL RULES:
1. ONLY use information that is EXPLICITLY stated in the provided text.
2. NEVER supplement with external knowledge, examples, or statistics.
3. NEVER invent examples, case studies, or quotes that are not in the text.
4. If the text doesn't contain quotes, return an empty quotes array.
5. If the text doesn't contain concrete examples, return an empty examples array.
6. Principles should be directly derived from what the text teaches.
7. The student_friendly_summary should rephrase the text's content for a teenager.

You must respond with valid JSON matching this schema:
{
  "title": "A concise title for this knowledge entry",
  "topic": "The broad topic area (e.g., 'marketing', 'finance', 'ideation')",
  "key_principles": [
    { "principle": "Name of principle", "explanation": "Explanation from the text" }
  ],
  "concrete_examples": [
    { "example": "Description", "business_type": "Type", "lesson": "What it teaches" }
  ],
  "quotes": [
    { "quote": "Exact quote from the text", "source": "Attribution from the text" }
  ],
  "student_friendly_summary": "A 2-3 sentence summary a 14-year-old would understand",
  "lesson_tags": ["tag-1", "tag-2"]
}

For lesson_tags, use the format provided in the user message. Tags should reflect
the topic areas covered (e.g., "marketing-basics", "customer-discovery", "pricing").`;

// ── Grouping logic ──

function groupChunks(chunks: ChunkWithMeta[]): ChunkWithMeta[][] {
  // Group by source file first
  const byFile = new Map<string, ChunkWithMeta[]>();
  for (const chunk of chunks) {
    const existing = byFile.get(chunk.sourceFile) ?? [];
    existing.push(chunk);
    byFile.set(chunk.sourceFile, existing);
  }

  // Within each file, group consecutive chunks
  const groups: ChunkWithMeta[][] = [];

  for (const [, fileChunks] of byFile) {
    // Sort by chunk index
    const sorted = [...fileChunks].sort((a, b) => a.chunkIndex - b.chunkIndex);

    let currentGroup: ChunkWithMeta[] = [];
    for (const chunk of sorted) {
      currentGroup.push(chunk);
      if (currentGroup.length >= MAX_CHUNKS_PER_GROUP) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
  }

  // If we have too many groups, merge small adjacent ones
  if (groups.length > TARGET_GROUPS_MAX) {
    const merged: ChunkWithMeta[][] = [];
    let current = groups[0];
    for (let i = 1; i < groups.length; i++) {
      if (current.length + groups[i].length <= MAX_CHUNKS_PER_GROUP) {
        current = [...current, ...groups[i]];
      } else {
        merged.push(current);
        current = groups[i];
      }
    }
    merged.push(current);
    return merged;
  }

  // If we have too few groups, split large ones
  if (groups.length < TARGET_GROUPS_MIN && groups.length > 0) {
    const expanded: ChunkWithMeta[][] = [];
    const targetSplit = Math.ceil(TARGET_GROUPS_MIN / groups.length);
    for (const group of groups) {
      if (group.length > 1 && expanded.length < TARGET_GROUPS_MIN) {
        const splitSize = Math.max(1, Math.ceil(group.length / targetSplit));
        for (let i = 0; i < group.length; i += splitSize) {
          expanded.push(group.slice(i, i + splitSize));
        }
      } else {
        expanded.push(group);
      }
    }
    return expanded;
  }

  return groups;
}

// ── Main function ──

/**
 * Structure raw curriculum chunks into knowledge_base entries.
 * Groups chunks by source file and proximity, then uses Claude Sonnet
 * to extract structured knowledge from each group.
 */
export async function structureKnowledge(
  orgId: string,
  chunks: ChunkWithMeta[],
  onProgress: (msg: string) => void
): Promise<void> {
  if (chunks.length === 0) {
    onProgress("No chunks to structure");
    return;
  }

  const anthropic = new Anthropic();
  const admin = createAdminClient();
  const orgShort = orgId.slice(0, 8);

  const groups = groupChunks(chunks);
  onProgress(`Grouped ${chunks.length} chunks into ${groups.length} knowledge entries`);

  let moduleCounter = 1;
  let entryCounter = 0;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const combinedText = group
      .map((c) => `[Source: ${c.sourceFile}, Page ${c.sourcePage ?? "N/A"}]\n${c.content}`)
      .join("\n\n---\n\n");

    const tagPrefix = `org-${orgShort}-module-${moduleCounter}`;
    const lessonNum = (i % 5) + 1; // Rotate lesson numbers within modules
    if (lessonNum === 1 && i > 0) moduleCounter++;

    const userPrompt = `Extract structured knowledge from the following curriculum text.

Use the tag prefix "${tagPrefix}-lesson-${lessonNum}" as the base for lesson_tags.
Add 2-3 additional descriptive tags based on the content topics.

CURRICULUM TEXT:
${combinedText}`;

    try {
      const response = await anthropic.messages.create({
        model: MODELS.SONNET,
        max_tokens: 2048,
        system: STRUCTURE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      const rawJson = textBlock?.text ?? "";

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, rawJson];
      const parsed: StructuredEntry = JSON.parse(jsonMatch[1]?.trim() ?? rawJson.trim());

      // Ensure the org-specific tag is included
      const tags = parsed.lesson_tags ?? [];
      if (!tags.some((t) => t.startsWith(`org-${orgShort}`))) {
        tags.unshift(`${tagPrefix}-lesson-${lessonNum}`);
      }

      const { error } = await admin.from("knowledge_base").insert({
        org_id: orgId,
        title: parsed.title,
        topic: parsed.topic,
        key_principles: parsed.key_principles,
        concrete_examples: parsed.concrete_examples,
        quotes: parsed.quotes,
        student_friendly_summary: parsed.student_friendly_summary,
        lesson_tags: tags,
        verified: false, // Must pass eval harness before verified=true
      });

      if (error) {
        console.error(`[curriculum/structure] DB insert failed for group ${i}:`, error.message);
        onProgress(`Warning: Failed to save entry ${i + 1} — ${error.message}`);
      } else {
        entryCounter++;
        onProgress(`Structured entry ${entryCounter}/${groups.length}: "${parsed.title}"`);
      }
    } catch (err) {
      console.error(`[curriculum/structure] Failed to structure group ${i}:`, err instanceof Error ? err.message : err);
      onProgress(`Warning: Failed to process group ${i + 1} — skipping`);
    }
  }

  onProgress(`Completed: ${entryCounter} knowledge base entries created`);
}
