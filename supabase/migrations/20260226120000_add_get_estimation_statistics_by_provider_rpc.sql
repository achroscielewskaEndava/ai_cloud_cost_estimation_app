create or replace function public.get_estimation_statistics_by_provider(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  provider text,
  count bigint
)
language sql
stable
as $$
  select
    p.name as provider,
    count(*)::bigint as count
  from public.estimations_statistics_providers esp
  join public.estimations_statistics es
    on es.id = esp.estimation_id
  join public.providers p
    on p.id = esp.provider_id
  where es.created_at >= p_start
    and es.created_at < p_end
  group by p.name
  order by count(*) desc, p.name asc;
$$;
