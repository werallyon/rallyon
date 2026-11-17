import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const intelligence = readFileSync(new URL('../src/components/sports/GameIntelligenceModal.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/components/HomeScreen.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('game intelligence receives the authoritative venue programming rows', () => {
  assert.match(intelligence, /venueGames: VenueGame\[\]/);
  assert.match(home, /venueGames: VenueGame\[\]/);
  assert.match(home, /venueGames=\{venueGames\}/);
  assert.match(app, /<HomeScreen[\s\S]*?venueGames=\{venueGames\}/);
});

test('game-to-venue matching joins programming rows to real venue IDs', () => {
  assert.match(intelligence, /venueGame\.gameId === game\.id/);
  assert.match(intelligence, /venues\.find\(\(venue\) => venue\.id === venueGame\.venueId\)/);
  assert.match(intelligence, /game\.status === 'UPCOMING' \|\| game\.status === 'DELAYED'/);
  assert.match(intelligence, /venueGame\.verificationStatus === 'GAME_ON'/);
  assert.match(intelligence, /venueGame\.verificationStatus === 'LIKELY'/);
  assert.match(intelligence, /venueGame\.verificationStatus === 'CONFIRMED'/);
  assert.doesNotMatch(intelligence, /currentGames/);
});

test('missing broadcast metadata does not get mislabeled as cable', () => {
  assert.match(intelligence, /!game\.broadcast[\s\S]*?Broadcast type unavailable/);
  assert.match(intelligence, /game\.broadcast\.broadcastType === 'REGIONAL'[\s\S]*?Regional sports network/);
});

test('venue cards distinguish scheduled programming from a live game confirmation', () => {
  assert.match(intelligence, /venueGame\.verificationStatus === 'GAME_ON'/);
  assert.match(intelligence, /'GAME ON'/);
  assert.match(intelligence, /'SCHEDULED'/);
});
