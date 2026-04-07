-- Migration 00021: COPPA technical scaffolding
--
-- Background: admin reviewer flagged COPPA absence as a contractual dealbreaker.
-- Adaptable accepts students 12-18, which means under-13s are explicitly in
-- scope. COPPA requires verifiable parental consent for under-13s, OR the
-- school can act as the consenting party under FTC's "school authorization"
-- exception.
--
-- This migration adds the TECHNICAL scaffolding only. Real legal copy and
-- procedural review must come from a lawyer before this is enabled in
-- production for under-13 students.
--
-- Adds:
--   1. profiles.date_of_birth (date, nullable, set during signup)
--   2. profiles.consent_status (text, default 'not_required')
--   3. student_consent table — tracks the consent record per student
--   4. parental_consent_tokens table — single-use tokens emailed to parents
--   5. RLS so only the student or org_admin can read their consent status
--
-- Idempotent.

------------------------------------------------------------
-- 1. profiles.date_of_birth + consent_status
------------------------------------------------------------
alter table profiles
  add column if not exists date_of_birth date,
  add column if not exists consent_status text default 'not_required'
    check (consent_status in (
      'not_required',           -- 13+, no consent needed
      'pending_parental',       -- under 13, awaiting parent verification
      'pending_school',         -- under 13, awaiting school authorization
      'parental_verified',      -- under 13, parent confirmed
      'school_authorized',      -- under 13, school is the consenting party
      'denied',                 -- consent denied or expired
      'revoked'                 -- consent withdrawn
    ));

create index if not exists idx_profiles_consent_status
  on profiles(consent_status)
  where consent_status in ('pending_parental', 'pending_school', 'denied');

------------------------------------------------------------
-- 2. student_consent table
------------------------------------------------------------
create table if not exists student_consent (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  consent_type text not null check (consent_type in ('parental_verified', 'school_authorized')),
  consenting_party_email text,
  consenting_party_name text,
  consenting_party_role text,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  evidence jsonb,
  ip_address text
);

create index if not exists idx_student_consent_active
  on student_consent(student_id)
  where revoked_at is null;

------------------------------------------------------------
-- 3. parental_consent_tokens — single-use, time-limited
------------------------------------------------------------
create table if not exists parental_consent_tokens (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  token text not null unique,
  parent_email text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  consent_outcome text check (consent_outcome in ('granted', 'denied')),
  created_at timestamptz not null default now()
);

create index if not exists idx_parental_consent_tokens_unused
  on parental_consent_tokens(token)
  where used_at is null;

------------------------------------------------------------
-- 4. RLS
------------------------------------------------------------
alter table student_consent enable row level security;
alter table parental_consent_tokens enable row level security;

drop policy if exists "student reads own consent" on student_consent;
create policy "student reads own consent"
  on student_consent for select
  using (student_id = auth.uid());

drop policy if exists "org_admin reads consent in org" on student_consent;
create policy "org_admin reads consent in org"
  on student_consent for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'org_admin'
        and exists (
          select 1 from class_enrollments ce
          join classes c on c.id = ce.class_id
          where ce.student_id = student_consent.student_id
            and c.org_id = p.org_id
        )
    )
  );

-- parental_consent_tokens: server-only access (no direct user reads)
drop policy if exists "service role manages parental_consent_tokens" on parental_consent_tokens;
create policy "service role manages parental_consent_tokens"
  on parental_consent_tokens for all
  with check (true);
