create table if not exists public.meal_reminder_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notify_time time not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_reminder_settings_10_minute_check check (
    extract(second from notify_time) = 0
    and mod(extract(minute from notify_time)::int, 10) = 0
  )
);

create unique index if not exists meal_reminder_settings_user_notify_time_key
  on public.meal_reminder_settings(user_id, notify_time);

create index if not exists meal_reminder_settings_user_enabled_idx
  on public.meal_reminder_settings(user_id, enabled, notify_time);

create table if not exists public.meal_reminder_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_reminder_setting_id uuid not null references public.meal_reminder_settings(id) on delete cascade,
  target_date date not null,
  first_sent_at timestamptz,
  followup_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, meal_reminder_setting_id, target_date)
);

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

create or replace function public.enforce_meal_reminder_settings_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.meal_reminder_settings
    where user_id = new.user_id
  ) >= 8 then
    raise exception 'meal_reminder_settings_limit_exceeded';
  end if;

  return new;
end;
$$;

create or replace function public.replace_meal_reminder_settings(p_settings jsonb)
returns void
language plpgsql
as $$
declare
  current_user_id uuid := auth.uid();
  setting jsonb;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if jsonb_typeof(p_settings) <> 'array' then
    raise exception 'invalid_meal_reminder_settings';
  end if;

  if jsonb_array_length(p_settings) > 8 then
    raise exception 'meal_reminder_settings_limit_exceeded';
  end if;

  delete from public.meal_reminder_settings
  where user_id = current_user_id;

  for setting in select value from jsonb_array_elements(p_settings)
  loop
    insert into public.meal_reminder_settings (user_id, notify_time, enabled)
    values (
      current_user_id,
      (setting->>'notify_time')::time,
      coalesce((setting->>'enabled')::boolean, true)
    );
  end loop;
end;
$$;

drop trigger if exists meal_reminder_settings_limit on public.meal_reminder_settings;
create trigger meal_reminder_settings_limit
before insert on public.meal_reminder_settings
for each row execute function public.enforce_meal_reminder_settings_limit();

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

drop policy if exists "meal reminder settings delete own" on public.meal_reminder_settings;
create policy "meal reminder settings delete own"
on public.meal_reminder_settings
for delete
using (auth.uid() = user_id);

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

grant execute on function public.replace_meal_reminder_settings(jsonb) to authenticated;
