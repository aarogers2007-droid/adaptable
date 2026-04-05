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

### Batch Check-in Architecture
Migrate on-demand check-ins to nightly batch processing when active student count exceeds
10K. Requires: Supabase Edge Functions cron, Anthropic Message Batches API, Resend for
email delivery, idempotent batch IDs, dead-letter tracking.
Depends on: >10K active students.
Effort: M (human: ~1 week / CC: ~30 min)

## P2 — Medium priority (v2)

### Shareable Student Portfolio Page
Public-facing page showing what each student built. Business concept, key decisions, pitch.
Proof of impact for VentureLab fundraising. Tangible artifact for students to show colleges.
Blocked by: Privacy/consent framework for minors (needs legal review).
Effort: M (human: ~1 week / CC: ~30 min, plus legal review)

### Interactive Tools (post-spine)
- AI prompting sandbox
- Business plan builder
- Revenue/pricing calculator
- Pitch deck creator
Effort: M each (human: ~1 week each / CC: ~30 min each)

### External Integrations
- Lovable website builder integration
- Make.com automation builder integration
Effort: M each

### ~~Gamification Layer~~ ✓
Built: 18 achievements across 5 categories (bronze/silver/gold tiers), 4-category leaderboard
(Most Consistent, Most Engaged, Deepest Thinker, Most Improved), student profiles on leaderboard.

### Peer Collaboration
Student-to-student features. Requires Supabase Realtime.
Effort: L

### Quizzes
Knowledge checks embedded in lessons.
Effort: S

### Full CMS for Content Authoring
Replace DB seed scripts + admin textarea with a proper content management interface.
Effort: M

### Parent Accounts
Upgrade from anonymous PIN access to real parent accounts with authentication.
Enables: notifications, multi-child view, consent management.
Effort: M

### True Offline Mode
PWA with service worker for offline lesson access. Complex with Next.js App Router.
Effort: L

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

## Investor & Launchpad Vision

> The venture studio model means students design and plan, then launch when ready.
> The investor view creates a pipeline from student ventures to real funding and mentorship.
> Each tier increases real-world connection while managing legal risk for minors.

### Tier 1 — Anonymous Venture Gallery (P2, safe to build soon)
Product Hunt for teen entrepreneurs. Investors browse student ventures by niche,
industry, and quality score. No student names or contact info visible. VentureLab
controls access. Ventures displayed as anonymous portfolio cards with: business concept,
niche, target customer, revenue model, and a quality indicator from the AI evaluation.
This gives VentureLab a demo asset ("look at what our students are designing") and
gives investors visibility into the pipeline without any direct contact with minors.
Effort: M (human: ~1 week / CC: ~30 min)

### Tier 2 — Investor Requests Introduction (P3, needs legal framework)
An investor sees an anonymous venture they like and clicks "Request Introduction."
VentureLab acts as the intermediary. The request goes to VentureLab staff, who
review it, then contact the student's school and parent/guardian for approval.
Only after school + parent consent does VentureLab facilitate a supervised introduction.
All communication is logged and monitored by VentureLab. No direct investor-to-minor
contact without institutional approval.
Depends on: Tier 1 gallery, legal review, parental consent framework.
Effort: L (human: ~3 weeks / CC: ~2 hours, plus legal)

### Tier 3 — Mentorship Matching (far future)
Direct mentorship matching between verified investors/mentors and students. Requires:
full legal framework, background checks on all mentors, parental consent per interaction,
school administrator approval, VentureLab oversight and moderation of all conversations.
Think Big Brothers Big Sisters level of safeguarding applied to entrepreneurship mentorship.
Depends on: Tier 2, legal infrastructure, safeguarding policies.
Effort: XL

### "Go Live" Launchpad (P2)
For students who complete the program and want to actually launch: a structured pathway
with proper scaffolding. Includes: parental consent flow, one-click starter tools
(booking page, payment link, portfolio site), and ongoing AI co-founder support.
This is the bridge from simulation to reality. Optional, not default. The venture studio
is the product, the launchpad is the graduation gift.
Depends on: Completion of core venture studio experience.
Effort: L (human: ~2 weeks / CC: ~1 hour)

## P3 — Security hardening (FIXED)

### ~~Lesson Progress Insert Race Condition~~ ✓
Fixed: uses upsert with onConflict + fallback fetch for concurrent tab safety.
File: src/app/(app)/lessons/[id]/page.tsx

### ~~CSRF Protection on Chat Route Handlers~~ ✓
Fixed: Origin/Referer validation via src/lib/csrf.ts, applied to chat, lesson-chat, and transcribe routes.

### ~~increment_invite_usage Security Definer Abuse~~ ✓
Fixed: added auth.uid() null check inside the function. Unauthenticated callers get exception.
Migration: supabase/migrations/00009_security_hardening.sql
