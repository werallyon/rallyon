import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const provider = readFileSync(new URL('../src/services/sports/espnProvider.ts', import.meta.url), 'utf8');
const intelligence = readFileSync(new URL('../src/components/sports/GameIntelligenceModal.tsx', import.meta.url), 'utf8');

test('missing ESPN broadcast metadata remains unknown instead of defaulting to ESPN', () => {
  assert.match(provider, /const rawBroadcast = competition\.broadcasts\?\.\[0\]\?\.names\?\.\[0\];/);
  assert.doesNotMatch(provider, /competition\.broadcasts\?\.\[0\].*\|\|\s*'ESPN'/);
  assert.match(provider, /broadcast = rawBroadcast && netUpper/);
});

test('provider does not infer streaming subscriptions from network names', () => {
  assert.doesNotMatch(provider, /streamingAvailability:\s*netUpper/);
  assert.doesNotMatch(provider, /\['ESPN\+'\]|\['Peacock'\]|\['Paramount\+'\]/);
});

test('over-the-air classification requires an exact broadcast network name', () => {
  assert.match(provider, /\^\(ABC\|FOX\|CBS\|NBC\)\$/);
  assert.doesNotMatch(provider, /netUpper\.includes\('FOX'\)/);
});

test('game intelligence does not claim an unverified ESPN broadcast or confirmed Austin venues', () => {
  assert.match(intelligence, /game\.broadcast\?\.network \|\| game\.broadcastNetwork \|\| 'Not confirmed'/);
  assert.match(intelligence, /Venues listing this game/);
  assert.doesNotMatch(intelligence, /ESPN Broadcast|Confirmed Austin Venues/);
});
