/*
 * P0 Security Fixes:
 * 1. Invite code race condition — atomic check + increment
 * 2. AI usage rate limit race condition — atomic check + insert
 */

-- Fix 1: Replace blind increment with atomic check-and-increment.
-- Returns true if increment succeeded, false if max_uses exceeded or code not found.
create or replace function increment_invite_usage(invite_code text)
returns boolean as $$
declare
  rows_affected int;
begin
  update invite_codes
  set current_uses = current_uses + 1
  where code = invite_code
    and (max_uses is null or current_uses < max_uses);

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$ language plpgsql security definer;


-- Fix 2: Atomic rate-limit reservation.
-- Inserts a placeholder row (0 tokens) to "claim" the slot atomically,
-- then the app updates it with real token counts after streaming.
-- Returns 'ok' with the inserted row ID, or 'hourly_limit'/'daily_limit'.
create or replace function reserve_ai_usage(
  p_student_id uuid,
  p_feature text
)
returns table(status text, reservation_id uuid) as $$
declare
  daily_count int;
  hourly_count int;
  today_start timestamptz;
  hour_ago timestamptz;
  new_id uuid;
begin
  today_start := date_trunc('day', now());
  hour_ago := now() - interval '1 hour';

  -- Count with advisory lock on student to serialize concurrent requests
  perform pg_advisory_xact_lock(hashtext(p_student_id::text));

  select
    count(*) filter (where created_at >= today_start),
    count(*) filter (where created_at >= hour_ago)
  into daily_count, hourly_count
  from ai_usage_log
  where student_id = p_student_id
    and created_at >= today_start;

  if hourly_count >= 30 then
    status := 'hourly_limit';
    reservation_id := null;
    return next;
    return;
  end if;

  if daily_count >= 100 then
    status := 'daily_limit';
    reservation_id := null;
    return next;
    return;
  end if;

  -- Reserve the slot with placeholder values
  insert into ai_usage_log (student_id, feature, model, input_tokens, output_tokens, estimated_cost_usd)
  values (p_student_id, p_feature, 'pending', 0, 0, 0)
  returning id into new_id;

  status := 'ok';
  reservation_id := new_id;
  return next;
end;
$$ language plpgsql security definer;
