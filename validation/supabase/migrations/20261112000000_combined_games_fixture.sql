-- Minimal disposable fixture for exercising the P0-B migration.
-- This is never applied outside the isolated local Supabase project.
create extension if not exists pgcrypto;
create table public.games (
  id uuid primary key default gen_random_uuid(),
  start_time timestamptz not null default now(),
  -- Simulate a pre-existing compatible UUID-only event schema with no FKs.
  league_id uuid,
  home_team_id uuid,
  away_team_id uuid
);
