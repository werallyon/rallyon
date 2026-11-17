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
  if v_count <> 26 then
    raise exception 'Expected 26 DFW cities, found %', v_count;
  end if;

  select count(*) into v_count from public.venues where market_id = v_market_id;
  if v_count <> 14 then
    raise exception 'Expected 14 DFW venues, found %', v_count;
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

  raise notice 'PASS: DFW market, 25 cities, 11 real unclaimed venues, valid city links and trust boundaries';
end $$;
