create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  category text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint contact_messages_category_check check (
    category in ('support', 'billing', 'bug', 'privacy', 'other')
  ),
  constraint contact_messages_status_check check (
    status in ('new', 'in_progress', 'closed')
  )
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages(created_at desc);

create index if not exists contact_messages_user_id_idx
  on public.contact_messages(user_id);

alter table public.contact_messages enable row level security;
