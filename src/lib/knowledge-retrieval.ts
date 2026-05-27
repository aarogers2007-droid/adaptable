import { createClient } from "@/lib/supabase/server";

/**
 * Hybrid knowledge retrieval: tag-based candidate fetch + semantic re-ranking.
 *
 * Flow:
 *   1. Tag-based lookup: fetch up to 8 candidates matching lesson tags
 *      (verified-first, fallback to unverified)
 *   2. If a student context + message is provided AND candidates have embeddings,
 *      re-rank by cosine similarity to an augmented query embedding
 *   3. Return top 3 re-ranked chunks
 *
 * VERIFIED-FIRST RETRIEVAL: prefers entries with verified=true (the 9
 * citation-clean originals). Only falls back to unverified entries when
 * no verified entries exist for the lesson tag.
 */

/** Metadata about a retrieved chunk, stored in ai_usage_log.retrieved_chunks */
export interface RetrievedChunkMeta {
  id: string;
  title: string;
  verified: boolean;
  tag_matched: string;
  similarity?: number;
}

export interface KnowledgeResult {
  formatted: string;
  chunks: RetrievedChunkMeta[];
}

/** Student context for building the augmented re-ranking query */
export interface StudentContext {
  businessName: string;
  niche: string;
  targetCustomer: string;
  lessonTitle: string;
  moduleName?: string;
  studentMessage: string;
}

// ── Formatting helper (shared by all retrieval paths) ──

interface KBRow {
  id: string;
  title: string;
  verified: boolean;
  key_principles: { principle: string; explanation: string }[];
  concrete_examples: { example: string; business_type: string; lesson: string }[];
  quotes: { quote: string; source: string }[];
  student_friendly_summary: string;
  challenge_qa?: unknown;
}

function formatChunks(rows: KBRow[]): string {
  return rows
    .map((chunk) => {
      const principles = chunk.key_principles
        .map((p) => `- ${p.principle}: ${p.explanation}`)
        .join("\n");
      const examples = chunk.concrete_examples
        .map((e) => `- ${e.example} (${e.business_type}): ${e.lesson}`)
        .join("\n");
      const quotes = chunk.quotes
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

function buildAugmentedQuery(ctx: StudentContext): string {
  const lessonPart = ctx.moduleName
    ? `Current lesson: ${ctx.lessonTitle} in ${ctx.moduleName}.`
    : `Current lesson: ${ctx.lessonTitle}.`;
  return `Student is building ${ctx.businessName}, a ${ctx.niche} serving ${ctx.targetCustomer}. ${lessonPart} Question: ${ctx.studentMessage}`;
}

// ── Embedding helper ──

async function getQueryEmbedding(text: string): Promise<number[] | null> {
  // Dynamic import so the openai package is only loaded when re-ranking fires
  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI();
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (e) {
    // If OpenAI key is missing or API fails, fall back to tag-only retrieval
    console.warn("[knowledge-retrieval] Embedding failed, falling back to tag-only:", e instanceof Error ? e.message : e);
    return null;
  }
}

// ── Main retrieval function ──

const TAG_CANDIDATE_LIMIT = 8; // Widen initial fetch for meaningful re-ranking
const RERANK_RETURN_LIMIT = 3; // Return top 3 after re-ranking

/**
 * Retrieve relevant knowledge with optional semantic re-ranking.
 *
 * @param lessonTag - Tag to match against knowledge_base.lesson_tags
 * @param studentCtx - If provided, re-rank candidates by semantic similarity
 *   to the augmented query (student context + message). If omitted, returns
 *   tag-matched results without re-ranking (backward compatible).
 */
export async function getRelevantKnowledgeWithMeta(
  lessonTag: string,
  studentCtx?: StudentContext,
  orgId?: string
): Promise<KnowledgeResult> {
  const supabase = await createClient();

  // ── Step 1: Tag-based candidate fetch (verified-first) ──

  const selectFields = "id, title, verified, key_principles, concrete_examples, quotes, student_friendly_summary, challenge_qa";

  let verifiedQuery = supabase
    .from("knowledge_base")
    .select(selectFields)
    .contains("lesson_tags", [lessonTag])
    .eq("verified", true)
    .limit(TAG_CANDIDATE_LIMIT);
  if (orgId) verifiedQuery = verifiedQuery.eq("org_id", orgId);

  let { data: candidates } = await verifiedQuery;

  if (!candidates || candidates.length === 0) {
    let fallbackQuery = supabase
      .from("knowledge_base")
      .select(selectFields)
      .contains("lesson_tags", [lessonTag])
      .limit(TAG_CANDIDATE_LIMIT);
    if (orgId) fallbackQuery = fallbackQuery.eq("org_id", orgId);

    const { data: fallback } = await fallbackQuery;
    candidates = fallback;
  }

  if (!candidates || candidates.length === 0) {
    return { formatted: "", chunks: [] };
  }

  // ── Step 2: Semantic re-ranking (if student context provided) ──

  let rankedRows: (KBRow & { similarity?: number })[] = candidates as KBRow[];
  let reranked = false;

  if (studentCtx && candidates.length > RERANK_RETURN_LIMIT) {
    const augmentedQuery = buildAugmentedQuery(studentCtx);
    const queryEmbedding = await getQueryEmbedding(augmentedQuery);

    if (queryEmbedding) {
      const candidateIds = candidates.map((c) => (c as KBRow).id);

      const { data: rerankedData, error } = await supabase.rpc(
        "match_knowledge_from_candidates",
        {
          query_embedding: JSON.stringify(queryEmbedding),
          candidate_ids: candidateIds,
          match_count: RERANK_RETURN_LIMIT,
          ...(orgId ? { filter_org_id: orgId } : {}),
        }
      );

      if (!error && rerankedData && rerankedData.length > 0) {
        rankedRows = rerankedData as (KBRow & { similarity: number })[];
        reranked = true;
      }
      // If RPC fails (e.g., no embeddings stored), fall through to tag-only
    }
  }

  // If not re-ranked, truncate to return limit
  if (!reranked) {
    rankedRows = rankedRows.slice(0, RERANK_RETURN_LIMIT);
  }

  // ── Step 3: Format and return ──

  const chunks: RetrievedChunkMeta[] = rankedRows.map((c) => ({
    id: c.id,
    title: c.title,
    verified: c.verified,
    tag_matched: lessonTag,
    similarity: c.similarity,
  }));

  const formatted = formatChunks(rankedRows);

  return { formatted, chunks };
}

/**
 * Backward-compatible wrapper that returns only the formatted string.
 * Uses tag-only retrieval (no re-ranking) for callers that don't pass
 * student context.
 */
export async function getRelevantKnowledge(
  lessonTag: string,
  _limit = 3,
  orgId?: string
): Promise<string> {
  const result = await getRelevantKnowledgeWithMeta(lessonTag, undefined, orgId);
  return result.formatted;
}
