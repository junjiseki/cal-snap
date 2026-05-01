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
    and analyzed_at <= p_day_end
    and analyzed_at < now() - interval '15 minutes';

  select count(*)::integer
  into current_used
  from public.ai_analysis_logs
  where user_id = p_user_id
    and analyzed_at >= p_day_start
    and analyzed_at <= p_day_end;

  if current_used >= p_daily_limit then
    return;
  end if;

  insert into public.ai_analysis_logs (user_id, model, success)
  values (p_user_id, p_model, false)
  returning id into inserted_log_id;

  return query select inserted_log_id, current_used + 1, p_daily_limit;
end;
$$;

revoke all on function public.claim_ai_analysis_slot(uuid, text, integer, timestamptz, timestamptz)
  from public;
grant execute on function public.claim_ai_analysis_slot(uuid, text, integer, timestamptz, timestamptz)
  to authenticated;

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
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'forbidden' using errcode = '42501';
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
