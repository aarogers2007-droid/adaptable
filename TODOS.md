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
- ~~Baseline schema commit~~ ✓ — teacher_alerts + knowledge_base in migration 00000
- ~~Knowledge base verification~~ ✓ — 188 entries, 67 tags, full lesson coverage
- ~~Multi-language crisis detection~~ ✓ — all 5 routes use detectCrisisUniversal (regex + Haiku ML)
- ~~Support chat rate limit~~ ✓ — already migrated to reserve_ai_usage RPC
- ~~Spanish crisis response~~ ✓ — getCrisisResponse supports Spanish, 988 includes "presiona 2 para español"
- ~~Org-level impact CSV export~~ ✓ — exportOrgImpactCSV on Impact tab
- ~~Org-scoped scenarios~~ ✓ — migration 00050, ScenariosPanel, scenario-actions.ts
- ~~Streaming profanity scrubber~~ ✓ — createStreamScrubber on all 5 AI routes
- ~~Onboarding wizard~~ ✓ — 5-step /start page with Stripe integration (waiting on keys)
- ~~Design audit~~ ✓ — 16 findings fixed across 21 files

</details>

---

## P0 — Before VentureLab pilot launches

### Upgrade Supabase to Pro plan
Free tier limits hit at 10K students. $25/month.
Effort: S (human: ~5 min)

### Toggle anonymous sign-in OFF in Supabase
Was enabled for DEMO event. Supabase Dashboard → Auth → Providers → Anonymous → OFF.
Effort: S (human: ~1 min)

### LLC formation + EIN
Texas LLC filed. Waiting on EIN. Required before Stripe live keys and receiving revenue.
Effort: M (human: waiting on state)

### Set up Stripe account + add keys to Vercel
**Blocked by: LLC/EIN.** Code is built and deployed. Just needs keys.
Effort: S (human: ~30 min after EIN)

### Legal
- IP carve-out from VentureLab (AJ owns Adaptable IP)
- Licensing agreement for per-student pricing
- Privacy policy and ToS for the platform
- COPPA review for under-13 users
Effort: L (human: lawyer engagement)

### Per-org email sender configuration
Each org sends crisis alerts from their own domain, not Adaptable's.
Add `sender_domain` and `sender_email` to organizations. Email pipeline reads from org config.
Effort: S (CC: ~30 min)

### Crisis email failure banner on org admin dashboard
`notification_failures` table is populated but silent. Org admin needs a hard banner.
Effort: S (CC: ~15 min)

### Crisis response playbook for org admins
Org admins get crisis alerts but have no protocol for what to DO. Need a guide:
when to call parents, when to call 911, when to call CPS, mandatory reporting
obligations, documentation requirements. Could be a page in the handbook or a
dedicated in-app guide accessible from the Alerts tab.
Source: Linda (rural Texas director) walkthrough.
Effort: S (CC: ~30 min for in-app guide)

---

## P1 — Before second org signs (scale readiness)

### Multi-site hierarchy
Orgs with multiple locations need sites/locations as a concept between org and class.
Marcus (42 sites in Atlanta) can't manage a flat list of 100+ classes. Need:
- `sites` table (org_id, name, address, manager_id)
- Classes belong to a site
- Dashboard groups classes by site
- Impact reporting filterable by site
Source: Marcus (Atlanta, 8,500 students) walkthrough.
Effort: L (CC: ~2 hours)

### Sponsor-specific reporting
Scenario creation supports sponsors (name, logo, context) but there's no way to
generate a "Delta Airlines Impact Report" showing completion rates and rubric scores
for Delta-sponsored scenarios only. Need per-sponsor filtered export.
Source: Marcus walkthrough.
Effort: M (CC: ~1 hour)

### REST API for data export
Server actions are React-only. Data analysts need REST endpoints to feed Salesforce,
run custom reports, or automate quarterly exports. At minimum: GET /api/impact with
org_id, date range, and site filters. Returns JSON.
Source: Marcus walkthrough.
Effort: M (CC: ~1 hour)

### SQL-level aggregation on impact queries
`impact-actions.ts` loads all rows into memory and does JavaScript GROUP BY for
lesson aggregation. At 8,500+ students over a school year, that's 100K+ rows in a
serverless function. Needs SQL-level aggregation (database views or raw SQL queries).
Source: Marcus walkthrough.
Effort: M (CC: ~1 hour)

### Role hierarchy (site_manager)
Current roles: student, instructor, org_admin. Multi-site orgs need a site_manager
role that sees cross-class data for their site but not the entire org. Program
managers shouldn't be org_admins (too much access) but instructors can't see
cross-class data.
Source: Marcus walkthrough.
Effort: M (CC: ~1 hour)

### Per-org isolated RAG
Each org gets their own knowledge base, isolated by org_id.
- Add `org_id` to `knowledge_base` table
- RLS: students only see their own org's KB
- `getRelevantKnowledge()` filters by org_id
- Org admin UI for managing KB entries
- Ingestion pipeline
Effort: L (CC: ~2 hours)

### Org onboarding flow updates
The 5-step wizard is built. Remaining improvements:
- Invoice/PO billing option (not just Stripe credit card)
- Nonprofit pricing tier or custom quote flow
- Printable instruction sheet for staff distributing invite codes
Source: Linda + Marcus walkthroughs.
Effort: M (CC: ~1 hour)

### Curriculum ingestion pipeline
Script that processes uploaded curriculum into org-scoped RAG.
Effort: M (CC: ~2 hours)

### COPPA compliance and data management
Data retention + deletion. Privacy policy page. Required before contracts.
Effort: L (CC: ~1 hour)

---

## P2 — Post-pilot enhancements (accepted from CEO review)

### Dashboard data-first redesign
Lead with charts/graphs, not student lists. Multiple visualization options
(bar, pie, line). Design for "screenshot this for a board presentation."
Effort: L (CC: ~2 hours)

### Impact Report generator (branded PDF)
One-click branded PDF with org logo, key stats, charts. The artifact Cristal
emails to sponsors and attaches to grant applications.
Effort: M (CC: ~1 hour)

### Student Journey Timeline
Per-student chronological view of all touchpoints: lessons, scenarios, AI
exchanges, check-ins, archetype card, business idea evolution.
Effort: M (CC: ~1 hour)

### Engagement Health Score
Predictive weekly trends + drop-off risk. Surfaces "engagement dropped 12%
this week in Module 3" type insights.
Effort: M (CC: ~1 hour)

### Lesson Drill-Down
Per-lesson completion funnel: started → checkpoint 1 → checkpoint 2 →
checkpoint 3 → complete. Shows where and why students drop off within a lesson.
Effort: M (CC: ~1 hour)

### AI Quality Monitor
1% sampling of lesson conversations, judged by Haiku on 6 dimensions.
Alert if quality drops below 4.0/5.0. Catches drift post-launch.
Effort: M (CC: ~1 hour)

### Org Admin Handbook (auto-generated branded PDF)
One-click download from launchpad. Answers every board/parent question.
Already drafted as HTML, needs to be built into the platform.
Effort: M (CC: ~1 hour)

### Identity Mirror (high school only)
Two-layer Founder's Mirror extension: student's own words + AI observations.
Gate on grade_tier === "high_school".
Effort: M (CC: ~1 hour)

### Streak visibility improvements
Larger display on dashboard + "Longest Streak" leaderboard category.
Effort: S (CC: ~30 min)

### Multimodal RAG
Images, diagrams, videos in knowledge base. AI surfaces inline during lessons.
Effort: L (CC: ~2 hours)

### Shareable Student Portfolio Page
Public page showing what each student built. Proof of impact for org fundraising.
Blocked by: privacy/consent framework.
Effort: M (CC: ~30 min)

---

## P3 — International expansion (before non-US orgs)

> From Amira's walkthrough (23,000 students, 12 countries, London-based NGO).
> None of these block the VentureLab pilot but all block international adoption.

### i18n framework (externalized strings)
Entire UI is English-only. No translation infrastructure. Need externalized strings
with locale detection. Priority languages: Spanish, French, Portuguese.
Effort: L (CC: ~3 hours)

### Offline-tolerant mode
8 of Amira's 12 countries have unreliable internet. Need service worker + local
storage to cache current lesson content. Responses sync when connectivity returns.
Without this, the product is unusable in most of the developing world.
Effort: XL (CC: ~4 hours)

### Regional pricing
USD-only pricing hardcoded. $5.99/student in Cambodia is unaffordable. Need
purchasing power parity tiers or regional pricing tables.
Effort: M (CC: ~1 hour)

### Cultural adaptation of AI examples
Business examples skew suburban US (Etsy, Depop, TikTok). Need region-aware
example sets: agriculture for rural areas, market trading for West Africa,
mobile money for Southeast Asia.
Effort: M (CC: ~1 hour per region)

### Cross-org federation dashboard
Amira needs one dashboard for 23,000 students across 12 country orgs. The
architecture isolates orgs perfectly but gives no super-admin aggregation view.
Effort: L (CC: ~2 hours)

### Expanded crisis resources for Global South
Crisis resources only cover US, UK, Canada, Australia, NZ, Ireland, South Africa.
Missing: Nigeria, Cambodia, Colombia, Ghana, Senegal, Kenya, and all other
operating countries. Offline caching of resources needed for when internet is down.
Effort: M (CC: ~1 hour)

### Non-US grade structure mapping
K-12 labels meaningless outside US. Need mapping to local education systems
(Nigerian Primary/JSS/SS, Cambodian system, etc.) or age-based tiers.
Effort: S (CC: ~30 min)

### Data sovereignty / GDPR compliance
Where is Supabase hosted? Nigeria's NDPR may require in-country data. EU students
need GDPR-compliant hosting. Need data residency controls and formal compliance docs.
Effort: L (human: legal + infrastructure)

### Tenant fallback data isolation
If Supabase goes down, resolveTenant falls back to default org. Students from
inactive/unreachable orgs get routed to default, creating brief data commingling.
Fix: show an error page instead of falling back.
Effort: S (CC: ~15 min)

---

## P4 — Optional (org-requested features)

### Teacher agency tools
Direct nudge messages, comments on artifacts, follow-up flags.
Effort: M (CC: ~30 min)

### Classroom mode
Real-time class progress, student spotlight, live leaderboard projection view.
Effort: L (CC: ~1 hour)

### Gradebook integration (LMS)
LTI 1.3 + OneRoster. Only if an org specifically requests it.
Effort: L (CC: ~2 hours per provider)

### Clever/ClassLink SSO
School district SSO. Only if mandated by an org's schools.
Effort: M (CC: ~30 min per provider)

### Quizzes
Knowledge checks embedded in lessons.
Effort: S

### Parent Accounts
Real parent accounts with auth. Notifications, multi-child view, consent.
Effort: M

### Full AI Mentor Guide
Upgrade from Q&A to proactive mentor. Needs pilot data first.
Effort: M (CC: ~1 hour)

### Real-World Brand Challenges
Brands pay $5K-$25K for branded scenarios. AI judges rank submissions.
Brand sponsor portal, Stripe Connect for prizes. Hold until 1K+ students.
Effort: L (CC: ~3 hours)

### Founder's Mirror template optimization
Replace AI generation with curated templates for common patterns.
Data-driven after 100+ founder_log_entries.
Effort: S (CC: ~30 min)

### Accessibility Audit (WCAG 2.1 AA)
Full audit and remediation. May be procurement requirement.
Effort: M

### Longitudinal Student Data
Multi-year journeys. Portfolio view of full journey from first login.
Effort: M (CC: ~30 min)
