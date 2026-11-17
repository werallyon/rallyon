-- Seed only game-to-venue relationships supported by official club or venue sources.
-- Do not infer network, screen allocation, or audio for the FC Dallas listings.
begin;

with fc_dallas_games as (
  select id, start_time
  from public.games
  where league = 'MLS'
    and start_time >= now()
    and status in ('UPCOMING', 'DELAYED')
    and (
      home_team ->> 'name' = 'FC Dallas'
      or away_team ->> 'name' = 'FC Dallas'
    )
),
fc_dallas_venues as (
  select *
  from (values
    (
      'a1000000-0000-4000-8000-000000000008'::uuid,
      90::numeric,
      'https://www.fcdallas.com/watchparty'::text,
      'FC Dallas official Where To Watch directory lists The Green Gator as a location to watch every FC Dallas match. Network, screen allocation, and audio are not specified.'
    ),
    (
      'a1000000-0000-4000-8000-000000000013'::uuid,
      90::numeric,
      'https://www.fcdallas.com/watchparty'::text,
      'FC Dallas official Where To Watch directory lists The Derbyshire as a location to watch every FC Dallas match. Network, screen allocation, and audio are not specified.'
    ),
    (
      'a1000000-0000-4000-8000-000000000017'::uuid,
      85::numeric,
      'https://www.grandscape.com/directory/toca-social/'::text,
      'Grandscape official venue listing says TOCA Social shows all televised games, subject to match clashes; full match audio is stated only for marquee matches. This fixture audio is not confirmed.'
    )
  ) as venues(venue_id, confidence, source_url, verification_notes)
)
insert into public.venue_game_programming (
  venue_id, game_id, network, status, is_confirmed, audio_on, screen,
  featured, notes, confidence, verified_at, created_by, start_time, end_time,
  source_type, source_url, verification_notes
)
select
  venue.venue_id,
  game.id,
  null,
  'CONFIRMED',
  true,
  false,
  null,
  false,
  'Official source lists this venue for FC Dallas matches; confirm kickoff-day availability and audio with the venue.',
  venue.confidence,
  now(),
  null,
  game.start_time,
  null,
  'OFFICIAL',
  venue.source_url,
  venue.verification_notes
from fc_dallas_games game
cross join fc_dallas_venues venue
on conflict (venue_id, game_id) do nothing;

-- G.O.A.T's Arena Aubrey explicitly advertises Cowboys Sundays, NFL Sunday Ticket,
-- and multiple audio zones. Restrict the seeded commitment to upcoming Sunday games.
insert into public.venue_game_programming (
  venue_id, game_id, network, status, is_confirmed, audio_on, screen,
  featured, notes, confidence, verified_at, created_by, start_time, end_time,
  source_type, source_url, verification_notes
)
select
  'a1000000-0000-4000-8000-000000000018'::uuid,
  game.id,
  null,
  'CONFIRMED',
  true,
  true,
  '220-inch jumbo screen',
  false,
  'G.O.A.T''s Arena Aubrey advertises Cowboys Sundays with NFL Sunday Ticket and multiple audio zones.',
  95,
  now(),
  null,
  game.start_time,
  null,
  'VENUE',
  'https://goatsarena.us/locations/aubrey',
  'Official venue page identifies Cowboys Sundays, NFL Sunday Ticket on screen, and multiple audio zones. Seeded only for upcoming Sunday Dallas Cowboys fixtures; broadcast network is not inferred.'
from public.games game
where game.league = 'NFL'
  and game.start_time >= now()
  and game.status in ('UPCOMING', 'DELAYED')
  and extract(isodow from game.start_time at time zone 'America/Chicago') = 7
  and (
    game.home_team ->> 'name' = 'Dallas Cowboys'
    or game.away_team ->> 'name' = 'Dallas Cowboys'
  )
on conflict (venue_id, game_id) do nothing;

commit;
