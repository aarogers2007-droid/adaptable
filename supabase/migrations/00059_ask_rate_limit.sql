-- 00059: Rate limiting for the public /ask endpoint (anonymous, cost-bounded).
--
-- The /ask page is a PUBLIC, unauthenticated AI chat surface. Every message
-- costs money, so it must be bounded against per-session abuse, per-IP abuse,
-- and (the real cost ceiling) rotating-IP / botnet abuse via a global cap.
--
-- reserve_ai_usage CANNOT be reused: it enforces p_student_id = auth.uid(),
-- and there is no authenticated user here. This mirrors that function's atomic
-- advisory-lock pattern, keyed on an IP hash + ephemeral session id instead.

CREATE TABLE IF NOT EXISTS ask_rate_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ask_rate_created ON ask_rate_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ask_rate_ip_time ON ask_rate_events (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ask_rate_session_time ON ask_rate_events (session_id, created_at DESC);

-- RLS on, no policies = no client access. The service-role admin client
-- (used by /api/ask-chat) bypasses RLS.
ALTER TABLE ask_rate_events ENABLE ROW LEVEL SECURITY;

-- Atomic check-and-reserve. Returns one of:
--   'ok'          slot reserved (a row was inserted)
--   'session_cap' per-session message cap hit
--   'ip_cap'      per-IP daily cap hit
--   'global_cap'  global daily cap hit (the cost ceiling)
-- On any unexpected error it RAISEs, and the caller treats that as a denial
-- (fail closed).
CREATE OR REPLACE FUNCTION reserve_ask_usage(
  p_ip_hash text,
  p_session_id text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_count int;
  v_ip_count int;
  v_global_count int;
  c_session_cap CONSTANT int := 8;
  c_ip_cap CONSTANT int := 30;
  c_global_cap CONSTANT int := 750;
BEGIN
  -- Serialize on one global key so the global cap count is exact. Traffic on a
  -- public sales page is low and capped at a few hundred/day, so a single lock
  -- is fine and keeps the ceiling precise.
  PERFORM pg_advisory_xact_lock(hashtext('ask_rate_limit'));

  SELECT count(*) INTO v_session_count
  FROM ask_rate_events
  WHERE session_id = p_session_id
    AND created_at > now() - interval '24 hours';
  IF v_session_count >= c_session_cap THEN
    RETURN 'session_cap';
  END IF;

  SELECT count(*) INTO v_ip_count
  FROM ask_rate_events
  WHERE ip_hash = p_ip_hash
    AND created_at > now() - interval '24 hours';
  IF v_ip_count >= c_ip_cap THEN
    RETURN 'ip_cap';
  END IF;

  SELECT count(*) INTO v_global_count
  FROM ask_rate_events
  WHERE created_at > now() - interval '24 hours';
  IF v_global_count >= c_global_cap THEN
    RETURN 'global_cap';
  END IF;

  INSERT INTO ask_rate_events (ip_hash, session_id) VALUES (p_ip_hash, p_session_id);
  RETURN 'ok';
END;
$$;

-- Housekeeping: drop events older than 48h (only the last 24h is ever counted).
CREATE OR REPLACE FUNCTION cleanup_old_ask_rate_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM ask_rate_events WHERE created_at < now() - interval '48 hours';
$$;
