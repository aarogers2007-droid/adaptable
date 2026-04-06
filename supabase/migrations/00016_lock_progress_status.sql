-- SECURITY FIX: Prevent students from directly setting status='completed' or completed_at
-- on their own progress rows via the Supabase client.
--
-- The lesson-chat API route now uses the admin client (service role) for completion updates.
-- This trigger silently reverts status/completed_at changes from non-service-role callers.

CREATE OR REPLACE FUNCTION prevent_student_progress_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
BEGIN
  -- Check the JWT role claim
  BEGIN
    jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  -- Service role can update anything
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For regular authenticated users: silently revert status and completed_at changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status := OLD.status;
  END IF;

  IF OLD.completed_at IS DISTINCT FROM NEW.completed_at THEN
    NEW.completed_at := OLD.completed_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_progress_escalation ON student_progress;

CREATE TRIGGER trg_prevent_progress_escalation
  BEFORE UPDATE ON student_progress
  FOR EACH ROW
  EXECUTE FUNCTION prevent_student_progress_escalation();
