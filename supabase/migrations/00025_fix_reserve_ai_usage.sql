-- ════════════════════════════════════════════════════════════════════════
-- 00025_fix_reserve_ai_usage.sql
-- ════════════════════════════════════════════════════════════════════════
--
-- The reserve_ai_usage function from migration 00014 has a column mismatch
-- bug. It tries to INSERT INTO ai_usage_log with these columns:
--   (student_id, feature, tokens_used, estimated_cost)
--
-- But the real ai_usage_log schema is:
--   (id, student_id, feature, model, input_tokens, output_tokens,
--    estimated_cost_usd, created_at)
--
-- The function fails at runtime with Postgres error 42703 ("column
-- 'tokens_used' of relation 'ai_usage_log' does not exist") on every call.
--
-- The Next.js route in src/app/api/lesson-chat/route.ts swallows the RPC
-- error via `reservation?.[0] ?? { status: "ok" }` and proceeds as if rate
-- limiting passed. Result: rate limiting has been completely silently
-- non-functional for every student since 00014 was applied.
--
-- THE FIX: rewrite the function to insert into the real columns, with
-- placeholder zero values for the token counts (the route updates them
-- with real counts after streaming completes).
-- ════════════════════════════════════════════════════════════════════════

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

  -- Use the real columns. model is required (NOT NULL); pass a placeholder
  -- that the route updates with the actual model after the stream completes.
  INSERT INTO ai_usage_log (student_id, feature, model, input_tokens, output_tokens, estimated_cost_usd)
  VALUES (p_student_id, p_feature, 'pending', 0, 0, 0);

  RETURN true;
END;
$$;
