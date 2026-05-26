-- Migration 00052: Tenant isolation for scenario sessions and badges
--
-- CRITICAL: student_scenario_sessions and student_badges lack org_id,
-- meaning org admins can read ALL students' sessions/badges across every org.
-- This migration adds org_id, backfills from profiles, and replaces RLS
-- policies with org-scoped versions.

-- ══════════════════════════════════════════════════════════
-- PART 1: Add org_id columns
-- ══════════════════════════════════════════════════════════

ALTER TABLE student_scenario_sessions
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE student_badges
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════
-- PART 2: Backfill org_id from the student's profile
-- ══════════════════════════════════════════════════════════

UPDATE student_scenario_sessions
SET org_id = (SELECT p.org_id FROM profiles p WHERE p.id = student_scenario_sessions.student_id)
WHERE org_id IS NULL;

UPDATE student_badges
SET org_id = (SELECT p.org_id FROM profiles p WHERE p.id = student_badges.student_id)
WHERE org_id IS NULL;

-- ══════════════════════════════════════════════════════════
-- PART 3: Add NOT NULL constraint
-- ══════════════════════════════════════════════════════════
-- Safe after backfill. If any rows have a student_id with no profile.org_id,
-- those are orphan rows and should be investigated separately.

ALTER TABLE student_scenario_sessions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE student_badges ALTER COLUMN org_id SET NOT NULL;

-- ══════════════════════════════════════════════════════════
-- PART 4: Indexes for org-scoped queries
-- ══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_scenario_sessions_org ON student_scenario_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_org ON student_badges(org_id);

-- ══════════════════════════════════════════════════════════
-- PART 5: Replace RLS policies on student_scenario_sessions
-- ══════════════════════════════════════════════════════════

-- Drop existing policies
DROP POLICY IF EXISTS "Students read own sessions" ON student_scenario_sessions;
DROP POLICY IF EXISTS "Students insert own sessions" ON student_scenario_sessions;
DROP POLICY IF EXISTS "Students update own sessions" ON student_scenario_sessions;
DROP POLICY IF EXISTS "Admins read all sessions" ON student_scenario_sessions;

-- Students can only read/write their own sessions
CREATE POLICY "Students read own sessions"
  ON student_scenario_sessions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students insert own sessions"
  ON student_scenario_sessions FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Students update own sessions"
  ON student_scenario_sessions FOR UPDATE
  USING (student_id = auth.uid());

-- Org admins can only read sessions within their org
CREATE POLICY "Org admins read org sessions"
  ON student_scenario_sessions FOR SELECT
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('org_admin', 'instructor')
    )
  );

-- Platform owners can read all sessions
CREATE POLICY "Platform owners read all sessions"
  ON student_scenario_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true)
  );

-- ══════════════════════════════════════════════════════════
-- PART 6: Replace RLS policies on student_badges
-- ══════════════════════════════════════════════════════════

-- Drop existing policies
DROP POLICY IF EXISTS "Students read own badges" ON student_badges;
DROP POLICY IF EXISTS "Students insert own badges" ON student_badges;
DROP POLICY IF EXISTS "Students update own badges" ON student_badges;
DROP POLICY IF EXISTS "Admins read all badges" ON student_badges;

-- Students can only read/write their own badges
CREATE POLICY "Students read own badges"
  ON student_badges FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students insert own badges"
  ON student_badges FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Students update own badges"
  ON student_badges FOR UPDATE
  USING (student_id = auth.uid());

-- Org admins can only read badges within their org
CREATE POLICY "Org admins read org badges"
  ON student_badges FOR SELECT
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('org_admin', 'instructor')
    )
  );

-- Platform owners can read all badges
CREATE POLICY "Platform owners read all badges"
  ON student_badges FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true)
  );
