# Adaptable

White-label AI curriculum platform for organizations and nonprofits. Each org uploads
their branding and curriculum, students see the org's name on everything, never Adaptable's.
First customer: VentureLab (10,000 students, founding partner at $4.99/student).

## The Adaptable Factual Floor

Adaptable's stated mission is **transformation, not education** — and the founder's
own words: *"confidence in their knowledge should be facts-based. We want to keep
things transparent and real, especially when trying to make these young students
more confident."*

That mission demands a non-negotiable editorial standard for any content the AI
mentor can surface to a student — whether shown as a citation, paraphrased, or
absorbed into generated text.

**The standard, adopted 2026-04-08 after an internal eval surfaced 13% citation
hallucination in the knowledge base:**

> Any claim the AI mentor can surface to a student must be traceable to a source
> a 16-year-old could independently verify in under 60 seconds. Named individuals
> paired with specific outcomes, quoted statistics, and study citations require
> a real, checkable source at seed time, or they do not enter the knowledge base.
> Principles, frameworks, and mechanism explanations do not require citations and
> are preferred over anecdotes whenever the pedagogical value is equivalent.

**The test isn't "is this probably true." The test is "can a skeptical teenager
verify it in 60 seconds." That test automatically kills fake teen case studies,
fabricated statistics, and paraphrase-drift misattributions, because none of them
survive a Google search.**

### Operational rules that follow from the Factual Floor

1. **The eval harness is a pre-commit gate, not a post-hoc audit.** No knowledge
   base entry ships to `verified=true` without passing
   `scripts/eval-knowledge-base.ts` with a likely_hallucinated count of 0 (or
   manually-reviewed exceptions for fields where the judge marks UNVERIFIED but
   the human can confirm).

2. **The paraphrasing layer is a product feature, not an integrity control.** Do
   not rely on "the AI paraphrases context conversationally so students don't see
   the exact citation" as a defense for shipping unverified claims. Integrity
   lives in the source of truth, not in downstream rendering.

3. **Principles over anecdotes.** When seeding new knowledge, prefer mechanism
   explanations and well-known frameworks (Lean Canvas, Jobs-to-be-Done, Mom Test,
   Golden Circle) over named teen case studies. If a real, verifiable example
   exists, cite it. If you're tempted to invent one for vividness, generalize
   instead with "imagine a teen who..." framing.

4. **When in doubt, cut.** A knowledge base entry with one fewer claim is strictly
   better than one with a fabricated claim. Surgical removal beats clever
   replacement.

5. **Velocity is not a defense.** When schedule pressure makes a fact-checking
   shortcut tempting, the answer is "delay the feature" not "ship the
   contamination." The mission cannot survive one screenshot of a fabricated
   citation; the lesson can survive 48 hours of degraded RAG context.

## Ikigai Synthesis Prompt — Standing Decisions

These prompt rules were validated through eval-driven iteration and regression tests.
They are standing decisions — do not revert without re-running the regression tests
and confirming scores remain above the baselines in `evals/baseline-scores.json`.

### Rule 11: Young Student Guard (age ≤ 12)

When `grade_tier === "elementary"`, the user message prepends a flag that triggers
rule 11: business ideas MUST require zero startup capital. Ideas must be purely
skill-based or time-based (tutoring, pet sitting, yard work, digital art commissions
using free tools). Any idea requiring the student to spend money before earning money
is rejected. Regression test: `scripts/eval-age12-regression.ts`, baseline capital_required ≥ 4.0.

### Rules 4-5: Dominant Interest Selection for Multi-Interest Students

When a student has 2-3 unrelated interests, the prompt picks the DOMINANT one —
the interest where the student's language is most specific, emotional, or experienced.
The dominant interest drives the niche, name, customer, and revenue model completely.
Secondary interests may ONLY appear in `why_this_fits` as transferable skill insight.

### Rule 5: Anti-Hybrid Self-Check

After generating an idea, the prompt runs a self-check: "If I removed the secondary
interest from this student's profile, would the niche description need to change?"
If yes, it's a forced hybrid and gets regenerated. Concrete bad examples are listed
in the prompt: "anime-themed nail art," "music-themed tutoring," "gaming-themed
cooking." The Valorant+drawing test case is explicit: produce EITHER Valorant coaching
OR character art commissions, NOT "Valorant character art."
Regression test: `scripts/eval-multi-interest-regression.ts`, baseline noHyb ≥ 4.5, insight ≥ 4.0.

## Architecture — Key Patterns

### Multi-Tenant Subdomain Routing
Organizations get subdomains (e.g., `venturelab.adaptable.one`). Resolution flow:
1. `src/lib/supabase/middleware.ts` extracts hostname, calls `resolveTenant()`
2. `src/lib/tenant/resolve.ts` queries `organizations` with 60s TTL in-memory cache (service role key)
3. Middleware injects `x-tenant-id` and `x-tenant-subdomain` headers
4. **Server actions read org_id from `auth.uid()` → `profiles.org_id`** (unforgeable). Never trust x-tenant headers for authorization
5. `src/lib/tenant/verify-access.ts` provides cross-tenant protection checks

### Per-Lesson Model Routing
14 of 22 lessons use GPT-4o-mini. 8 reasoning-heavy lessons use Claude Sonnet.
- `lessons.model_override` column (migration 00036): `"gpt-4o-mini"` or null (defaults to Sonnet)
- `src/lib/model-config.ts`: `getLessonModel(lessonId)` queries the column
- `src/lib/ai.ts`: `streamMessageOpenAI()` is an OpenAI streaming shim matching Anthropic's `AIStream` interface
- `src/app/api/lesson-chat/route.ts`: calls `streamMessage()` with `modelOverride` param

### Prompt Caching
System prompts use `cache_control: { type: "ephemeral" }` on `ContentBlockParam` arrays.
Applied to: lesson-chat, scenario-chat, guide. Cache metrics returned in `AIResponse.usage`.
Type workaround: Anthropic SDK doesn't expose cache fields in TS types, so usage is cast via `as unknown as Record<string, number>`.

### Scenario System
- `src/lib/scenario-rubric.ts`: 6 universal criteria (CUSTOMER_CLARITY, PROBLEM_VALIDATION, etc.)
- `src/app/api/scenario-chat/route.ts`: SSE streaming with fire-and-forget criteria evaluation (gpt-4o-mini, non-blocking)
- System prompt includes `[OPTIONS]` block instruction; `MCOptions.tsx` parses and renders clickable MC cards
- Badge levels: bronze (3/6 criteria), silver (5/6), gold (6/6)

### Data Flywheel
6 instrumented columns on `ai_usage_log`: response_length, prompt_length, lesson_id, completion_flag, session_duration_seconds, student_response_time_ms.
Views: `lesson_effectiveness` (avg completion, tokens, ratings per lesson), `at_risk_students` (inactive 3+ days with incomplete progress).

### Streaming UX
All chat interfaces (lesson, scenario, guide) throttle state updates to `requestAnimationFrame` to prevent choppy re-renders during SSE streaming. Buffer pattern: accumulate text in a ref, flush to state on rAF callback.

## Language Rules

This is an org platform, not a classroom tool. Enforce these everywhere: code,
comments, copy, error messages, documentation.

- **Say "organizations" and "org admins."** Never "teachers" or "classroom."
  Teacher/instructor features are P3 optional.
- **Say "students" or "participants."** Never "users" in student-facing copy.
- **Say "program" or "curriculum."** Never "course" or "class" in org-facing copy.
- **No specific lesson counts.** Never say "22 lessons" or any fixed number. Orgs
  have their own curriculum with their own lesson count.
- **No "Adaptable" in student-facing UI.** Students see the org's name. Only the
  landing page (adaptable.one) and admin-facing settings show "Adaptable."

## Target Hardware

Students use school Chromebooks (2GB RAM, 1366x768, spotty WiFi). Every technical
choice must be validated against this baseline first.

- **No WebGL, canvas, or heavy JS animations.** CSS/DOM/SVG only.
- **Bundle size matters.** Don't add large client-side libraries without justification.
- **Test at 375px (iPhone SE) and 1366px (Chromebook).** Every user-facing change
  must work at both widths.

## Mobile-First Verification

**Every time user-facing UI is created or modified**, verify it works on mobile
before considering the task complete:

1. Check all elements at 375px width (no horizontal overflow, no clipped text)
2. All buttons minimum 44px touch target
3. All text minimum 14px (no 12px labels on mobile)
4. No layout that requires horizontal scrolling
5. Inputs are full-width on mobile
6. Modals/overlays are scrollable if content exceeds viewport height

If generating an HTML preview, include a mobile viewport toggle so the user can
verify both desktop and mobile in one view.

## Build and Commit Discipline

1. **Always verify `npx next build` passes before committing.** No exceptions.
   A broken build that reaches main is a deployment failure.
2. **Run `/cso` after any security-sensitive change** (auth, payments, API routes,
   RLS policies, CSRF, rate limiting).
3. **Run `/checkpoint` at natural session boundaries** (end of a feature, before
   switching contexts, before the user leaves).
4. **Stage specific files.** Never `git add -A`. Name the files being committed.

## Data Integrity Rules

The engagement data IS the product. Nonprofits use it for sponsor reports and grant
applications. One wrong number discovered by a sponsor destroys the value proposition.

1. **Every ai_usage_log insert must include org_id.** No exceptions. Cross-tenant
   data leakage is a product-killing bug.
2. **Every ai_usage_log insert must use real token counts** from finalMessage().usage,
   not estimates. Include cache_read and cache_creation tokens where applicable.
3. **Every fire-and-forget DB write must have .catch() with console.error.** Silent
   write failures mean invisible data loss.
4. **Use DISTINCT/Set when counting unique entities.** No double-counting students,
   lessons, or sessions.
5. **Cost formulas must match the actual model being called.** Sonnet, Haiku, and
   Mini have different rates. Cache reads cost 10% of base. Don't hardcode $0.
6. **Dashboard numbers and CSV exports must use the same data source.** If the
   dashboard shows 247 completions, the CSV must show 247.

## API Route Checklist

When creating or modifying any API route in `src/app/api/`, verify ALL of these:

- [ ] Auth check (supabase.auth.getUser, return 401 if missing)
- [ ] Profile query includes org_id
- [ ] org_id is not null (return 403 "Account not configured" if missing)
- [ ] CSRF validation (validateOrigin) on non-webhook routes
- [ ] Rate limiting via reserve_ai_usage RPC (unless admin bypass)
- [ ] Content moderation on user input (moderateContent + moderateContentML)
- [ ] ai_usage_log insert includes org_id and real token counts
- [ ] Streaming routes have output moderation (moderateOutput + createStreamScrubber)
- [ ] Crisis detection runs on student messages (detectCrisisUniversal)
- [ ] Error responses are student-friendly, not raw error messages

## Security Posture

Standing rules from two CSO audits. Do not regress on these.

- **CSRF must fail closed.** If NEXT_PUBLIC_SITE_URL is not set, block the request.
  If no Origin and no Referer header, block the request.
- **Rate limiters must fail closed.** If the RPC errors, deny the request. Never
  fail open and allow unlimited access.
- **Never hardcode emails or user IDs for admin checks.** Use `is_platform_owner`
  flag on the profiles table.
- **Tenant cache has a hard cap** (100 entries). Force-evict oldest after lazy pass.
- **Crisis alert emails never include the matched trigger phrase.** Keep raw text in
  the DB audit log, send only the crisis type to instructors.
- **Webhook handlers must null-check subscription.items.data[0]** before accessing.

## Pricing Reference

Volume pricing (single Stripe price ID with tiers):
- 1-500 students: $14.99/student/year + $2,500 implementation fee
- 501-2,500: $12.99 + $2,500
- 2,501-10,000: $9.99 + $2,500
- 10,001-50,000: $7.99 + $2,500
- 50,000+: negotiable

Founding Partner (VentureLab): $4.99/student, no implementation fee, lookup key: founding-partner

All features at every level. No gating. Prices only go up.

## Terminal Safety

- **Never run `npm run dev`, `npm start`, or any blocking server command** in the
  Claude Code terminal. These lock the session. Use `run_in_background` if needed.
- **Always warn before destructive operations** (rm -rf, git reset --hard,
  DROP TABLE, etc.).
- **List all steps before executing a multi-step operation** so the user can
  intervene if something looks wrong.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
- Security audit, "is this secure" → invoke cso

Automatic triggers (run without being asked):
- After security-sensitive changes (auth, payments, API routes) → run /cso
- At end of major features or before user leaves → run /checkpoint
- Before committing → verify build passes
