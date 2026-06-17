-- 00063: lock is_platform_owner against self-update (cross-tenant privilege escalation)
--
-- CRITICAL FIX. is_platform_owner was added to profiles in migration 00033,
-- AFTER the field-lock UPDATE policy (00024) was written. That policy's WITH
-- CHECK locks `role` and `org_id` but never got updated to lock the new
-- is_platform_owner column. Result: any authenticated user could run
--   UPDATE profiles SET is_platform_owner = true WHERE id = auth.uid()
-- and the WITH CHECK passed (id matches, role/org_id unchanged). They then
-- inherit every platform-owner RLS exemption: read ALL orgs' knowledge_base
-- and lessons (00054), scenarios (00046/50/52), subscriptions (00049),
-- support chat (00035), and trigger ingestion for any org. Full multi-tenant
-- data breach.
--
-- FIX: lock is_platform_owner the same recursion-safe way role/org_id are
-- locked — via a SECURITY DEFINER helper (bypasses RLS, so no policy
-- recursion on profiles; see 00024 for why inline subqueries can't be used).

CREATE OR REPLACE FUNCTION auth_is_platform_owner()
RETURNS boolean AS $$
  SELECT is_platform_owner FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = auth_role()
    AND org_id IS NOT DISTINCT FROM auth_org_id()
    AND is_platform_owner IS NOT DISTINCT FROM auth_is_platform_owner()
  );
