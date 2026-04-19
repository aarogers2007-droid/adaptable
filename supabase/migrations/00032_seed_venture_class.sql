-- Seed the VENTURE class code for the May 13 VentureLab invention event.
--
-- This creates:
--   1. A VentureLab organization (if it doesn't exist)
--   2. An Invention Mode class under that org
--   3. The VENTURE invite code pointing to that class
--
-- NOTE: instructor_id is set to a placeholder. After AJ's account exists,
-- run: UPDATE classes SET instructor_id = '<aj_user_id>' WHERE name = 'VentureLab Invention Day';
-- Then update grouping_config co_admin_ids with both AJ and Cristal's UUIDs.

-- 1. Create organization
INSERT INTO organizations (id, name)
VALUES ('a0000000-0000-0000-0000-venturelab01', 'VentureLab')
ON CONFLICT (id) DO NOTHING;

-- 2. Create the invention class
-- instructor_id uses a placeholder; update after real account exists.
-- We cannot reference a non-existent profile, so we skip the FK check
-- by deferring this step if no admin profile exists yet.
DO $$
DECLARE
  _admin_id uuid;
  _class_id uuid := 'c0000000-0000-0000-0000-invention001';
BEGIN
  -- Try to find an existing org_admin or instructor for VentureLab
  SELECT id INTO _admin_id
  FROM profiles
  WHERE role IN ('instructor', 'org_admin')
  LIMIT 1;

  -- If no admin exists yet, use a placeholder approach:
  -- create the class only if we have a valid instructor_id
  IF _admin_id IS NULL THEN
    RAISE NOTICE 'No admin profile found. Run this migration again after creating an admin account, or manually insert the class.';
    RETURN;
  END IF;

  INSERT INTO classes (id, org_id, instructor_id, name, description, session_type, grouping_config)
  VALUES (
    _class_id,
    'a0000000-0000-0000-0000-venturelab01',
    _admin_id,
    'VentureLab Invention Day',
    'May 13 invention event — 165 middle school students',
    'invention',
    jsonb_build_object(
      'group_size', 5,
      'grouping_threshold', 80,
      'groups_revealed', false,
      'co_admin_ids', jsonb_build_array()
    )
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. Create the VENTURE invite code
  INSERT INTO invite_codes (code, class_id, created_by, max_uses, current_uses)
  VALUES ('VENTURE', _class_id, _admin_id, 200, 0)
  ON CONFLICT (code) DO NOTHING;
END $$;
