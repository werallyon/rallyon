-- Deliberately incompatible pre-existing games reference type for the preflight test.
alter table public.games alter column league_id type text using league_id::text;
