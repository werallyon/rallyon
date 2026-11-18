import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const provider = readFileSync(new URL('../src/services/sports/espnProvider.ts', import.meta.url), 'utf8');
const types = readFileSync(new URL('../src/types.ts', import.meta.url), 'utf8');

test('ESPN games without broadcast names remain explicitly unconfirmed', () => {
  assert.match(provider, /const broadcastNames = broadcastEntries/);
  assert.match(provider, /const broadcast: BroadcastIntelligence \| undefined = rawBroadcast/);
  assert.match(provider, /broadcastNetwork: rawBroadcast \|\| undefined/);
  assert.doesNotMatch(provider, /competition\.broadcasts\?\.\[0\].*\|\|.*'ESPN'/);
});

test('ESPN broadcast mapping does not invent streaming services or national availability', () => {
  assert.doesNotMatch(provider, /netUpper\.includes\('ESPN'\)[\s\S]*\['ESPN\+'\]/);
  assert.doesNotMatch(provider, /netUpper\.includes\('NBC'\)[\s\S]*\['Peacock'\]/);
  assert.doesNotMatch(provider, /'Available Nationally'/);
  assert.match(provider, /regionalAvailability: explicitMarket \|\| undefined/);
  assert.match(provider, /broadcastType: BroadcastIntelligence\['broadcastType'\] = 'UNKNOWN'/);
  assert.match(types, /'STREAMING_EXCLUSIVE' \| 'UNKNOWN'/);
});

test('ESPN maps only explicitly named streaming services as streaming availability', () => {
  assert.match(provider, /\['ESPN\+', 'PEACOCK', 'PRIME VIDEO', 'APPLE TV\+', 'MAX', 'PARAMOUNT\+'\]/);
  assert.match(provider, /streamingAvailability: normalizedNames\.filter/);
});
