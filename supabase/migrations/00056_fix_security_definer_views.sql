-- Migration 00056: Remove SECURITY DEFINER from views
-- These views were bypassing RLS, allowing any authenticated user to see all orgs' data.
-- Recreating as SECURITY INVOKER so they respect the querying user's RLS policies.

-- Drop and recreate at_risk_students view without SECURITY DEFINER
DROP VIEW IF EXISTS public.at_risk_students;

CREATE VIEW public.at_risk_students
WITH (security_invoker = true)
AS
SELECT
  sp.student_id,
  p.full_name AS first_name,
  CASE
    WHEN sp.status = 'in_progress'
      AND sp.updated_at < now() - interval '3 days'
      THEN 'stuck'
    WHEN sp.status = 'in_progress'
      AND NOT EXISTS (
        SELECT 1 FROM ai_usage_log aul
        WHERE aul.student_id = sp.student_id
          AND aul.created_at > now() - interval '3 days'
      )
      THEN 'lapsing'
    ELSE 'not_completing'
  END AS risk_reason,
  EXTRACT(DAY FROM now() - COALESCE(
    (SELECT MAX(aul2.created_at) FROM ai_usage_log aul2 WHERE aul2.student_id = sp.student_id),
    sp.updated_at
  ))::int AS days_since_last_activity,
  l.title AS current_lesson_title,
  p.grade_level
FROM student_progress sp
JOIN profiles p ON p.id = sp.student_id
LEFT JOIN lessons l ON l.id = sp.lesson_id
WHERE sp.status = 'in_progress'
  AND sp.updated_at < now() - interval '3 days';

-- Drop and recreate lesson_effectiveness view without SECURITY DEFINER
DROP VIEW IF EXISTS public.lesson_effectiveness;

CREATE VIEW public.lesson_effectiveness
WITH (security_invoker = true)
AS
SELECT
  aul.lesson_id,
  l.title,
  l.module_sequence,
  l.lesson_sequence,
  COUNT(DISTINCT aul.student_id) AS total_students,
  COUNT(DISTINCT CASE WHEN aul.completion_flag = true THEN aul.student_id END) AS completed_students,
  ROUND(
    COUNT(DISTINCT CASE WHEN aul.completion_flag = true THEN aul.student_id END)::numeric
    / NULLIF(COUNT(DISTINCT aul.student_id), 0) * 100, 1
  ) AS completion_rate,
  ROUND(AVG(aul.input_tokens + aul.output_tokens)::numeric, 0) AS avg_tokens_per_exchange,
  ROUND(AVG(aul.session_duration_seconds)::numeric, 0) AS avg_session_duration_seconds,
  ROUND(AVG(aul.response_length)::numeric, 0) AS avg_response_length,
  COUNT(DISTINCT CASE WHEN aul.drop_off_flag = true THEN aul.student_id END) AS drop_off_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN aul.drop_off_flag = true THEN aul.student_id END)::numeric
    / NULLIF(COUNT(DISTINCT aul.student_id), 0) * 100, 1
  ) AS drop_off_rate
FROM ai_usage_log aul
JOIN lessons l ON l.id::text = aul.lesson_id
WHERE aul.lesson_id IS NOT NULL
GROUP BY aul.lesson_id, l.title, l.module_sequence, l.lesson_sequence;
