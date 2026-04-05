create table if not exists student_card_config (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null unique,
  card_finish text not null default 'matte',
  accent_color text, -- null = use ikigai gradient
  back_design text not null default 'achievements',
  border_style text not null default 'clean',
  updated_at timestamptz default now() not null
);

alter table student_card_config enable row level security;
create policy "Students manage own card" on student_card_config for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
