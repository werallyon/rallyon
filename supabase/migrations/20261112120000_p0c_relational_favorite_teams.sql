-- P0-C/P0-A remediation: transactional profile + relational favorites write.
-- This migration is additive. It deliberately refuses to adopt an unknown
-- pre-existing relation or malformed legacy profile data.
do $$
declare
  v_favorites_type text;
  v_bad_roots bigint;
  v_bad_items bigint;
  v_select_policy boolean;
  v_insert_policy boolean;
  v_update_policy boolean;
  v_rls boolean;
  v_anon_grants bigint;
  v_bootstrap_trigger boolean;
  v_unverified_policies bigint;
  v_bad_profile_columns text[];
  v_has_profile_pk boolean;
  v_has_profile_auth_fk boolean;
  v_public_profile_grants bigint;
begin
  if to_regclass('public.profiles') is null then
    raise exception 'P0-C preflight: public.profiles does not exist; stop and reconcile the profile schema first';
  end if;

  select c.relrowsecurity into v_rls
  from pg_class c where c.oid = 'public.profiles'::regclass;
  if not coalesce(v_rls, false) then
    raise exception 'P0-C preflight: RLS is not enabled on public.profiles';
  end if;

  -- Accept only the two canonical owner predicates after removing
  -- formatting parentheses/whitespace. Any additional permissive policy for
  -- authenticated/anon/PUBLIC must also be owner-scoped; PostgreSQL ORs
  -- permissive policies together, so a second broad policy defeats a safe one.
  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd = 'SELECT' and permissive = 'PERMISSIVE'
      and roles @> array['authenticated']::name[]
      and regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g')
          in ('auth.uid=id', 'id=auth.uid', 'selectauth.uid=id', 'id=selectauth.uid', 'selectauth.uidasuid=id', 'id=selectauth.uidasuid')
  ) into v_select_policy;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd = 'INSERT' and permissive = 'PERMISSIVE'
      and roles @> array['authenticated']::name[]
      and regexp_replace(lower(coalesce(with_check, '')), '[[:space:]()]', '', 'g')
          in ('auth.uid=id', 'id=auth.uid', 'selectauth.uid=id', 'id=selectauth.uid', 'selectauth.uidasuid=id', 'id=selectauth.uidasuid')
  ) into v_insert_policy;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and cmd = 'UPDATE' and permissive = 'PERMISSIVE'
      and roles @> array['authenticated']::name[]
      and regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g')
          in ('auth.uid=id', 'id=auth.uid', 'selectauth.uid=id', 'id=selectauth.uid', 'selectauth.uidasuid=id', 'id=selectauth.uidasuid')
      and regexp_replace(lower(coalesce(with_check, '')), '[[:space:]()]', '', 'g')
          in ('auth.uid=id', 'id=auth.uid', 'selectauth.uid=id', 'id=selectauth.uid', 'selectauth.uidasuid=id', 'id=selectauth.uidasuid')
  ) into v_update_policy;

  if not v_select_policy or not v_insert_policy or not v_update_policy then
    raise exception 'P0-C preflight: public.profiles must have authenticated owner-scoped SELECT, INSERT, and UPDATE policies (UPDATE requires USING and WITH CHECK)';
  end if;

  select exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace pn on pn.oid = p.pronamespace
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and t.tgname = 'on_auth_user_created'
      and t.tgenabled in ('O', 'A')
      and t.tgtype = 5 -- AFTER INSERT FOR EACH ROW
      and pn.nspname = 'public'
      and p.proname = 'handle_new_user'
      and p.prosecdef
      and pg_get_userbyid(p.proowner) in ('postgres', 'supabase_admin')
      and exists (
        select 1 from unnest(coalesce(p.proconfig, array[]::text[])) cfg
        where regexp_replace(cfg, '[[:space:]]', '', 'g') = 'search_path=public,pg_temp'
      )
      and pg_get_functiondef(p.oid) ilike '%insert into public.profiles%'
      and pg_get_functiondef(p.oid) ilike '%new.id%'
  ) into v_bootstrap_trigger;
  if not v_bootstrap_trigger then
    raise exception 'P0-C preflight: expected enabled AFTER INSERT row trigger auth.on_auth_user_created -> public.handle_new_user SECURITY DEFINER with pinned safe search_path and profile insert was not verified';
  end if;

  select count(*) into v_unverified_policies
  from pg_policies
  where schemaname = 'public' and tablename = 'profiles'
    and permissive = 'PERMISSIVE'
    and (roles && array['authenticated', 'anon', 'public']::name[])
    and (
      cmd = 'ALL'
      or (cmd in ('SELECT', 'UPDATE', 'DELETE') and
        regexp_replace(lower(coalesce(qual, '')), '[[:space:]()]', '', 'g')
          not in ('auth.uid=id', 'id=auth.uid', 'selectauth.uid=id', 'id=selectauth.uid', 'selectauth.uidasuid=id', 'id=selectauth.uidasuid'))
      or (cmd in ('INSERT', 'UPDATE') and
        regexp_replace(lower(coalesce(with_check, '')), '[[:space:]()]', '', 'g')
          not in ('auth.uid=id', 'id=auth.uid', 'selectauth.uid=id', 'id=selectauth.uid', 'selectauth.uidasuid=id', 'id=selectauth.uidasuid'))
    );
  if v_unverified_policies > 0 then
    raise exception 'P0-C preflight: % permissive profile policies for authenticated/anon/PUBLIC do not match the exact owner predicate allowlist; inspect policy OR-composition', v_unverified_policies;
  end if;

  select count(*) into v_anon_grants
  from unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as privilege_name
  where has_table_privilege('anon', 'public.profiles', privilege_name);
  if v_anon_grants > 0 then
    raise exception 'P0-C preflight: anon has % effective privileges on public.profiles; audit grants before rollout', v_anon_grants;
  end if;

  select count(*) into v_public_profile_grants
  from pg_class c
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
  where c.oid = 'public.profiles'::regclass
    and acl.grantee = 0
    and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE');
  if v_public_profile_grants > 0 then
    raise exception 'P0-C preflight: PUBLIC has % effective table grants on public.profiles; revoke them before rollout', v_public_profile_grants;
  end if;

  if not has_table_privilege('authenticated', 'public.profiles', 'SELECT')
     or not has_table_privilege('authenticated', 'public.profiles', 'UPDATE') then
    raise exception 'P0-C preflight: authenticated must retain effective SELECT and UPDATE privileges on public.profiles for the invoker-rights profile RPC';
  end if;

  select exists (
    select 1 from pg_constraint c
    where c.conrelid = 'public.profiles'::regclass
      and c.contype = 'p'
      and c.conkey = array[(select a.attnum from pg_attribute a where a.attrelid = c.conrelid and a.attname = 'id' and not a.attisdropped)]::smallint[]
  ) into v_has_profile_pk;
  if not coalesce(v_has_profile_pk, false) then
    raise exception 'P0-C preflight: public.profiles.id must be the sole primary key';
  end if;

  select exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.profiles'::regclass
      and c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
      and c.conkey = array[(select a.attnum from pg_attribute a where a.attrelid = c.conrelid and a.attname = 'id' and not a.attisdropped)]::smallint[]
      and c.confkey = array[(select a.attnum from pg_attribute a where a.attrelid = c.confrelid and a.attname = 'id' and not a.attisdropped)]::smallint[]
  ) into v_has_profile_auth_fk;
  if not coalesce(v_has_profile_auth_fk, false) then
    raise exception 'P0-C preflight: public.profiles.id must reference auth.users.id';
  end if;

  select array_agg(required.column_name || ' expected ' || required.data_type ||
                   coalesce(' (' || required.udt_name || ')', '') ||
                   ', found ' || coalesce(actual.data_type || ' (' || actual.udt_name || ')', 'MISSING'))
  into v_bad_profile_columns
  from (values
    ('id', 'uuid', 'uuid'),
    ('username', 'text', 'text'),
    ('first_name', 'text', 'text'),
    ('last_name', 'text', 'text'),
    ('display_name', 'text', 'text'),
    ('avatar_url', 'text', 'text'),
    ('onboarding_completed', 'boolean', 'bool'),
    ('onboarding_step', 'text', 'text'),
    ('home_city', 'text', 'text'),
    ('home_state', 'text', 'text'),
    ('home_zip', 'text', 'text'),
    ('latitude', 'double precision', 'float8'),
    ('longitude', 'double precision', 'float8'),
    ('favorite_sports', 'ARRAY', '_text'),
    ('favorite_leagues', 'ARRAY', '_text'),
    ('preferred_experience', 'ARRAY', '_text'),
    ('current_intent', 'text', 'text'),
    ('preferences', 'jsonb', 'jsonb'),
    ('privacy_settings', 'jsonb', 'jsonb'),
    ('notification_preferences', 'jsonb', 'jsonb'),
    ('saved_venue_ids', 'ARRAY', '_text'),
    ('updated_at', 'timestamp with time zone', 'timestamptz')
  ) as required(column_name, data_type, udt_name)
  left join information_schema.columns actual
    on actual.table_schema = 'public'
   and actual.table_name = 'profiles'
   and actual.column_name = required.column_name
  where actual.column_name is null
     or actual.data_type <> required.data_type
     or actual.udt_name <> required.udt_name;
  if coalesce(array_length(v_bad_profile_columns, 1), 0) > 0 then
    raise exception 'P0-C preflight: profile schema is incompatible with the transactional RPC: %',
      array_to_string(v_bad_profile_columns, '; ');
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
revoke all on table public.user_favorite_teams from public, anon, authenticated;
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
