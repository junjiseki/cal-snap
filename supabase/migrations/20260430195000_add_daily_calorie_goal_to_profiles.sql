alter table public.profiles
add column if not exists daily_calorie_goal integer not null default 2000
check (daily_calorie_goal >= 0);
