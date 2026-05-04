-- Limit meal volume server-side so paid users and direct Supabase clients cannot bypass it.

create or replace function public.enforce_daily_meal_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meal_day text;
  existing_count integer;
begin
  meal_day := to_char(new.eaten_at at time zone 'Asia/Tokyo', 'YYYY-MM-DD');

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':' || meal_day, 0));

  select count(*)
    into existing_count
  from public.meals
  where user_id = new.user_id
    and eaten_at >= (meal_day || ' 00:00:00+09')::timestamptz
    and eaten_at <= (meal_day || ' 23:59:59.999+09')::timestamptz
    and (tg_op <> 'UPDATE' or id <> new.id);

  if existing_count >= 8 then
    raise exception 'daily_meal_limit_exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_daily_meal_limit_trigger on public.meals;
create trigger enforce_daily_meal_limit_trigger
before insert or update of user_id, eaten_at on public.meals
for each row execute function public.enforce_daily_meal_limit();

create or replace function public.enforce_meal_items_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.meal_id::text, 0));

  select count(*)
    into item_count
  from public.meal_items
  where meal_id = new.meal_id;

  if item_count > 14 then
    raise exception 'meal_items_limit_exceeded' using errcode = 'P0001';
  end if;

  return null;
end;
$$;

drop trigger if exists enforce_meal_items_limit_trigger on public.meal_items;
create trigger enforce_meal_items_limit_trigger
after insert or update of meal_id on public.meal_items
for each row execute function public.enforce_meal_items_limit();

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
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || meal_day, 0));

  select count(*)
    into existing_count
  from public.meals
  where user_id = p_user_id
    and eaten_at >= (meal_day || ' 00:00:00+09')::timestamptz
    and eaten_at <= (meal_day || ' 23:59:59.999+09')::timestamptz;

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

revoke all on function public.enforce_daily_meal_limit() from public, anon, authenticated;
revoke all on function public.enforce_meal_items_limit() from public, anon, authenticated;
