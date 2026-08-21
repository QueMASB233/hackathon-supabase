create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null unique references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text not null default '',
  icon_path text,
  status text not null default 'Invitación enviada',
  created_at timestamptz not null default now()
);

create index if not exists clients_business_id_idx on public.clients (business_id);
