-- Migration 00038: Multi-Tenant Database Foundation
--
-- Establishes true multi-tenancy with org-level data isolation.
--
-- EXISTING ORG UUIDs (do not create new ones):
--   Adaptable (default): 00000000-0000-0000-0000-000000000001
--   VentureLab:           a0000000-0000-0000-0000-00000000ab01

-- ══════════════════════════════════════════════════════════
-- PART 1: Extend organizations table with new columns
-- ══════════════════════════════════════════════════════════

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS subdomain text,
  ADD COLUMN IF NOT EXISTS branding_config jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rag_namespace text,
  ADD COLUMN IF NOT EXISTS book_rag_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
  ON organizations(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_subdomain
  ON organizations(subdomain) WHERE subdomain IS NOT NULL;

-- ══════════════════════════════════════════════════════════
-- PART 2: Update existing orgs (no new inserts)
-- ══════════════════════════════════════════════════════════

-- Rename "VentureLab Test" → "Adaptable" (internal default org)
UPDATE organizations SET
  name = 'Adaptable',
  slug = 'adaptable',
  rag_namespace = 'adaptable',
  subscription_tier = 'internal'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Update VentureLab org with new fields
UPDATE organizations SET
  slug = 'venturelab',
  rag_namespace = 'venturelab',
  subscription_tier = 'enterprise',
  branding_config = '{"platform_name": "VentureLab"}'::jsonb
WHERE id = 'a0000000-0000-0000-0000-00000000ab01';

-- ══════════════════════════════════════════════════════════
-- PART 3: Add org_id to 25 child tables
-- Default to Adaptable org for all existing rows
-- ══════════════════════════════════════════════════════════

ALTER TABLE class_enrollments
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE student_progress
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE mentor_checkins
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE daily_checkins
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE lesson_decisions
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE business_pitches
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE student_achievements
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE student_card_config
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE founder_log_entries
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE invention_sessions
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE invention_groups
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE teacher_comments
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE teacher_flags
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE intervention_log
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE notification_failures
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE deletion_requests
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE data_access_log
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE student_consent
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE parental_consent_tokens
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE support_conversations
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE support_escalations
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE ai_usage_log
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001';

-- ══════════════════════════════════════════════════════════
-- PART 4: Backfill org_id from parent tables
-- ══════════════════════════════════════════════════════════

-- From profiles.org_id (student_id joins)
UPDATE class_enrollments SET org_id = p.org_id FROM profiles p WHERE class_enrollments.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE student_progress SET org_id = p.org_id FROM profiles p WHERE student_progress.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE ai_conversations SET org_id = p.org_id FROM profiles p WHERE ai_conversations.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE mentor_checkins SET org_id = p.org_id FROM profiles p WHERE mentor_checkins.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE daily_checkins SET org_id = p.org_id FROM profiles p WHERE daily_checkins.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE lesson_decisions SET org_id = p.org_id FROM profiles p WHERE lesson_decisions.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE business_pitches SET org_id = p.org_id FROM profiles p WHERE business_pitches.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE student_achievements SET org_id = p.org_id FROM profiles p WHERE student_achievements.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE student_card_config SET org_id = p.org_id FROM profiles p WHERE student_card_config.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE founder_log_entries SET org_id = p.org_id FROM profiles p WHERE founder_log_entries.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE invention_sessions SET org_id = p.org_id FROM profiles p WHERE invention_sessions.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE student_consent SET org_id = p.org_id FROM profiles p WHERE student_consent.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE parental_consent_tokens SET org_id = p.org_id FROM profiles p WHERE parental_consent_tokens.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE deletion_requests SET org_id = p.org_id FROM profiles p WHERE deletion_requests.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE data_access_log SET org_id = p.org_id FROM profiles p WHERE data_access_log.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE support_conversations SET org_id = p.org_id FROM profiles p WHERE support_conversations.user_id = p.id AND p.org_id IS NOT NULL;
UPDATE support_escalations SET org_id = p.org_id FROM profiles p WHERE support_escalations.user_id = p.id AND p.org_id IS NOT NULL;
UPDATE ai_usage_log SET org_id = p.org_id FROM profiles p WHERE ai_usage_log.student_id = p.id AND p.org_id IS NOT NULL;
UPDATE feedback SET org_id = p.org_id FROM profiles p WHERE feedback.user_id = p.id AND p.org_id IS NOT NULL;

-- From classes.org_id (class_id joins)
UPDATE teacher_comments SET org_id = c.org_id FROM classes c WHERE teacher_comments.class_id = c.id AND c.org_id IS NOT NULL;
UPDATE teacher_flags SET org_id = c.org_id FROM classes c WHERE teacher_flags.class_id = c.id AND c.org_id IS NOT NULL;
UPDATE intervention_log SET org_id = c.org_id FROM classes c WHERE intervention_log.class_id = c.id AND c.org_id IS NOT NULL;
UPDATE invite_codes SET org_id = c.org_id FROM classes c WHERE invite_codes.class_id = c.id AND c.org_id IS NOT NULL;

-- Invention groups via class_code → invite_codes → classes
UPDATE invention_groups ig SET org_id = c.org_id
FROM invite_codes ic JOIN classes c ON ic.class_id = c.id
WHERE ig.class_code = ic.code AND c.org_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════
-- PART 4b: Reassign VENTURE data to VentureLab org
-- ══════════════════════════════════════════════════════════

-- VENTURE class → VentureLab
UPDATE classes SET org_id = 'a0000000-0000-0000-0000-00000000ab01'
WHERE id IN (SELECT class_id FROM invite_codes WHERE code = 'VENTURE');

-- Cascade to child tables
UPDATE class_enrollments SET org_id = 'a0000000-0000-0000-0000-00000000ab01'
WHERE class_id IN (SELECT class_id FROM invite_codes WHERE code = 'VENTURE');

UPDATE invention_sessions SET org_id = 'a0000000-0000-0000-0000-00000000ab01'
WHERE class_code = 'VENTURE';

UPDATE invention_groups SET org_id = 'a0000000-0000-0000-0000-00000000ab01'
WHERE class_code = 'VENTURE';

UPDATE invite_codes SET org_id = 'a0000000-0000-0000-0000-00000000ab01'
WHERE code = 'VENTURE';

-- ══════════════════════════════════════════════════════════
-- PART 5: Indexes on org_id
-- ══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_class_enrollments_org ON class_enrollments(org_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_org ON student_progress(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_org ON ai_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_mentor_checkins_org ON mentor_checkins(org_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_org ON daily_checkins(org_id);
CREATE INDEX IF NOT EXISTS idx_lesson_decisions_org ON lesson_decisions(org_id);
CREATE INDEX IF NOT EXISTS idx_business_pitches_org ON business_pitches(org_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_org ON student_achievements(org_id);
CREATE INDEX IF NOT EXISTS idx_student_card_config_org ON student_card_config(org_id);
CREATE INDEX IF NOT EXISTS idx_founder_log_entries_org ON founder_log_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_invention_sessions_org ON invention_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_invention_groups_org ON invention_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_teacher_comments_org ON teacher_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_teacher_flags_org ON teacher_flags(org_id);
CREATE INDEX IF NOT EXISTS idx_intervention_log_org ON intervention_log(org_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_org ON invite_codes(org_id);
CREATE INDEX IF NOT EXISTS idx_notification_failures_org ON notification_failures(org_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_org ON deletion_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_data_access_log_org ON data_access_log(org_id);
CREATE INDEX IF NOT EXISTS idx_student_consent_org ON student_consent(org_id);
CREATE INDEX IF NOT EXISTS idx_parental_consent_tokens_org ON parental_consent_tokens(org_id);
CREATE INDEX IF NOT EXISTS idx_feedback_org ON feedback(org_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_org ON support_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_support_escalations_org ON support_escalations(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_org ON ai_usage_log(org_id);

-- ══════════════════════════════════════════════════════════
-- PART 6: ai_usage_log data flywheel extensions
-- ══════════════════════════════════════════════════════════

ALTER TABLE ai_usage_log
  ADD COLUMN IF NOT EXISTS response_length integer,
  ADD COLUMN IF NOT EXISTS prompt_length integer,
  ADD COLUMN IF NOT EXISTS session_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS lesson_id text,
  ADD COLUMN IF NOT EXISTS completion_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drop_off_flag boolean NOT NULL DEFAULT false;

-- ══════════════════════════════════════════════════════════
-- PART 7: student_ideas table (class idea feed)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS student_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  idea_title text NOT NULL,
  idea_summary text NOT NULL CHECK (char_length(idea_summary) <= 500),
  ikigai_session_id uuid,
  is_visible_to_class boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_ideas_class ON student_ideas(class_id, is_visible_to_class);
CREATE INDEX IF NOT EXISTS idx_student_ideas_org ON student_ideas(org_id);

ALTER TABLE student_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read visible class ideas"
  ON student_ideas FOR SELECT
  USING (
    is_visible_to_class = true
    AND class_id IN (SELECT class_id FROM class_enrollments WHERE student_id = auth.uid())
  );

CREATE POLICY "Students manage own ideas"
  ON student_ideas FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers read class ideas"
  ON student_ideas FOR SELECT
  USING (
    class_id IN (SELECT id FROM classes WHERE instructor_id = auth.uid())
  );

CREATE POLICY "Org admins read org ideas"
  ON student_ideas FOR SELECT
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'org_admin'
  );

CREATE POLICY "Platform owners read all ideas"
  ON student_ideas FOR SELECT
  USING (
    (SELECT is_platform_owner FROM profiles WHERE id = auth.uid())
  );

-- Feed columns on classes
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS feed_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feed_named_attribution boolean NOT NULL DEFAULT false;

-- Trigger
CREATE TRIGGER trg_student_ideas_updated_at
  BEFORE UPDATE ON student_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
