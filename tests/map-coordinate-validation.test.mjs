import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/MapScreen.tsx', import.meta.url), 'utf8');

test('map bounds, pins and selected venue use only finite WGS84 coordinates', () => {
  assert.match(source, /const hasValidMapCoordinates = \(venue: Venue\): boolean/);
  assert.match(source, /Number\.isFinite\(venue\.latitude\)/);
  assert.match(source, /Number\.isFinite\(venue\.longitude\)/);
  assert.match(source, /venue\.latitude >= -90/);
  assert.match(source, /venue\.latitude <= 90/);
  assert.match(source, /venue\.longitude >= -180/);
  assert.match(source, /venue\.longitude <= 180/);
  assert.match(source, /venues\.find\(hasValidMapCoordinates\)/);
  assert.match(source, /venues\.filter\(hasValidMapCoordinates\)/);
  assert.match(source, /\[selectedMarkerVenue\.name, selectedMarkerVenue\.address, selectedMarkerVenue\.city, selectedMarkerVenue\.state\]\.filter\(Boolean\)\.join\(' '\)/);
});

test('map state follows active-market venue updates and never presents simulated GPS as the user location', () => {
  assert.match(source, /useEffect\(\(\) => \{[\s\S]*venues\.find\(\(venue\) => venue\.id === current\.id && hasValidMapCoordinates\(venue\)\)[\s\S]*\}, \[venues\]\)/);
  assert.match(source, /const locatedVenues = useMemo\(\(\) => venues\.filter\(hasValidMapCoordinates\), \[venues\]\)/);
  assert.match(source, /const latitudes = located\.map\(\(venue\) => venue\.latitude\)/);
  assert.match(source, /const longitudes = located\.map\(\(venue\) => venue\.longitude\)/);
  assert.match(source, /return locatedVenues\.reduce\(/);
  assert.match(source, /Select a central venue/);
  assert.doesNotMatch(source, /Center on My Location|User Location Pulse|Downtown|Austin geographic bounds/);
});
