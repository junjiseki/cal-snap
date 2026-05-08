create table if not exists public.meal_reminder_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null,
  notify_time time not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, meal_type),
  constraint meal_reminder_settings_meal_type_check check (
    meal_type in (
      'breakfast',
      'morning_snack',
      'lunch',
      'afternoon_snack',
      'dinner',
      'night_snack',
      'supplement_1',
      'supplement_2'
    )
  )
);

create table if not exists public.meal_reminder_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null,
  target_date date not null,
  first_sent_at timestamptz,
  followup_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, meal_type, target_date),
  constraint meal_reminder_logs_meal_type_check check (
    meal_type in (
      'breakfast',
      'morning_snack',
      'lunch',
      'afternoon_snack',
      'dinner',
      'night_snack',
      'supplement_1',
      'supplement_2'
    )
  )
);

create index if not exists meal_reminder_settings_user_enabled_idx
  on public.meal_reminder_settings(user_id, enabled, notify_time);

create index if not exists meal_reminder_logs_user_target_date_idx
  on public.meal_reminder_logs(user_id, target_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meal_reminder_settings_set_updated_at on public.meal_reminder_settings;
create trigger meal_reminder_settings_set_updated_at
before update on public.meal_reminder_settings
for each row execute function public.set_updated_at();

drop trigger if exists meal_reminder_logs_set_updated_at on public.meal_reminder_logs;
create trigger meal_reminder_logs_set_updated_at
before update on public.meal_reminder_logs
for each row execute function public.set_updated_at();

alter table public.meal_reminder_settings enable row level security;
alter table public.meal_reminder_logs enable row level security;

drop policy if exists "meal reminder settings select own" on public.meal_reminder_settings;
create policy "meal reminder settings select own"
on public.meal_reminder_settings
for select
using (auth.uid() = user_id);

drop policy if exists "meal reminder settings insert own" on public.meal_reminder_settings;
create policy "meal reminder settings insert own"
on public.meal_reminder_settings
for insert
with check (auth.uid() = user_id);

drop policy if exists "meal reminder settings update own" on public.meal_reminder_settings;
create policy "meal reminder settings update own"
on public.meal_reminder_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "meal reminder logs select own" on public.meal_reminder_logs;
create policy "meal reminder logs select own"
on public.meal_reminder_logs
for select
using (auth.uid() = user_id);

drop policy if exists "meal reminder logs insert own" on public.meal_reminder_logs;
create policy "meal reminder logs insert own"
on public.meal_reminder_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "meal reminder logs update own" on public.meal_reminder_logs;
create policy "meal reminder logs update own"
on public.meal_reminder_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
