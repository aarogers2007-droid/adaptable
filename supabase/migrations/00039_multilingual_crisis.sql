-- Migration 00039: Multilingual crisis detection support
--
-- Adds region and org_admin_alert_email to organizations
-- for international crisis resource routing.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS region text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS org_admin_alert_email text;
