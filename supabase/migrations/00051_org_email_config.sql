-- Per-org email sender configuration.
-- When set, crisis alerts (and other transactional emails) are sent
-- from the org's own verified domain instead of the platform default.
-- Both columns are nullable; NULL means "use platform default."

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sender_email text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sender_domain text;
