/*
 * Teacher Agency Tools:
 * - teacher_comments: comments on student artifacts (decisions, pitches, progress)
 * - teacher_flags: follow-up flags with priority and due dates
 * - intervention_log: audit trail of all teacher actions
 */

-- Teacher comments on student work
create table if not exists teacher_comments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  student_id uuid references auth.users(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  artifact_type text not null check (artifact_type in ('decision_journal', 'business_pitch', 'lesson_progress', 'check_in')),
  artifact_id uuid not null,
  comment_text text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table teacher_comments enable row level security;

-- Teachers can manage their own comments
create policy "Teachers manage own comments" on teacher_comments
  for all using (teacher_id = auth.uid());

-- Students can read comments addressed to them
create policy "Students read own comments" on teacher_comments
  for select using (student_id = auth.uid());

-- Teacher follow-up flags
create table if not exists teacher_flags (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  student_id uuid references auth.users(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  note text,
  due_date date,
  resolved boolean default false not null,
  resolved_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table teacher_flags enable row level security;

-- Teachers manage their own flags
create policy "Teachers manage own flags" on teacher_flags
  for all using (teacher_id = auth.uid());

-- Intervention log (audit trail)
create table if not exists intervention_log (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade not null,
  student_id uuid references auth.users(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  action_type text not null check (action_type in (
    'message_sent', 'nudge_sent', 'alert_resolved', 'alert_acknowledged',
    'comment_left', 'comment_deleted', 'flag_set', 'flag_resolved'
  )),
  details jsonb,
  created_at timestamptz default now() not null
);

alter table intervention_log enable row level security;

-- Teachers read their own intervention logs
create policy "Teachers read own logs" on intervention_log
  for all using (teacher_id = auth.uid());

-- Indexes
create index idx_teacher_comments_student on teacher_comments(student_id, created_at desc);
create index idx_teacher_comments_artifact on teacher_comments(artifact_type, artifact_id);
create index idx_teacher_flags_teacher on teacher_flags(teacher_id, resolved, due_date);
create index idx_teacher_flags_student on teacher_flags(student_id, resolved);
create index idx_intervention_log_teacher on intervention_log(teacher_id, created_at desc);
create index idx_intervention_log_student on intervention_log(student_id, created_at desc);
