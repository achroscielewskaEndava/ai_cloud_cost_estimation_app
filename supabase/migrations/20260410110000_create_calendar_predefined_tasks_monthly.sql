create table if not exists public.calendar_predefined_tasks_monthly (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 1970 and 9999),
  month integer not null check (month between 0 and 11),
  task_id text not null,
  label text not null,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year, month, task_id)
);

create index if not exists calendar_predefined_tasks_monthly_period_idx
  on public.calendar_predefined_tasks_monthly (year, month, position);
