-- Migration 00044: Add prompt cache token tracking to ai_usage_log
--
-- Anthropic prompt caching returns cache_creation_input_tokens and
-- cache_read_input_tokens in the usage response. These columns track
-- cache writes (1.25x cost) and cache reads (0.10x cost) per AI call.

ALTER TABLE ai_usage_log
  ADD COLUMN IF NOT EXISTS cache_write_tokens int,
  ADD COLUMN IF NOT EXISTS cache_read_tokens int;
