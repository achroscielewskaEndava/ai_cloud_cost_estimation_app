-- 1️⃣ Utworzenie enuma (jeśli nie istnieje)

do $$
begin
  create type public.user_role as enum (
    'user',
    'admin',
    'superadmin'
  );
exception
  when duplicate_object then null;
end $$;


-- 2️⃣ Tabela users

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),

  -- dane z OAuth
  email text not null unique,
  name text,
  image text,

  -- informacje o providerze (github / google)
  provider text not null,
  provider_id text not null,

  -- rola użytkownika
  role public.user_role not null default 'user',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- jeden użytkownik z danego providera nie może się powtórzyć
  constraint users_provider_unique unique (provider, provider_id)
);


-- 3️⃣ Indeksy (opcjonalne, ale dobre praktyki)

create index if not exists users_email_idx on public.users(email);
create index if not exists users_role_idx on public.users(role);