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
     or has_table_privilege('authenticated', 'public.sports', 'INSERT') then
    raise exception 'Client roles must not be able to write taxonomy';
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
