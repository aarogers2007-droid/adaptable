-- Database-backed rate limiting for parent PIN verification
-- Replaces in-memory Map that was ineffective on serverless

CREATE TABLE IF NOT EXISTS parent_pin_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by token_hash + time window
CREATE INDEX idx_pin_attempts_token_time ON parent_pin_attempts (token_hash, attempted_at DESC);

-- Auto-cleanup: delete attempts older than 1 hour (no need to keep them)
-- Run this periodically or via a cron job
CREATE OR REPLACE FUNCTION cleanup_old_pin_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM parent_pin_attempts WHERE attempted_at < now() - interval '1 hour';
$$;

-- RLS: no direct access from clients. All access goes through admin client in server actions.
ALTER TABLE parent_pin_attempts ENABLE ROW LEVEL SECURITY;
-- No policies = no client access (admin client bypasses RLS)
