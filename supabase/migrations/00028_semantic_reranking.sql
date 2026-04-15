-- Semantic re-ranking for knowledge base retrieval.
--
-- The knowledge_base table was created outside the migration system (via seed
-- scripts and manual setup). This migration only adds the vector similarity
-- search function needed for hybrid tag+semantic retrieval. The embedding
-- column (vector(1536)) already exists on the table.
--
-- pgvector is already enabled on this Supabase instance. The CREATE EXTENSION
-- is idempotent and included for migration portability.

CREATE EXTENSION IF NOT EXISTS vector;

-- Similarity search function: takes a query embedding and a set of candidate
-- IDs (from tag-based lookup), returns candidates re-ranked by cosine
-- similarity. Used by getRelevantKnowledgeWithMeta() for hybrid retrieval.
CREATE OR REPLACE FUNCTION match_knowledge_from_candidates(
  query_embedding vector(1536),
  candidate_ids uuid[],
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  title text,
  verified boolean,
  key_principles jsonb,
  concrete_examples jsonb,
  quotes jsonb,
  student_friendly_summary text,
  challenge_qa jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.verified,
    kb.key_principles,
    kb.concrete_examples,
    kb.quotes,
    kb.student_friendly_summary,
    kb.challenge_qa,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.id = ANY(candidate_ids)
    AND kb.embedding IS NOT NULL
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
