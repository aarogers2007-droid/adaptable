-- Migration 00043: Scenario sessions + badges
--
-- Tracks every student attempt at a scenario and their earned badges.
-- student_badges has one row per student per scenario (badge_level updated in place).

-- ══════════════════════════════════════════════════════════
-- PART 1: Student scenario sessions
-- ══════════════════════════════════════════════════════════

CREATE TABLE student_scenario_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  attempt_number int NOT NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  criteria_satisfied text[] DEFAULT '{}',
  approach_summary jsonb,
  conversation jsonb DEFAULT '[]',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  badge_level_awarded int CHECK (badge_level_awarded BETWEEN 1 AND 3)
);

CREATE INDEX idx_scenario_sessions_student
  ON student_scenario_sessions(student_id, scenario_id, attempt_number);

-- RLS
ALTER TABLE student_scenario_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own sessions"
  ON student_scenario_sessions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students insert own sessions"
  ON student_scenario_sessions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own sessions"
  ON student_scenario_sessions FOR UPDATE
  USING (student_id = auth.uid());

-- Admins read all sessions
CREATE POLICY "Admins read all sessions"
  ON student_scenario_sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_platform_owner = true OR role IN ('org_admin', 'instructor')))
  );

-- ══════════════════════════════════════════════════════════
-- PART 2: Student badges
-- ══════════════════════════════════════════════════════════

CREATE TABLE student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  badge_level int NOT NULL CHECK (badge_level BETWEEN 1 AND 3),
  first_earned_at timestamptz DEFAULT now(),
  last_upgraded_at timestamptz,
  UNIQUE (student_id, scenario_id)
);

CREATE INDEX idx_student_badges_student ON student_badges(student_id);

-- RLS
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own badges"
  ON student_badges FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students insert own badges"
  ON student_badges FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own badges"
  ON student_badges FOR UPDATE
  USING (student_id = auth.uid());

-- Admins read all badges
CREATE POLICY "Admins read all badges"
  ON student_badges FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_platform_owner = true OR role IN ('org_admin', 'instructor')))
  );

-- ══════════════════════════════════════════════════════════
-- PART 3: Update leaderboard score trigger for scenarios
-- ══════════════════════════════════════════════════════════

-- Update the existing leaderboard trigger to include scenario completions.
-- Formula: (lessons × 10) + (badges × 5) + (scenarios × 15)
CREATE OR REPLACE FUNCTION update_leaderboard_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id uuid;
  v_lessons int;
  v_badges int;
  v_scenarios int;
  v_score int;
BEGIN
  v_student_id := NEW.student_id;

  SELECT count(*) INTO v_lessons
  FROM student_progress
  WHERE student_id = v_student_id AND status = 'completed';

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

  SELECT count(*) INTO v_scenarios
  FROM student_scenario_sessions
  WHERE student_id = v_student_id AND status = 'completed';

  v_score := (v_lessons * 10) + (v_badges * 5) + (v_scenarios * 15);

  UPDATE profiles SET leaderboard_score = v_score
  WHERE id = v_student_id;

  RETURN NEW;
END;
$$;

-- Trigger on scenario session completion
DROP TRIGGER IF EXISTS trg_leaderboard_score_scenario ON student_scenario_sessions;
CREATE TRIGGER trg_leaderboard_score_scenario
  AFTER INSERT OR UPDATE OF status ON student_scenario_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_leaderboard_score();
