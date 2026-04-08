-- Migration 00023: Tester feedback box
--
-- AJ is having friends and family go through Adaptable on 2026-04-09 to
-- collect first-impressions feedback. This table captures the messages
-- they leave via the "Tell AJ your thoughts" box on the dashboard.
--
-- Anonymous testers welcome — user_id is nullable.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  user_name text, -- captured at submit time so the row is readable even if profile gets deleted
  page text, -- which route they were on (e.g. "/dashboard", "/lessons/abc", "/onboarding")
  message text not null check (length(message) >= 1 and length(message) <= 5000),
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_created_at on feedback(created_at desc);

-- RLS: anyone authenticated can INSERT (so testers without org_admin role can submit)
-- Only org_admin can SELECT — feedback is private to AJ
alter table feedback enable row level security;

drop policy if exists "anyone authenticated can submit feedback" on feedback;
create policy "anyone authenticated can submit feedback"
  on feedback for insert
  with check (auth.uid() is not null);

drop policy if exists "org_admin reads feedback" on feedback;
create policy "org_admin reads feedback"
  on feedback for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'org_admin'
    )
  );
