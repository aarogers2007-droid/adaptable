-- Expand grade_tier from 3 levels to 4 levels (part 1 of 2).
-- Split 'elementary' into 'lower_elementary' (K-2) and 'upper_elementary' (3-5).
--
-- PostgreSQL requires new enum values to be committed before they can
-- be used in DML statements. The UPDATE statements are in migration 00030.

ALTER TYPE grade_tier ADD VALUE IF NOT EXISTS 'lower_elementary';
ALTER TYPE grade_tier ADD VALUE IF NOT EXISTS 'upper_elementary';
