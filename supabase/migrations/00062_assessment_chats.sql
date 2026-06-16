-- 00062: assessment_chats — transcripts of the founder AI chat at the bottom of
-- /assessment.
--
-- What a candidate asks AJ's AI (and how they think) is often a stronger signal
-- than the form answers. Each turn is one row, keyed by session_id — the SAME id
-- the assessment form uses — so a chat joins to its submission in
-- assessment_submissions on session_id.
--
-- Same posture as assessment_submissions: public/unauthenticated writes via the
-- service-role admin client, RLS on with no client policies. Scoped to org #0.

CREATE TABLE IF NOT EXISTS assessment_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  session_id text,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_chats_org_session
  ON assessment_chats (org_id, session_id, created_at);

ALTER TABLE assessment_chats ENABLE ROW LEVEL SECURITY;
-- No client policies. Service-role admin client writes; platform owner reads.
