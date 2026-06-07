/*
 * SQL aggregation functions to replace JS-side dedup on ai_usage_log.
 * Supabase PostgREST caps results at 1000 rows by default, which means
 * the JS-side COUNT(DISTINCT) and MAX() patterns silently return wrong
 * results for orgs with >1000 log entries.
 *
 * These RPCs do the aggregation server-side where row limits don't apply.
 */

-- Count distinct active students in a time window for an org
CREATE OR REPLACE FUNCTION count_active_students(p_org_id uuid, p_since timestamptz)
RETURNS integer AS $$
  SELECT COALESCE(COUNT(DISTINCT student_id)::integer, 0)
  FROM ai_usage_log
  WHERE org_id = p_org_id AND created_at >= p_since;
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- Get last active timestamp per student for an org
CREATE OR REPLACE FUNCTION student_last_active(p_org_id uuid)
RETURNS TABLE(student_id uuid, last_active timestamptz) AS $$
  SELECT student_id, MAX(created_at) as last_active
  FROM ai_usage_log
  WHERE org_id = p_org_id
  GROUP BY student_id;
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- Count AI exchanges per student for an org
CREATE OR REPLACE FUNCTION student_exchange_counts(p_org_id uuid)
RETURNS TABLE(student_id uuid, exchange_count bigint) AS $$
  SELECT student_id, COUNT(*) as exchange_count
  FROM ai_usage_log
  WHERE org_id = p_org_id
  GROUP BY student_id;
$$ LANGUAGE sql STABLE SECURITY INVOKER;
