-- 00061: assessment_submissions — the one-link intern assessment at /assessment.
--
-- A single public page captures everything (a drawing + written answers) and
-- submits it here. Scoped to Adaptable's own org row (org #0). Same posture as
-- faq_leads: public/unauthenticated writes via the service-role client, RLS on
-- with no client policies.

CREATE TABLE IF NOT EXISTS assessment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  session_id text,
  name text NOT NULL,
  email text,
  drawing_svg text,          -- the rendered drawing as standalone SVG markup
  answers jsonb,             -- { kid, truth, arena, arena_proof, surprise }
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_org_created
  ON assessment_submissions (org_id, created_at DESC);

ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
-- No client policies. Service-role admin client writes; platform owner reads.
