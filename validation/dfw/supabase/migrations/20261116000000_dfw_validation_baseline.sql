-- Minimal disposable baseline matching the hosted market/city/venue contracts.
-- This database is isolated to the DFW migration CI job.
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  state text,
  state_code text,
  country text not null default 'USA',
  timezone text not null default 'America/Chicago',
  latitude double precision,
  longitude double precision,
  radius_miles numeric,
  geographic_boundary jsonb,
  population integer,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE','PLANNED')),
  launch_status text not null default 'PLANNED' check (launch_status in ('PLANNED','PREPARING','SOFT_LAUNCH','LIVE','EXPANDING','NATIONAL','PAUSED')),
  launch_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id) on delete set null,
  name text not null,
  state text,
  state_code text,
  country text not null default 'USA',
  latitude double precision,
  longitude double precision,
  population integer,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, state_code, country)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references public.markets(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  name text not null,
  address text not null,
  neighborhood text,
  city text not null,
  state text not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text,
  website text,
  image_url text,
  categories text[] not null default '{}',
  atmosphere text[] not null default '{}',
  fan_bases jsonb not null default '[]'::jsonb,
  features text[] not null default '{}',
  baseline jsonb not null default '{}'::jsonb,
  venue_truth jsonb not null default '{}'::jsonb,
  claimed boolean not null default false,
  google_place_id text unique,
  google_place_data jsonb,
  reliability_score numeric,
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  is_demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.markets enable row level security;
alter table public.cities enable row level security;
alter table public.venues enable row level security;
