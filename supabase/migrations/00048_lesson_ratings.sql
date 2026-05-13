-- Migration 00048: Student rating widget
--
-- Captures star ratings (1-5) from students across lesson chat,
-- scenario chat, and AI guide. No UPDATE or DELETE — one and done.

CREATE TABLE lesson_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type text NOT NULL CHECK (context_type IN ('lesson', 'scenario', 'guide')),
  context_id uuid,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lesson_ratings_student ON lesson_ratings(student_id);

ALTER TABLE lesson_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students insert own ratings"
  ON lesson_ratings FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students read own ratings"
  ON lesson_ratings FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins read org ratings"
  ON lesson_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_p
      JOIN profiles student_p ON student_p.id = lesson_ratings.student_id
      WHERE admin_p.id = auth.uid()
        AND (admin_p.is_platform_owner = true
          OR (admin_p.role IN ('org_admin', 'instructor') AND admin_p.org_id = student_p.org_id))
    )
  );
