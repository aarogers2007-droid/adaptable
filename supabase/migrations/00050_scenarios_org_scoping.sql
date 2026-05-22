-- Migration 00050: Org-scoped scenarios
--
-- Allows org admins to create scenarios visible only to their org's students.
-- Global scenarios (org_id IS NULL) remain visible to all students.
-- This enables Brand Challenges: sponsor-funded scenarios that produce
-- engagement data valuable to the sponsor.

-- Add org_id to scenarios (nullable = global scenario)
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scenarios_org ON scenarios(org_id);

-- Drop existing policies and replace with org-aware versions
DROP POLICY IF EXISTS "Admins read all active scenarios" ON scenarios;
DROP POLICY IF EXISTS "Students read active scenarios" ON scenarios;
DROP POLICY IF EXISTS "Platform owners manage scenarios" ON scenarios;
DROP POLICY IF EXISTS "Platform owners update scenarios" ON scenarios;

-- Students see global scenarios + their own org's scenarios
CREATE POLICY "Students read accessible scenarios" ON scenarios FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    AND (
      org_id IS NULL
      OR org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Org admins see global scenarios + their own org's scenarios
CREATE POLICY "Org admins read scenarios" ON scenarios FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('org_admin', 'instructor'))
    AND (
      org_id IS NULL
      OR org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Platform owners see everything
CREATE POLICY "Platform owners read all scenarios" ON scenarios FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true)
  );

-- Org admins can create scenarios scoped to their org
CREATE POLICY "Org admins create org scenarios" ON scenarios FOR INSERT
  WITH CHECK (
    org_id IS NOT NULL
    AND org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'org_admin')
  );

-- Org admins can update their own org's scenarios
CREATE POLICY "Org admins update org scenarios" ON scenarios FOR UPDATE
  USING (
    org_id IS NOT NULL
    AND org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'org_admin')
  );

-- Platform owners can still create/update any scenario (including global)
CREATE POLICY "Platform owners manage scenarios" ON scenarios FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true)
  );

CREATE POLICY "Platform owners update scenarios" ON scenarios FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true)
  );

-- Expand industry CHECK to allow custom industries from orgs
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_industry_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_industry_check
  CHECK (industry IN (
    'food', 'retail', 'logistics', 'technology', 'healthcare',
    'finance', 'hospitality', 'education', 'manufacturing',
    'marketing', 'design', 'agriculture', 'entertainment', 'sports',
    'nonprofit', 'environment', 'custom'
  ));

-- Expand rubric criteria limit (sponsor scenarios may have more criteria)
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_rubric_criteria_check;
ALTER TABLE scenarios ADD CONSTRAINT scenarios_rubric_criteria_check
  CHECK (array_length(rubric_criteria, 1) BETWEEN 1 AND 6);
