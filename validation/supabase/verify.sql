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
  anon_profile_privileges integer;
  public_profile_privileges integer;
  bootstrap_security_definer boolean;
  bootstrap_safe_search_path boolean;
  bootstrap_api_execute boolean;
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

  select count(*) into anon_profile_privileges
  from unnest(array['SELECT','INSERT','UPDATE','DELETE']) privilege_name
  where has_table_privilege('anon','public.profiles',privilege_name);
  if anon_profile_privileges <> 0 then
    raise exception 'anon retains % effective profile-table privileges after P0-C', anon_profile_privileges;
  end if;

  select count(*) into public_profile_privileges
  from pg_class c
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
  where c.oid='public.profiles'::regclass
    and acl.grantee=0
    and acl.privilege_type in ('SELECT','INSERT','UPDATE','DELETE');
  if public_profile_privileges <> 0 then
    raise exception 'PUBLIC retains % effective profile-table grants after P0-C', public_profile_privileges;
  end if;

  select p.prosecdef,
         exists (
           select 1 from unnest(coalesce(p.proconfig,array[]::text[])) cfg
           where regexp_replace(cfg,'[[:space:]]','','g')='search_path=pg_catalog,public,pg_temp'
         )
    into bootstrap_security_definer, bootstrap_safe_search_path
  from pg_trigger t
  join pg_proc p on p.oid=t.tgfoid
  where t.tgrelid='auth.users'::regclass
    and not t.tgisinternal
    and t.tgname='on_auth_user_created'
    and t.tgenabled in ('O','A')
    and t.tgtype=5
    and p.proname='handle_new_user';
  if not coalesce(bootstrap_security_definer,false) then
    raise exception 'Auth bootstrap function is not SECURITY DEFINER after P0-C';
  end if;
  if not coalesce(bootstrap_safe_search_path,false) then
    raise exception 'Auth bootstrap function does not have the pinned safe search_path after P0-C';
  end if;

  select has_function_privilege('anon','public.handle_new_user()','EXECUTE')
      or has_function_privilege('authenticated','public.handle_new_user()','EXECUTE')
      or has_function_privilege('service_role','public.handle_new_user()','EXECUTE')
    into bootstrap_api_execute;
  if bootstrap_api_execute then
    raise exception 'API roles retain direct EXECUTE on Auth bootstrap trigger function';
  end if;
  raise notice 'PASS: P0-A profile bootstrap and P0-C favorite backfill fixture checks';
end $$;
