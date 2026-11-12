-- Synthetic-only fixtures for the local validation stack.
-- Stable UUIDs make RLS checks repeatable. No production identifiers/data.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  'a1000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'p0-a@example.test', '',
  now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"p0_a_fixture","firstName":"P0","lastName":"Alpha","name":"P0 Alpha"}'::jsonb,
  now(), now()
),
(
  'b2000000-0000-4000-8000-000000000002',
  'authenticated', 'authenticated', 'p0-b@example.test', '',
  now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"p0_b_fixture","firstName":"P0","lastName":"Bravo","name":"P0 Bravo"}'::jsonb,
  now(), now()
)
on conflict (id) do nothing;

-- Legacy source fixture for the P0-C migration that follows this migration.
update public.profiles
set favorite_teams = '[
  {"id":"fixture-nfl-kc","name":"Kansas City Chiefs","sportId":"FOOTBALL","league":"NFL","abbrev":"KC","logo":"kc.svg","color":"#E31837"},
  {"id":"fixture-mls-atx","name":"Austin FC","sportId":"SOCCER","league":"MLS","abbrev":"ATX","logo":"atx.svg"},
  {"id":"fixture-nfl-kc","name":"Kansas City Chiefs","sportId":"FOOTBALL","league":"NFL","abbrev":"KC","logo":"kc.svg","color":"#E31837"},
  {"id":" ","name":"Blank ID"},
  {"id":"fixture-missing-name"}
]'::jsonb
where id = 'a1000000-0000-4000-8000-000000000001';

update public.profiles
set favorite_teams = '[]'::jsonb
where id = 'b2000000-0000-4000-8000-000000000002';
