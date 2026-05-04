-- JST 暦日を半開区間 [00:00:00+09, 翌日 00:00:00+09) で扱う。
-- <= 23:59:59.999 だと timestamptz のマイクロ秒が範囲外になり得るため。

create or replace function public.get_daily_meal_summary(
  p_start timestamptz,
  p_end timestamptz
)
returns table(
  meal_count bigint,
  calories bigint,
  protein numeric,
  fat numeric,
  carbs numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::bigint as meal_count,
    coalesce(sum(total_calories), 0)::bigint as calories,
    coalesce(sum(protein), 0)::numeric as protein,
    coalesce(sum(fat), 0)::numeric as fat,
    coalesce(sum(carbs), 0)::numeric as carbs
  from public.meals
  where user_id = auth.uid()
    and eaten_at >= p_start
    and eaten_at < p_end;
$$;

-- p_day_end は排他的終端（翌日 00:00 JST に相当する timestamptz）

create or replace function public.claim_ai_analysis_slot(
  p_user_id uuid,
  p_model text,
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
  current_used integer;
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

  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_day_start::date::text, 0)
  );

  delete from public.ai_analysis_logs
  where user_id = p_user_id
    and success = false
    and analyzed_at >= p_day_start
    and analyzed_at < p_day_end
    and analyzed_at < now() - interval '15 minutes';

  select count(*)::integer
  into current_used
  from public.ai_analysis_logs
  where user_id = p_user_id
    and analyzed_at >= p_day_start
    and analyzed_at < p_day_end;

  if current_used >= p_daily_limit then
    return;
  end if;

  insert into public.ai_analysis_logs (user_id, model, success)
  values (p_user_id, p_model, false)
  returning id into inserted_log_id;

  return query select inserted_log_id, current_used + 1, p_daily_limit;
end;
$$;

create or replace function public.enforce_daily_meal_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meal_day text;
  day_start timestamptz;
  day_end_exclusive timestamptz;
  existing_count integer;
begin
  meal_day := to_char(new.eaten_at at time zone 'Asia/Tokyo', 'YYYY-MM-DD');
  day_start := (meal_day || ' 00:00:00+09')::timestamptz;
  day_end_exclusive := day_start + interval '1 day';

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':' || meal_day, 0));

  select count(*)
    into existing_count
  from public.meals
  where user_id = new.user_id
    and eaten_at >= day_start
    and eaten_at < day_end_exclusive
    and (tg_op <> 'UPDATE' or id <> new.id);

  if existing_count >= 8 then
    raise exception 'daily_meal_limit_exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- meal / item 上限は lib/meal-analysis.ts の MAX_MEAL_ITEMS_PER_MEAL（14）と同期すること

create or replace function public.create_meal_with_items(
  p_user_id uuid,
  p_eaten_at timestamptz,
  p_total_calories integer,
  p_protein numeric,
  p_fat numeric,
  p_carbs numeric,
  p_ai_confidence numeric,
  p_memo text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_meal_id uuid;
  meal_day text;
  day_start timestamptz;
  day_end_exclusive timestamptz;
  existing_count integer;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 14 then
    raise exception 'meal_items_limit_exceeded' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_user_id
      and deleted_at is null
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  meal_day := to_char(p_eaten_at at time zone 'Asia/Tokyo', 'YYYY-MM-DD');
  day_start := (meal_day || ' 00:00:00+09')::timestamptz;
  day_end_exclusive := day_start + interval '1 day';
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || meal_day, 0));

  select count(*)
    into existing_count
  from public.meals
  where user_id = p_user_id
    and eaten_at >= day_start
    and eaten_at < day_end_exclusive;

  if existing_count >= 8 then
    raise exception 'daily_meal_limit_exceeded' using errcode = 'P0001';
  end if;

  insert into public.meals (
    user_id,
    eaten_at,
    total_calories,
    protein,
    fat,
    carbs,
    ai_confidence,
    memo
  )
  values (
    p_user_id,
    p_eaten_at,
    p_total_calories,
    p_protein,
    p_fat,
    p_carbs,
    p_ai_confidence,
    nullif(p_memo, '')
  )
  returning id into inserted_meal_id;

  insert into public.meal_items (
    meal_id,
    name,
    estimated_amount,
    calories,
    protein,
    fat,
    carbs,
    confidence
  )
  select
    inserted_meal_id,
    item.name,
    item.estimated_amount,
    item.calories,
    item.protein,
    item.fat,
    item.carbs,
    item.confidence
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    name text,
    estimated_amount text,
    calories integer,
    protein numeric,
    fat numeric,
    carbs numeric,
    confidence numeric
  );

  return inserted_meal_id;
end;
$$;

revoke all on function public.get_daily_meal_summary(timestamptz, timestamptz) from public;
grant execute on function public.get_daily_meal_summary(timestamptz, timestamptz) to authenticated;

revoke all on function public.claim_ai_analysis_slot(uuid, text, integer, timestamptz, timestamptz)
  from public;
grant execute on function public.claim_ai_analysis_slot(uuid, text, integer, timestamptz, timestamptz)
  to authenticated;

revoke all on function public.enforce_daily_meal_limit() from public, anon, authenticated;

revoke all on function public.create_meal_with_items(
  uuid,
  timestamptz,
  integer,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  jsonb
) from public;
grant execute on function public.create_meal_with_items(
  uuid,
  timestamptz,
  integer,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  jsonb
) to authenticated;

-- p_day_end は排他的終端（翌 JST 00:00）

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
    and suggested_at < p_day_end
    and suggested_at < now() - interval '15 minutes';

  select count(*)::integer
  into current_reserved
  from public.meal_suggestion_logs
  where user_id = p_user_id
    and suggested_at >= p_day_start
    and suggested_at < p_day_end;

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
    and suggested_at < p_day_end;

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
