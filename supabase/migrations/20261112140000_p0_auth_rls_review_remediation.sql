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
    where favorite_teams is null or jsonb_typeof(favorite_teams::jsonb) <> 'array'
  $q$ into v_bad_roots;
  if v_bad_roots > 0 then
    raise exception 'P0-C preflight: % profile rows have NULL or non-array favorite_teams; no data was migrated', v_bad_roots;
  end if;

  execute $q$
    select count(*)
    from public.profiles p
    cross join lateral jsonb_array_elements(p.favorite_teams::jsonb) with ordinality as t(value, ordinality)
    where jsonb_typeof(t.value) <> 'object'
       or jsonb_typeof(t.value->'id') <> 'string'
       or length(btrim(coalesce(t.value->>'id', ''))) = 0
       or jsonb_typeof(t.value->'name') <> 'string'
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

-- One invoker-rights RPC is the transaction boundary for profile edits and
-- complete favorite replacement. auth.uid() is the only owner identifier.
create or replace function public.save_profile_and_favorite_teams(
  p_profile_updates jsonb default '{}'::jsonb,
  p_favorite_teams jsonb default null
)
returns public.profiles
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_unknown_keys text[];
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_profile_updates is null or jsonb_typeof(p_profile_updates) <> 'object' then
    raise exception 'Profile updates must be a JSON object';
  end if;
  if p_favorite_teams is not null and jsonb_typeof(p_favorite_teams) <> 'array' then
    raise exception 'Favorite teams must be a JSON array';
  end if;

  select array_agg(k) into v_unknown_keys
  from jsonb_object_keys(p_profile_updates) as keys(k)
  where k not in (
    'username','firstName','lastName','name','profilePhotoUrl','avatar',
    'onboardingCompleted','onboardingStep','homeCity','homeState','homeZip',
    'latitude','longitude','favoriteSports','favoriteLeagues','preferredExperience',
    'currentIntent','preferences','privacySettings','notificationPreferences','savedVenueIds'
  );
  if coalesce(array_length(v_unknown_keys, 1), 0) > 0 then
    raise exception 'Unsupported profile update fields: %', array_to_string(v_unknown_keys, ', ');
  end if;

  if p_profile_updates ? 'favoriteSports' and jsonb_typeof(p_profile_updates->'favoriteSports') <> 'array' then
    raise exception 'favoriteSports must be an array';
  end if;
  if p_profile_updates ? 'favoriteLeagues' and jsonb_typeof(p_profile_updates->'favoriteLeagues') <> 'array' then
    raise exception 'favoriteLeagues must be an array';
  end if;
  if p_profile_updates ? 'preferredExperience' and jsonb_typeof(p_profile_updates->'preferredExperience') <> 'array' then
    raise exception 'preferredExperience must be an array';
  end if;
  if p_profile_updates ? 'savedVenueIds' and jsonb_typeof(p_profile_updates->'savedVenueIds') <> 'array' then
    raise exception 'savedVenueIds must be an array';
  end if;

  update public.profiles p set
    username = case when p_profile_updates ? 'username' then p_profile_updates->>'username' else p.username end,
    first_name = case when p_profile_updates ? 'firstName' then p_profile_updates->>'firstName' else p.first_name end,
    last_name = case when p_profile_updates ? 'lastName' then p_profile_updates->>'lastName' else p.last_name end,
    display_name = case when p_profile_updates ? 'name' then p_profile_updates->>'name' else p.display_name end,
    avatar_url = case when p_profile_updates ? 'profilePhotoUrl' then p_profile_updates->>'profilePhotoUrl'
                      when p_profile_updates ? 'avatar' then p_profile_updates->>'avatar' else p.avatar_url end,
    onboarding_completed = case when p_profile_updates ? 'onboardingCompleted' then (p_profile_updates->>'onboardingCompleted')::boolean else p.onboarding_completed end,
    onboarding_step = case when p_profile_updates ? 'onboardingStep' then p_profile_updates->>'onboardingStep' else p.onboarding_step end,
    home_city = case when p_profile_updates ? 'homeCity' then p_profile_updates->>'homeCity' else p.home_city end,
    home_state = case when p_profile_updates ? 'homeState' then p_profile_updates->>'homeState' else p.home_state end,
    home_zip = case when p_profile_updates ? 'homeZip' then p_profile_updates->>'homeZip' else p.home_zip end,
    latitude = case when p_profile_updates ? 'latitude' then (p_profile_updates->>'latitude')::double precision else p.latitude end,
    longitude = case when p_profile_updates ? 'longitude' then (p_profile_updates->>'longitude')::double precision else p.longitude end,
    favorite_sports = case when p_profile_updates ? 'favoriteSports' then array(select jsonb_array_elements_text(p_profile_updates->'favoriteSports')) else p.favorite_sports end,
    favorite_leagues = case when p_profile_updates ? 'favoriteLeagues' then array(select jsonb_array_elements_text(p_profile_updates->'favoriteLeagues')) else p.favorite_leagues end,
    preferred_experience = case when p_profile_updates ? 'preferredExperience' then array(select jsonb_array_elements_text(p_profile_updates->'preferredExperience')) else p.preferred_experience end,
    current_intent = case when p_profile_updates ? 'currentIntent' then p_profile_updates->>'currentIntent' else p.current_intent end,
    preferences = case when p_profile_updates ? 'preferences' then p_profile_updates->'preferences' else p.preferences end,
    privacy_settings = case when p_profile_updates ? 'privacySettings' then p_profile_updates->'privacySettings' else p.privacy_settings end,
    notification_preferences = case when p_profile_updates ? 'notificationPreferences' then p_profile_updates->'notificationPreferences' else p.notification_preferences end,
    saved_venue_ids = case when p_profile_updates ? 'savedVenueIds' then array(select jsonb_array_elements_text(p_profile_updates->'savedVenueIds')) else p.saved_venue_ids end,
    updated_at = now()
  where p.id = v_user_id
  returning p.* into v_profile;

  if not found then
    raise exception 'Canonical profile row is missing for authenticated user %', v_user_id;
  end if;

  if p_favorite_teams is not null then
    if exists (
      select 1 from jsonb_array_elements(p_favorite_teams) as t(value)
      where jsonb_typeof(t.value) <> 'object'
         or jsonb_typeof(t.value->'id') <> 'string'
         or length(btrim(coalesce(t.value->>'id',''))) = 0
         or jsonb_typeof(t.value->'name') <> 'string'
         or length(btrim(coalesce(t.value->>'name',''))) = 0
    ) then
      raise exception 'Every favorite team must be an object with non-empty string id and name';
    end if;

    insert into public.user_favorite_teams
      (user_id, team_id, team_name, sport_id, league, abbrev, logo, color, sort_order)
    select v_user_id, team_id, team_name, sport_id, league, abbrev, logo, color, (ordinality - 1)::integer
    from (
      select distinct on (t.value->>'id')
        t.value->>'id' as team_id,
        t.value->>'name' as team_name,
        coalesce(nullif(btrim(t.value->>'sportId'), ''), 'OTHER') as sport_id,
        coalesce(nullif(btrim(t.value->>'league'), ''), 'OTHER') as league,
        coalesce(t.value->>'abbrev', '') as abbrev,
        coalesce(t.value->>'logo', '') as logo,
        nullif(t.value->>'color', '') as color,
        t.ordinality
      from jsonb_array_elements(p_favorite_teams) with ordinality as t(value, ordinality)
      order by t.value->>'id', t.ordinality
    ) selected
    on conflict (user_id, team_id) do update set
      team_name = excluded.team_name,
      sport_id = excluded.sport_id,
      league = excluded.league,
      abbrev = excluded.abbrev,
      logo = excluded.logo,
      color = excluded.color,
      sort_order = excluded.sort_order,
      updated_at = now();

    delete from public.user_favorite_teams f
    where f.user_id = v_user_id
      and not exists (
        select 1 from jsonb_array_elements(p_favorite_teams) as t(value)
        where t.value->>'id' = f.team_id
      );
  end if;

  return v_profile;
end;
$$;

revoke all on function public.save_profile_and_favorite_teams(jsonb, jsonb) from public, anon;
grant execute on function public.save_profile_and_favorite_teams(jsonb, jsonb) to authenticated;
