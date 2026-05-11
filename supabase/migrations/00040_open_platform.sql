-- Migration 00040: Open Platform — grade_level, leaderboard_score, triggers
--
-- Students can now access the curriculum without a class code.
-- Grade level drives AI adaptation and leaderboard filtering.
-- Leaderboard score is denormalized on profiles for fast ranking queries.

-- ══════════════════════════════════════════════════════════
-- PART 1: Add grade_level to profiles
-- ══════════════════════════════════════════════════════════

-- Separate from grade_tier (which drives AI language adaptation).
-- grade_level is the student's self-reported school level.
-- Default 'middle' — most common VentureLab cohort.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS grade_level text DEFAULT 'middle';

-- Backfill from existing grade_tier where possible
UPDATE profiles SET grade_level = CASE
  WHEN grade_tier IN ('lower_elementary', 'upper_elementary') THEN 'elementary'
  WHEN grade_tier = 'middle_school' THEN 'middle'
  WHEN grade_tier = 'high_school' THEN 'high'
  ELSE 'middle'
END
WHERE grade_level = 'middle'; -- only update defaults, not manually set values

-- ══════════════════════════════════════════════════════════
-- PART 2: Add leaderboard_score denormalized column
-- ══════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS leaderboard_score int NOT NULL DEFAULT 0;

-- Index for fast leaderboard queries: org + grade + score descending
CREATE INDEX IF NOT EXISTS idx_profiles_leaderboard
  ON profiles(org_id, grade_level, leaderboard_score DESC)
  WHERE role = 'student';

-- ══════════════════════════════════════════════════════════
-- PART 3: Leaderboard score trigger
-- ══════════════════════════════════════════════════════════

-- Recomputes leaderboard_score from student_progress + student_achievements.
-- Formula: (lessons_completed × 10) + (badge_points × 5)
-- scenarios_completed × 15 will be added when the scenario system ships.
CREATE OR REPLACE FUNCTION update_leaderboard_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id uuid;
  v_lessons int;
  v_badges int;
  v_score int;
BEGIN
  -- Determine which student to update
  v_student_id := NEW.student_id;

  -- Count completed lessons
  SELECT count(*) INTO v_lessons
  FROM student_progress
  WHERE student_id = v_student_id AND status = 'completed';

  -- Sum badge points (bronze=1, silver=2, gold=3)
  SELECT COALESCE(sum(
    CASE tier
      WHEN 'bronze' THEN 1
      WHEN 'silver' THEN 2
      WHEN 'gold' THEN 3
      ELSE 0
    END
  ), 0) INTO v_badges
  FROM student_achievements
  WHERE student_id = v_student_id;

  -- Compute score (scenarios × 15 added later)
  v_score := (v_lessons * 10) + (v_badges * 5);

  -- Update denormalized score
  UPDATE profiles SET leaderboard_score = v_score
  WHERE id = v_student_id;

  RETURN NEW;
END;
$$;

-- Trigger on lesson completion (INSERT or UPDATE on student_progress)
DROP TRIGGER IF EXISTS trg_leaderboard_score_progress ON student_progress;
CREATE TRIGGER trg_leaderboard_score_progress
  AFTER INSERT OR UPDATE OF status ON student_progress
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_leaderboard_score();

-- Trigger on badge earned (INSERT on student_achievements)
DROP TRIGGER IF EXISTS trg_leaderboard_score_achievement ON student_achievements;
CREATE TRIGGER trg_leaderboard_score_achievement
  AFTER INSERT ON student_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_score();

-- ══════════════════════════════════════════════════════════
-- PART 4: Make teacher_alerts.class_id nullable
-- ══════════════════════════════════════════════════════════

-- Students can now exist without a class. Alerts for classless
-- students store class_id = NULL and route to the org admin.
ALTER TABLE teacher_alerts
  ALTER COLUMN class_id DROP NOT NULL;
