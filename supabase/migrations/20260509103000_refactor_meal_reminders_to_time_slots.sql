alter table if exists public.meal_reminder_settings
  add column if not exists id uuid default gen_random_uuid();

update public.meal_reminder_settings
set id = gen_random_uuid()
where id is null;

update public.meal_reminder_settings
set notify_time = make_time(
  extract(hour from notify_time)::int,
  (extract(minute from notify_time)::int / 10) * 10,
  0
);

alter table if exists public.meal_reminder_logs
  add column if not exists meal_reminder_setting_id uuid;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_reminder_settings'
      and column_name = 'meal_type'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_reminder_logs'
      and column_name = 'meal_type'
  ) then
    update public.meal_reminder_logs logs
    set meal_reminder_setting_id = settings.id
    from public.meal_reminder_settings settings
    where logs.user_id = settings.user_id
      and logs.meal_type = settings.meal_type
      and logs.meal_reminder_setting_id is null;
  end if;
end;
$$;

delete from public.meal_reminder_settings newer
using public.meal_reminder_settings older
where newer.user_id = older.user_id
  and newer.notify_time = older.notify_time
  and newer.ctid > older.ctid;

delete from public.meal_reminder_logs logs
where logs.meal_reminder_setting_id is null
  or not exists (
    select 1
    from public.meal_reminder_settings settings
    where settings.id = logs.meal_reminder_setting_id
  );

drop index if exists meal_reminder_settings_user_enabled_idx;
drop index if exists meal_reminder_settings_user_notify_time_key;

do $$
declare
  pk_name text;
  pk_columns text[];
begin
  select c.conname, array_agg(a.attname order by k.ordinality)
  into pk_name, pk_columns
  from pg_constraint c
  join unnest(c.conkey) with ordinality as k(attnum, ordinality) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
  where c.conrelid = 'public.meal_reminder_settings'::regclass
    and c.contype = 'p'
  group by c.conname;

  if pk_name is not null and pk_columns <> array['id'] then
    execute format('alter table public.meal_reminder_settings drop constraint %I', pk_name);
  end if;
end;
$$;

alter table public.meal_reminder_settings
  alter column id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.meal_reminder_settings'::regclass
      and contype = 'p'
  ) then
    alter table public.meal_reminder_settings
      add constraint meal_reminder_settings_pkey primary key (id);
  end if;
end;
$$;

alter table public.meal_reminder_settings
  drop constraint if exists meal_reminder_settings_meal_type_check,
  drop constraint if exists meal_reminder_settings_10_minute_check,
  add constraint meal_reminder_settings_10_minute_check check (
    extract(second from notify_time) = 0
    and mod(extract(minute from notify_time)::int, 10) = 0
  );

create unique index if not exists meal_reminder_settings_user_notify_time_key
  on public.meal_reminder_settings(user_id, notify_time);

create index if not exists meal_reminder_settings_user_enabled_idx
  on public.meal_reminder_settings(user_id, enabled, notify_time);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_reminder_settings'
      and column_name = 'meal_type'
  ) then
    alter table public.meal_reminder_settings drop column meal_type;
  end if;
end;
$$;

do $$
declare
  pk_name text;
  pk_columns text[];
begin
  select c.conname, array_agg(a.attname order by k.ordinality)
  into pk_name, pk_columns
  from pg_constraint c
  join unnest(c.conkey) with ordinality as k(attnum, ordinality) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
  where c.conrelid = 'public.meal_reminder_logs'::regclass
    and c.contype = 'p'
  group by c.conname;

  if pk_name is not null
    and pk_columns <> array['user_id', 'meal_reminder_setting_id', 'target_date'] then
    execute format('alter table public.meal_reminder_logs drop constraint %I', pk_name);
  end if;
end;
$$;

alter table public.meal_reminder_logs
  drop constraint if exists meal_reminder_logs_meal_type_check,
  alter column meal_reminder_setting_id set not null;

do $$
declare
  r record;
  setting_attnum smallint;
begin
  select a.attnum
  into setting_attnum
  from pg_attribute a
  where a.attrelid = 'public.meal_reminder_logs'::regclass
    and a.attname = 'meal_reminder_setting_id'
    and not a.attisdropped;

  if setting_attnum is null then
    raise exception 'meal_reminder_logs.meal_reminder_setting_id not found';
  end if;

  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.meal_reminder_logs'::regclass
      and c.contype = 'f'
      and c.confrelid = 'public.meal_reminder_settings'::regclass
      and c.conkey = array[setting_attnum]::smallint[]
  loop
    execute format('alter table public.meal_reminder_logs drop constraint %I', r.conname);
  end loop;

  alter table public.meal_reminder_logs
    add constraint meal_reminder_logs_setting_id_fkey
    foreign key (meal_reminder_setting_id)
    references public.meal_reminder_settings(id)
    on delete cascade;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.meal_reminder_logs'::regclass
      and contype = 'p'
  ) then
    alter table public.meal_reminder_logs
      add constraint meal_reminder_logs_pkey
      primary key (user_id, meal_reminder_setting_id, target_date);
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_reminder_logs'
      and column_name = 'meal_type'
  ) then
    alter table public.meal_reminder_logs drop column meal_type;
  end if;
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
  incoming_count int;
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

  create temporary table _incoming_meal_reminder_settings (
    notify_time time not null,
    enabled boolean not null
  ) on commit drop;

  insert into _incoming_meal_reminder_settings (notify_time, enabled)
  select
    (setting->>'notify_time')::time,
    coalesce((setting->>'enabled')::boolean, true)
  from jsonb_array_elements(p_settings) as setting;

  select count(*) into incoming_count from _incoming_meal_reminder_settings;
  if incoming_count > 8 then
    raise exception 'meal_reminder_settings_limit_exceeded';
  end if;

  if exists (
    select 1
    from _incoming_meal_reminder_settings
    group by notify_time
    having count(*) > 1
  ) then
    raise exception 'duplicate_notify_time';
  end if;

  update public.meal_reminder_settings existing
  set enabled = incoming.enabled
  from _incoming_meal_reminder_settings incoming
  where existing.user_id = current_user_id
    and existing.notify_time = incoming.notify_time;

  -- 件数トリガー回避: 入れ替えで8件→別8件のとき、先に不要行を消してから insert する
  delete from public.meal_reminder_settings existing
  where existing.user_id = current_user_id
    and not exists (
      select 1
      from _incoming_meal_reminder_settings incoming
      where incoming.notify_time = existing.notify_time
    );

  insert into public.meal_reminder_settings (user_id, notify_time, enabled)
  select current_user_id, incoming.notify_time, incoming.enabled
  from _incoming_meal_reminder_settings incoming
  where not exists (
    select 1
    from public.meal_reminder_settings existing
    where existing.user_id = current_user_id
      and existing.notify_time = incoming.notify_time
  );
end;
$$;

drop trigger if exists meal_reminder_settings_limit on public.meal_reminder_settings;
create trigger meal_reminder_settings_limit
before insert on public.meal_reminder_settings
for each row execute function public.enforce_meal_reminder_settings_limit();

drop policy if exists "meal reminder settings delete own" on public.meal_reminder_settings;
create policy "meal reminder settings delete own"
on public.meal_reminder_settings
for delete
using (auth.uid() = user_id);

grant execute on function public.replace_meal_reminder_settings(jsonb) to authenticated;
