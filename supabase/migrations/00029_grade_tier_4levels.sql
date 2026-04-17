-- Expand grade_tier from 3 levels to 4 levels.
-- Split 'elementary' into 'lower_elementary' (K-2) and 'upper_elementary' (3-5).
--
-- Migration strategy: add new values to the enum, migrate existing
-- 'elementary' rows to 'upper_elementary' (conservative default),
-- then remove the old 'elementary' value.

-- Step 1: Add new enum values
ALTER TYPE grade_tier ADD VALUE IF NOT EXISTS 'lower_elementary';
ALTER TYPE grade_tier ADD VALUE IF NOT EXISTS 'upper_elementary';

-- Step 2: Migrate existing 'elementary' rows to 'upper_elementary'
-- (conservative: assume existing elementary students are older elementary)
UPDATE profiles SET grade_tier = 'upper_elementary' WHERE grade_tier = 'elementary';
UPDATE lessons SET grade_tier = 'upper_elementary' WHERE grade_tier = 'elementary';
UPDATE knowledge_base SET grade_tier = 'upper_elementary' WHERE grade_tier = 'elementary';

-- Note: PostgreSQL doesn't support removing enum values directly.
-- The old 'elementary' value remains in the enum but won't be used.
-- Application code should only reference the 4 active values:
-- lower_elementary, upper_elementary, middle_school, high_school
