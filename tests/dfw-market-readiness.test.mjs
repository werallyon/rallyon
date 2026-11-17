import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const marketService = readFileSync(new URL('../src/services/marketService.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20261117100000_seed_dfw_market_and_cities.sql', import.meta.url), 'utf8');
const marketsData = readFileSync(new URL('../src/data/marketsData.ts', import.meta.url), 'utf8');
const programmingMigration = readFileSync(new URL('../supabase/migrations/20261117104500_seed_dfw_official_game_programming.sql', import.meta.url), 'utf8');

test('production venue UUIDs resolve to the client market IDs without geographic cross-market fallback', () => {
  assert.match(marketService, /market_texarkana:\s*'108e0e1e-23bd-4f7a-a792-a79429720ea9'/);
  assert.match(marketService, /market_dfw:\s*'b2c1d8e4-7a6f-4d31-9c52-8f0a1e6b4d20'/);
  assert.match(marketService, /venue\.market_id === targetId \|\| venue\.market_id === databaseMarketId/);
  assert.match(marketService, /Geographic radius fallback is only for legacy rows without a market assignment/);
});

test('DFW migration seeds a stable market and broad metro city coverage without fabricating venues', () => {
  assert.match(migration, /'dallas-fort-worth'/);
  assert.match(migration, /'b2c1d8e4-7a6f-4d31-9c52-8f0a1e6b4d20'::uuid/);
  assert.match(migration, /'PREPARING'/);
  for (const city of ['Dallas, TX', 'Fort Worth, TX', 'Arlington, TX', 'Plano, TX', 'Frisco, TX', 'Denton, TX', 'McKinney, TX', 'Mansfield, TX', 'The Colony, TX', 'Aubrey, TX']) {
    assert.ok(migration.includes(city), `missing DFW city: ${city}`);
  }
  assert.match(migration, /Venue rows are intentionally not fabricated/);
  assert.doesNotMatch(migration, /insert into public\.venues/i);
});

test('DFW city seeds are merged into existing local storage rather than hidden by stale cached lists', () => {
  assert.match(marketsData, /id: 'city_plano'[\s\S]*market_id: 'market_dfw'/);
  assert.match(marketsData, /id: 'city_frisco'[\s\S]*market_id: 'market_dfw'/);
  assert.match(marketsData, /id: 'city_mansfield'[\s\S]*market_id: 'market_dfw'/);
  assert.match(marketsData, /id: 'city_the_colony'[\s\S]*market_id: 'market_dfw'/);
  assert.match(marketsData, /id: 'city_aubrey'[\s\S]*market_id: 'market_dfw'/);
  assert.match(marketService, /const parsedCities: City\[\] = storedCities \? JSON\.parse\(storedCities\) : \[\]/);
  assert.match(marketService, /SEEDED_CITIES\.filter\(\(seeded\) => !parsedCities\.some\(\(stored\) => stored\.id === seeded\.id\)\)/);
});

test('DFW directory seed contains real unclaimed venues without fabricated game programming or venue truth', () => {
  const venueMigration = readFileSync(new URL('../supabase/migrations/20261117103000_seed_dfw_venue_directory.sql', import.meta.url), 'utf8');
  const provenance = readFileSync(new URL('../docs/dfw-venue-seed-provenance.md', import.meta.url), 'utf8');
  for (const venue of ["Frankie''s Downtown", 'Press Box Grill', 'Happiest Hour', 'Christies Sports Bar', 'Harwood Arms', 'Texas Live!', 'Sidecar Social Frisco', 'The Green Gator', "Fat Daddy''s Sports & Spirits Cafe", "Morton''s Tavern", 'Texas Republic Fort Worth', 'Buffalo Bros Sundance Square', 'The Derbyshire Pub', "Walk-On''s Sports Bistreaux The Colony", "BoomerJack''s Bedford", "BoomerJack''s Grapevine", 'TOCA Social', "G.O.A.T''s Arena Aubrey"]) {
    assert.ok(venueMigration.includes(venue), `missing DFW venue: ${venue}`);
  }
  assert.equal((venueMigration.match(/'a1000000-0000-4000-8000-0000000000/g) ?? []).length, 18);
  assert.match(venueMigration, /'\{\}'::jsonb/);
  assert.match(venueMigration, /false,\s*null,\s*null,\s*null,\s*null,\s*false/);
  assert.doesNotMatch(venueMigration, /insert into public\.venue_game_programming/i);
  assert.match(provenance, /A separate forward-only migration seeds game-specific programming/);
  assert.match(provenance, /DFW remains `PREPARING`/);
});

test('DFW game programming is limited to official club and venue commitments', () => {
  assert.match(programmingMigration, /https:\/\/www\.fcdallas\.com\/watchparty/);
  assert.match(programmingMigration, /https:\/\/www\.grandscape\.com\/directory\/toca-social/);
  assert.match(programmingMigration, /https:\/\/goatsarena\.us\/locations\/aubrey/);
  assert.match(programmingMigration, /'OFFICIAL',/);
  assert.match(programmingMigration, /'VENUE',/);
  assert.match(programmingMigration, /where league = 'MLS'/);
  assert.match(programmingMigration, /game\.league = 'NFL'/);
  assert.match(programmingMigration, /extract\(isodow from game\.start_time at time zone 'America\/Chicago'\) = 7/);
  assert.match(programmingMigration, /audio_on, screen/);
  assert.match(programmingMigration, /220-inch jumbo screen/);
  assert.match(programmingMigration, /network is not specified|network is not inferred/i);
  assert.match(programmingMigration, /then 'PLANNED'/);
  assert.match(programmingMigration, /else 'CONFIRMED'/);
  assert.match(programmingMigration, /venue\.venue_id <> 'a1000000-0000-4000-8000-000000000017'::uuid/);
});
