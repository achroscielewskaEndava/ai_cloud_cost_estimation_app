create table if not exists public.calendar_task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  year integer not null check (year between 1970 and 9999),
  month integer not null check (month between 0 and 11),
  day integer not null check (day between 1 and 31),
  task_id text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month, day, task_id)
);

create index if not exists calendar_task_completions_user_period_idx
  on public.calendar_task_completions (user_id, year, month, day);
