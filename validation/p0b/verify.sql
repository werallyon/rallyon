-- Validate canonical hierarchy, league-scoped game participants, legacy nullability,
-- RLS and effective SQL privileges on the isolated local P0-B database.
insert into public.sports (id, code, slug, name, category) values
  ('10000000-0000-4000-8000-000000000001', 'FOOTBALL', 'football', 'Football', 'FOOTBALL');

insert into public.leagues (id, sport_id, code, slug, name) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'LEAGUE_A', 'league-a', 'League A'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'LEAGUE_B', 'league-b', 'League B');

insert into public.teams (id, league_id, name, slug) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Team A', 'team-a'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Team B', 'team-b');

-- Provider IDs are unique within each entity type and provider.
insert into public.sport_provider_ids (sport_id, provider, external_id)
values ('10000000-0000-4000-8000-000000000001', 'fixture-provider', 'sport-external-1');
insert into public.league_provider_ids (league_id, provider, external_id)
values ('20000000-0000-4000-8000-000000000001', 'fixture-provider', 'league-external-1');
insert into public.team_provider_ids (team_id, provider, external_id)
values ('30000000-0000-4000-8000-000000000001', 'fixture-provider', 'team-external-1');

do $$
begin
  begin
    insert into public.sport_provider_ids (sport_id, provider, external_id)
    values ('10000000-0000-4000-8000-000000000001', 'fixture-provider', 'sport-external-1');
    raise exception 'Duplicate sport provider ID unexpectedly accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.league_provider_ids (league_id, provider, external_id)
    values ('20000000-0000-4000-8000-000000000001', 'fixture-provider', 'league-external-1');
    raise exception 'Duplicate league provider ID unexpectedly accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.team_provider_ids (team_id, provider, external_id)
    values ('30000000-0000-4000-8000-000000000001', 'fixture-provider', 'team-external-1');
    raise exception 'Duplicate team provider ID unexpectedly accepted';
  exception when unique_violation then null;
  end;
end $$;

-- Same-league participant references are valid.
insert into public.games (id, league_id, home_team_id, away_team_id)
values ('40000000-0000-4000-8000-000000000001',
        '20000000-0000-4000-8000-000000000001',
        '30000000-0000-4000-8000-000000000001',
        null);

-- Existing game rows with no canonical references remain valid during rollout.
insert into public.games (id)
values ('40000000-0000-4000-8000-000000000002');

do $$
begin
  begin
    insert into public.games (id, league_id)
    values ('40000000-0000-4000-8000-000000000006',
            '20000000-0000-4000-8000-000000000099');
    raise exception 'Unknown canonical league unexpectedly accepted';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.games (id, league_id, home_team_id)
    values ('40000000-0000-4000-8000-000000000003',
            '20000000-0000-4000-8000-000000000001',
            '30000000-0000-4000-8000-000000000002');
    raise exception 'Cross-league home team unexpectedly accepted';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.games (id, league_id, away_team_id)
    values ('40000000-0000-4000-8000-000000000004',
            '20000000-0000-4000-8000-000000000001',
            '30000000-0000-4000-8000-000000000002');
    raise exception 'Cross-league away team unexpectedly accepted';
  exception when foreign_key_violation then
    null;
  end;

  begin
    insert into public.games (id, home_team_id)
    values ('40000000-0000-4000-8000-000000000005',
            '30000000-0000-4000-8000-000000000001');
    raise exception 'Team reference without league unexpectedly accepted';
  exception when check_violation then
    null;
  end;
end $$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array['sports','leagues','teams','sport_provider_ids','league_provider_ids','team_provider_ids'] loop
    if not (select relrowsecurity from pg_class where oid = to_regclass('public.' || v_table)) then
      raise exception 'RLS is not enabled on public.%', v_table;
    end if;
  end loop;

  if not has_table_privilege('anon', 'public.sports', 'SELECT')
     or not has_table_privilege('authenticated', 'public.sports', 'SELECT') then
    raise exception 'Taxonomy SELECT must be granted to anon and authenticated';
  end if;
  if has_table_privilege('anon', 'public.sports', 'INSERT')
     or has_table_privilege('anon', 'public.sports', 'UPDATE')
     or has_table_privilege('anon', 'public.sports', 'DELETE')
     or has_table_privilege('authenticated', 'public.sports', 'INSERT')
     or has_table_privilege('authenticated', 'public.sports', 'UPDATE')
     or has_table_privilege('authenticated', 'public.sports', 'DELETE') then
    raise exception 'Client roles must not be able to write taxonomy';
  end if;

  if exists (
    select 1
    from pg_class c
    cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
    where c.oid in (
      'public.sports'::regclass, 'public.leagues'::regclass, 'public.teams'::regclass,
      'public.sport_provider_ids'::regclass, 'public.league_provider_ids'::regclass,
      'public.team_provider_ids'::regclass
    )
    and acl.grantee = 0
    and acl.privilege_type in ('SELECT','INSERT','UPDATE','DELETE')
  ) then
    raise exception 'PUBLIC has direct privileges on a canonical or provider relation';
  end if;
  if not has_table_privilege('service_role', 'public.sports', 'SELECT')
     or not has_table_privilege('service_role', 'public.sports', 'INSERT')
     or not has_table_privilege('service_role', 'public.sports', 'UPDATE')
     or not has_table_privilege('service_role', 'public.sports', 'DELETE') then
    raise exception 'service_role lacks required write privileges on canonical taxonomy';
  end if;

  foreach v_table in array array['sport_provider_ids','league_provider_ids','team_provider_ids'] loop
    if has_table_privilege('anon', 'public.' || v_table, 'SELECT')
       or has_table_privilege('authenticated', 'public.' || v_table, 'SELECT')
       or has_table_privilege('anon', 'public.' || v_table, 'INSERT')
       or has_table_privilege('authenticated', 'public.' || v_table, 'INSERT') then
      raise exception 'Client roles unexpectedly have privileges on public.%', v_table;
    end if;
    if not has_table_privilege('service_role', 'public.' || v_table, 'SELECT')
       or not has_table_privilege('service_role', 'public.' || v_table, 'INSERT')
       or not has_table_privilege('service_role', 'public.' || v_table, 'UPDATE')
       or not has_table_privilege('service_role', 'public.' || v_table, 'DELETE') then
      raise exception 'service_role lacks required privileges on public.%', v_table;
    end if;
  end loop;
end $$;

-- Exercise RLS, not just ACLs: public taxonomy is readable; provider IDs are
-- inaccessible to API roles even if an unexpected permissive policy is added.
begin;
set local role anon;
select count(*) from public.sports;
do $$
begin
  begin
    perform * from public.team_provider_ids;
    raise exception 'anon unexpectedly read provider mappings';
  exception when insufficient_privilege then
    null;
  end;
end $$;
rollback;

begin;
set local role authenticated;
select count(*) from public.teams;
do $$
begin
  begin
    insert into public.sports (code, slug, name, category)
    values ('BAD', 'bad', 'Bad', 'OTHER');
    raise exception 'authenticated unexpectedly wrote taxonomy';
  exception when insufficient_privilege then
    null;
  end;
end $$;
rollback;
