# TODOS

## Completed (reference)

<details>
<summary>Security fixes, safety layers, and infrastructure already shipped</summary>

- ~~TOCTOU Race on Daily Message Cap~~ ✓ — `reserve_ai_usage` with `pg_advisory_xact_lock`
- ~~Race Condition on Invite Code Max Uses~~ ✓ — `increment_invite_usage` with `WHERE current_uses < max_uses`
- ~~Lesson Progress Insert Race Condition~~ ✓ — upsert with onConflict
- ~~CSRF Protection on Chat Route Handlers~~ ✓ — Origin/Referer validation
- ~~increment_invite_usage Security Definer Abuse~~ ✓ — auth.uid() null check
- ~~Proactive Instructor Alerts~~ ✓ — inactive, stuck, emotional, content flags, class struggle
- ~~Teacher Onboarding Flow~~ ✓ — WelcomeSlideshow (4 steps)
- ~~Gamification Layer~~ ✓ — 18 achievements, 4-category leaderboard
- ~~AI Content Safety~~ ✓ — regex output moderation + streaming profanity scrubber (10 languages) on all 5 AI routes
- ~~Curriculum Alignment Documentation~~ ✓ — /standards page with NBEA, Jump$tart, Common Core, ISTE
- ~~OpenAI lesson routing~~ — N/A, all Mini lessons moved to Haiku (2026-05-17)
- ~~`organizations` table is FK-only~~ — confirmed correct architecture, do NOT drop

</details>

---

## P0 — Before VentureLab pilot launches

### Commit baseline schema for dashboard-created tables
**FOOTGUN.** `teacher_alerts` and `knowledge_base` exist in prod but have no committed
migration. A fresh DB will explode. Run `supabase db dump --schema-only`, diff against
existing migrations, commit the missing tables.
Effort: S (human: ~20 min)

### Verify `knowledge_base` is populated in prod
`getRelevantKnowledge()` returns `""` on empty table. The mentor silently gets dumber
with no error. Check before pilot.
Effort: S (human: ~5 min)

### Per-org email sender configuration
Each org sends crisis alerts and notifications from their own domain (e.g.,
`alerts@venturelab.org`), not from Adaptable. The org provides DNS records
during onboarding. Resend supports multiple verified domains on one account.
Add `sender_domain` and `sender_email` columns to `organizations`. Email pipeline
reads from org config instead of env var.
Effort: S (CC: ~30 min)

### Crisis email failure banner on org admin dashboard
`notification_failures` table is populated when a crisis email fails. The org admin
dashboard needs a hard banner that screams about unresolved failures. Currently silent.
Effort: S (CC: ~15 min)

### Multi-language crisis detection (LLM second opinion)
Current `crisis-detection.ts` is regex, English-first. Misses: "I don't want to be
alive," indirect language ("everything hurts," "made a plan," "unalive"), all
non-English. Fix: Claude Haiku classifier in parallel with regex, OR-ing results.
Cost: ~$0.0001 per message.
Effort: M (CC: ~1 hour)

### Toggle anonymous sign-in OFF in Supabase
Was enabled for DEMO event. Supabase Dashboard → Auth → Providers → Anonymous → OFF.
Effort: S (human: ~1 min)

### Upgrade Supabase to Pro plan
Free tier limits hit at 10K students. $25/month.
Effort: S (human: ~5 min)

### Legal
- IP carve-out from VentureLab (AJ owns Adaptable IP)
- Licensing agreement for per-student pricing
- Privacy policy and ToS for the platform
- COPPA review for under-13 users
Effort: L (human: lawyer engagement)

### Adaptable LLC formation
Texas LLC, EIN, bank account. Required before receiving revenue AND before
Stripe account activation (Stripe requires a legal entity for payouts).
Effort: M (human: ~1 week)

### Set up Stripe account + add keys to Vercel
**Blocked by: LLC formation** (Stripe requires a legal entity for live payouts).
Can create account in test mode now, but can't go live until LLC + EIN + bank
account are done.

Steps (in order):
1. Create Stripe account at dashboard.stripe.com (test mode)
2. Create 3 products: Starter ($9.99/yr), Growth ($7.99/yr), Scale ($5.99/yr)
3. Copy Secret key (sk_test_...) and 3 Price IDs (price_...)
4. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
5. Run `stripe login` then `stripe listen --forward-to localhost:3000/api/stripe/webhook`
6. Copy webhook signing secret (whsec_...)
7. Add all 5 keys to .env.local
8. Test full onboarding flow locally
9. After LLC: switch to live keys, add to Vercel env vars

The onboarding wizard code is built and compiles clean. Just waiting on these keys
to test it end-to-end.
Effort: S (human: ~30 min for test mode, ~10 min for live after LLC)

---

## P1 — Org platform infrastructure (the product IS this)

### Per-org isolated RAG
The core differentiator. Each org gets their own knowledge base, isolated by org_id.
When VentureLab uploads their curriculum, it goes into a `knowledge_base` partition
scoped to their org. Students only see content from their org's RAG. Other orgs
never see VentureLab's content. The AI mentor queries only the student's org's
knowledge base.

Infrastructure:
- Add `org_id` column to `knowledge_base` table (FK to organizations)
- RLS policy: students can only trigger retrieval from their own org's KB
- `getRelevantKnowledge()` filters by org_id from the authenticated user's profile
- Org admin UI for managing KB entries (CRUD + bulk upload)
- Ingestion pipeline that processes uploaded curriculum into tagged chunks

Effort: L (CC: ~2 hours)

### Org onboarding flow (the money path)
This is the most important flow in the entire product. When an org is ready to pay,
the path from "yes" to "live and branded" must be frictionless. Most decision-makers
want to be led. They want numbered steps. They want "click here, then here, done."

The flow (one action per screen, progress bar at top):
1. **Create account** — Google sign-in, one click
2. **Pick your plan** — per-student pricing, estimated student count, Stripe Checkout inline
3. **Name your organization** — one text field, auto-generates subdomain suggestion
4. **Upload your logo** — drag and drop, instant preview
5. **Pick your colors** — color picker with live preview of how the student UI looks
6. **Upload curriculum** — drag and drop PDFs/docs/images/videos, progress bar per file
7. **Review your knowledge base** — auto-chunked + auto-tagged, org admin confirms
8. **You're live** — subdomain is active, share the link with your students

Payment is step 2. They're ready to pay, let them pay. Don't make them configure
for 20 minutes first — that's 20 minutes of potential distraction, tab-closing, and
"I'll come back to this later" that kills conversions. Once they've paid, everything
after is setup for something they already own. They'll finish because they're invested.

Already partially built (subdomain routing, branding columns, 3-step wizard at
/org/onboarding). Needs: curriculum upload, RAG ingestion, Stripe integration,
expanded wizard, preview mode.
Effort: L (CC: ~3 hours)

### Curriculum ingestion pipeline
Script that processes an org's uploaded curriculum files into their isolated RAG.

Input: PDFs, docs, images, videos, slide decks dropped into Supabase Storage.
Output: tagged, embedded knowledge_base rows scoped to the org.

Pipeline steps:
1. **Extract** — parse text from PDFs/docs (pdf-parse, mammoth for docx)
2. **Chunk** — split into self-contained concepts (paragraph-level, ~200-400 tokens each)
3. **Tag** — Haiku auto-suggests lesson_tags per chunk, org admin confirms
4. **Embed** — generate vector embeddings for semantic search (pgvector)
5. **Classify media** — images/diagrams get content_type + media_url, linked to parent chunk
6. **Verify** — run Factual Floor eval on any chunk containing named claims or statistics
7. **Insert** — write to knowledge_base with org_id, ready for retrieval

Script: `scripts/ingest-curriculum.ts`
Usage: `bunx tsx scripts/ingest-curriculum.ts --org venturelab --source ./curriculum/venturelab/`
Effort: M (CC: ~2 hours)

### Multimodal RAG (images, diagrams, videos in knowledge base)
Platform is text-only in AI interactions. VentureLab's curriculum includes diagrams
and videos. The AI mentor should surface these inline during conversations.

Infrastructure:
- Add `content_type` (text/image/video/diagram) and `media_url` to `knowledge_base`
- Retrieval pipeline returns mixed content blocks
- Chat UI renders inline images and video embeds in message stream
- Org admin uploads visual content to Supabase Storage, tagged with lesson_tags
- Chromebook constraint: native `<img>` and `<video>`/iframe only

Core to Adaptable's thesis: not all students learn through text.
Effort: L (CC: ~2 hours)

### COPPA compliance and data management
Data retention + deletion system. Students and org admins can request full deletion.
Automatic purging for inactive accounts. Privacy policy page within the platform.
Required before any org signs a contract.
Effort: L (CC: ~1 hour)

### Full AI Mentor Guide
Upgrade the AI guide from Q&A to full mentor with proactive suggestions and deep
awareness of the student's full journey. Build after pilot usage data shows where
students actually get stuck.
Depends on: pilot data.
Effort: M (CC: ~1 hour)

### Real-World Brand Challenges
Brands pay $5K-$25K to put a real problem in front of teen users. Top student ideas
get prizes + portfolio pieces. Adaptable takes a platform fee. This is the
differentiated revenue path that doesn't charge students or orgs.

Architecture: `challenges` table, AI judge on 5-dim rubric, brand sponsor portal,
Stripe Connect for prize distribution. Hold sales motion until 1K+ active students.
Effort: L (CC: ~3 hours)

---

## P2 — Post-pilot enhancements

### Org analytics dashboard
Monthly reports per org: active students, completion rates, session time, business
ideas generated, module-level stats, top performers. Exportable as PDF. Designed
for an org director, not a teacher.
Effort: M (CC: ~30 min)

### Shareable Student Portfolio Page
Public page showing what each student built. Proof of impact for org fundraising.
Tangible artifact for students.
Blocked by: privacy/consent framework for minors (legal review).
Effort: M (CC: ~30 min)

### Identity Mirror (Founder's Mirror extension, high school only)
Extend the Founder's Mirror into a two-layer identity system. High school students
only (grade_tier === "high_school"). Too deep for younger students, and sometimes
they don't want that level of honesty.

**Layer 1: Their own words (AI silent).**
The student's check-in timeline displayed chronologically. No AI interpretation, no
summaries. Just their own reflections, dated. They see their growth because their
words change over time. Week 1: "i dont really know what im doing." Week 6: "I just
pitched my first customer and she said yes." The Mirror just shows them.

**Layer 2: What the AI saw (recognition, not advice).**
Across 22 lessons and 150+ exchanges, the AI observes patterns in how the student
thinks. It surfaces these as identity observations, not guidance:
- "You've pivoted your target customer three times. Each time you got more specific."
- "Every time you talk about pricing, your answer is higher than the last one."
- "You always start with who you're helping before what you're making. That's rare."

These are stored as `identity_observations` generated after lesson completion by
analyzing the student's full conversation history. Short. Specific. About THEM.
AI restraint principle still applies: observations, not advice.

Infrastructure:
- `identity_observations` table (student_id, observation, lesson_id, created_at)
- Generation via Haiku after lesson completion (async, non-blocking)
- Gate on grade_tier === "high_school" — younger students see regular Founder's Mirror only
- UI: tab or section within Founder's Mirror showing both layers
Effort: M (CC: ~1 hour)

### Streak visibility improvements
Streak counter exists but is a small badge tucked into the dashboard hero. Make it
more prominent:
- Larger, more visible streak display on dashboard
- Add "Longest Streak" category to leaderboard alongside existing four categories
- Streak visible on student profile in leaderboard view
Effort: S (CC: ~30 min)

### Founder's Mirror template optimization
Replace AI generation with curated templates for common patterns (~80% of triggers).
Data-driven decision after 100+ founder_log_entries.
Effort: S (CC: ~30 min)

### Quizzes
Knowledge checks embedded in lessons.
Effort: S

### Parent Accounts
Real parent accounts with auth. Enables: notifications, multi-child view, consent.
Effort: M

### Accessibility Audit (WCAG 2.1 AA)
Full audit and remediation. May be procurement requirement for some orgs.
Effort: M

### Longitudinal Student Data
Multi-year student journeys. Progress persists across program cycles. Portfolio
view of full journey from first login forward.
Effort: M (CC: ~30 min)

---

## P3 — Optional (org-requested features)

> These were designed for classroom use. Still available if an org wants them,
> but not on the critical path for the white-label platform model.

### Teacher agency tools
Direct nudge messages, comments on artifacts, follow-up flags. Logged interventions.
Effort: M (CC: ~30 min)

### Classroom mode
Teacher projection view. Real-time class progress, student spotlight, live leaderboard.
Effort: L (CC: ~1 hour)

### Gradebook integration (LMS)
LTI 1.3 + OneRoster for PowerSchool / Infinite Campus / Canvas / Google Classroom.
Only if an org specifically requests it for their schools.
Effort: L (CC: ~2 hours per provider)

### Clever/ClassLink SSO
School district SSO providers. Only if an org's schools mandate it.
Effort: M (CC: ~30 min per provider)
