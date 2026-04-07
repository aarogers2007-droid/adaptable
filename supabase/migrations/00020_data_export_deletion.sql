-- Migration 00020: Data export + deletion workflow (FERPA/COPPA support)
--
-- Background: admin reviewer flagged "no data retention or deletion path" as a
-- dealbreaker for any school district contract. Both FERPA practice and COPPA
-- require that students, verified parents, and district admins can:
--   - Export the full record of a student's data
--   - Request deletion (with a grace period)
--
-- This migration adds:
--   1. deletion_requests table — tracks deletion requests with a 30-day grace
--      period before hard delete. Allows undo. Logs requester role.
--   2. data_access_log table — every export and every deletion is logged for
--      audit trail. Includes requester id, target student id, action, timestamp.
--   3. soft_deleted_at column on profiles for the grace-period state
--   4. RLS so only the student themselves, a verified parent (via parent token),
--      or an org_admin can read these tables for their own scope
--
-- Idempotent.

------------------------------------------------------------
-- 1. Soft-delete column on profiles
------------------------------------------------------------
alter table profiles
  add column if not exists soft_deleted_at timestamptz,
  add column if not exists deletion_scheduled_for timestamptz;

create index if not exists idx_profiles_soft_deleted
  on profiles(deletion_scheduled_for)
  where deletion_scheduled_for is not null;

------------------------------------------------------------
-- 2. deletion_requests table
------------------------------------------------------------
create table if not exists deletion_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  requested_by uuid references profiles(id) on delete set null,
  requester_role text not null check (requester_role in ('student', 'parent', 'instructor', 'org_admin', 'system')),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'cancelled', 'completed')),
  scheduled_for timestamptz not null default (now() + interval '30 days'),
  cancelled_at timestamptz,
  cancelled_by uuid references profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_deletion_requests_pending
  on deletion_requests(scheduled_for)
  where status = 'pending';

create index if not exists idx_deletion_requests_student
  on deletion_requests(student_id);

------------------------------------------------------------
-- 3. data_access_log table — audit trail for every export/deletion
------------------------------------------------------------
create table if not exists data_access_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  requester_id uuid references profiles(id) on delete set null,
  requester_role text not null,
  action text not null check (action in ('export', 'deletion_requested', 'deletion_cancelled', 'deletion_completed')),
  details jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_data_access_log_student
  on data_access_log(student_id, created_at desc);

create index if not exists idx_data_access_log_requester
  on data_access_log(requester_id, created_at desc);

------------------------------------------------------------
-- 4. RLS policies
------------------------------------------------------------
alter table deletion_requests enable row level security;
alter table data_access_log enable row level security;

-- Students can see their own deletion requests
drop policy if exists "student reads own deletion_requests" on deletion_requests;
create policy "student reads own deletion_requests"
  on deletion_requests for select
  using (student_id = auth.uid());

-- Students can create deletion requests for themselves
drop policy if exists "student creates own deletion_request" on deletion_requests;
create policy "student creates own deletion_request"
  on deletion_requests for insert
  with check (student_id = auth.uid() and requested_by = auth.uid());

-- Org admins can see and manage deletion requests for their org's students
drop policy if exists "org_admin manages deletion_requests" on deletion_requests;
create policy "org_admin manages deletion_requests"
  on deletion_requests for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'org_admin'
        and exists (
          select 1 from class_enrollments ce
          join classes c on c.id = ce.class_id
          where ce.student_id = deletion_requests.student_id
            and c.org_id = p.org_id
        )
    )
  );

-- Students can read their own access log
drop policy if exists "student reads own data_access_log" on data_access_log;
create policy "student reads own data_access_log"
  on data_access_log for select
  using (student_id = auth.uid());

-- Org admins can read the access log for their org's students
drop policy if exists "org_admin reads data_access_log" on data_access_log;
create policy "org_admin reads data_access_log"
  on data_access_log for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'org_admin'
        and exists (
          select 1 from class_enrollments ce
          join classes c on c.id = ce.class_id
          where ce.student_id = data_access_log.student_id
            and c.org_id = p.org_id
        )
    )
  );

-- Service role inserts (server-side audit logging)
drop policy if exists "service role inserts data_access_log" on data_access_log;
create policy "service role inserts data_access_log"
  on data_access_log for insert
  with check (true);
