-- Create providers table
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- Optional: enforce unique provider names
create unique index if not exists providers_name_unique_idx
  on public.providers (name);