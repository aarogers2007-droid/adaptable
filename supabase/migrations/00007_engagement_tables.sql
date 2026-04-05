/*
 * Engagement feature tables:
 * - daily_checkins: lightweight daily micro check-ins
 * - lesson_decisions: one-sentence decision journal per lesson
 * - business_pitches: "teach the AI" module-end pitches
 */

-- Daily check-ins (dashboard widget, ~30 seconds)
create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  prompt text not null,
  response text not null,
  ai_reply text,
  created_at timestamptz default now() not null
);

-- Lesson decision journal (one sentence per lesson)
create table if not exists lesson_decisions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade not null,
  decision_text text not null,
  created_at timestamptz default now() not null,
  unique(student_id, lesson_id)
);

-- Business pitches ("teach the AI" moment per module)
create table if not exists business_pitches (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  module_sequence int not null,
  pitch_text text not null,
  ai_feedback text,
  created_at timestamptz default now() not null,
  unique(student_id, module_sequence)
);

-- RLS: students can only access their own rows

alter table daily_checkins enable row level security;
create policy "Students read own checkins" on daily_checkins for select using (auth.uid() = student_id);
create policy "Students insert own checkins" on daily_checkins for insert with check (auth.uid() = student_id);

alter table lesson_decisions enable row level security;
create policy "Students read own decisions" on lesson_decisions for select using (auth.uid() = student_id);
create policy "Students insert own decisions" on lesson_decisions for insert with check (auth.uid() = student_id);
create policy "Students update own decisions" on lesson_decisions for update using (auth.uid() = student_id);

alter table business_pitches enable row level security;
create policy "Students read own pitches" on business_pitches for select using (auth.uid() = student_id);
create policy "Students insert own pitches" on business_pitches for insert with check (auth.uid() = student_id);
create policy "Students update own pitches" on business_pitches for update using (auth.uid() = student_id);

-- Instructors can read their students' data
create policy "Instructors read student checkins" on daily_checkins for select using (
  exists (
    select 1 from class_enrollments ce
    join classes c on c.id = ce.class_id
    where ce.student_id = daily_checkins.student_id
    and c.instructor_id = auth.uid()
  )
);

create policy "Instructors read student decisions" on lesson_decisions for select using (
  exists (
    select 1 from class_enrollments ce
    join classes c on c.id = ce.class_id
    where ce.student_id = lesson_decisions.student_id
    and c.instructor_id = auth.uid()
  )
);

create policy "Instructors read student pitches" on business_pitches for select using (
  exists (
    select 1 from class_enrollments ce
    join classes c on c.id = ce.class_id
    where ce.student_id = business_pitches.student_id
    and c.instructor_id = auth.uid()
  )
);

-- Index for quick lookups
create index idx_daily_checkins_student on daily_checkins(student_id, created_at desc);
create index idx_lesson_decisions_student on lesson_decisions(student_id);
create index idx_business_pitches_student on business_pitches(student_id);
