-- ════════════════════════════════════════════════════════════════════════
-- 00024_fix_profile_rls_recursion.sql
-- ════════════════════════════════════════════════════════════════════════
--
-- CRITICAL BUG FIX: Migration 00014_lock_profile_fields.sql introduced an
-- RLS UPDATE policy on `profiles` whose WITH CHECK clause contained an
-- inline subquery against `profiles`:
--
--   WITH CHECK (
--     ...
--     AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
--     AND (org_id IS NOT DISTINCT FROM (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()))
--   )
--
-- That inline subquery itself triggers RLS on `profiles`, which triggers
-- another subquery, which triggers another RLS check... Postgres aborts
-- with error 42P17: "infinite recursion detected in policy for relation
-- profiles".
--
-- Every authenticated UPDATE on profiles has been silently failing with a
-- 500 error since 00014 was applied. The Next.js server actions catch the
-- error but the wizard's handleConfirm fallthrough re-routes the student
-- back to /onboarding anyway, causing the "I'm in" → wizard restart bug
-- and leaving every recent profile with NULL business_idea / NULL ikigai_draft.
--
-- THE FIX: replace the inline subqueries with calls to the existing
-- auth_role() and auth_org_id() helpers from 00002_rls.sql. Those are
-- SECURITY DEFINER functions, so they bypass RLS — no recursion possible.
--
-- The security guarantee is identical: students still can't change their
-- own role or org_id. The check is just expressed via a function call
-- instead of an inline subquery.
-- ════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = auth_role()
    AND org_id IS NOT DISTINCT FROM auth_org_id()
  );
