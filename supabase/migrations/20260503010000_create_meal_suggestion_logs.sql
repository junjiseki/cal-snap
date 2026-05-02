create table if not exists public.meal_suggestion_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  suggested_at timestamptz not null default now(),
  model text not null,
  context text not null check (context in ('eat_out', 'cook', 'convenience')),
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner')),
  success boolean not null default false
);

create index if not exists meal_suggestion_logs_user_suggested_at_idx
  on public.meal_suggestion_logs (user_id, suggested_at desc);

alter table public.meal_suggestion_logs enable row level security;

drop policy if exists "meal_suggestion_logs_select_own" on public.meal_suggestion_logs;
create policy "meal_suggestion_logs_select_own" on public.meal_suggestion_logs
  for select using (auth.uid() = user_id);

create or replace function public.claim_meal_suggestion_slot(
  p_user_id uuid,
  p_model text,
  p_context text,
  p_meal_slot text,
  p_daily_limit integer,
  p_day_start timestamptz,
  p_day_end timestamptz
)
returns table(log_id uuid, used integer, daily_limit integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_reserved integer;
  success_count integer;
  inserted_log_id uuid;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_user_id
      and deleted_at is null
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_daily_limit < 1 then
    raise exception 'daily limit must be positive' using errcode = '22023';
  end if;

  if p_context not in ('eat_out', 'cook', 'convenience') then
    raise exception 'invalid context' using errcode = '22023';
  end if;

  if p_meal_slot not in ('breakfast', 'lunch', 'dinner') then
    raise exception 'invalid meal slot' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':meal-suggestion:' || p_day_start::date::text, 0)
  );

  delete from public.meal_suggestion_logs
  where user_id = p_user_id
    and success = false
    and suggested_at >= p_day_start
    and suggested_at <= p_day_end
    and suggested_at < now() - interval '15 minutes';

  select count(*)::integer
  into current_reserved
  from public.meal_suggestion_logs
  where user_id = p_user_id
    and suggested_at >= p_day_start
    and suggested_at <= p_day_end;

  if current_reserved >= p_daily_limit then
    return;
  end if;

  insert into public.meal_suggestion_logs (user_id, model, context, meal_slot, success)
  values (p_user_id, p_model, p_context, p_meal_slot, false)
  returning id into inserted_log_id;

  select count(*)::integer
  into success_count
  from public.meal_suggestion_logs
  where user_id = p_user_id
    and success = true
    and suggested_at >= p_day_start
    and suggested_at <= p_day_end;

  return query select inserted_log_id, success_count + 1, p_daily_limit;
end;
$$;

revoke all on function public.claim_meal_suggestion_slot(
  uuid,
  text,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) from public;
grant execute on function public.claim_meal_suggestion_slot(
  uuid,
  text,
  text,
  text,
  integer,
  timestamptz,
  timestamptz
) to authenticated;
