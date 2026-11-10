-- RallyOn core data model
-- Applied: 2026-11-10

create table if not exists public.markets (
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

create table if not exists public.cities (
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
  unique(name, state_code, country)
);

create table if not exists public.venues (
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
  reliability_score numeric(5,2),
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  is_demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  league text not null,
  home_team jsonb not null,
  away_team jsonb not null,
  start_time timestamptz not null,
  status text not null default 'UPCOMING' check (status in ('UPCOMING','LIVE','HALFTIME','DELAYED','FINAL','POSTPONED','CANCELLED')),
  live_details jsonb,
  broadcast_network text,
  broadcast jsonb,
  venue_name text,
  season text,
  external_game_id text,
  last_updated timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(league, external_game_id)
);

create table if not exists public.venue_game_programming (
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
  confidence numeric(5,2) not null default 0 check (confidence >= 0 and confidence <= 100),
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(venue_id, game_id)
);

create table if not exists public.venue_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_id)
);

create table if not exists public.venue_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  activity_type text not null default 'JUST_ARRIVED' check (activity_type in ('WATCHING_GAME','HANGING_OUT','LOOKING_TO_SOCIALIZE','WITH_FRIENDS','JUST_ARRIVED')),
  status_message text,
  checked_in_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.venue_presence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  activity_type text not null default 'JUST_ARRIVED',
  status_message text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.venue_signals (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  signal_type text not null,
  title text not null,
  message text not null,
  value jsonb,
  source text not null default 'USER',
  confidence numeric(5,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists venues_market_id_idx on public.venues(market_id);
create index if not exists venues_city_id_idx on public.venues(city_id);
create index if not exists venues_location_idx on public.venues(latitude, longitude);
create index if not exists venues_claimed_idx on public.venues(claimed);
create index if not exists games_start_time_idx on public.games(start_time);
create index if not exists games_league_start_time_idx on public.games(league, start_time);
create index if not exists vgp_game_id_idx on public.venue_game_programming(game_id);
create index if not exists vgp_venue_start_time_idx on public.venue_game_programming(venue_id, start_time);
create index if not exists venue_checkins_venue_expires_idx on public.venue_checkins(venue_id, expires_at);
create index if not exists venue_presence_venue_expires_idx on public.venue_presence(venue_id, expires_at);
create index if not exists venue_signals_venue_created_idx on public.venue_signals(venue_id, created_at desc);

-- RLS
alter table public.markets enable row level security;
alter table public.cities enable row level security;
alter table public.venues enable row level security;
alter table public.games enable row level security;
alter table public.venue_game_programming enable row level security;
alter table public.venue_favorites enable row level security;
alter table public.venue_checkins enable row level security;
alter table public.venue_presence enable row level security;
alter table public.venue_signals enable row level security;

create policy markets_public_read on public.markets for select to anon, authenticated using (true);
create policy cities_public_read on public.cities for select to anon, authenticated using (true);
create policy venues_public_read on public.venues for select to anon, authenticated using (true);
create policy games_public_read on public.games for select to anon, authenticated using (true);
create policy programming_public_read on public.venue_game_programming for select to anon, authenticated using (true);

create policy favorites_select_own on public.venue_favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy favorites_insert_own on public.venue_favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy favorites_delete_own on public.venue_favorites for delete to authenticated using ((select auth.uid()) = user_id);

create policy checkins_select_own on public.venue_checkins for select to authenticated using ((select auth.uid()) = user_id);
create policy checkins_insert_own on public.venue_checkins for insert to authenticated with check ((select auth.uid()) = user_id);
create policy checkins_update_own on public.venue_checkins for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy checkins_delete_own on public.venue_checkins for delete to authenticated using ((select auth.uid()) = user_id);

create policy presence_public_read on public.venue_presence for select to authenticated using (true);
create policy presence_insert_own on public.venue_presence for insert to authenticated with check ((select auth.uid()) = user_id);
create policy presence_update_own on public.venue_presence for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy presence_delete_own on public.venue_presence for delete to authenticated using ((select auth.uid()) = user_id);

create policy signals_public_read on public.venue_signals for select to anon, authenticated using (true);
create policy signals_insert_own on public.venue_signals for insert to authenticated with check ((select auth.uid()) = created_by);
