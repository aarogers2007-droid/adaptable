import { createClient } from "@/lib/supabase/server";

/**
 * Retrieve relevant knowledge for a given topic/question.
 *
 * VERIFIED-FIRST RETRIEVAL: prefers entries with verified=true (the 9
 * citation-clean originals). Only falls back to unverified entries when
 * no verified entries exist for the lesson tag. This protects production
 * from the 29% citation hallucination rate found in the 16 entries seeded
 * by the 2-agent pipeline on 2026-04-07. See scripts/eval-knowledge-base.ts.
 *
 * Once Option B (regeneration with strict no-fabrication prompt) lands and
 * those entries are re-marked verified=true, the fallback path becomes
 * cosmetic and the production retrieval is fully clean.
 */
export async function getRelevantKnowledge(
  lessonTag: string,
  limit = 3
): Promise<string> {
  const supabase = await createClient();

  // Pass 1: verified entries only — citation-clean originals
  let { data: tagResults } = await supabase
    .from("knowledge_base")
    .select(
      "title, key_principles, concrete_examples, quotes, student_friendly_summary, challenge_qa"
    )
    .contains("lesson_tags", [lessonTag])
    .eq("verified", true)
    .limit(limit);

  // Pass 2: fall back to ANY entries if no verified hits exist for this tag.
  // This is "better than empty context" while the unverified entries wait
  // to be regenerated.
  if (!tagResults || tagResults.length === 0) {
    const { data: fallback } = await supabase
      .from("knowledge_base")
      .select(
        "title, key_principles, concrete_examples, quotes, student_friendly_summary, challenge_qa"
      )
      .contains("lesson_tags", [lessonTag])
      .limit(limit);
    tagResults = fallback;
  }

  if (!tagResults || tagResults.length === 0) {
    return "";
  }

  // Format knowledge into context string for the AI
  return tagResults
    .map((chunk) => {
      const principles = (
        chunk.key_principles as { principle: string; explanation: string }[]
      )
        .map((p) => `- ${p.principle}: ${p.explanation}`)
        .join("\n");

      const examples = (
        chunk.concrete_examples as {
          example: string;
          business_type: string;
          lesson: string;
        }[]
      )
        .map((e) => `- ${e.example} (${e.business_type}): ${e.lesson}`)
        .join("\n");

      const quotes = (
        chunk.quotes as { quote: string; source: string }[]
      )
        .map((q) => `- "${q.quote}" — ${q.source}`)
        .join("\n");

      return `## ${chunk.title}

Key Principles:
${principles}

Real Examples:
${examples}

Quotes:
${quotes}

Student Summary: ${chunk.student_friendly_summary}`;
    })
    .join("\n\n---\n\n");
}
