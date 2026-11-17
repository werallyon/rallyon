import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const marketService = readFileSync(new URL('../src/services/marketService.ts', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20261117100000_seed_dfw_market_and_cities.sql', import.meta.url), 'utf8');
const marketsData = readFileSync(new URL('../src/data/marketsData.ts', import.meta.url), 'utf8');

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
  for (const city of ['Dallas, TX', 'Fort Worth, TX', 'Arlington, TX', 'Plano, TX', 'Frisco, TX', 'Denton, TX', 'McKinney, TX', 'Mansfield, TX']) {
    assert.ok(migration.includes(city), `missing DFW city: ${city}`);
  }
  assert.match(migration, /Venue rows are intentionally not fabricated/);
  assert.doesNotMatch(migration, /insert into public\.venues/i);
});

test('DFW city seeds are merged into existing local storage rather than hidden by stale cached lists', () => {
  assert.match(marketsData, /id: 'city_plano'[\s\S]*market_id: 'market_dfw'/);
  assert.match(marketsData, /id: 'city_frisco'[\s\S]*market_id: 'market_dfw'/);
  assert.match(marketsData, /id: 'city_mansfield'[\s\S]*market_id: 'market_dfw'/);
  assert.match(marketService, /const parsedCities: City\[\] = storedCities \? JSON\.parse\(storedCities\) : \[\]/);
  assert.match(marketService, /SEEDED_CITIES\.filter\(\(seeded\) => !parsedCities\.some\(\(stored\) => stored\.id === seeded\.id\)\)/);
});
