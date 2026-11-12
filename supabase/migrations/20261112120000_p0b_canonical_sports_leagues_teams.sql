-- P0-B: canonical sports, leagues, and teams reference model.
-- Review-only migration: do not apply to production until this PR is approved.
-- Existing games JSONB participants/home_team/away_team remain intact for compatibility.
-- Provider IDs are normalized into mapping tables to support multiple providers per entity.

create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  name text not null,
  category text not null check (category in (
    'FOOTBALL','BASKETBALL','BASEBALL','HOCKEY','SOCCER',
    'MMA','TENNIS','GOLF','RACING','OTHER'
  )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sports_code_format check (code ~ '^[A-Z0-9_]+$')
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete restrict,
  code text not null,
  slug text not null,
  name text not null,
  country_code char(2),
  competition_level text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leagues_sport_code_unique unique (sport_id, code),
  constraint leagues_sport_slug_unique unique (sport_id, slug),
  constraint leagues_code_format check (code ~ '^[A-Z0-9_]+$')
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete restrict,
  name text not null,
  short_name text,
  abbreviation text,
  slug text not null,
  logo_url text,
  primary_color text,
  secondary_color text,
  city text,
  region text,
  country_code char(2),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_league_slug_unique unique (league_id, slug),
  constraint teams_abbreviation_format check (
    abbreviation is null or abbreviation = upper(abbreviation)
  )
);

-- One canonical entity may be represented by several provider IDs.
-- Provider IDs are unique within a provider and entity type, preventing duplicate ingestion.
create table if not exists public.sport_provider_ids (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  provider text not null,
  external_id text not null,
  created_at timestamptz not null default now(),
  constraint sport_provider_identity_unique unique (provider, external_id)
);

create table if not exists public.league_provider_ids (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  provider text not null,
  external_id text not null,
  created_at timestamptz not null default now(),
  constraint league_provider_identity_unique unique (provider, external_id)
);

create table if not exists public.team_provider_ids (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  provider text not null,
  external_id text not null,
  created_at timestamptz not null default now(),
  constraint team_provider_identity_unique unique (provider, external_id)
);

-- Add canonical references to events without removing or rewriting legacy payload fields.
alter table public.games
  add column if not exists league_id uuid references public.leagues(id) on delete restrict,
  add column if not exists home_team_id uuid references public.teams(id) on delete set null,
  add column if not exists away_team_id uuid references public.teams(id) on delete set null;

create index if not exists leagues_sport_active_idx
  on public.leagues (sport_id, is_active, name);
create index if not exists teams_league_active_idx
  on public.teams (league_id, is_active, name);
create index if not exists teams_name_lower_idx
  on public.teams (lower(name));
create index if not exists sport_provider_ids_entity_idx
  on public.sport_provider_ids (sport_id);
create index if not exists league_provider_ids_entity_idx
  on public.league_provider_ids (league_id);
create index if not exists team_provider_ids_entity_idx
  on public.team_provider_ids (team_id);
create index if not exists games_league_start_time_idx
  on public.games (league_id, start_time)
  where league_id is not null;
create index if not exists games_home_team_start_time_idx
  on public.games (home_team_id, start_time)
  where home_team_id is not null;
create index if not exists games_away_team_start_time_idx
  on public.games (away_team_id, start_time)
  where away_team_id is not null;

alter table public.sports enable row level security;
alter table public.leagues enable row level security;
alter table public.teams enable row level security;
alter table public.sport_provider_ids enable row level security;
alter table public.league_provider_ids enable row level security;
alter table public.team_provider_ids enable row level security;

-- Reference data is readable by the app; writes are reserved for trusted server/service-role jobs.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sports' and policyname='sports_public_read') then
    create policy sports_public_read on public.sports for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leagues' and policyname='leagues_public_read') then
    create policy leagues_public_read on public.leagues for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='teams' and policyname='teams_public_read') then
    create policy teams_public_read on public.teams for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sport_provider_ids' and policyname='sport_provider_ids_service_only') then
    create policy sport_provider_ids_service_only on public.sport_provider_ids for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='league_provider_ids' and policyname='league_provider_ids_service_only') then
    create policy league_provider_ids_service_only on public.league_provider_ids for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='team_provider_ids' and policyname='team_provider_ids_service_only') then
    create policy team_provider_ids_service_only on public.team_provider_ids for all to anon, authenticated using (false) with check (false);
  end if;
end $$;

comment on table public.sports is 'Canonical sports taxonomy; stable RallyOn-owned identifiers.';
comment on table public.leagues is 'Canonical competitions scoped to one sport.';
comment on table public.teams is 'Canonical team identities scoped to a league.';
comment on table public.team_provider_ids is 'Maps provider-specific team identifiers to canonical RallyOn teams.';
comment on column public.games.league_id is 'Nullable during migration; canonical league reference alongside legacy league text.';
comment on column public.games.home_team_id is 'Nullable canonical team reference; legacy home_team JSONB remains supported.';
comment on column public.games.away_team_id is 'Nullable canonical team reference; legacy away_team JSONB remains supported.';
