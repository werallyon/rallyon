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
});
