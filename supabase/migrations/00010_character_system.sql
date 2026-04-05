/*
 * Character system tables:
 * - character_system_config: defines each character's personality, prompt, and behavior
 * - character_handoffs: tracks when students switch between characters
 * - student_unlocked_characters: tracks which characters each student has met
 * - character_consistency_log: logs consistency check failures for debugging
 */

-- Character definitions
create table if not exists character_system_config (
  id uuid primary key default gen_random_uuid(),
  character_key text unique not null,
  name text not null,
  creature text not null,
  domain text not null,
  personality_summary text not null,
  system_prompt text not null,
  communication_style jsonb not null default '{}',
  behavioral_rules jsonb not null default '{}',
  signature_phrases text[] not null default '{}',
  unlock_condition text not null default 'default',
  domain_color text not null default '#0D9488',
  image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Character handoffs (when a student switches between characters)
create table if not exists character_handoffs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  from_character text not null references character_system_config(character_key),
  to_character text not null references character_system_config(character_key),
  trigger_message text,
  created_at timestamptz default now() not null
);

-- Student unlocked characters (first encounter tracking)
create table if not exists student_unlocked_characters (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  character_key text not null references character_system_config(character_key),
  first_encountered_at timestamptz default now() not null,
  unique(student_id, character_key)
);

-- Consistency check failures (debugging log)
create table if not exists character_consistency_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  character_key text not null,
  failure_type text not null,
  original_response text,
  corrected boolean default false,
  created_at timestamptz default now() not null
);

-- RLS policies

alter table character_system_config enable row level security;
create policy "Anyone can read character configs" on character_system_config for select using (true);

alter table character_handoffs enable row level security;
create policy "Students read own handoffs" on character_handoffs for select using (auth.uid() = student_id);
create policy "Students insert own handoffs" on character_handoffs for insert with check (auth.uid() = student_id);

alter table student_unlocked_characters enable row level security;
create policy "Students read own unlocks" on student_unlocked_characters for select using (auth.uid() = student_id);
create policy "Students insert own unlocks" on student_unlocked_characters for insert with check (auth.uid() = student_id);

-- Instructors can read their students' data
create policy "Instructors read student handoffs" on character_handoffs for select using (
  exists (
    select 1 from class_enrollments ce
    join classes c on c.id = ce.class_id
    where ce.student_id = character_handoffs.student_id
    and c.instructor_id = auth.uid()
  )
);

create policy "Instructors read student unlocks" on student_unlocked_characters for select using (
  exists (
    select 1 from class_enrollments ce
    join classes c on c.id = ce.class_id
    where ce.student_id = student_unlocked_characters.student_id
    and c.instructor_id = auth.uid()
  )
);

alter table character_consistency_log enable row level security;
create policy "Service role only for consistency log" on character_consistency_log for all using (false);

-- Indexes
create index idx_handoffs_student on character_handoffs(student_id, created_at desc);
create index idx_unlocked_student on student_unlocked_characters(student_id);
create index idx_consistency_log on character_consistency_log(student_id, created_at desc);
create index idx_character_key on character_system_config(character_key);
