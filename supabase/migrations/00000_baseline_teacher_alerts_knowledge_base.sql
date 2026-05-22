-- Baseline migration for tables created via Supabase Dashboard.
-- These tables exist in prod but had no committed migration.
-- This migration makes them reproducible on a fresh DB.
--
-- Tables: teacher_alerts, knowledge_base
-- Source: schema dump from prod on 2026-05-22

-- ═══════════════════════════════════════════════════════════
-- teacher_alerts — crisis detection, content flags, stuck/inactive alerts
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS teacher_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  context jsonb,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  crisis_type text,
  severity_at_creation text,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id),
  resolution_action text,
  resolution_notes text,
  notified_at timestamptz,
  notification_channel text,
  notification_failed boolean DEFAULT false
);

ALTER TABLE teacher_alerts ENABLE ROW LEVEL SECURITY;

-- Instructors see alerts for their own classes
CREATE POLICY "Instructors see class alerts" ON teacher_alerts FOR SELECT
  USING (class_id IN (
    SELECT classes.id FROM classes WHERE classes.instructor_id = auth.uid()
  ));

-- Instructors can acknowledge/resolve alerts for their classes
CREATE POLICY "Instructors acknowledge alerts" ON teacher_alerts FOR UPDATE
  USING (class_id IN (
    SELECT classes.id FROM classes WHERE classes.instructor_id = auth.uid()
  ));

-- Org admins see all alerts for their org's classes
CREATE POLICY "Org admins see org alerts" ON teacher_alerts FOR SELECT
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      WHERE c.org_id = (SELECT profiles.org_id FROM profiles WHERE profiles.id = auth.uid())
    )
    AND (SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = 'org_admin'
  );

-- System (service role) inserts alerts
CREATE POLICY "System inserts alerts" ON teacher_alerts FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_teacher_alerts_student ON teacher_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_alerts_class ON teacher_alerts(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_alerts_unacked ON teacher_alerts(class_id) WHERE acknowledged = false;

-- ═══════════════════════════════════════════════════════════
-- knowledge_base — RAG content for AI mentor lesson context
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  lesson_tags text[] NOT NULL DEFAULT '{}',
  title text NOT NULL,
  source_url text,
  source_type text NOT NULL,
  key_principles jsonb NOT NULL DEFAULT '[]',
  concrete_examples jsonb NOT NULL DEFAULT '[]',
  quotes jsonb NOT NULL DEFAULT '[]',
  student_friendly_summary text NOT NULL,
  challenge_qa jsonb NOT NULL DEFAULT '[]',
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  grade_tier grade_tier NOT NULL DEFAULT 'high_school',
  verified boolean NOT NULL DEFAULT false
);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read knowledge base entries
CREATE POLICY "Authenticated users can read knowledge base" ON knowledge_base FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING gin(lesson_tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_verified ON knowledge_base(verified) WHERE verified = true;
