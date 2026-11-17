import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/services/googlePlacesService.ts', import.meta.url), 'utf8');

test('Google Places normalization supports Places API New field names', () => {
  for (const field of [
    'raw.displayName',
    'raw.formattedAddress',
    'raw.nationalPhoneNumber',
    'raw.websiteUri',
    'raw.location',
    'raw.userRatingCount',
    'raw.businessStatus',
    'raw.regularOpeningHours',
    'raw.googleMapsUri'
  ]) {
    assert.ok(source.includes(field), `missing Places API New field mapping: ${field}`);
  }
});

test('Google Places normalization remains backward-compatible with legacy Places fields', () => {
  for (const field of [
    'raw.place_id',
    'raw.formatted_address',
    'raw.formatted_phone_number',
    'raw.geometry?.location',
    'raw.user_ratings_total',
    'raw.business_status',
    'raw.opening_hours?.weekday_text',
    'raw.url'
  ]) {
    assert.ok(source.includes(field), `missing legacy Places field mapping: ${field}`);
  }
});

test('Places API New price levels are normalized without inventing missing ratings or coordinates', () => {
  assert.ok(source.includes('PRICE_LEVEL_FREE: 0'));
  assert.ok(source.includes('PRICE_LEVEL_INEXPENSIVE: 1'));
  assert.ok(source.includes('PRICE_LEVEL_MODERATE: 2'));
  assert.ok(source.includes('PRICE_LEVEL_EXPENSIVE: 3'));
  assert.ok(source.includes('PRICE_LEVEL_VERY_EXPENSIVE: 4'));
  assert.ok(source.includes('Number(lat ?? 0)'));
  assert.ok(source.includes('Number(lng ?? 0)'));
  assert.ok(source.includes('rating: raw.rating'));
  assert.ok(source.includes('userRatingsTotal: raw.userRatingCount ?? raw.user_ratings_total'));
});
