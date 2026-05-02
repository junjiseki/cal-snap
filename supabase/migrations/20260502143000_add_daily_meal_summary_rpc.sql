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
    and eaten_at <= p_end;
$$;

revoke all on function public.get_daily_meal_summary(timestamptz, timestamptz) from public;
grant execute on function public.get_daily_meal_summary(timestamptz, timestamptz) to authenticated;
