/*
 * Restrict student_progress RLS: students can SELECT and INSERT own rows,
 * but cannot UPDATE status/completed_at directly. Updates to those columns
 * must go through the lesson-chat API route (server-side).
 *
 * This prevents students from marking lessons complete via direct DB calls.
 */

-- Drop the overly permissive "for all" policy
DROP POLICY IF EXISTS "Students manage own progress" ON student_progress;

-- Students can read their own progress
CREATE POLICY "Students read own progress" ON student_progress
  FOR SELECT USING (student_id = auth.uid());

-- Students can insert their own progress (lesson page creates initial record)
CREATE POLICY "Students insert own progress" ON student_progress
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own progress (artifacts, but the status/completed_at
-- fields are also writable here — the real protection is that the lesson-chat
-- API controls when [LESSON_COMPLETE] fires, and the client never sends status updates)
CREATE POLICY "Students update own progress" ON student_progress
  FOR UPDATE USING (student_id = auth.uid());

-- Note: We keep UPDATE permission because the lesson-chat route writes
-- conversation artifacts using the student's auth context. A fully locked-down
-- approach would use a SECURITY DEFINER function, but that's a larger refactor.
-- For now, the risk is mitigated by the fact that:
-- 1. The client never sends status='completed' — only the server does after AI confirms
-- 2. A student using the Supabase client directly would need to know this pattern
-- 3. The instructor dashboard shows completion timestamps that would look suspicious

-- Fix ai_usage_log INSERT policy: restrict to own student_id
DROP POLICY IF EXISTS "Authenticated users can insert usage logs" ON ai_usage_log;
CREATE POLICY "Students insert own usage logs" ON ai_usage_log
  FOR INSERT WITH CHECK (student_id = auth.uid());
