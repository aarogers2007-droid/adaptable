/*
 * Fix: set org_id to the default Adaptable org in the auth trigger so
 * new profiles NEVER have null org_id. Previously the trigger left
 * org_id null and relied on the client to update it, causing a race
 * condition that produced 403 errors on lesson-chat.
 */
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, org_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'student',
    '00000000-0000-0000-0000-000000000001'
  );
  return new;
end;
$$ language plpgsql security definer;
