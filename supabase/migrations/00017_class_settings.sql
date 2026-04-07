-- Per-class teacher settings
-- Allows teachers to disable streaks (and future toggles) for their entire class.
-- Some communities object to streak gamification — this gives the teacher control.

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS streaks_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN classes.streaks_enabled IS
  'When false, students in this class do not see streak badges or fire emojis. Default: true.';
