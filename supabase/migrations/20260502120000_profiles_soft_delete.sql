-- 論理削除: profiles.deleted_at。RLS と RPC でアプリ利用を止める。

alter table public.profiles
add column if not exists deleted_at timestamptz;

comment on column public.profiles.deleted_at is '設定時はアカウント利用停止（論理削除）';

create or replace function public.current_profile_active()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and deleted_at is null
  );
$$;

revoke all on function public.current_profile_active() from public;
grant execute on function public.current_profile_active() to authenticated;

create or replace function public.soft_delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  update public.profiles
  set deleted_at = now()
  where id = auth.uid()
    and deleted_at is null;
end;
$$;

revoke all on function public.soft_delete_my_account() from public;
grant execute on function public.soft_delete_my_account() to authenticated;

-- RLS: 利用中アカウントのみデータ操作可。削除済みでも自分の profile 行は参照可（deleted_at 確認用）。

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id and deleted_at is null)
  with check (auth.uid() = id and deleted_at is null);

drop policy if exists "meals_select_own" on public.meals;
drop policy if exists "meals_insert_own" on public.meals;
drop policy if exists "meals_update_own" on public.meals;
drop policy if exists "meals_delete_own" on public.meals;

create policy "meals_select_own" on public.meals
  for select using (auth.uid() = user_id and public.current_profile_active());

create policy "meals_insert_own" on public.meals
  for insert with check (auth.uid() = user_id and public.current_profile_active());

create policy "meals_update_own" on public.meals
  for update
  using (auth.uid() = user_id and public.current_profile_active())
  with check (auth.uid() = user_id and public.current_profile_active());

create policy "meals_delete_own" on public.meals
  for delete using (auth.uid() = user_id and public.current_profile_active());

drop policy if exists "meal_items_select_own" on public.meal_items;
drop policy if exists "meal_items_insert_own" on public.meal_items;
drop policy if exists "meal_items_update_own" on public.meal_items;
drop policy if exists "meal_items_delete_own" on public.meal_items;

create policy "meal_items_select_own" on public.meal_items
  for select using (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
    and public.current_profile_active()
  );

create policy "meal_items_insert_own" on public.meal_items
  for insert with check (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
    and public.current_profile_active()
  );

create policy "meal_items_update_own" on public.meal_items
  for update
  using (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
    and public.current_profile_active()
  )
  with check (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
    and public.current_profile_active()
  );

create policy "meal_items_delete_own" on public.meal_items
  for delete using (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
        and meals.user_id = auth.uid()
    )
    and public.current_profile_active()
  );

drop policy if exists "ai_logs_select_own" on public.ai_analysis_logs;
drop policy if exists "ai_logs_insert_own" on public.ai_analysis_logs;

create policy "ai_logs_select_own" on public.ai_analysis_logs
  for select using (auth.uid() = user_id and public.current_profile_active());

create policy "ai_logs_insert_own" on public.ai_analysis_logs
  for insert with check (auth.uid() = user_id and public.current_profile_active());

-- security definer RPC からも論理削除ユーザーを拒否

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

  if not exists (
    select 1 from public.profiles
    where id = p_user_id
      and deleted_at is null
  ) then
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
