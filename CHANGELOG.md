# Changelog

All notable changes to Adaptable will be documented in this file.

## [0.24.0.0] - 2026-05-09

### Added
- **Scenario Simulations** — Role-play business challenges with Socratic AI, branching narratives, MC decision points, criteria-based badge earning (bronze/silver/gold), and replay support
- **Scenario Chat UX** — Two-panel layout (context panel + conversation), `[OPTIONS]` block parsing for clickable MC cards, staggered entrance animations, criteria unlock animations
- **Multi-tenant Subdomain Routing** — Organizations get subdomains (e.g., `venturelab.adaptable.one`). Middleware resolves tenant from hostname with 60s TTL cache, injects `x-tenant-*` headers
- **Self-Serve Org Onboarding** — 3-step wizard (org name, subdomain, class creation) with subdomain availability check and 23505 collision handling
- **Guest Join Page** (`/go`) — Class code entry, anonymous Supabase sign-in, profile creation, class enrollment, redirect to onboarding. Built for live demo events
- **Per-Lesson Model Routing** — 14 of 22 lessons use GPT-4o-mini via `lessons.model_override` column. 8 reasoning-heavy lessons stay on Claude Sonnet. OpenAI streaming shim (`streamMessageOpenAI`) matches Anthropic's `AIStream` interface
- **Prompt Caching** — System prompts use Anthropic's `cache_control: { type: "ephemeral" }` on lesson-chat, scenario-chat, and guide routes. ~90% token cost reduction on cached hits
- **Data Flywheel Instrumentation** — 6 columns on `ai_usage_log` (response_length, prompt_length, lesson_id, completion_flag, session_duration_seconds, student_response_time_ms). Views: `lesson_effectiveness`, `at_risk_students`
- **Student Response Time Tracking** — Millisecond-precision timing via client-side `Date.now()` refs in all 3 chat interfaces
- **Rating Widget** — 5 inline SVG stars on lesson, scenario, and guide chats. Optimistic submit, disappears on click. `lesson_ratings` table with RLS
- **Platform Owner Dashboard** (`/aj`) — Real-time analytics with 18 parallel queries: engagement metrics, AI costs, scenario completion, crisis detection, at-risk students
- **Instructor Impact Tab** — `getOrgImpactReport` and `getAtRiskStudents` actions on instructor dashboard
- **Archetype Card Richness** — Cards now include portrait, edge, watch_out sections (backward compat with old `description` field). Max tokens 600→1024
- **Founder's Mirror** — Reflection practice layer with AI-generated prompts at natural lesson breakpoints, Vigil integration
- **Support Chat Logging** — Inputs logged to `feedback` table for product insight
- **Vercel Analytics** — Added site-wide analytics tracking

### Changed
- **Leaderboard Redesign** — First name only display, removed decision count from DEPTH metric
- **Lesson Suggestions** — Only show "Give me an example" at lesson start (userMessageCount <= 1)
- **Streaming Smoothness** — All 3 chat interfaces now throttle state updates to `requestAnimationFrame`, eliminating choppy re-renders
- **Mobile Spacing** — Fixed padding, gap, and touch target issues across lesson chat, scenario chat, and dashboard

### Removed
- **Decision Journal** — Fully removed (superseded by Founder's Log). Deleted: `DecisionJournal.tsx`, `decision-actions.ts`, all imports/queries in dashboard, completion, plan, leaderboard, achievements, engagement-context, admin actions, and instructor CSV export. `lesson_decisions` table left for data preservation
- **Decision Maker Achievement** — Removed from achievements system

### Fixed
- Support chat silent crash on AI call failure (wrapped in try/catch with fallback)
- Auth callback URL parsing (replaced `String.replace()` with `new URL()` hostname manipulation)
- Org onboarding `formData.get()` null safety
- Invite code collision (retry loop with 1-99 suffix)
- Impact report global scenario count (now org-scoped via profile join)
- Scenario chat feature key (`feature: "guide"` with `modelOverride` instead of invalid `"scenario_chat"`)

### Security
- Cross-tenant protection (`verify-access.ts` checks profile.org_id against tenant)
- Server actions read org_id from auth (unforgeable), NOT from x-tenant headers
- `provisionOrganization` guards against org_id already set
- Database rate limiting via `reserve_ai_usage` RPC with advisory locks
- RLS tightened on flywheel views and rating table

### Database
- Migrations 00038-00048: open platform, branding storage, scenarios, sessions+badges, cache tokens, flywheel views, tightened RLS, response time, lesson ratings

## [0.23.0.0] - 2026-04-27

### Changed
- Summary tab on the demo page now uses a collapsible accordion layout instead of a long-scroll article, making it easier to scan and navigate
- Each of the 11 summary sections has its own dropdown toggle
- Accordion includes full accessibility support (aria-expanded, aria-controls, screen reader regions)
- Scoped CSS transitions for smooth expand/collapse on school Chromebooks
