-- Migration 00047: Student response time tracking
--
-- Captures the exact milliseconds between the AI finishing its response
-- and the student sending their next message. This is the purest measure
-- of engagement: how long did the student spend reading, thinking, and
-- formulating their response?

ALTER TABLE ai_usage_log
  ADD COLUMN IF NOT EXISTS student_response_time_ms int;

-- Index for engagement analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_response_time
  ON ai_usage_log(student_id, lesson_id, student_response_time_ms)
  WHERE student_response_time_ms IS NOT NULL;
