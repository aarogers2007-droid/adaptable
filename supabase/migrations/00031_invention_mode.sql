-- Invention Mode — database schema
-- Adds session_type to classes, creates invention_sessions and invention_groups,
-- adds grouping_config to classes, and applies RLS.

------------------------------------------------------------
-- 1. Add session_type to classes
------------------------------------------------------------
-- Determines whether students enter the curriculum flow or the invention flow.
-- Default 'curriculum' preserves all existing behavior.
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS session_type text NOT NULL DEFAULT 'curriculum'
  CHECK (session_type IN ('curriculum', 'invention'));

------------------------------------------------------------
-- 2. Add grouping_config to classes (invention-mode settings)
------------------------------------------------------------
-- JSONB: { group_size: int, grouping_threshold: int (0-100),
--           groups_revealed: bool, co_admin_ids: text[] }
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS grouping_config jsonb;

------------------------------------------------------------
-- 3. Create invention_sessions table
------------------------------------------------------------
-- One row per student per invention-mode class. Stores all five circle
-- responses and the AI-synthesized invention concept.
CREATE TABLE invention_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_code text NOT NULL,

  -- Circle 1: The Wish
  circle_1_category text,
  idea_freetext text,

  -- Circle 2: The Mind
  circle_2_archetype text,

  -- Circle 3: The Lens
  circle_3_chips text[],
  circle_3_freetext text,

  -- Circle 4: The Scale
  circle_4_scale text,

  -- Circle 5: The Voice
  circle_5_voice text[],

  -- AI synthesis output (JSON stored as text)
  synthesized_idea text,

  -- Group assignment (set by grouping algorithm)
  group_number integer,

  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- One session per student per class code
  UNIQUE(student_id, class_code)
);

------------------------------------------------------------
-- 4. Create invention_groups table
------------------------------------------------------------
-- Written by the grouping algorithm. One row per group per class code.
CREATE TABLE invention_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_code text NOT NULL,
  group_number integer NOT NULL,
  student_ids text[] NOT NULL DEFAULT '{}',
  locked boolean NOT NULL DEFAULT false,

  -- Algorithm diagnostics
  composition_log jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(class_code, group_number)
);

------------------------------------------------------------
-- 5. Enable RLS
------------------------------------------------------------
ALTER TABLE invention_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invention_groups ENABLE ROW LEVEL SECURITY;

-- Students can read and write their own invention session
CREATE POLICY "Students read own invention session"
  ON invention_sessions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students insert own invention session"
  ON invention_sessions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own invention session"
  ON invention_sessions FOR UPDATE
  USING (student_id = auth.uid());

-- Instructors can read all invention sessions for their classes
CREATE POLICY "Instructors read class invention sessions"
  ON invention_sessions FOR SELECT
  USING (
    auth_role() = 'instructor'
    AND class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.instructor_id = auth.uid()
    )
  );

-- Org admins can read all invention sessions in their org
CREATE POLICY "Org admins read org invention sessions"
  ON invention_sessions FOR SELECT
  USING (
    auth_role() = 'org_admin'
    AND class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.org_id = auth_org_id()
    )
  );

-- Co-admins can read invention sessions (checked via grouping_config)
CREATE POLICY "Co-admins read invention sessions"
  ON invention_sessions FOR SELECT
  USING (
    class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.grouping_config->>'co_admin_ids' IS NOT NULL
        AND c.grouping_config->'co_admin_ids' ? auth.uid()::text
    )
  );

-- Invention groups: students can read groups for their class code
CREATE POLICY "Students read own class groups"
  ON invention_groups FOR SELECT
  USING (
    class_code IN (
      SELECT is2.class_code FROM invention_sessions is2
      WHERE is2.student_id = auth.uid()
    )
  );

-- Instructors can read and write groups for their classes
CREATE POLICY "Instructors read class groups"
  ON invention_groups FOR SELECT
  USING (
    auth_role() = 'instructor'
    AND class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors write class groups"
  ON invention_groups FOR INSERT
  WITH CHECK (
    auth_role() = 'instructor'
    AND class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors update class groups"
  ON invention_groups FOR UPDATE
  USING (
    auth_role() = 'instructor'
    AND class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.instructor_id = auth.uid()
    )
  );

-- Org admins can read/write all groups in org
CREATE POLICY "Org admins read org groups"
  ON invention_groups FOR SELECT
  USING (
    auth_role() = 'org_admin'
    AND class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.org_id = auth_org_id()
    )
  );

CREATE POLICY "Org admins write org groups"
  ON invention_groups FOR INSERT
  WITH CHECK (
    auth_role() = 'org_admin'
    AND class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.org_id = auth_org_id()
    )
  );

CREATE POLICY "Org admins update org groups"
  ON invention_groups FOR UPDATE
  USING (
    auth_role() = 'org_admin'
    AND class_code IN (
      SELECT ic.code FROM invite_codes ic
      JOIN classes c ON c.id = ic.class_id
      WHERE c.org_id = auth_org_id()
    )
  );
