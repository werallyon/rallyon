-- Deliberately incompatible pre-existing games reference type for the preflight test.
alter table public.games add column league_id text;
