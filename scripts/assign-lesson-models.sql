-- Per-lesson model assignments (updated 2026-05-15)
-- Sonnet lessons: model_override = NULL (use platform default)
-- Haiku lessons: model_override = 'claude-haiku-4-5-20251001'
-- Mini removed: checkpoint marking unreliable (sim-all-lessons.ts, 0/3 across all personas)
--
-- Run against production after migration 00036 is confirmed live.

-- FORMER MINI → NOW HAIKU (3 lessons, switched 2026-05-15)
UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 3 AND lesson_sequence = 3; -- Designing Your First Impression

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 4 AND lesson_sequence = 2; -- Social Media for Service Business

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 5 AND lesson_sequence = 3; -- Reading Simple Financials

-- HAIKU (14 lessons total, including 3 former Mini above)
UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 1 AND lesson_sequence = 1; -- Welcome to Adaptable

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 2 AND lesson_sequence = 2; -- What Did You Learn?

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 3 AND lesson_sequence = 1; -- Brand Identity and Voice

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 3 AND lesson_sequence = 2; -- Naming Your Business

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 4 AND lesson_sequence = 1; -- Zero-Budget Marketing

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 4 AND lesson_sequence = 3; -- Word of Mouth and Referrals

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 5 AND lesson_sequence = 1; -- Understanding Your Costs

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 6 AND lesson_sequence = 1; -- Shipping Before You're Ready

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 6 AND lesson_sequence = 2; -- Handling Your First Customer

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 6 AND lesson_sequence = 3; -- Getting Feedback

UPDATE lessons SET model_override = 'claude-haiku-4-5-20251001'
  WHERE module_sequence = 6 AND lesson_sequence = 4; -- What to Do After Your First Sale

-- SONNET (8 lessons) — explicitly set to NULL (platform default)
UPDATE lessons SET model_override = NULL
  WHERE module_sequence = 1 AND lesson_sequence = 2; -- What Makes a Good Niche?

UPDATE lessons SET model_override = NULL
  WHERE module_sequence = 1 AND lesson_sequence = 3; -- Research Your Competition

UPDATE lessons SET model_override = NULL
  WHERE module_sequence = 1 AND lesson_sequence = 4; -- Define Your Target Customer

UPDATE lessons SET model_override = NULL
  WHERE module_sequence = 2 AND lesson_sequence = 1; -- The Customer Interview

UPDATE lessons SET model_override = NULL
  WHERE module_sequence = 2 AND lesson_sequence = 3; -- Set Your Price

UPDATE lessons SET model_override = NULL
  WHERE module_sequence = 2 AND lesson_sequence = 4; -- Your First 3 Customers

UPDATE lessons SET model_override = NULL
  WHERE module_sequence = 4 AND lesson_sequence = 4; -- Writing Your First Pitch

UPDATE lessons SET model_override = NULL
  WHERE module_sequence = 5 AND lesson_sequence = 2; -- How Real Teens Price Their Work

-- VERIFICATION: Check assignments
SELECT module_sequence, lesson_sequence, title, model_override
FROM lessons
ORDER BY module_sequence, lesson_sequence;
