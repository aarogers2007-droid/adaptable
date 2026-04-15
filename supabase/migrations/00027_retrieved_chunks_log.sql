-- Track which knowledge base chunks were retrieved for each AI call.
-- Enables faithfulness evaluation: did the AI actually use retrieved context?
ALTER TABLE ai_usage_log
  ADD COLUMN IF NOT EXISTS retrieved_chunks jsonb;

-- retrieved_chunks shape: [{ "id": uuid, "title": string, "verified": bool, "tag_matched": string }]
-- null = no RAG retrieval attempted (e.g. ikigai synthesis, checkin)
-- [] = RAG attempted but no chunks found (knowledge gap — P0 finding)

COMMENT ON COLUMN ai_usage_log.retrieved_chunks IS
  'Knowledge base chunks retrieved for this AI call. null = no RAG, [] = RAG returned empty, [{id,title,verified,tag_matched}] = chunks used.';
