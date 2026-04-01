/*
 * Database functions used by the application.
 */

-- Increment invite code usage count atomically
create or replace function increment_invite_usage(invite_code text)
returns void as $$
begin
  update invite_codes
  set current_uses = current_uses + 1
  where code = invite_code;
end;
$$ language plpgsql security definer;
