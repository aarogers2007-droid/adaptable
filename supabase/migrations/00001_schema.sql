/*
 * Adaptable — core schema
 *
 * Entity relationships:
 *
 *   organizations
 *     └── classes
 *           ├── class_enrollments ──▶ profiles (students)
 *           ├── invite_codes
 *           └── instructor_id ──▶ profiles (instructor)
 *
 *   profiles (all authenticated users)
 *     ├── role: student | instructor | org_admin
 *     ├── business_idea (JSONB, nullable, student-only)
 *     ├── ikigai_result (JSONB, nullable, student-only)
 *     └── parent_access_pin / parent_access_token (student-only)
 *
 *   lessons ──▶ student_progress (per student per lesson)
 *   ai_conversations (per student, chat history)
 *   mentor_checkins (per student, weekly AI check-ins)
 *   ai_usage_log (observability, every Claude API call)
 */

-- Enable UUID generation
create extension if not exists "pgcrypto";

------------------------------------------------------------
-- ORGANIZATIONS
------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

------------------------------------------------------------
-- PROFILES (extends Supabase Auth users)
------------------------------------------------------------
create type user_role as enum ('student', 'instructor', 'org_admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'student',
  org_id uuid references organizations(id),
  full_name text,
  email text,
  avatar_url text,

  -- Student-specific fields (nullable for non-students)
  business_idea jsonb,        -- {niche, name, target_customer, pricing}
  ikigai_result jsonb,        -- {passions, skills, needs, monetization}
  ikigai_draft jsonb,         -- draft state for incomplete wizard
  parent_access_pin text,     -- bcrypt hash of 6-digit PIN
  parent_access_token uuid default gen_random_uuid(), -- unguessable URL token
  niche_recommendations jsonb, -- cached AI-generated recommendations

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

------------------------------------------------------------
-- CLASSES
------------------------------------------------------------
create table classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  instructor_id uuid not null references profiles(id),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

------------------------------------------------------------
-- CLASS ENROLLMENTS
------------------------------------------------------------
create table class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(class_id, student_id)
);

------------------------------------------------------------
-- INVITE CODES
------------------------------------------------------------
create table invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  class_id uuid not null references classes(id) on delete cascade,
  created_by uuid not null references profiles(id),
  expires_at timestamptz,
  max_uses int,
  current_uses int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_invite_codes_code on invite_codes(code);

------------------------------------------------------------
-- LESSONS
------------------------------------------------------------
create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_name text not null,
  module_sequence int not null,         -- order of module (1, 2, 3...)
  lesson_sequence int not null,         -- order within module (1, 2, 3...)
  title text not null,
  content_template text not null,       -- markdown with {{niche}}, {{business_name}} tokens
  personalization_prompts jsonb,        -- Claude prompt templates for AI-enhanced examples
  video_url text,                       -- YouTube embed URL (nullable)
  curriculum_version int not null default 1, -- bump to invalidate cached examples
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(module_sequence, lesson_sequence)
);

------------------------------------------------------------
-- STUDENT PROGRESS
------------------------------------------------------------
create type progress_status as enum ('not_started', 'in_progress', 'completed');

create table student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status progress_status not null default 'not_started',
  artifacts jsonb,                      -- student-produced deliverables (validated by Zod)
  cached_examples jsonb,                -- AI-enhanced examples (cached per student per lesson)
  cached_examples_version int,          -- matches lessons.curriculum_version when generated
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

create index idx_student_progress_student on student_progress(student_id);
create index idx_student_progress_lesson on student_progress(lesson_id, student_id);

------------------------------------------------------------
-- AI CONVERSATIONS
------------------------------------------------------------
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  context_snapshot jsonb,               -- business state at conversation start
  messages jsonb not null default '[]', -- [{role, content, timestamp}]
  message_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_conversations_student on ai_conversations(student_id, created_at desc);

------------------------------------------------------------
-- MENTOR CHECK-INS
------------------------------------------------------------
create table mentor_checkins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  content text not null,                -- AI-generated summary + recommendations
  created_at timestamptz not null default now()
);

create index idx_mentor_checkins_student on mentor_checkins(student_id, created_at desc);

------------------------------------------------------------
-- AI USAGE LOG (observability)
------------------------------------------------------------
create table ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete set null,
  feature text not null,                -- 'guide' | 'ikigai' | 'checkin' | 'recommendations'
  model text not null,
  input_tokens int not null,
  output_tokens int not null,
  estimated_cost_usd numeric(10, 6),
  created_at timestamptz not null default now()
);

create index idx_ai_usage_log_student on ai_usage_log(student_id, created_at desc);
create index idx_ai_usage_log_feature on ai_usage_log(feature, created_at desc);

------------------------------------------------------------
-- UPDATED_AT TRIGGER
------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_updated_at before update on organizations
  for each row execute function update_updated_at();
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger trg_classes_updated_at before update on classes
  for each row execute function update_updated_at();
create trigger trg_lessons_updated_at before update on lessons
  for each row execute function update_updated_at();
create trigger trg_student_progress_updated_at before update on student_progress
  for each row execute function update_updated_at();
create trigger trg_ai_conversations_updated_at before update on ai_conversations
  for each row execute function update_updated_at();
