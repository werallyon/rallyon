-- Seed the DFW market and its core city coverage.
-- Venue rows are intentionally not fabricated here; they require verified business
-- identity, address, coordinates, and an operational source before production insertion.
begin;

with dfw_market as (
  insert into public.markets (
    id, name, slug, state, state_code, country, timezone,
    latitude, longitude, radius_miles, geographic_boundary,
    population, status, launch_status
  )
  values (
    'b2c1d8e4-7a6f-4d31-9c52-8f0a1e6b4d20'::uuid,
    'Dallas–Fort Worth Metroplex',
    'dallas-fort-worth',
    'Texas',
    'TX',
    'USA',
    'America/Chicago',
    32.7767,
    -96.7970,
    45,
    jsonb_build_object(
      'type', 'RADIUS',
      'radiusMiles', 45,
      'center', jsonb_build_object('lat', 32.7767, 'lng', -96.7970)
    ),
    7637000,
    'ACTIVE',
    'PREPARING'
  )
  on conflict (slug) do update set
    name = excluded.name,
    state = excluded.state,
    state_code = excluded.state_code,
    country = excluded.country,
    timezone = excluded.timezone,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    radius_miles = excluded.radius_miles,
    geographic_boundary = excluded.geographic_boundary,
    population = excluded.population,
    status = 'ACTIVE',
    launch_status = 'PREPARING',
    updated_at = now()
  returning id
)
insert into public.cities (
  id, market_id, name, state, state_code, country,
  latitude, longitude, population, status
)
select
  city.id::uuid,
  dfw_market.id,
  city.name,
  'Texas',
  'TX',
  'USA',
  city.latitude,
  city.longitude,
  null,
  'ACTIVE'
from dfw_market
cross join (values
  ('a0000000-0000-4000-8000-000000000001', 'Dallas, TX', 32.7767, -96.7970),
  ('a0000000-0000-4000-8000-000000000002', 'Fort Worth, TX', 32.7555, -97.3308),
  ('a0000000-0000-4000-8000-000000000003', 'Arlington, TX', 32.7357, -97.1081),
  ('a0000000-0000-4000-8000-000000000004', 'Plano, TX', 33.0198, -96.6989),
  ('a0000000-0000-4000-8000-000000000005', 'Frisco, TX', 33.1507, -96.8236),
  ('a0000000-0000-4000-8000-000000000006', 'Irving, TX', 32.8140, -96.9489),
  ('a0000000-0000-4000-8000-000000000007', 'Grand Prairie, TX', 32.7460, -96.9978),
  ('a0000000-0000-4000-8000-000000000008', 'Garland, TX', 32.9126, -96.6389),
  ('a0000000-0000-4000-8000-000000000009', 'Richardson, TX', 32.9483, -96.7299),
  ('a0000000-0000-4000-8000-000000000010', 'McKinney, TX', 33.1972, -96.6398),
  ('a0000000-0000-4000-8000-000000000011', 'Denton, TX', 33.2148, -97.1331),
  ('a0000000-0000-4000-8000-000000000012', 'Lewisville, TX', 33.0462, -96.9942),
  ('a0000000-0000-4000-8000-000000000013', 'Grapevine, TX', 32.9343, -97.0781),
  ('a0000000-0000-4000-8000-000000000014', 'Carrollton, TX', 32.9756, -96.8899),
  ('a0000000-0000-4000-8000-000000000015', 'Addison, TX', 32.9618, -96.8292),
  ('a0000000-0000-4000-8000-000000000016', 'Mansfield, TX', 32.5632, -97.1417),
  ('a0000000-0000-4000-8000-000000000017', 'Bedford, TX', 32.8440, -97.1431),
  ('a0000000-0000-4000-8000-000000000018', 'Euless, TX', 32.8371, -97.0819),
  ('a0000000-0000-4000-8000-000000000019', 'Flower Mound, TX', 33.0146, -97.0969),
  ('a0000000-0000-4000-8000-000000000020', 'Rowlett, TX', 32.9029, -96.5639),
  ('a0000000-0000-4000-8000-000000000021', 'Rockwall, TX', 32.9312, -96.4597),
  ('a0000000-0000-4000-8000-000000000022', 'Keller, TX', 32.9346, -97.2517),
  ('a0000000-0000-4000-8000-000000000023', 'Southlake, TX', 32.9412, -97.1342),
  ('a0000000-0000-4000-8000-000000000024', 'Duncanville, TX', 32.6518, -96.9083),
  ('a0000000-0000-4000-8000-000000000025', 'DeSoto, TX', 32.5899, -96.8570),
  ('a0000000-0000-4000-8000-000000000026', 'The Colony, TX', 33.0890, -96.8860),
  ('a0000000-0000-4000-8000-000000000027', 'Aubrey, TX', 33.3043, -96.9860),
  ('a0000000-0000-4000-8000-000000000028', 'Mesquite, TX', 32.7668, -96.5992)
) as city(id, name, latitude, longitude)
on conflict (id) do update set
  market_id = excluded.market_id,
  name = excluded.name,
  state = excluded.state,
  state_code = excluded.state_code,
  country = excluded.country,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  status = 'ACTIVE',
  updated_at = now();

commit;
