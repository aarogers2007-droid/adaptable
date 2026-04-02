# TODOS

## P0 — Security (next session)

### TOCTOU Race on Daily Message Cap
The chat endpoint checks message count then proceeds, but concurrent requests can all pass
the check simultaneously. Fix: use atomic counter (UPDATE ... RETURNING or Redis INCR)
checked and incremented in a single operation before starting the stream.
File: src/app/api/chat/route.ts

### Race Condition on Invite Code Max Uses
Multiple students redeeming the same invite code concurrently can all pass validation and
exceed max_uses. Fix: add WHERE current_uses < max_uses to the increment_invite_usage
function and check row count to detect failure.
File: supabase/migrations/00004_functions.sql, src/app/(auth)/join/actions.ts

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

### Gamification Layer
- Badges and achievements
- Leaderboards (build-based, not watch-based)
Effort: M combined

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

### Additional AI Content Safety Layer
Secondary Claude Haiku call checking AI output age-appropriateness before showing to students.
Effort: S

### Accessibility Audit (WCAG 2.1 AA)
Full accessibility audit and remediation. May be a procurement requirement for US schools.
Effort: M

## P3 — Low priority (security hardening)

### Lesson Progress Insert Race Condition
If a student opens the same lesson in two tabs, both try to insert a progress record.
The unique constraint catches it but the error isn't handled, causing a 500.
Fix: use Supabase upsert with onConflict instead of insert.
File: src/app/(app)/lessons/[id]/page.tsx

### CSRF Protection on Chat Route Handler
The /api/chat Route Handler doesn't have CSRF protection (Server Actions get it
automatically). A malicious site could POST to /api/chat with the user's cookies.
Fix: check Origin/Referer header, or add CSRF token validation.
File: src/app/api/chat/route.ts

### increment_invite_usage Security Definer Abuse
The RPC function runs as security definer (superuser privileges), bypassing RLS.
Any authenticated user can call it to exhaust any invite code's usage limit.
Fix: add caller validation inside the function or restrict to specific roles.
File: supabase/migrations/00004_functions.sql
