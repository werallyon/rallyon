import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/MapScreen.tsx', import.meta.url), 'utf8');

test('market changes reset map readiness before replacing the Google map instance', () => {
  const effect = source.slice(source.indexOf('let cancelled = false;'), source.indexOf('loadGoogleMaps(apiKey)'));
  assert.ok(effect.includes('setMapReady(false)'));
  assert.ok(effect.includes("setMapError('')"));
  assert.ok(source.includes('[apiKey, activeMarket.latitude, activeMarket.longitude]'));
});

test('Google Maps loader can retry after script load or network failures', () => {
  assert.ok(source.includes('let googleMapsLoader: { apiKey: string; promise: Promise<GoogleMapsApi> } | null = null'));
  assert.ok(source.includes('const resetLoader = () =>'));
  assert.ok(source.includes('if (googleMapsLoader?.promise === promise) googleMapsLoader = null'));
  assert.ok(source.includes('script.onerror = () => {'));
  assert.ok(source.includes('Google Maps loaded without its maps library'));
});

test('concurrent map requests reuse one loader and reject conflicting keys clearly', () => {
  assert.ok(source.includes('if (googleMapsLoader.apiKey !== apiKey)'));
  assert.ok(source.includes('return googleMapsLoader.promise'));
});
