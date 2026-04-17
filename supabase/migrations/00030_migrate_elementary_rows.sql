-- Expand grade_tier from 3 levels to 4 levels (part 2 of 2).
-- Migrate existing 'elementary' rows to 'upper_elementary' (conservative default).
-- This runs in a separate transaction after 00029 commits the new enum values.

UPDATE profiles SET grade_tier = 'upper_elementary' WHERE grade_tier = 'elementary';
UPDATE lessons SET grade_tier = 'upper_elementary' WHERE grade_tier = 'elementary';
UPDATE knowledge_base SET grade_tier = 'upper_elementary' WHERE grade_tier = 'elementary';

-- Note: PostgreSQL doesn't support removing enum values directly.
-- The old 'elementary' value remains in the enum but won't be used.
-- Application code should only reference the 4 active values:
-- lower_elementary, upper_elementary, middle_school, high_school
