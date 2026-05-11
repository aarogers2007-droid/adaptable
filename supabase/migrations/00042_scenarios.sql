-- Migration 00042: Scenarios table
--
-- Business challenge scenarios that students can browse and complete.
-- Each scenario selects 1-3 rubric criteria from the universal rubric bank.

CREATE TABLE scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  situation text NOT NULL,
  industry text NOT NULL CHECK (industry IN (
    'food', 'retail', 'logistics', 'technology', 'healthcare',
    'finance', 'hospitality', 'education', 'manufacturing'
  )),
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  rubric_criteria text[] NOT NULL CHECK (
    array_length(rubric_criteria, 1) BETWEEN 1 AND 3
  ),
  is_sponsored boolean DEFAULT false,
  sponsor_name text,
  sponsor_logo_url text,
  sponsor_context text,
  badge_name text NOT NULL,
  badge_icon text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_scenarios_active ON scenarios(is_active, industry);

-- RLS
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Platform owners and org admins can read all active scenarios
CREATE POLICY "Admins read all active scenarios"
  ON scenarios FOR SELECT
  USING (
    is_active = true
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true)
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('org_admin', 'instructor'))
    )
  );

-- Students can read active scenarios (limited view enforced at query level)
CREATE POLICY "Students read active scenarios"
  ON scenarios FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
  );

-- Only platform owners can insert/update scenarios
CREATE POLICY "Platform owners manage scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true)
  );

CREATE POLICY "Platform owners update scenarios"
  ON scenarios FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true)
  );
