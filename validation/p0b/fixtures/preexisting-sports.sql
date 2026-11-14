-- Deliberately incompatible pre-existing relation for the fail-closed migration test.
create table public.sports (unexpected_column text);
