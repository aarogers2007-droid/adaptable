# Adaptable

AI-native entrepreneurship platform where students design, plan, and prepare to launch real businesses. Built for [VentureLab](https://venturelab.org) — reaching 300K+ students across 155 countries.

## What It Does

Students work through a 22-lesson curriculum guided by AI mentors. They start with an Ikigai-based self-discovery wizard that identifies their strengths, passions, and market opportunities, then build a real business concept with AI-guided lessons on customer research, pricing, branding, pitch development, and more.

**Core student experiences:**
- **Ikigai Wizard** — Interactive Venn diagram where students discover their business sweet spot
- **AI-Guided Lessons** — 22 lessons with Socratic AI mentors that adapt to each student's business
- **Archetype Cards** — AI-generated "thinker profile" cards with shareable URLs and PDF downloads
- **Scenario Simulations** — Role-play business challenges with AI-driven branching narratives
- **AI Guide** — Context-aware assistant that knows the student's niche, customers, and progress
- **Founder's Mirror** — Reflection practice layer with AI-generated prompts at natural breakpoints

**Instructor tools:**
- Real-time dashboard with progress tracking, alert triage, and impact metrics
- Crisis detection pipeline (regex + LLM classifier) with automatic teacher alerts
- Gradebook CSV export, standards alignment documentation
- At-risk student identification and engagement analytics

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL + Auth + RLS + Storage)
- **AI:** Anthropic Claude (Sonnet for reasoning, Haiku for moderation), OpenAI GPT-4o-mini (commodity tasks)
- **Hosting:** Vercel (Fluid Compute)
- **Email:** Resend (crisis alerts, parent notifications)
- **Analytics:** Vercel Analytics

## Architecture

```
src/
├── app/
│   ├── (app)/           # Authenticated student/admin routes
│   │   ├── lessons/     # 22-lesson AI-guided curriculum
│   │   ├── invention/   # Ikigai wizard + archetype cards
│   │   ├── scenarios/   # Scenario simulations + chat
│   │   ├── chat/        # AI Guide
│   │   ├── dashboard/   # Student dashboard
│   │   ├── aj/          # Platform owner analytics
│   │   └── org/         # Org admin onboarding
│   ├── instructor/      # Teacher dashboard + tools
│   ├── auth/            # OAuth callback + routing
│   ├── go/              # Guest join (class codes)
│   ├── ask/             # "Ask Adaptable" — public conversational sales/education
│   ├── api/             # Route handlers (lesson/scenario/guide + ask-chat, ask-lead)
│   └── demo/            # Public demo site
├── components/          # Shared UI components
├── lib/                 # Core logic
│   ├── ai.ts            # AI streaming (Anthropic + OpenAI shim)
│   ├── tenant/          # Multi-tenant subdomain routing
│   ├── supabase/        # Client, server, middleware
│   └── ...              # Crisis detection, achievements, leaderboard, etc.
└── ...
```

**Multi-tenant:** Organizations get subdomains (e.g., `venturelab.adaptable.one`). Middleware resolves tenant from hostname with 60s TTL cache and injects `x-tenant-*` headers. Server actions read org_id from auth (unforgeable), not headers.

**Per-lesson model routing:** 14 of 22 lessons use GPT-4o-mini for cost efficiency. 8 lessons requiring deeper reasoning use Claude Sonnet. Configured via `lessons.model_override` column.

**Prompt caching:** System prompts use Anthropic's `cache_control: { type: "ephemeral" }` to cache large context blocks across requests, reducing token costs ~90% on cached hits.

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Run development server
npm run dev
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`

## Database

48 migrations in `supabase/migrations/`. Key tables:
- `profiles` — Student/instructor accounts with org_id
- `lesson_progress` — Per-lesson completion state
- `ai_usage_log` — Token tracking, model routing, response times
- `scenario_sessions` / `scenario_badges` — Simulation state + achievements
- `organizations` / `classes` — Multi-tenant structure
- `teacher_alerts` — Crisis detection + instructor notifications

RLS policies enforce org-scoped access. Platform owner has cross-org read access.

## License

Proprietary. All rights reserved.
