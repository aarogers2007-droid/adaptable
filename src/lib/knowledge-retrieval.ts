import { createClient } from "@/lib/supabase/server";

/**
 * Retrieve relevant knowledge for a given topic/question.
 * Uses lesson tag matching first, then falls back to semantic search.
 */
export async function getRelevantKnowledge(
  lessonTag: string,
  limit = 3
): Promise<string> {
  const supabase = await createClient();

  // Tag-based retrieval (fast, precise)
  const { data: tagResults } = await supabase
    .from("knowledge_base")
    .select(
      "title, key_principles, concrete_examples, quotes, student_friendly_summary, challenge_qa"
    )
    .contains("lesson_tags", [lessonTag])
    .limit(limit);

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
