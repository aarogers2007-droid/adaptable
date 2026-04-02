/**
 * Knowledge Base Pipeline
 *
 * Two-agent system that builds a curated knowledge base:
 *
 *   Agent 1 (Researcher)          Agent 2 (Student Challenger)
 *   ─────────────────────         ─────────────────────────────
 *   Search web for best           Read Agent 1's output.
 *   content on a topic.           Ask hard questions a skeptical
 *   Extract principles,           16-year-old would ask.
 *   frameworks, real              Force concrete examples.
 *   examples, quotes.             Translate to plain language.
 *                    ↓                        ↓
 *              ┌──────────────────────────────────┐
 *              │   Structured Knowledge Chunk      │
 *              │   → stored in Supabase + pgvector │
 *              └──────────────────────────────────┘
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface KnowledgeChunk {
  topic: string;
  lesson_tags: string[];
  title: string;
  source_url: string | null;
  source_type: string;
  key_principles: { principle: string; explanation: string }[];
  concrete_examples: { example: string; business_type: string; lesson: string }[];
  quotes: { quote: string; source: string; context: string }[];
  student_friendly_summary: string;
  challenge_qa: { question: string; answer: string }[];
}

/**
 * Agent 1: Researcher
 * Given a topic, searches for and synthesizes the best business education content.
 */
export async function researchTopic(
  topic: string,
  lessonTags: string[],
  webSearchResults: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are an expert business education researcher. Your job is to find and synthesize the BEST thinking on a given business topic from world-class sources: Harvard Business School, Y Combinator, Paul Graham, Reid Hoffman, Guy Kawasaki, How I Built This, Shark Tank, real entrepreneur interviews, academic research, and proven frameworks.

You are building a knowledge base for an AI tutor that teaches teenagers (ages 12-18) entrepreneurship. The tutor needs to give advice grounded in real expertise, not generic platitudes.

For every topic, provide:
1. KEY PRINCIPLES: The 3-5 most important ideas, with specific attribution (who said it, where)
2. CONCRETE EXAMPLES: Real businesses and what they did. Names, numbers, outcomes.
3. MEMORABLE QUOTES: Exact quotes from credible sources that a teenager would remember
4. FRAMEWORKS: Step-by-step mental models or decision frameworks

Be specific. "Price based on value, not cost" is generic. "Patrick Campbell at ProfitWell analyzed 10,000 SaaS companies and found that value-based pricing generates 2x revenue vs cost-plus" is specific.

Return your output as a JSON object matching this structure:
{
  "title": "descriptive title",
  "source_type": "framework|article|lecture|interview|case_study|essay",
  "key_principles": [{"principle": "...", "explanation": "..."}],
  "concrete_examples": [{"example": "...", "business_type": "...", "lesson": "..."}],
  "quotes": [{"quote": "...", "source": "...", "context": "..."}]
}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}
Lesson tags: ${lessonTags.join(", ")}

Here is what I found from web research on this topic:
${webSearchResults}

Now synthesize the BEST insights from these sources and your training knowledge into a structured knowledge chunk. Be specific, cite real people and real businesses. Return ONLY valid JSON.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Agent 2: Student Challenger
 * Reads Agent 1's output and pressure-tests it with hard questions.
 */
export async function challengeContent(
  topic: string,
  researcherOutput: string
): Promise<KnowledgeChunk | null> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a skeptical, smart 16-year-old entrepreneur who has heard a lot of generic business advice and is tired of it. You're reviewing educational content that an AI researcher prepared.

Your job:
1. Read the researcher's output
2. Ask 5 hard questions that a real teenager would ask: "But what if my business is different?", "That example is for a big company, what about someone just starting?", "How do I actually DO this, step by step?"
3. Answer each question yourself using the researcher's content, translating it into plain language
4. Write a student-friendly summary that a 14-year-old could understand and act on
5. Flag anything that sounds generic or unhelpful

Your output must be a JSON object:
{
  "student_friendly_summary": "2-3 paragraph summary in casual, encouraging language. Use 'you' and 'your'. Reference specific examples. No business jargon without explaining it.",
  "challenge_qa": [
    {"question": "hard question a teen would ask", "answer": "concrete, specific answer using the research"}
  ],
  "quality_score": 1-10,
  "flags": ["anything generic or weak that should be improved"]
}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}

Here's what the researcher found:
${researcherOutput}

Now challenge this content. Ask the hard questions. Make it real for a teenager building their first business. Return ONLY valid JSON.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock?.text) return null;

  try {
    const challengeResult = JSON.parse(textBlock.text);
    const researchResult = JSON.parse(researcherOutput);

    // Merge into final knowledge chunk
    const chunk: KnowledgeChunk = {
      topic,
      lesson_tags: [],
      title: researchResult.title ?? topic,
      source_url: null,
      source_type: researchResult.source_type ?? "framework",
      key_principles: researchResult.key_principles ?? [],
      concrete_examples: researchResult.concrete_examples ?? [],
      quotes: researchResult.quotes ?? [],
      student_friendly_summary: challengeResult.student_friendly_summary ?? "",
      challenge_qa: challengeResult.challenge_qa ?? [],
    };

    return chunk;
  } catch {
    return null;
  }
}
