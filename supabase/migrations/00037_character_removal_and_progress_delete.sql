-- Migration 00037: Character system removal + student_progress DELETE policy
--
-- 1. Drop all character system tables (FK order: children first)
-- 2. Add DELETE policy to student_progress for service_role only

-- ── Character system removal ──
DROP TABLE IF EXISTS student_unlocked_characters CASCADE;
DROP TABLE IF EXISTS character_handoffs CASCADE;
DROP TABLE IF EXISTS character_consistency_log CASCADE;
DROP TABLE IF EXISTS character_system_config CASCADE;

-- ── student_progress DELETE policy ──
-- Closes the RLS gap that caused Fresh Start to silently fail.
-- Only service_role (admin client) can delete progress rows.
CREATE POLICY "service_role_delete_student_progress"
  ON student_progress FOR DELETE
  TO service_role
  USING (true);
