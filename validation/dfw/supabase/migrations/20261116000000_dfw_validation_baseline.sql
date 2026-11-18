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

create table public.games (
  id uuid primary key default gen_random_uuid(),
  league text not null,
  home_team jsonb,
  away_team jsonb,
  start_time timestamptz not null,
  status text not null default 'UPCOMING',
  broadcast_network text,
  broadcast jsonb
);

insert into public.games (id, league, home_team, away_team, start_time, status)
values
  (
    'f0000000-0000-4000-8000-000000000001'::uuid,
    'MLS',
    '{"name":"FC Dallas"}'::jsonb,
    '{"name":"Portland Timbers"}'::jsonb,
    now() + interval '4 days',
    'UPCOMING'
  ),
  (
    'f0000000-0000-4000-8000-000000000002'::uuid,
    'NFL',
    '{"name":"Dallas Cowboys"}'::jsonb,
    '{"name":"Tennessee Titans"}'::jsonb,
    (
      date_trunc('week', now() at time zone 'America/Chicago')
      + case
          when extract(isodow from now() at time zone 'America/Chicago') = 7
            then interval '13 days 12 hours'
          else interval '6 days 12 hours'
        end
    ) at time zone 'America/Chicago',
    'UPCOMING'
  );

create table public.venue_game_programming (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  network text,
  status text not null default 'PLANNED' check (status in ('PLANNED','CONFIRMED','GAME_ON','CANCELLED','NOT_SHOWING')),
  is_confirmed boolean not null default false,
  audio_on boolean not null default false,
  screen text,
  featured boolean not null default false,
  notes text,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 100),
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_type text not null default 'MANUAL' check (source_type in ('MANUAL','VENUE','OFFICIAL','USER_REPORT','SYSTEM')),
  source_url text,
  verification_notes text,
  unique (venue_id, game_id)
);

alter table public.venue_game_programming enable row level security;
