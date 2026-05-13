-- Migration 00045: Data Flywheel — indexes, views, drop-off function
--
-- Adds indexes for flywheel queries, creates lesson_effectiveness and
-- at_risk_students views, and the update_dropoff_flags() function.

-- ══════════════════════════════════════════════════════════
-- PART 1: Additional indexes for flywheel aggregations
-- ══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_lesson
  ON ai_usage_log(lesson_id, student_id)
  WHERE lesson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_completion
  ON ai_usage_log(completion_flag)
  WHERE completion_flag = true;

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_dropoff
  ON ai_usage_log(drop_off_flag)
  WHERE drop_off_flag = true;

-- ══════════════════════════════════════════════════════════
-- PART 2: Make student_ideas.class_id nullable
-- ══════════════════════════════════════════════════════════

-- Open platform students may not have a class. The original schema
-- required class_id NOT NULL. Relax this constraint.
ALTER TABLE student_ideas
  ALTER COLUMN class_id DROP NOT NULL;

-- ══════════════════════════════════════════════════════════
-- PART 3: Drop-off flag retroactive update function
-- ══════════════════════════════════════════════════════════

-- Sets drop_off_flag = true on the last ai_usage_log row for any
-- lesson session where:
--   - completion_flag is false
--   - The row's created_at is more than 72 hours ago
--   - No newer ai_usage_log row exists for the same student + lesson_id
-- Safe to run repeatedly. Only updates rows where drop_off_flag is false.

CREATE OR REPLACE FUNCTION update_dropoff_flags()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated int;
BEGIN
  WITH last_per_session AS (
    SELECT DISTINCT ON (student_id, lesson_id)
      id, student_id, lesson_id, created_at, completion_flag, drop_off_flag
    FROM ai_usage_log
    WHERE lesson_id IS NOT NULL
    ORDER BY student_id, lesson_id, created_at DESC
  )
  UPDATE ai_usage_log a
  SET drop_off_flag = true
  FROM last_per_session lps
  WHERE a.id = lps.id
    AND lps.completion_flag = false
    AND lps.drop_off_flag = false
    AND lps.created_at < now() - interval '72 hours';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- ══════════════════════════════════════════════════════════
-- PART 4: Lesson effectiveness view
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW lesson_effectiveness AS
SELECT
  l.id AS lesson_id,
  l.title AS lesson_title,
  l.model_override,
  a.org_id,
  COUNT(DISTINCT a.student_id) AS total_sessions,
  COUNT(DISTINCT a.student_id) FILTER (WHERE a.completion_flag)::float
    / NULLIF(COUNT(DISTINCT a.student_id), 0) AS completion_rate,
  COUNT(a.id)::float
    / NULLIF(COUNT(DISTINCT a.student_id), 0) AS avg_exchanges,
  AVG(a.session_duration_seconds) AS avg_session_duration_seconds,
  AVG(a.response_length) AS avg_response_length,
  COUNT(DISTINCT a.student_id) FILTER (WHERE a.drop_off_flag)::float
    / NULLIF(COUNT(DISTINCT a.student_id), 0) AS drop_off_rate
FROM ai_usage_log a
JOIN lessons l ON a.lesson_id::uuid = l.id
WHERE a.lesson_id IS NOT NULL
GROUP BY l.id, l.title, l.model_override, a.org_id;

-- ══════════════════════════════════════════════════════════
-- PART 5: At-risk students view
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW at_risk_students AS

-- Stuck: same lesson >5 days with no new message
SELECT
  p.id AS student_id,
  SPLIT_PART(p.full_name, ' ', 1) AS first_name,
  p.org_id,
  p.grade_level,
  'stuck' AS risk_reason,
  EXTRACT(DAY FROM now() - sp.updated_at)::int AS days_since_last_activity,
  l.title AS current_lesson_title
FROM student_progress sp
JOIN profiles p ON sp.student_id = p.id
JOIN lessons l ON sp.lesson_id = l.id
WHERE sp.status = 'in_progress'
  AND sp.updated_at < now() - interval '5 days'
  AND p.role = 'student'

UNION ALL

-- Not completing: started 3+ lessons, completed 0
SELECT
  p.id,
  SPLIT_PART(p.full_name, ' ', 1),
  p.org_id,
  p.grade_level,
  'not_completing',
  EXTRACT(DAY FROM now() - MAX(sp.updated_at))::int,
  NULL
FROM student_progress sp
JOIN profiles p ON sp.student_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.org_id, p.grade_level
HAVING COUNT(*) >= 3 AND COUNT(*) FILTER (WHERE sp.status = 'completed') = 0

UNION ALL

-- Lapsing: no platform activity in 14+ days
SELECT
  p.id,
  SPLIT_PART(p.full_name, ' ', 1),
  p.org_id,
  p.grade_level,
  'lapsing',
  EXTRACT(DAY FROM now() - MAX(a.created_at))::int,
  NULL
FROM profiles p
JOIN ai_usage_log a ON a.student_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.org_id, p.grade_level
HAVING MAX(a.created_at) < now() - interval '14 days';
