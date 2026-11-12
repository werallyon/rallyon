-- Fails fast when the isolated P0-A/P0-C fixture contract is not met.
do $$
declare
  auth_count integer;
  profile_count integer;
  favorite_count integer;
  alpha_favorites integer;
  bravo_favorites integer;
  invalid_rows integer;
  anon_privileges integer;
  authenticated_non_crud integer;
begin
  select count(*) into auth_count from auth.users
  where id in ('a1000000-0000-4000-8000-000000000001'::uuid,
               'b2000000-0000-4000-8000-000000000002'::uuid);
  select count(*) into profile_count from public.profiles
  where id in ('a1000000-0000-4000-8000-000000000001'::uuid,
               'b2000000-0000-4000-8000-000000000002'::uuid);
  select count(*) into favorite_count from public.user_favorite_teams
  where user_id in ('a1000000-0000-4000-8000-000000000001'::uuid,
                    'b2000000-0000-4000-8000-000000000002'::uuid);
  select count(*) into alpha_favorites from public.user_favorite_teams
  where user_id = 'a1000000-0000-4000-8000-000000000001'::uuid;
  select count(*) into bravo_favorites from public.user_favorite_teams
  where user_id = 'b2000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into invalid_rows from public.user_favorite_teams
  where length(btrim(team_id)) = 0 or length(btrim(team_name)) = 0;

  if auth_count <> 2 then raise exception 'Expected 2 synthetic Auth users, got %', auth_count; end if;
  if profile_count <> 2 then raise exception 'Expected 2 bootstrapped profiles, got %', profile_count; end if;
  if favorite_count <> 2 then raise exception 'Expected 2 relational favorite rows, got %', favorite_count; end if;
  if alpha_favorites <> 2 then raise exception 'Expected Alpha to have 2 favorites, got %', alpha_favorites; end if;
  if bravo_favorites <> 0 then raise exception 'Expected Bravo to have 0 favorites, got %', bravo_favorites; end if;
  if invalid_rows <> 0 then raise exception 'Found % invalid favorite rows', invalid_rows; end if;
  if not (select relrowsecurity from pg_class where oid='public.profiles'::regclass) then
    raise exception 'RLS is not enabled on profiles';
  end if;
  if not (select relrowsecurity from pg_class where oid='public.user_favorite_teams'::regclass) then
    raise exception 'RLS is not enabled on user_favorite_teams';
  end if;
  select count(*) into anon_privileges
  from information_schema.role_table_grants
  where table_schema='public' and table_name='user_favorite_teams'
    and grantee='anon';
  select count(*) into authenticated_non_crud
  from information_schema.role_table_grants
  where table_schema='public' and table_name='user_favorite_teams'
    and grantee='authenticated'
    and privilege_type not in ('SELECT','INSERT','UPDATE','DELETE');
  if anon_privileges <> 0 then raise exception 'anon has % favorite-table grants', anon_privileges; end if;
  if authenticated_non_crud <> 0 then raise exception 'authenticated has % non-CRUD favorite-table grants', authenticated_non_crud; end if;
  raise notice 'PASS: P0-A profile bootstrap and P0-C favorite backfill fixture checks';
end $$;
