-- Assertions after applying the exact root PR #22 migrations.
do $$
declare
  v_users integer;
  v_profiles integer;
  v_favorites integer;
  v_alpha integer;
  v_bravo integer;
  v_rls boolean;
  v_public_grants integer;
begin
  select count(*) into v_users from auth.users
  where id in ('a1000000-0000-4000-8000-000000000001'::uuid,
               'b2000000-0000-4000-8000-000000000002'::uuid);
  select count(*) into v_profiles from public.profiles
  where id in ('a1000000-0000-4000-8000-000000000001'::uuid,
               'b2000000-0000-4000-8000-000000000002'::uuid);
  select count(*) into v_favorites from public.user_favorite_teams
  where user_id in ('a1000000-0000-4000-8000-000000000001'::uuid,
                    'b2000000-0000-4000-8000-000000000002'::uuid);
  select count(*) into v_alpha from public.user_favorite_teams
  where user_id = 'a1000000-0000-4000-8000-000000000001'::uuid;
  select count(*) into v_bravo from public.user_favorite_teams
  where user_id = 'b2000000-0000-4000-8000-000000000002'::uuid;

  if v_users <> 2 then raise exception 'Expected 2 Auth fixtures, got %', v_users; end if;
  if v_profiles <> 2 then raise exception 'Expected 2 bootstrap profiles, got %', v_profiles; end if;
  if v_favorites <> 2 or v_alpha <> 2 or v_bravo <> 0 then
    raise exception 'Unexpected deterministic favorite backfill: total %, A %, B %', v_favorites, v_alpha, v_bravo;
  end if;
  if not exists (
    select 1 from public.user_favorite_teams
    where user_id = 'a1000000-0000-4000-8000-000000000001'::uuid
      and team_id = 'fixture-nfl-kc' and sort_order = 0
  ) then raise exception 'First duplicate legacy favorite was not retained at original order'; end if;
  if not exists (
    select 1 from public.user_favorite_teams
    where user_id = 'a1000000-0000-4000-8000-000000000001'::uuid
      and team_id = 'fixture-mls-atx' and sort_order = 1
  ) then raise exception 'Second legacy favorite was not retained at original order'; end if;

  select relrowsecurity into v_rls from pg_class where oid = 'public.user_favorite_teams'::regclass;
  if not coalesce(v_rls, false) then raise exception 'RLS is not enabled on relational favorites'; end if;
  if to_regprocedure('public.save_profile_and_favorite_teams(jsonb,jsonb,boolean)') is null then
    raise exception 'Transactional profile/favorites RPC is missing'; end if;
  if has_table_privilege('anon', 'public.user_favorite_teams', 'SELECT')
     or has_table_privilege('anon', 'public.user_favorite_teams', 'INSERT')
     or has_table_privilege('anon', 'public.user_favorite_teams', 'UPDATE')
     or has_table_privilege('anon', 'public.user_favorite_teams', 'DELETE') then
    raise exception 'anon has effective privileges on relational favorites'; end if;
  select count(*) into v_public_grants
  from pg_class c
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
  where c.oid = 'public.user_favorite_teams'::regclass
    and acl.grantee = 0
    and acl.privilege_type in ('SELECT','INSERT','UPDATE','DELETE');
  if v_public_grants <> 0 then raise exception 'PUBLIC has % relational favorite table grants', v_public_grants; end if;
  if not has_table_privilege('authenticated', 'public.user_favorite_teams', 'SELECT')
     or not has_table_privilege('authenticated', 'public.user_favorite_teams', 'INSERT')
     or not has_table_privilege('authenticated', 'public.user_favorite_teams', 'UPDATE')
     or not has_table_privilege('authenticated', 'public.user_favorite_teams', 'DELETE') then
    raise exception 'authenticated lacks required CRUD privileges on relational favorites'; end if;
end $$;

-- Exercise the exact RPC as an authenticated owner. The outer transaction is
-- rolled back so the fixture rows remain unchanged for the next test.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
do $$
declare
  v_name text;
  v_favorites integer;
begin
  perform public.save_profile_and_favorite_teams(
    '{"name":"RPC valid empty selection"}'::jsonb,
    '[]'::jsonb,
    true
  );

  select display_name into v_name
  from public.profiles
  where id = auth.uid();
  if v_name <> 'RPC valid empty selection' then
    raise exception 'Authenticated RPC did not update the canonical profile';
  end if;

  select count(*) into v_favorites
  from public.user_favorite_teams
  where user_id = auth.uid();
  if v_favorites <> 0 then
    raise exception 'Authenticated RPC did not treat an empty favorite array as authoritative';
  end if;

  begin
    perform public.save_profile_and_favorite_teams(
      '{"name":"MUST ROLL BACK"}'::jsonb,
      '[{"id":"   ","name":"Malformed"}]'::jsonb,
      true
    );
    raise exception 'Expected malformed favorite payload to fail';
  exception when others then
    if sqlerrm = 'Expected malformed favorite payload to fail' then
      raise;
    end if;
  end;

  select display_name into v_name
  from public.profiles
  where id = auth.uid();
  if v_name <> 'RPC valid empty selection' then
    raise exception 'Profile update was not rolled back after favorite validation failed';
  end if;
end $$;
rollback;
