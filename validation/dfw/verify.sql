do $$
declare
  v_market_id uuid;
  v_count integer;
begin
  select id into v_market_id
  from public.markets
  where slug = 'dallas-fort-worth'
    and launch_status = 'PREPARING'
    and status = 'ACTIVE';
  if v_market_id is null then
    raise exception 'DFW market missing or has unexpected launch status';
  end if;

  select count(*) into v_count from public.cities where market_id = v_market_id;
  if v_count <> 27 then
    raise exception 'Expected 27 DFW cities, found %', v_count;
  end if;

  select count(*) into v_count from public.venues where market_id = v_market_id;
  if v_count <> 18 then
    raise exception 'Expected 18 DFW venues, found %', v_count;
  end if;

  if exists (
    select 1 from public.venues
    where market_id = v_market_id
      and (claimed or is_demo_data or venue_truth <> '{}'::jsonb)
  ) then
    raise exception 'DFW seed contains claimed/demo venues or fabricated venue truth';
  end if;

  if exists (
    select 1 from public.venues v
    left join public.cities c on c.id = v.city_id
    where v.market_id = v_market_id
      and (c.id is null or c.market_id is distinct from v_market_id)
  ) then
    raise exception 'DFW venue references a city outside the DFW market';
  end if;

  if exists (
    select 1 from public.venues
    where market_id = v_market_id
      and (latitude < -90 or latitude > 90 or longitude < -180 or longitude > 180)
  ) then
    raise exception 'DFW seed contains invalid WGS84 coordinates';
  end if;

  if exists (
    select 1 from public.venues
    where market_id = v_market_id
      and (baseline ? 'priceLevel' or baseline ? 'capacity')
  ) then
    raise exception 'DFW seed includes unverified price or capacity values';
  end if;

  select count(*) into v_count
  from public.venue_game_programming
  where game_id in (
    'f0000000-0000-4000-8000-000000000001'::uuid,
    'f0000000-0000-4000-8000-000000000002'::uuid
  );
  if v_count <> 4 then
    raise exception 'Expected 4 official DFW game-to-venue rows, found %', v_count;
  end if;

  if exists (
    select 1
    from public.venue_game_programming p
    where p.game_id = 'f0000000-0000-4000-8000-000000000001'::uuid
      and (
        p.status <> 'CONFIRMED'
        or not p.is_confirmed
        or p.source_type <> 'OFFICIAL'
        or p.network is not null
        or p.screen is not null
        or p.audio_on
      )
  ) then
    raise exception 'FC Dallas programming contains unsupported broadcast, screen, or audio claims';
  end if;

  if not exists (
    select 1
    from public.venue_game_programming p
    where p.game_id = 'f0000000-0000-4000-8000-000000000002'::uuid
      and p.venue_id = 'a1000000-0000-4000-8000-000000000018'::uuid
      and p.status = 'CONFIRMED'
      and p.is_confirmed
      and p.source_type = 'VENUE'
      and p.audio_on
      and p.screen = '220-inch jumbo screen'
  ) then
    raise exception 'G.O.A.T''s Arena Cowboys Sunday programming is missing or lacks its sourced audio/screen facts';
  end if;

  if exists (
    select 1 from public.venue_game_programming
    where game_id in (
      'f0000000-0000-4000-8000-000000000001'::uuid,
      'f0000000-0000-4000-8000-000000000002'::uuid
    )
      and source_url is null
  ) then
    raise exception 'DFW programming rows must retain their source URLs';
  end if;

  raise notice 'PASS: DFW market, 27 cities, 18 real unclaimed venues, 4 source-backed game-to-venue rows and trust boundaries';
end $$;
