-- Migration 00022: knowledge_base verified flag
--
-- Background: an audit of the 25 knowledge_base entries via Opus cross-model
-- judging found that 115 of 395 citations (29%) in the 16 entries seeded by
-- the 2-agent pipeline on 2026-04-07 are LIKELY HALLUCINATED (fabricated
-- people, fake numbers, invented teen entrepreneurs). The 9 original entries
-- have ZERO hallucinated citations.
--
-- Until the 16 hallucinated entries are regenerated with a stricter prompt
-- (queued as Option B), the RAG retrieval should PREFER verified entries
-- and only fall back to unverified ones when no verified entries exist for
-- a given lesson tag. This protects the AI mentor from citing fabrications
-- in production.
--
-- This migration:
--   1. Adds verified BOOLEAN to knowledge_base (default false)
--   2. Marks the 9 known-clean entries as verified=true
--   3. Adds an index for the verified column for fast filtered retrieval
--
-- Idempotent.

------------------------------------------------------------
-- 1. verified column
------------------------------------------------------------
alter table knowledge_base
  add column if not exists verified boolean not null default false;

------------------------------------------------------------
-- 2. Mark the 9 original entries as verified
--    These were seeded by an earlier script and have zero fabricated
--    citations per the eval-knowledge-base.ts run on 2026-04-07.
------------------------------------------------------------
update knowledge_base
set verified = true
where title in (
  'Pricing Strategy for First-Time Entrepreneurs: Research-Backed Guide',
  'finding first customers — Research-Backed Guide',
  'competition and differentiation — Research-Backed Guide',
  'Customer Interview & Business Validation Masterclass',
  'Validating Your Business Niche and Finding Product-Market Fit',
  'Marketing Your First Business: Pitching Customers With Zero Budget',
  'Learning From Failure: How the Best Entrepreneurs Turn Setbacks Into Breakthroughs',
  'The Creative Act: Rick Rubin''s Principles Applied to Building Ventures',
  'Start With Why: Simon Sineks Golden Circle Applied to Your Ikigai'
);

------------------------------------------------------------
-- 3. Index for fast verified-first retrieval
------------------------------------------------------------
create index if not exists idx_knowledge_base_verified
  on knowledge_base(verified)
  where verified = true;
