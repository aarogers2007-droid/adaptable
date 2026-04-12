-- ════════════════════════════════════════════════════════════════════════
-- 00026_founders_mirror.sql
-- ════════════════════════════════════════════════════════════════════════
--
-- Lane A of the Founder's Mirror implementation plan.
--
-- 1. New table: founder_log_entries — stores reflection prompts/responses
--    triggered by lesson completions, return-from-absence, weekly reviews.
-- 2. New column: student_progress.last_emotion — caches the most recent
--    emotional snapshot for quick reads.
-- 3. Update reserve_ai_usage to support the 'mirror' feature type (5/day).
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. founder_log_entries table ─────────────────────────────────────

create table founder_log_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade not null,
  trigger_type text not null check (trigger_type in ('lesson_completion', 'return_from_absence', 'weekly_review')),
  lesson_id integer,
  mirror_prompt text not null,
  student_response text,
  emotional_snapshot text,
  days_since_last_activity integer,
  created_at timestamptz default now()
);

alter table founder_log_entries enable row level security;

create policy "Students own their reflections"
  on founder_log_entries for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create index idx_founder_log_student_date
  on founder_log_entries(student_id, created_at desc);


-- ── 2. last_emotion column on student_progress ──────────────────────

alter table student_progress add column if not exists last_emotion text;


-- ── 3. Update reserve_ai_usage to support 'mirror' (5/day) ─────────
--
-- The current function (from 00025) uses a CASE statement for per-feature
-- daily limits. We add 'mirror' with a limit of 5.

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
