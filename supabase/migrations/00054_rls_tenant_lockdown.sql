-- Migration 00054: Lock down RLS policies for multi-tenant isolation
-- Fixes 3 tables where any authenticated user could read all orgs' data

-- ═══════════════════════════════════════════════════════════════
-- 1. KNOWLEDGE_BASE: restrict reads to own org's entries
-- ═══════════════════════════════════════════════════════════════

-- Drop the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON knowledge_base;

-- Students read their own org's knowledge base
CREATE POLICY "Students read own org knowledge base" ON knowledge_base FOR SELECT
  USING (
    org_id IS NULL  -- legacy global entries (Adaptable default)
    OR org_id = '00000000-0000-0000-0000-000000000001'  -- Adaptable default org (available to all)
    OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND org_id IS NOT NULL)
  );

-- Platform owners read all
CREATE POLICY "Platform owners read all knowledge base" ON knowledge_base FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true));

-- ═══════════════════════════════════════════════════════════════
-- 2. LESSONS: restrict reads to own org's lessons
-- ═══════════════════════════════════════════════════════════════

-- Drop the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can read lessons" ON lessons;

-- Students read their own org's lessons (or Adaptable default for orgs using default curriculum)
CREATE POLICY "Students read own org lessons" ON lessons FOR SELECT
  USING (
    org_id IS NULL  -- legacy entries without org_id
    OR org_id = '00000000-0000-0000-0000-000000000001'  -- Adaptable default lessons (available to default-curriculum orgs)
    OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND org_id IS NOT NULL)
  );

-- Platform owners read all
CREATE POLICY "Platform owners read all lessons" ON lessons FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_owner = true));

-- ═══════════════════════════════════════════════════════════════
-- 3. INVITE_CODES: restrict reads to own org's codes
-- ═══════════════════════════════════════════════════════════════

-- Drop the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can read invite codes" ON invite_codes;

-- Users can only read invite codes for classes in their org
CREATE POLICY "Users read own org invite codes" ON invite_codes FOR SELECT
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      JOIN profiles p ON p.org_id = c.org_id
      WHERE p.id = auth.uid()
    )
  );

-- Keep the existing public validation policy for unauthenticated code entry
-- (students need to validate a code before signing in, via /go page)
-- The existing INSERT/UPDATE policies via RPC (reserve_ai_usage pattern) are unaffected.

-- ═══════════════════════════════════════════════════════════════
-- 4. STUDENT_ACHIEVEMENTS: fix NULL-unsafe org comparison
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Org members read achievements" ON student_achievements;

CREATE POLICY "Org members read achievements" ON student_achievements FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.org_id = p2.org_id
      WHERE p1.id = auth.uid()
      AND p2.id = student_achievements.student_id
      AND p1.org_id IS NOT NULL
      AND p2.org_id IS NOT NULL
    )
  );
