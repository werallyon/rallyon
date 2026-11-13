-- Existing UUID game-reference values cannot be trusted before canonical relations exist.
insert into public.games (id, league_id)
values ('40000000-0000-4000-8000-000000000099', '20000000-0000-4000-8000-000000000099');
