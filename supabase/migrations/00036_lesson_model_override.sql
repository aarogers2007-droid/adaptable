-- Migration 00036: Per-lesson model override
--
-- Allows admins to assign a specific AI model to individual lessons.
-- null = use platform default from model-config.ts
-- Valid values: 'gpt-4o-mini-2024-07-18', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-20250514'

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS model_override text DEFAULT NULL;
