-- Migration 00055: Lesson health scoring and admin review actions
-- Enables the self-improving curriculum engine

-- Add is_active flag to lessons (for deactivation by org admin)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_lessons_active ON lessons(is_active) WHERE is_active = true;

-- Lesson review log (tracks admin actions on lessons)
CREATE TABLE IF NOT EXISTS lesson_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id),
  org_id uuid NOT NULL REFERENCES organizations(id),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL CHECK (action IN ('flagged', 'deactivated', 'reactivated')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_reviews_org ON lesson_reviews(org_id);
CREATE INDEX IF NOT EXISTS idx_lesson_reviews_lesson ON lesson_reviews(lesson_id);

ALTER TABLE lesson_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins manage own reviews" ON lesson_reviews FOR ALL
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'org_admin'));

CREATE POLICY "Platform owners read all reviews" ON lesson_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true));
