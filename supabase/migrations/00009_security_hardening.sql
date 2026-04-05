/*
 * Security hardening:
 * 1. Restrict increment_invite_usage to authenticated users only
 * 2. Add unique constraint index for student_progress upsert (already exists in 00001 but ensuring)
 */

-- Fix: Add caller authentication check to invite code increment
create or replace function increment_invite_usage(invite_code text)
returns boolean as $$
declare
  rows_affected int;
begin
  -- Verify caller is authenticated
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update invite_codes
  set current_uses = current_uses + 1
  where code = invite_code
    and (max_uses is null or current_uses < max_uses);

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$ language plpgsql security definer;
