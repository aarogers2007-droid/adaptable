# TODOS

## P0 — Security (FIXED)

### ~~TOCTOU Race on Daily Message Cap~~ ✓
Fixed: `reserve_ai_usage` DB function uses `pg_advisory_xact_lock` to serialize concurrent
rate limit checks per student. Reserves a placeholder row atomically before streaming,
updated with real token counts after.
Migration: supabase/migrations/00006_security_fixes.sql

### ~~Race Condition on Invite Code Max Uses~~ ✓
Fixed: `increment_invite_usage` now includes `WHERE current_uses < max_uses` and returns
boolean. Join action rolls back enrollment if increment fails.
Migration: supabase/migrations/00006_security_fixes.sql

## P0 — Pilot blockers (do before any school sees the product)

### Domain + Resend production sender
We have the email pipeline scaffolded (`src/lib/email.ts`, Resend SDK installed,
crisis alerts wire-up complete). Currently using `onboarding@resend.dev` which only
delivers to the email used to sign up at Resend. Before any real teacher hears
about a real crisis: register a domain (Cloudflare ~$10/yr), verify it in Resend
DNS, swap `RESEND_FROM_ADDRESS` env var. ~15 min once you have the $10.
Effort: S (human: ~15 min)

### Real-time crisis email failure surfacing in dashboard
The `notification_failures` table is populated when a crisis email fails to deliver.
A hard banner needs to be added at the top of `/instructor/dashboard` that loads
unresolved failures and screams about them. Right now the failure path is silent
to instructors — only visible if you query the table directly.
Effort: S (human: ~30 min / CC: ~15 min)

### Multi-language crisis detection (LLM second opinion)
Current `crisis-detection.ts` is regex, English-first with 4 Spanish patches. Admin
reviewer flagged: "I don't want to be alive" misses, all non-English misses, indirect
language misses ("everything hurts," "made a plan," "if I just disappeared," "unalive").
The honest fix: Claude Haiku classifier running in parallel with the regex, OR-ing the
result. Cost ~$0.0001 per message. Negligible.
Effort: M (human: ~half day / CC: ~1 hour)

### Commit a baseline schema for tables created via Supabase dashboard
**FOOTGUN — P0 critical.** Two tables are referenced in code but never declared in
any committed migration:

1. **`teacher_alerts`** — referenced in 8 code files (alerts pipeline, dashboard,
   types, crisis email path). Discovered when migration 00018 hit a check-constraint
   error from data the code didn't know about.
2. **`knowledge_base`** — referenced in `src/lib/knowledge-retrieval.ts` (RAG context
   for the lesson chat AI). This one is sneakier than `teacher_alerts` because
   `getRelevantKnowledge()` returns `""` on missing/empty table. The mentor silently
   gets dumber with no error and no alarm. If you ever lose this table or rebuild
   your DB, you might not notice for weeks.

Both tables exist in your prod DB only because someone created them via the Supabase
dashboard. **A fresh staging DB will explode** the moment any code touches them.

**Exact fix (you need supabase CLI access):**
```bash
# From the project root, with supabase CLI logged in to the project:
supabase db dump --schema-only > supabase/migrations/00000_baseline.sql

# Or if you don't have the CLI configured, use psql directly:
# pg_dump --schema-only --no-owner --no-acl "$DATABASE_URL" > supabase/migrations/00000_baseline.sql
```

Then diff the file against the existing numbered migrations and confirm the only
NEW tables introduced are `teacher_alerts` and `knowledge_base`. Anything else
that shows up is another silent footgun and should be promoted to a real migration.

Effort: S (human: ~5 min for the dump + ~15 min for the audit)

### Investigate `knowledge_base` is actually populated in prod
Connected to the footgun above: `getRelevantKnowledge()` is the RAG context fed
into the lesson chat AI. If this table is empty in prod, the AI mentor is operating
without any of the curated entrepreneurship content the team thought it had. Sample
query:
```sql
select count(*), array_agg(distinct lesson_tag) from knowledge_base;
```
If the count is 0 or the lesson_tags don't match what `lesson-chat/route.ts` is
querying for, the mentor has been running blind. Check before any pilot.
Effort: S (human: ~5 min)

### Note: `organizations` table is FK-only, not dead schema
Investigated as part of the schema audit. `organizations` is referenced in code
exclusively via FK joins (`profiles.org_id`, `classes.org_id`) — no `.from("organizations")`
calls anywhere. This is correct architecture: it's a referential anchor for RLS
scoping. **Do NOT drop it.** Logged here so future audits don't waste time on this.

### Lessons as gradeable artifacts + native gradebook integration
Right now `exportGradebookCSV` returns a participation report (lessons completed,
%, last active) — admin reviewer correctly called this "not a gradebook." For real
classroom adoption, lessons need: a per-lesson rubric score, time-on-task, standards
mastery indicators, and the ability to push grades to PowerSchool / Infinite Campus
/ Skyward / Google Classroom / Canvas via LTI 1.3 + OneRoster + Assignments and
Grade Services. Without this, teachers run the platform once and ask "where's the
actual grade?"
Effort: L (human: ~3 weeks / CC: ~2 hours per LMS provider)
Priority: P1 — required for sustained classroom adoption beyond pilot

## P1 — High priority (v1.1)

### Clever/ClassLink SSO
Add Clever and ClassLink SSO for schools that don't use Google Workspace. Many US school
districts mandate these for app access. Without it, IT departments may block adoption.
Depends on: Google SSO working in v1.
Effort: M (human: ~1 week / CC: ~30 min per provider)

### Full AI Mentor Guide
Upgrade minimal Q&A AI guide to full mentor with personality, proactive suggestions, and
deep contextual awareness of student's full journey. This is the 10x differentiator.
Build after v1 usage data shows where students actually get stuck.
Depends on: v1 student usage data.
Effort: M (human: ~1-2 weeks / CC: ~1 hour)

### Real-World Brand Challenges (the unicorn-track revenue play)
Brands like Adidas, Spotify, Crayola, Roblox pay $5K-$25K to put a real product or
marketing problem in front of 5K-50K teen Adaptable users for 2 weeks ("How would
you redesign sneaker packaging for Gen Z?" / "Pitch a Roblox event for high
schoolers"). The top 10 student ideas get $200-$500 each plus a Zoom call with the
brand team. Adaptable takes a platform fee on the brand sponsorship.

Why this matters more than any other revenue idea:
- Real-world stakes the lessons can't fake
- Brand gets actual teen insight (more honest than focus groups)
- Teen gets a portfolio piece + cash + adult contact + something to put on a college app
- Adaptable gets revenue from a third party WITHOUT charging students or schools
- The 19yo founder is the most fundable demographic for "we sell teen insight to brands"

The global brand-research market is ~$80B. Even 0.01% of that is $8M ARR. Becomes
a category nobody else owns because nobody else has the audience embedded in a
learning context where they're already producing high-quality structured thinking.

Architecture sketch:
- New `challenges` table: brand, prompt, deadline, prize_pool, sponsor_id
- Student submits via existing lesson chat (one-shot mode, not full lesson flow)
- AI judge ranks submissions on 5-dim rubric (creativity, executability, teen-truth,
  brand-fit, articulation) — borrows the eval-confidence judge pattern
- Brand sponsor reviews top 50 in a portal, picks 10 winners
- Cash distributed via Stripe Connect (custodial under-18 flow — same scaffolding
  the COPPA work needed)
- Winners get a richly-designed certificate that auto-attaches to their Founder
  Portfolio (when that ships)

Depends on: Stripe Connect under-18 custodial flow + at least 1,000 active students
(brands won't pay for an audience of 50). Build the data model + judge now, hold the
sales motion until the audience is real.

Effort: L (human: ~3-4 weeks for the platform / CC: ~3 hours)
Priority: P1 — this is the differentiated revenue path. Don't skip it for SaaS-style
per-school pricing.

## P2 — Medium priority (v2)

### Shareable Student Portfolio Page
Public-facing page showing what each student built. Business concept, key decisions, pitch.
Proof of impact for VentureLab fundraising. Tangible artifact for students to show colleges.
Blocked by: Privacy/consent framework for minors (needs legal review).
Effort: M (human: ~1 week / CC: ~30 min, plus legal review)

### ~~Gamification Layer~~ ✓
Built: 18 achievements across 5 categories (bronze/silver/gold tiers), 4-category leaderboard
(Most Consistent, Most Engaged, Deepest Thinker, Most Improved), student profiles on leaderboard.

### Quizzes
Knowledge checks embedded in lessons.
Effort: S

### Parent Accounts
Upgrade from anonymous PIN access to real parent accounts with authentication.
Enables: notifications, multi-child view, consent management.
Effort: M

### ~~Additional AI Content Safety Layer~~ ✓
Built: regex-based output moderation (src/lib/output-moderation.ts) runs post-stream on every
AI response. Checks for explicit content, age-inappropriate advice, PII requests, hallucinated
URLs, prompt leakage. Fires teacher alert on flag. Applied to lesson-chat and guide routes.

### Accessibility Audit (WCAG 2.1 AA)
Full accessibility audit and remediation. May be a procurement requirement for US schools.
Effort: M

## Institutional Value — Teachers & Schools

> Note: Teacher experience items should be designed in collaboration with the first
> pilot teacher based on what they actually ask for. Build the scaffolding now, but
> validate priorities with real teacher feedback before polishing.

### P1 — Teacher Experience

#### ~~Proactive Instructor Alerts~~ ✓
Built: inactive (3+ days), stuck (3+ days), emotional (3+ accumulated signals),
content flags, class struggle patterns (30%+ stuck on same lesson), check-in quality
flags. All surfaced in alert panel with resolve/dismiss/message actions.

#### Teacher Agency Tools
Add the ability for instructors to send a direct nudge message to a specific student
from the dashboard, leave a comment on a student's business plan artifact that the
student can see, and flag a student for personal follow-up. These actions should be
logged so the teacher has a record of their interventions.
Effort: M (human: ~1 week / CC: ~30 min)

#### Classroom Mode
A teacher-facing view designed to be projected on a classroom screen. Shows the class
working in real time, allows the teacher to spotlight a specific student's business
idea or artifact for group discussion, and can display a live leaderboard of progress.
Students see a simplified focused view when classroom mode is active.
Effort: L (human: ~2 weeks / CC: ~1 hour)

#### ~~Teacher Onboarding Flow~~ ✓
Built: WelcomeSlideshow (4 steps), reopenable via "How it works" button.
Missing: teacher preview mode (experience as student). Deferred to v1.1.

### P1 — School & Administrator Value (pilot-ready)

#### School Onboarding UI
Replace manual database manipulation for adding new schools with a proper admin
interface. An org_admin should be able to create classes, generate invite codes,
manage enrollments, and view school-wide analytics without any developer involvement.
Effort: L (human: ~2 weeks / CC: ~1 hour)
Priority: P1 — blocks every new school onboarding

#### COPPA Compliance and Data Management
Build a data retention and deletion system. Students and administrators must be able
to request full data deletion. Implement automatic data purging for inactive accounts
after a configurable retention period. Document the full data handling story clearly
in a privacy policy page within the platform. This is required before any public
school can sign a contract.
Effort: L (human: ~2 weeks / CC: ~1 hour)
Priority: P1 — legal requirement for public school contracts

### P2 — School & Administrator Value (post-pilot)

#### Aggregate Reporting
A monthly report generated automatically for each organization showing: total active
students, average completion rate, average session time, number of business ideas
generated, module-level completion rates, and top performing students. Exportable as
PDF. Designed to be shown to a principal or superintendent without any explanation needed.
Effort: M (human: ~1 week / CC: ~30 min)

#### ~~Curriculum Alignment Documentation~~ ✓
Built: /standards page mapping all 8 lessons to NBEA, Jump$tart, Common Core, ISTE
standards. Printable. Linked from instructor dashboard.

#### Longitudinal Student Data
Design the data model to support multi-year student journeys. A student's business
idea, decisions, artifacts, and progress should persist and be accessible across
school years. Add a student portfolio view that shows their full entrepreneurship
journey from first login forward.
Effort: M (human: ~1 week / CC: ~30 min)

## P3 — Security hardening (FIXED)

### ~~Lesson Progress Insert Race Condition~~ ✓
Fixed: uses upsert with onConflict + fallback fetch for concurrent tab safety.
File: src/app/(app)/lessons/[id]/page.tsx

### ~~CSRF Protection on Chat Route Handlers~~ ✓
Fixed: Origin/Referer validation via src/lib/csrf.ts, applied to chat, lesson-chat, and transcribe routes.

### ~~increment_invite_usage Security Definer Abuse~~ ✓
Fixed: added auth.uid() null check inside the function. Unauthenticated callers get exception.
Migration: supabase/migrations/00009_security_hardening.sql
