-- Migration 00034: Add generated_card JSONB column to invention_sessions
--
-- Stores the AI-generated archetype card content for each student.
-- Nullable — null means card not yet generated.
-- Existing rows are unaffected (column defaults to null).
--
-- Schema of the JSONB object:
-- {
--   "title": "The Frontier",
--   "description": "...",
--   "insights": { "wish": "...", "mind": "...", "lens": "...", "scale": "...", "voice": "..." },
--   "shareable_slug": "abc123xyz",
--   "generated_at": "2026-05-02T...",
--   "model_used": "claude-haiku-4-5-20251001",
--   "grade_tier": "high_school"
-- }

ALTER TABLE invention_sessions
  ADD COLUMN IF NOT EXISTS generated_card JSONB DEFAULT NULL;

-- Index on shareable_slug for fast public URL lookups.
-- Extract the slug from the JSONB and index it where non-null.
CREATE INDEX IF NOT EXISTS idx_invention_sessions_shareable_slug
  ON invention_sessions (( generated_card->>'shareable_slug' ))
  WHERE generated_card IS NOT NULL;

-- Platform owner needs full read access on invention_sessions for backfill.
-- Without this, backfillClassCards queries return zero rows.
DROP POLICY IF EXISTS "Platform owner full read on invention_sessions" ON invention_sessions;
CREATE POLICY "Platform owner full read on invention_sessions"
  ON invention_sessions FOR SELECT
  USING (
    (SELECT is_platform_owner FROM profiles WHERE id = auth.uid())
  );

-- Update reserve_ai_usage to add 'card' feature with daily limit of 1.
-- One card per student per 24 hours. Combined with application-level
-- idempotency (return existing card if already generated), this means
-- one card per student ever in practice.
CREATE OR REPLACE FUNCTION reserve_ai_usage(
  p_student_id uuid,
  p_feature text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
  v_limit int;
BEGIN
  -- Prevent calling with another user's ID
  IF p_student_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot reserve usage for another user';
  END IF;

  -- Get feature limit
  SELECT CASE p_feature
    WHEN 'guide' THEN 100
    WHEN 'lesson' THEN 200
    WHEN 'chat' THEN 100
    WHEN 'mirror' THEN 5
    WHEN 'card' THEN 1
    ELSE 50
  END INTO v_limit;

  -- Atomic check-and-increment
  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text || p_feature));

  SELECT count(*) INTO v_count
  FROM ai_usage_log
  WHERE student_id = p_student_id
    AND feature = p_feature
    AND created_at > now() - interval '24 hours';

  IF v_count >= v_limit THEN
    RETURN false;
  END IF;

  -- Insert reservation row (model updated by the application after generation)
  INSERT INTO ai_usage_log (student_id, feature, model, input_tokens, output_tokens, estimated_cost_usd)
  VALUES (p_student_id, p_feature, 'pending', 0, 0, 0);

  RETURN true;
END;
$$;
