-- Migration 00046: Tighten admin RLS on student_scenario_sessions
--
-- The original "Admins read all sessions" policy allowed any instructor
-- or org_admin to read ALL sessions across ALL orgs. This replaces it
-- with an org-scoped policy: admins can only see sessions belonging to
-- students in their own org. Platform owners see all.

DROP POLICY IF EXISTS "Admins read all sessions" ON student_scenario_sessions;

CREATE POLICY "Admins read org sessions"
  ON student_scenario_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_p
      JOIN profiles student_p ON student_p.id = student_scenario_sessions.student_id
      WHERE admin_p.id = auth.uid()
        AND (admin_p.role IN ('org_admin', 'instructor') OR admin_p.is_platform_owner = true)
        AND (admin_p.org_id = student_p.org_id OR admin_p.is_platform_owner = true)
    )
  );

-- Same fix for student_badges
DROP POLICY IF EXISTS "Admins read all badges" ON student_badges;

CREATE POLICY "Admins read org badges"
  ON student_badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_p
      JOIN profiles student_p ON student_p.id = student_badges.student_id
      WHERE admin_p.id = auth.uid()
        AND (admin_p.role IN ('org_admin', 'instructor') OR admin_p.is_platform_owner = true)
        AND (admin_p.org_id = student_p.org_id OR admin_p.is_platform_owner = true)
    )
  );
