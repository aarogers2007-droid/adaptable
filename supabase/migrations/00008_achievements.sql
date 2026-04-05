/*
 * Student achievements / badges system.
 * Each row = one earned achievement at a specific tier.
 */

create table if not exists student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  achievement_id text not null,
  tier text not null check (tier in ('bronze', 'silver', 'gold')),
  earned_at timestamptz default now() not null,
  unique(student_id, achievement_id, tier)
);

alter table student_achievements enable row level security;

create policy "Students read own achievements" on student_achievements
  for select using (auth.uid() = student_id);

create policy "Students read classmate achievements" on student_achievements
  for select using (
    exists (
      select 1 from class_enrollments ce1
      join class_enrollments ce2 on ce1.class_id = ce2.class_id
      where ce1.student_id = auth.uid()
      and ce2.student_id = student_achievements.student_id
    )
  );

create policy "Org members read achievements" on student_achievements
  for select using (
    exists (
      select 1 from profiles p1
      join profiles p2 on p1.org_id = p2.org_id
      where p1.id = auth.uid()
      and p2.id = student_achievements.student_id
      and p1.org_id is not null
    )
  );

create index idx_achievements_student on student_achievements(student_id);
