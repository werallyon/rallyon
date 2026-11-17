import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/MapScreen.tsx', import.meta.url), 'utf8');

test('Google Maps replaces the schematic canvas and uses a DFW default center', () => {
  assert.match(source, /loadGoogleMaps\(apiKey\)/);
  assert.match(source, /VITE_GOOGLE_MAPS_API_KEY/);
  assert.match(source, /new maps\.Map\(/);
  assert.match(source, /center: \{ lat: 32\.7767, lng: -96\.7970 \}/);
  assert.doesNotMatch(source, /<svg|projectCoords|relative positions/i);
});

test('Google Maps venue markers use valid WGS84 coordinates from active market data', () => {
  assert.match(source, /const hasValidMapCoordinates = \(venue: Venue\): boolean/);
  assert.match(source, /Number\.isFinite\(venue\.latitude\)/);
  assert.match(source, /Number\.isFinite\(venue\.longitude\)/);
  assert.match(source, /venue\.latitude >= -90/);
  assert.match(source, /venue\.latitude <= 90/);
  assert.match(source, /venue\.longitude >= -180/);
  assert.match(source, /venue\.longitude <= 180/);
  assert.match(source, /venues\.filter\(hasValidMapCoordinates\)/);
  assert.match(source, /new maps\.Marker\(/);
  assert.match(source, /marker\.addListener\('click'/);
});

test('map remains usable without a key and never simulates GPS or hardcodes Austin', () => {
  assert.match(source, /if \(!apiKey\)/);
  assert.match(source, /Google Maps integration is ready/);
  assert.match(source, /locatedVenues\.slice\(0, 6\)/);
  assert.doesNotMatch(source, /Center on My Location|User Location Pulse|Downtown|Austin geographic bounds/);
});

test('selected game filters venues to programming rows for that game', () => {
  assert.match(source, /selectedGame && !venueGames\.some\(\(programming\) => programming\.venueId === venue\.id && programming\.gameId === selectedGame\.id\)/);
});
