create table public.estimations_statistics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index on public.estimations_statistics (created_at);

create table public.estimations_statistics_providers (
  estimation_id uuid not null references public.estimations_statistics(id) on delete cascade,
  provider_id uuid not null references public.providers(id),
  primary key (estimation_id, provider_id)
);

create index on public.estimations_statistics_providers (provider_id);
create index on public.estimations_statistics_providers (estimation_id);
