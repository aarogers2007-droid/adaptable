-- Migration 00018: Distinct crisis alert type + audit fields
--
-- Background: crisis signals were previously stored as alert_type='content_flag'
-- with severity='urgent' + a context blob. This commingles real crises with
-- profanity flags in the dashboard, makes audit reports impossible, and is the
-- kind of thing a plaintiff's lawyer asks about in a deposition.
--
-- This migration is idempotent and resilient:
--   1. Adds new audit columns (IF NOT EXISTS)
--   2. Drops any existing alert_type check constraint
--   3. Backfills existing crisis-context content_flags into the new 'crisis' type
--      BEFORE recreating the constraint (so the new constraint sees clean data)
--   4. Discovers ALL existing distinct alert_type values in the table and
--      includes them in the new constraint along with our known set, so we
--      never break on unknown types added by prior migrations or dashboard work
--   5. Creates notification_failures table for the email failure path
--
-- NOTE: assumes teacher_alerts table already exists (created via dashboard
-- in a prior phase).

------------------------------------------------------------
-- 1. Add new audit columns
------------------------------------------------------------
alter table teacher_alerts
  add column if not exists crisis_type text,
  add column if not exists severity_at_creation text,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists acknowledged_by uuid references profiles(id) on delete set null,
  add column if not exists resolution_action text,
  add column if not exists resolution_notes text,
  add column if not exists notified_at timestamptz,
  add column if not exists notification_channel text,
  add column if not exists notification_failed boolean default false;

------------------------------------------------------------
-- 2. Drop any existing alert_type check constraint
------------------------------------------------------------
do $$
declare
  con_name text;
begin
  for con_name in
    select conname
    from pg_constraint
    where conrelid = 'teacher_alerts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%alert_type%'
  loop
    execute format('alter table teacher_alerts drop constraint %I', con_name);
  end loop;
exception
  when undefined_table then
    raise notice 'teacher_alerts table does not exist yet';
end $$;

------------------------------------------------------------
-- 3. Backfill crisis-context content_flags into the new 'crisis' type
--    Runs BEFORE recreating the constraint so the new value is allowed.
------------------------------------------------------------
update teacher_alerts
set
  alert_type = 'crisis',
  crisis_type = coalesce(crisis_type, context->>'crisis_type'),
  severity_at_creation = coalesce(severity_at_creation, severity)
where alert_type = 'content_flag'
  and (
    (context->>'requires_immediate_attention')::boolean is true
    or context->>'crisis_type' is not null
  );

------------------------------------------------------------
-- 4. Recreate the constraint, including ANY existing distinct alert_type
--    values found in the table plus our known set. This means the migration
--    survives whatever values prior migrations or dashboard edits introduced.
------------------------------------------------------------
do $$
declare
  all_types text[];
  type_list text;
begin
  select array(
    select distinct t
    from (
      select unnest(
        coalesce(
          (select array_agg(distinct alert_type) from teacher_alerts where alert_type is not null),
          array[]::text[]
        )
        ||
        array['inactive', 'stuck', 'emotional', 'content_flag', 'parent_message', 'crisis']
      ) as t
    ) sub
    where t is not null
  ) into all_types;

  -- Build a quoted, comma-separated IN list
  select string_agg(format('%L', t), ', ' order by t) into type_list
  from unnest(all_types) t;

  if type_list is null or type_list = '' then
    type_list := '''inactive'', ''stuck'', ''emotional'', ''content_flag'', ''parent_message'', ''crisis''';
  end if;

  execute format(
    'alter table teacher_alerts add constraint teacher_alerts_alert_type_check check (alert_type in (%s))',
    type_list
  );

  raise notice 'teacher_alerts_alert_type_check created with values: %', type_list;
end $$;

------------------------------------------------------------
-- 4. Index for fast crisis-only queries on the dashboard
------------------------------------------------------------
create index if not exists idx_teacher_alerts_crisis
  on teacher_alerts(class_id, created_at desc)
  where alert_type = 'crisis' and acknowledged = false;

------------------------------------------------------------
-- 5. notification_failures table — surfaces email/SMS delivery failures
--    The dashboard reads this on load and shows a hard banner if any
--    crisis-alert notification failed to deliver.
------------------------------------------------------------
create table if not exists notification_failures (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references teacher_alerts(id) on delete cascade,
  channel text not null,
  reason text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_notification_failures_unresolved
  on notification_failures(created_at desc)
  where resolved_at is null;

-- RLS: only org_admins can read the failures table (ops surface)
alter table notification_failures enable row level security;

drop policy if exists "org_admin reads notification_failures" on notification_failures;
create policy "org_admin reads notification_failures"
  on notification_failures for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'org_admin'
    )
  );

-- Service role can insert (server-side only)
drop policy if exists "service role inserts notification_failures" on notification_failures;
create policy "service role inserts notification_failures"
  on notification_failures for insert
  with check (true);
