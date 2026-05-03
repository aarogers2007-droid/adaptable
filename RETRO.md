# Retro: Student Archetype Card Feature

**Date:** 2026-05-03
**Branch:** main
**Version:** 0.23.0.0+
**Duration:** ~4 hours across 2 sessions

## What shipped

An AI-generated character card system for Invention Mode. When a student completes the 5-circle Ikigai wizard, Claude Haiku generates a one-sentence description and five insight lines that describe who they are as a thinker, not as an inventor. The card has a deterministic title (20 combinations from archetype × scale), a sequenced reveal animation, a downloadable PDF, a shareable public URL, and an optional parent email.

### Files created (16 total, ~2,880 lines)

**Core logic:**
- `src/lib/archetype-titles.ts` — 20-title lookup with compile-time exhaustiveness
- `src/lib/generate-card.ts` — Claude generation + 6-step validation pipeline
- `src/app/(app)/invention/card-actions.ts` — server action, semaphore, slug, email

**Student-facing:**
- `src/app/(app)/invention/ArchetypeCardReveal.tsx` — loading/timeout/error/reveal states
- `src/app/(app)/invention/card-print/page.tsx` — 4×6 inch PDF via browser print

**Admin:**
- `src/app/instructor/invention/[classId]/AdminCardsTab.tsx` — grid, modal, backfill
- `src/app/instructor/invention/[classId]/print/cards/page.tsx` — print-all route

**Public:**
- `src/app/c/[slug]/page.tsx` — shareable card with runtime data allowlist

**Database:**
- `supabase/migrations/00034_generated_card.sql` — JSONB column, slug index, RLS policy, rate limit

**Tests:**
- `tests/archetype-titles.test.ts` — 9 tests covering all 20 combos + edge cases
- `tests/generate-card-validation.test.ts` — 11 tests for validation pipeline

## What went well

1. **Question Bundle Protocol worked.** Every decision that wasn't in the spec got surfaced before code was committed. Zero rework from misunderstood requirements.

2. **CSO caught two real issues.** The `reserve_ai_usage` auth guard would have broken admin-triggered generation. The platform owner RLS policy was missing for backfill. Both caught before shipping, not in production.

3. **Compile-time title exhaustiveness.** Template literal types mean adding a 6th archetype or 5th scale without updating the title map is a TypeScript error, not a runtime crash. This is the kind of safety that matters when you're generating cards for 165 students in one sitting.

4. **The validation pipeline is solid.** JSON parse → schema → sentence structure → banned words → output moderation → coherence check. One retry with a modified prompt on failure. No raw Claude output ever surfaces to a student.

## What could be better

1. **The semaphore is per-instance.** On Vercel serverless, each function invocation is its own isolate. The in-memory semaphore doesn't coordinate across instances. The real rate limit is the database RPC. The semaphore is defense-in-depth but weaker than it looks. Post-event, consider database advisory locks or a Redis semaphore.

2. **6 tests need live verification.** G1, G4, P1, A1, U1, E1 all require real student sessions, Claude API calls, or Resend. They'll be verified during the May 13 dry run. Not ideal, but the code-level verification covers the logic paths.

3. **Part Five was out of sequence.** The admin Cards tab was built after the public URL and email (Part Six). The prompt sequence skipped Part Five. No functional impact, but the build order in the spec wasn't followed exactly.

## Decisions made

- `/c/[slug]` instead of `/card/[slug]` — existing business card route at `(app)/card` would conflict
- EB Garamond serif for titles, DM Sans for everything else — both already loaded
- CSS transitions only, no Framer Motion — not in the codebase
- In-memory semaphore (10 concurrent, 30s timeout, 50 queue cap) — sufficient for May 13
- `sent_parent_email_at` inside JSONB, not a separate column — card-specific metadata
- Rate limit: 1 card per student per 24 hours via `reserve_ai_usage` RPC
- Admin-initiated generation skips `reserve_ai_usage` (auth.uid mismatch) — idempotency is the guard
- Runtime data allowlist on public card page — strips grade_tier, model_used from response

## Red flags — all cleared

RF-1 through RF-11: all verified and passing.
