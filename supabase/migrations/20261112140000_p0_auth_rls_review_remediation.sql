-- Transactional profile and relational favorite-team write API.
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
      where coalesce(jsonb_typeof(t.value), 'null') <> 'object'
         or coalesce(jsonb_typeof(t.value->'id'), 'null') <> 'string'
         or length(btrim(coalesce(t.value->>'id',''))) = 0
         or coalesce(jsonb_typeof(t.value->'name'), 'null') <> 'string'
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
