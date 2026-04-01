/*
 * Row Level Security policies
 *
 * Access control model:
 *   student     → own data only
 *   instructor  → own data + students in their classes
 *   org_admin   → all data in their organization
 *   anonymous   → parent view via access token (no auth)
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │ org_admin: sees everything in org               │
 *   │   ┌─────────────────────────────────────────┐   │
 *   │   │ instructor: sees own classes + students  │   │
 *   │   │   ┌─────────────────────────────────┐   │   │
 *   │   │   │ student: sees only own data      │   │   │
 *   │   │   └─────────────────────────────────┘   │   │
 *   │   └─────────────────────────────────────────┘   │
 *   └─────────────────────────────────────────────────┘
 */

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table classes enable row level security;
alter table class_enrollments enable row level security;
alter table invite_codes enable row level security;
alter table lessons enable row level security;
alter table student_progress enable row level security;
alter table ai_conversations enable row level security;
alter table mentor_checkins enable row level security;
alter table ai_usage_log enable row level security;

------------------------------------------------------------
-- Helper: get current user's role
------------------------------------------------------------
create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

------------------------------------------------------------
-- Helper: get current user's org_id
------------------------------------------------------------
create or replace function auth_org_id()
returns uuid as $$
  select org_id from profiles where id = auth.uid()
$$ language sql security definer stable;

------------------------------------------------------------
-- PROFILES
------------------------------------------------------------
-- Users can read their own profile
create policy "Users can read own profile"
  on profiles for select using (id = auth.uid());

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());

-- Instructors can read profiles of students in their classes
create policy "Instructors can read class students"
  on profiles for select using (
    auth_role() = 'instructor'
    and id in (
      select ce.student_id from class_enrollments ce
      join classes c on c.id = ce.class_id
      where c.instructor_id = auth.uid()
    )
  );

-- Org admins can read all profiles in their org
create policy "Org admins can read org profiles"
  on profiles for select using (
    auth_role() = 'org_admin'
    and org_id = auth_org_id()
  );

-- Allow inserting own profile on signup
create policy "Users can insert own profile"
  on profiles for insert with check (id = auth.uid());

------------------------------------------------------------
-- ORGANIZATIONS
------------------------------------------------------------
create policy "Members can read own org"
  on organizations for select using (
    id = auth_org_id()
  );

create policy "Org admins can update org"
  on organizations for update using (
    auth_role() = 'org_admin' and id = auth_org_id()
  );

------------------------------------------------------------
-- CLASSES
------------------------------------------------------------
-- Students see classes they're enrolled in
create policy "Students see enrolled classes"
  on classes for select using (
    id in (select class_id from class_enrollments where student_id = auth.uid())
  );

-- Instructors see their own classes
create policy "Instructors see own classes"
  on classes for select using (instructor_id = auth.uid());

-- Instructors can create classes in their org
create policy "Instructors can create classes"
  on classes for insert with check (
    auth_role() in ('instructor', 'org_admin')
    and org_id = auth_org_id()
  );

-- Instructors can update their own classes
create policy "Instructors can update own classes"
  on classes for update using (instructor_id = auth.uid());

-- Org admins see all classes in their org
create policy "Org admins see org classes"
  on classes for select using (
    auth_role() = 'org_admin' and org_id = auth_org_id()
  );

------------------------------------------------------------
-- CLASS ENROLLMENTS
------------------------------------------------------------
-- Students see their own enrollments
create policy "Students see own enrollments"
  on class_enrollments for select using (student_id = auth.uid());

-- Students can enroll themselves (via invite code, validated in app)
create policy "Students can enroll"
  on class_enrollments for insert with check (student_id = auth.uid());

-- Instructors see enrollments for their classes
create policy "Instructors see class enrollments"
  on class_enrollments for select using (
    class_id in (select id from classes where instructor_id = auth.uid())
  );

-- Org admins see all enrollments in their org
create policy "Org admins see org enrollments"
  on class_enrollments for select using (
    class_id in (
      select id from classes where org_id = auth_org_id()
    )
    and auth_role() = 'org_admin'
  );

------------------------------------------------------------
-- INVITE CODES
------------------------------------------------------------
-- Anyone authenticated can read invite codes (to validate on join)
create policy "Authenticated users can read invite codes"
  on invite_codes for select using (auth.uid() is not null);

-- Instructors can create invite codes for their classes
create policy "Instructors can create invite codes"
  on invite_codes for insert with check (
    class_id in (select id from classes where instructor_id = auth.uid())
  );

-- Instructors can update their own invite codes (increment uses)
create policy "Instructors can update invite codes"
  on invite_codes for update using (
    class_id in (select id from classes where instructor_id = auth.uid())
  );

------------------------------------------------------------
-- LESSONS
------------------------------------------------------------
-- All authenticated users can read lessons
create policy "Authenticated users can read lessons"
  on lessons for select using (auth.uid() is not null);

-- Org admins can manage lessons
create policy "Org admins can manage lessons"
  on lessons for all using (auth_role() = 'org_admin');

------------------------------------------------------------
-- STUDENT PROGRESS
------------------------------------------------------------
-- Students see and manage their own progress
create policy "Students manage own progress"
  on student_progress for all using (student_id = auth.uid());

-- Instructors see progress for students in their classes
create policy "Instructors see class progress"
  on student_progress for select using (
    student_id in (
      select ce.student_id from class_enrollments ce
      join classes c on c.id = ce.class_id
      where c.instructor_id = auth.uid()
    )
  );

-- Org admins see all progress in their org
create policy "Org admins see org progress"
  on student_progress for select using (
    auth_role() = 'org_admin'
    and student_id in (
      select p.id from profiles p where p.org_id = auth_org_id()
    )
  );

------------------------------------------------------------
-- AI CONVERSATIONS
------------------------------------------------------------
-- Students manage their own conversations
create policy "Students manage own conversations"
  on ai_conversations for all using (student_id = auth.uid());

------------------------------------------------------------
-- MENTOR CHECK-INS
------------------------------------------------------------
-- Students see their own check-ins
create policy "Students see own checkins"
  on mentor_checkins for all using (student_id = auth.uid());

------------------------------------------------------------
-- AI USAGE LOG
------------------------------------------------------------
-- Only insertable by authenticated users (logged server-side)
create policy "Authenticated users can insert usage logs"
  on ai_usage_log for insert with check (auth.uid() is not null);

-- Org admins can read usage logs for their org
create policy "Org admins can read usage logs"
  on ai_usage_log for select using (
    auth_role() = 'org_admin'
    and (
      student_id is null
      or student_id in (select p.id from profiles p where p.org_id = auth_org_id())
    )
  );
