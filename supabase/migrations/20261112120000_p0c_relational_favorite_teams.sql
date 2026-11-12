-- P0-C/P0-A remediation: transactional profile + relational favorites write.
-- This migration is additive. It deliberately refuses to adopt an unknown
-- pre-existing relation or malformed legacy profile data.
do $$
declare
  v_favorites_type text;
  v_bad_roots bigint;
  v_bad_items bigint;
  v_select_policy boolean;
  v_update_policy boolean;
  v_rls boolean;
  v_broad_policies bigint;
  v_anon_grants bigint;
begin
  if to_regclass('public.profiles') is null then
    raise exception 'P0-C preflight: public.profiles does not exist; stop and reconcile the profile schema first';
  end if;

  select c.relrowsecurity into v_rls
  from pg_class c where c.oid = 'public.profiles'::regclass;
  if not coalesce(v_rls, false) then
    raise exception 'P0-C preflight: RLS is not enabled on public.profiles';
  end if;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd = 'SELECT' and permissive = 'PERMISSIVE'
      and roles @> array['authenticated']::name[]
      and lower(coalesce(qual, '')) like '%auth.uid()%'
      and lower(coalesce(qual, '')) like '%id%'
  ) into v_select_policy;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd = 'UPDATE' and permissive = 'PERMISSIVE'
      and roles @> array['authenticated']::name[]
      and lower(coalesce(qual, '')) like '%auth.uid()%'
      and lower(coalesce(qual, '')) like '%id%'
      and lower(coalesce(with_check, '')) like '%auth.uid()%'
      and lower(coalesce(with_check, '')) like '%id%'
  ) into v_update_policy;

  if not v_select_policy or not v_update_policy then
    raise exception 'P0-C preflight: public.profiles must have authenticated owner-scoped SELECT and UPDATE policies (USING and WITH CHECK)';
  end if;

  select count(*) into v_broad_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'profiles'
    and permissive = 'PERMISSIVE'
    and cmd in ('SELECT', 'UPDATE')
    and (roles @> array['authenticated']::name[] or roles @> array['public']::name[])
    and (
      lower(coalesce(qual, '')) not like '%auth.uid()%'
      or lower(coalesce(qual, '')) not like '%id%'
      or (cmd = 'UPDATE' and (
        lower(coalesce(with_check, '')) not like '%auth.uid()%'
        or lower(coalesce(with_check, '')) not like '%id%'
      ))
    );
  if v_broad_policies > 0 then
    raise exception 'P0-C preflight: found % potentially broad permissive profile SELECT/UPDATE policies; audit policy OR-composition before rollout', v_broad_policies;
  end if;

  select count(*) into v_anon_grants
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'profiles'
    and grantee = 'anon';
  if v_anon_grants > 0 then
    raise exception 'P0-C preflight: anon has % direct grants on public.profiles; audit grants before rollout', v_anon_grants;
  end if;

  select c.udt_name into v_favorites_type
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'profiles'
    and c.column_name = 'favorite_teams';

  if v_favorites_type is null then
    raise exception 'P0-C preflight: public.profiles.favorite_teams is missing';
  end if;
  if v_favorites_type not in ('json', 'jsonb') then
    raise exception 'P0-C preflight: favorite_teams must be json/jsonb, found %; inspect and repair explicitly before migration', v_favorites_type;
  end if;

  if to_regclass('public.user_favorite_teams') is not null then
    raise exception 'P0-C preflight: public.user_favorite_teams already exists; audit its columns, constraints, grants, and every policy before adopting it';
  end if;

  execute $q$
    select count(*) from public.profiles
    where coalesce(jsonb_typeof(favorite_teams::jsonb), 'null') <> 'array'
  $q$ into v_bad_roots;
  if v_bad_roots > 0 then
    raise exception 'P0-C preflight: % profile rows have NULL or non-array favorite_teams; no data was migrated', v_bad_roots;
  end if;

  execute $q$
    select count(*)
    from public.profiles p
    cross join lateral jsonb_array_elements(p.favorite_teams::jsonb) with ordinality as t(value, ordinality)
    where coalesce(jsonb_typeof(t.value), 'null') <> 'object'
       or coalesce(jsonb_typeof(t.value->'id'), 'null') <> 'string'
       or length(btrim(coalesce(t.value->>'id', ''))) = 0
       or coalesce(jsonb_typeof(t.value->'name'), 'null') <> 'string'
       or length(btrim(coalesce(t.value->>'name', ''))) = 0
  $q$ into v_bad_items;
  if v_bad_items > 0 then
    raise exception 'P0-C preflight: % legacy favorite entries lack a valid string id/name or are not objects; repair explicitly before migration', v_bad_items;
  end if;
end $$;

create table public.user_favorite_teams (
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id text not null,
  team_name text not null,
  sport_id text not null default 'OTHER',
  league text not null default 'OTHER',
  abbrev text not null default '',
  logo text not null default '',
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, team_id),
  constraint user_favorite_teams_team_id_nonempty check (length(btrim(team_id)) > 0),
  constraint user_favorite_teams_team_name_nonempty check (length(btrim(team_name)) > 0)
);
create index user_favorite_teams_team_id_idx on public.user_favorite_teams(team_id);
create index user_favorite_teams_user_sort_idx on public.user_favorite_teams(user_id, sort_order);
alter table public.user_favorite_teams enable row level security;

create policy user_favorite_teams_select_own on public.user_favorite_teams
  for select to authenticated using ((select auth.uid()) = user_id);
create policy user_favorite_teams_insert_own on public.user_favorite_teams
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_favorite_teams_update_own on public.user_favorite_teams
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy user_favorite_teams_delete_own on public.user_favorite_teams
  for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on table public.user_favorite_teams from anon, authenticated;
grant select, insert, update, delete on table public.user_favorite_teams to authenticated;

-- Stable backfill: first occurrence wins for duplicate team IDs; ordinality
-- preserves source order. The preflight rejects malformed required fields,
-- so this query never silently drops an entry.
insert into public.user_favorite_teams
  (user_id, team_id, team_name, sport_id, league, abbrev, logo, color, sort_order)
select user_id, team_id, team_name, sport_id, league, abbrev, logo, color, (ordinality - 1)::integer
from (
  select distinct on (p.id, t.value->>'id')
    p.id as user_id,
    t.value->>'id' as team_id,
    t.value->>'name' as team_name,
    coalesce(nullif(btrim(t.value->>'sportId'), ''), 'OTHER') as sport_id,
    coalesce(nullif(btrim(t.value->>'league'), ''), 'OTHER') as league,
    coalesce(t.value->>'abbrev', '') as abbrev,
    coalesce(t.value->>'logo', '') as logo,
    nullif(t.value->>'color', '') as color,
    t.ordinality
  from public.profiles p
  cross join lateral jsonb_array_elements(p.favorite_teams::jsonb) with ordinality as t(value, ordinality)
  order by p.id, t.value->>'id', t.ordinality
) deduplicated
order by user_id, ordinality;
