update public.meal_reminder_settings
set notify_time = make_time(
  extract(hour from notify_time)::int,
  (extract(minute from notify_time)::int / 30) * 30,
  0
);

delete from public.meal_reminder_settings newer
using public.meal_reminder_settings older
where newer.user_id = older.user_id
  and newer.notify_time = older.notify_time
  and newer.ctid > older.ctid;

alter table public.meal_reminder_settings
  drop constraint if exists meal_reminder_settings_10_minute_check,
  drop constraint if exists meal_reminder_settings_30_minute_check,
  add constraint meal_reminder_settings_30_minute_check check (
    extract(second from notify_time) = 0
    and mod(extract(minute from notify_time)::int, 30) = 0
  );
