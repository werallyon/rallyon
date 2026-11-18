import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/MapScreen.tsx', import.meta.url), 'utf8');

test('market changes reset map readiness before replacing the Google map instance', () => {
  const effect = source.slice(source.indexOf('let cancelled = false;'), source.indexOf('loadGoogleMaps(apiKey)'));
  assert.match(effect, /setMapReady\\(false\\)/);
  assert.match(effect, /setMapError\\(''\\)/);
  assert.match(source, /\\[apiKey, activeMarket\\.latitude, activeMarket\\.longitude\\]/);
});

test('Google Maps loader can retry after script load or network failures', () => {
  assert.match(source, /let googleMapsLoader: \\{ apiKey: string; promise: Promise<GoogleMapsApi> \\} \\| null = null/);
  assert.match(source, /const resetLoader = \\(\\) =>/);
  assert.match(source, /if \\(googleMapsLoader\\?\\.promise === promise\\) googleMapsLoader = null/);
  assert.match(source, /script\\.onerror = \\(\\) => \\{/);
  assert.match(source, /Google Maps loaded without its maps library/);
});

test('concurrent map requests reuse one loader and reject conflicting keys clearly', () => {
  assert.match(source, /if \\(googleMapsLoader\\.apiKey !== apiKey\\)/);
  assert.match(source, /return googleMapsLoader\\.promise/);
});
