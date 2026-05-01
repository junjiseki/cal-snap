create type public.plan_type as enum ('free', 'paid');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan public.plan_type not null default 'free',
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null,
  total_calories integer not null check (total_calories >= 0),
  protein numeric(8, 1) not null default 0 check (protein >= 0),
  fat numeric(8, 1) not null default 0 check (fat >= 0),
  carbs numeric(8, 1) not null default 0 check (carbs >= 0),
  ai_confidence numeric(3, 2) not null default 0 check (ai_confidence >= 0 and ai_confidence <= 1),
  memo text,
  created_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  estimated_amount text not null,
  calories integer not null check (calories >= 0),
  protein numeric(8, 1) not null default 0 check (protein >= 0),
  fat numeric(8, 1) not null default 0 check (fat >= 0),
  carbs numeric(8, 1) not null default 0 check (carbs >= 0),
  confidence numeric(3, 2) not null default 0 check (confidence >= 0 and confidence <= 1)
);

create table public.ai_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analyzed_at timestamptz not null default now(),
  model text not null,
  success boolean not null default false
);

create index meals_user_eaten_at_idx on public.meals(user_id, eaten_at desc);
create index meal_items_meal_id_idx on public.meal_items(meal_id);
create index ai_analysis_logs_user_analyzed_at_idx on public.ai_analysis_logs(user_id, analyzed_at desc);

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.ai_analysis_logs enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "meals_select_own" on public.meals
  for select using (auth.uid() = user_id);

create policy "meals_insert_own" on public.meals
  for insert with check (auth.uid() = user_id);

create policy "meals_update_own" on public.meals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meals_delete_own" on public.meals
  for delete using (auth.uid() = user_id);

create policy "meal_items_select_own" on public.meal_items
  for select using (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
      and meals.user_id = auth.uid()
    )
  );

create policy "meal_items_insert_own" on public.meal_items
  for insert with check (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
      and meals.user_id = auth.uid()
    )
  );

create policy "meal_items_update_own" on public.meal_items
  for update using (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
      and meals.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
      and meals.user_id = auth.uid()
    )
  );

create policy "meal_items_delete_own" on public.meal_items
  for delete using (
    exists (
      select 1 from public.meals
      where meals.id = meal_items.meal_id
      and meals.user_id = auth.uid()
    )
  );

create policy "ai_logs_select_own" on public.ai_analysis_logs
  for select using (auth.uid() = user_id);

create policy "ai_logs_insert_own" on public.ai_analysis_logs
  for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, plan)
  values (new.id, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
