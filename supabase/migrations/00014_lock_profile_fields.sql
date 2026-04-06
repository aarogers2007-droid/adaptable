-- P0 SECURITY FIX: Prevent students from escalating role or changing org_id
-- The existing "Users can update own profile" policy allows updating ANY column,
-- meaning a student can SET role = 'instructor' or change org_id to access other orgs.

-- Drop the permissive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Replace with a restricted update policy that preserves role and org_id
-- Users can update their own profile, but role and org_id must remain unchanged
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    AND (
      org_id IS NOT DISTINCT FROM (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid())
    )
  );

-- Also lock down teacher agency tables: require instructor/org_admin role
-- Currently any authenticated user with teacher_id = auth.uid() can insert

DROP POLICY IF EXISTS "Teachers manage own comments" ON teacher_comments;
CREATE POLICY "Teachers manage own comments"
  ON teacher_comments FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (
    teacher_id = auth.uid()
    AND (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('instructor', 'org_admin')
  );

DROP POLICY IF EXISTS "Teachers manage own flags" ON teacher_flags;
CREATE POLICY "Teachers manage own flags"
  ON teacher_flags FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (
    teacher_id = auth.uid()
    AND (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('instructor', 'org_admin')
  );

DROP POLICY IF EXISTS "Teachers manage own interventions" ON intervention_log;
CREATE POLICY "Teachers manage own interventions"
  ON intervention_log FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (
    teacher_id = auth.uid()
    AND (SELECT p.role FROM profiles p WHERE p.id = auth.uid()) IN ('instructor', 'org_admin')
  );

-- Fix ai_conversations and mentor_checkins: replace FOR ALL with explicit policies (no DELETE)
DROP POLICY IF EXISTS "Students manage own conversations" ON ai_conversations;
CREATE POLICY "Students select own conversations"
  ON ai_conversations FOR SELECT
  USING (student_id = auth.uid());
CREATE POLICY "Students insert own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students update own conversations"
  ON ai_conversations FOR UPDATE
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students see own checkins" ON mentor_checkins;
CREATE POLICY "Students select own checkins"
  ON mentor_checkins FOR SELECT
  USING (student_id = auth.uid());
CREATE POLICY "Students insert own checkins"
  ON mentor_checkins FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Fix reserve_ai_usage: prevent calling with another student's ID
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

  INSERT INTO ai_usage_log (student_id, feature, tokens_used, estimated_cost)
  VALUES (p_student_id, p_feature, 0, 0);

  RETURN true;
END;
$$;
