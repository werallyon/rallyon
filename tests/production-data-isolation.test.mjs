import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const dataMode = read('src/config/dataMode.ts');
const espn = read('src/services/sports/espnProvider.ts');
const curated = read('src/services/sports/curatedProvider.ts');
const commercial = read('src/services/sports/commercialProvider.ts');
const gameService = read('src/services/gameService.ts');
const venueService = read('src/services/venueService.ts');
const app = read('src/App.tsx');
const businessVenue = read('src/services/businessVenueService.ts');
const signalEngine = read('src/services/signalEngine.ts');
const googlePlaces = read('src/services/googlePlacesService.ts');

test('demo data requires the explicit VITE_ENABLE_DEMO_DATA=true opt-in', () => {
  assert.match(dataMode, /VITE_ENABLE_DEMO_DATA\s*===\s*'true'/);
  assert.doesNotMatch(dataMode, /VITE_ENABLE_DEMO_DATA\s*\|\|\s*['"]true/);
});

test('ESPN seeded fixtures are returned only in explicit demo mode', () => {
  const fallback = espn.slice(espn.indexOf('// Seeded fixtures are available only'), espn.indexOf('this.activePendingRequests.set'));
  assert.match(fallback, /if\s*\(isDemoMode\)\s*\{/);
  assert.match(fallback, /\[\.\.\.SEEDED_GAMES\]/);
  assert.match(fallback, /this\.cache\.set\(cacheKey,\s*\{\s*data:\s*\[\]/);
  assert.match(fallback, /return\s+\[\]\s*;/);
});

test('ESPN empty/error fallback is reported as unavailable in production', () => {
  assert.match(espn, /mode:\s*this\.isUsingFallback\s*\?\s*\(isDemoMode\s*\?\s*'DEMO_FALLBACK'\s*:\s*'UNAVAILABLE'\)/);
  assert.match(espn, /error:\s*this\.lastError/);
  assert.match(espn, /ESPN returned no games for the requested schedule/);
  assert.match(espn, /this\.lastError\s*=\s*err\.message\s*\|\|\s*'ESPN fetch failed'/);
});

test('curated provider cannot return fixtures outside demo mode but can in demo mode', () => {
  assert.match(curated, /if\s*\(!isDemoMode\)\s*return\s*\[\]\s*;/);
  assert.match(curated, /if\s*\(!isDemoMode\)\s*return\s*null\s*;/);
  assert.match(curated, /let list\s*=\s*\[\.\.\.SEEDED_GAMES\]/);
  assert.match(curated, /mode:\s*isDemoMode\s*\?\s*'DEMO_FALLBACK'\s*:\s*'UNAVAILABLE'/);
});

test('unimplemented commercial provider stays unavailable and returns no fabricated games', () => {
  assert.match(commercial, /mode:\s*'UNAVAILABLE'/);
  assert.match(commercial, /async getGames\([^)]*\)[\s\S]*?return\s+\[\]\s*;/);
  assert.doesNotMatch(commercial, /SEEDED_GAMES/);
  assert.match(commercial, /Commercial provider integration is not implemented/);
});

test('empty Supabase games remain empty unless a real provider returns games', () => {
  assert.match(gameService, /supabase\.from\('games'\)\.select\('\*'\)/);
  assert.match(gameService, /return\s+\(data\s*\?\?\s*\[\]\)\.map\(mapGame\)/);
  assert.doesNotMatch(gameService, /SEEDED_GAMES|seedData/);
  assert.match(app, /storedGames\.length\s*\?\s*storedGames\s*:\s*await\s*sportsService\.getGames\(\)/);
});

test('production venue discovery filters demo rows and preserves empty results', () => {
  assert.match(venueService, /if\s*\(!isDemoMode\)\s*query\s*=\s*query\.eq\('is_demo_data',\s*false\)/);
  assert.match(venueService, /if\s*\(error\)\s*throw\s+error/);
  assert.match(venueService, /return\s+\(data\s*\?\?\s*\[\]\)\.map\(mapVenue\)/);
  assert.doesNotMatch(venueService, /SEEDED_VENUES|seedData/);
});

test('empty or failed production venue reads do not activate seeded venue fallback', () => {
  assert.match(app, /setDbVenues\(isDemoMode\s*&&\s*venues\.length\s*===\s*0\s*\?\s*null\s*:\s*venues\)/);
  assert.match(app, /setDbVenues\(\[\]\)/);
  assert.match(app, /dbVenues\s*\?\?\s*\(isDemoMode\s*\?\s*SEEDED_VENUES\s*:\s*\[\]\)/);
});

test('demo venue fixtures remain available only when demo mode is enabled', () => {
  assert.match(app, /dbVenues\s*\?\?\s*\(isDemoMode\s*\?\s*SEEDED_VENUES\s*:\s*\[\]\)/);
  assert.match(app, /isDemoMode\s*&&\s*venues\.length\s*===\s*0\s*\?\s*null/);
});

test('business venue seed records and browser storage are isolated by data mode', () => {
  assert.match(businessVenue, /rallyon_venue_programming_v1_\$\{isDemoMode\s*\?\s*'demo'\s*:\s*'production'\}/);
  assert.match(businessVenue, /storedProg\s*\?\s*JSON\.parse\(storedProg\)\s*:\s*\(isDemoMode\s*\?\s*this\.getInitialProgramming\(\)\s*:\s*\[\]\)/);
  assert.match(businessVenue, /this\.programming\s*=\s*isDemoMode\s*\?\s*this\.getInitialProgramming\(\)\s*:\s*\[\]/);
});

test('crowd and presence simulations are disabled outside demo mode', () => {
  assert.match(signalEngine, /private signals:[^\n]*=\s*isDemoMode\s*\?/);
  assert.match(signalEngine, /public isSimulating:\s*boolean\s*=\s*isDemoMode/);
  assert.match(signalEngine, /if\s*\(!isDemoMode\)\s*return\s*;/);
});

test('Google Places demo cache and venue matching are mode-separated', () => {
  assert.match(googlePlaces, /rallyon_venue_place_matches_v1_\$\{isDemoMode\s*\?\s*'demo'\s*:\s*'production'\}/);
  assert.match(googlePlaces, /mode:\s*this\.apiKey[^\n]*\?\s*'CONFIGURED'\s*:\s*\(isDemoMode\s*\?\s*'USING_DEMO_CACHE'\s*:\s*'UNCONFIGURED'\)/);
});


test('saved venue defaults and seeded venue-game links are demo-only', () => {
  assert.ok(app.includes("isDemoMode ? ['venue_bufords', 'venue_cover3', 'venue_haymaker'] : []"));
  assert.ok(app.includes('dbVenueGames.length || !isDemoMode ? dbVenueGames : SEEDED_VENUE_GAMES'));
});

test('all business localStorage namespaces are separated by demo and production mode', () => {
  for (const key of [
    'rallyon_venue_claims_v1',
    'rallyon_venue_programming_v1',
    'rallyon_venue_promotions_v1',
    'rallyon_venue_redemptions_v1',
    'rallyon_sponsorships_v1',
    'rallyon_analytics_events_v1',
    'rallyon_business_accounts_v1'
  ]) {
    assert.ok(businessVenue.includes(key + "_${isDemoMode ? 'demo' : 'production'}"));
  }
  assert.ok(businessVenue.includes('this.redemptions = storedRedemptions ? JSON.parse(storedRedemptions) : [];'));
});

test('Google Places never preloads seeded records or default venue matches in production', () => {
  assert.ok(googlePlaces.includes('if (isDemoMode) {'));
  assert.ok(googlePlaces.includes('Object.values(SEEDED_GOOGLE_PLACES).forEach'));
  assert.ok(googlePlaces.includes('} else if (isDemoMode) {'));
});

test('signal engine does not start or toggle simulated activity in production', () => {
  assert.ok(signalEngine.includes('if (isDemoMode) this.startSimulation();'));
  assert.ok(signalEngine.includes('public toggleSimulation() {\n    if (!isDemoMode) return;'));
  assert.ok(signalEngine.includes('private startSimulation() {\n    if (!isDemoMode) return;'));
});
