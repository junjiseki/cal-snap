-- 丸めで (user_id, notify_time) が衝突するため、一意索引を外してから UPDATE → 重複解消 → 再作成する。
drop index if exists public.meal_reminder_settings_user_notify_time_key;

update public.meal_reminder_settings
set notify_time = make_time(
  extract(hour from notify_time)::int,
  (extract(minute from notify_time)::int / 30) * 30,
  0
);

-- 同一 (user_id, notify_time) で複数行ある場合、いずれかが enabled なら true に統合する。
with merged as (
  select user_id, notify_time, bool_or(enabled) as merged_enabled
  from public.meal_reminder_settings
  group by user_id, notify_time
),
keeper as (
  select distinct on (user_id, notify_time)
    id,
    user_id,
    notify_time
  from public.meal_reminder_settings
  order by user_id, notify_time, enabled desc, id asc
)
update public.meal_reminder_settings m
set enabled = merged.merged_enabled
from merged
join keeper k on k.user_id = merged.user_id and k.notify_time = merged.notify_time
where m.id = k.id;

-- 生存行: (user_id, notify_time) ごとに enabled 優先、次に id 昇順で 1 行。
delete from public.meal_reminder_settings m
where m.id not in (
  select distinct on (user_id, notify_time) id
  from public.meal_reminder_settings
  order by user_id, notify_time, enabled desc, id asc
);

create unique index if not exists meal_reminder_settings_user_notify_time_key
  on public.meal_reminder_settings(user_id, notify_time);

alter table public.meal_reminder_settings
  drop constraint if exists meal_reminder_settings_10_minute_check,
  drop constraint if exists meal_reminder_settings_30_minute_check,
  add constraint meal_reminder_settings_30_minute_check check (
    extract(second from notify_time) = 0
    and mod(extract(minute from notify_time)::int, 30) = 0
  );
