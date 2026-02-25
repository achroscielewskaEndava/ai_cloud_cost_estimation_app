create table public.estimations_stats (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id)
);

create index on public.estimations_stats (created_at);
create index on public.estimations_stats (created_by);

create table public.estimation_stats_providers (
  estimation_id uuid not null references public.estimations_stats(id) on delete cascade,
  provider_id smallint not null references public.providers(id),
  primary key (estimation_id, provider_id)
);

create index on public.estimation_stats_providers (provider_id);
create index on public.estimation_providers (estimation_id);
