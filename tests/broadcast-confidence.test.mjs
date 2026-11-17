import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const provider = readFileSync(new URL('../src/services/sports/espnProvider.ts', import.meta.url), 'utf8');
const intelligence = readFileSync(new URL('../src/components/sports/GameIntelligenceModal.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/components/HomeScreen.tsx', import.meta.url), 'utf8');

test('missing ESPN broadcast metadata remains unknown instead of defaulting to ESPN', () => {
  assert.match(provider, /const rawBroadcast = competition\.broadcasts\?\.\[0\]\?\.names\?\.\[0\];/);
  assert.doesNotMatch(provider, /competition\.broadcasts\?\.\[0\].*\|\|\s*'ESPN'/);
  assert.match(provider, /if \(rawBroadcast && netUpper\)/);
  assert.match(provider, /broadcast = \{/);
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

test('game intelligence does not invent odds, totals, or a host stadium when provider data is absent', () => {
  assert.match(intelligence, /summary\?\.odds\?\.details \|\| game\.liveDetails\?\.headline \|\| 'Odds unavailable'/);
  assert.match(intelligence, /No verified total available/);
  assert.match(intelligence, /summary\?\.venue\?\.name \|\| game\.venueName \|\| 'Venue details unavailable'/);
  assert.doesNotMatch(intelligence, /'Even Line'|'Live ESPN Feed'|'Host Stadium'/);
});

test('home game cards do not label missing network data as a live broadcast', () => {
  assert.match(home, /game\.broadcast\?\.network \|\| game\.broadcastNetwork \|\| 'Broadcast details unavailable'/);
  assert.doesNotMatch(home, /game\.broadcastNetwork \|\| 'Live Broadcast'/);
});
