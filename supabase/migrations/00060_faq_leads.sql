-- 00060: faq_leads — the /ask capture + intel store.
--
-- The public /ask Spokesperson captures a lead at peak interest: first name
-- (required), email/org/note optional, plus the conversation transcript so AJ
-- has the intel (what they cared about). Scoped to Adaptable's own org row
-- (org #0) so it rides the multi-tenant rails and can become a per-org product
-- surface later without a rewrite.

CREATE TABLE IF NOT EXISTS faq_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  session_id text,
  name text NOT NULL,
  email text,
  org_name text,
  note text,
  transcript jsonb,          -- the Q&A so far (the intel). Attacker-controlled
                             -- text: render ONLY in an escaped admin view.
  consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_leads_org_created ON faq_leads (org_id, created_at DESC);

-- RLS on, no client policies. The service-role admin client (used by
-- /api/ask-lead) writes; reads happen through a platform-owner admin view later.
ALTER TABLE faq_leads ENABLE ROW LEVEL SECURITY;

-- Retention: drop transcript bodies after 180 days (keep the lead row + name).
-- Schedule via pg_cron or a Vercel cron route (deferred — see TODOS).
CREATE OR REPLACE FUNCTION purge_old_faq_lead_transcripts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE faq_leads SET transcript = NULL
  WHERE transcript IS NOT NULL AND created_at < now() - interval '180 days';
$$;
