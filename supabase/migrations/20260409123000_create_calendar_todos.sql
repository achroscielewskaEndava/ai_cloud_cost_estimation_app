create table if not exists public.calendar_todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  year integer not null check (year between 1970 and 9999),
  month integer not null check (month between 0 and 11),
  task_id text not null,
  text text not null,
  completed boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month, task_id)
);

create index if not exists calendar_todos_user_period_idx
  on public.calendar_todos (user_id, year, month, position);
