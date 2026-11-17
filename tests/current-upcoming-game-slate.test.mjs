import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gameService = readFileSync(new URL('../src/services/gameService.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('stored game feed is bounded to recent results and the synced upcoming window', () => {
  assert.match(gameService, /GAME_HISTORY_WINDOW_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(gameService, /GAME_LOOKAHEAD_WINDOW_MS = 8 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(gameService, /startTime >= now - GAME_HISTORY_WINDOW_MS/);
  assert.match(gameService, /startTime <= now \+ GAME_LOOKAHEAD_WINDOW_MS/);
});

test('live and halftime events remain visible even when their start time is older', () => {
  assert.match(gameService, /game\.status === 'LIVE' \|\| game\.status === 'HALFTIME'\) return true/);
});

test('stored games are filtered and sorted for the fan-facing slate', () => {
  assert.match(gameService, /\.filter\(\(game\) => isRelevantGame\(game, now\)\)/);
  assert.match(gameService, /\.sort\(sortGamesForFanDisplay\)/);
  assert.match(gameService, /a\.status === 'FINAL' && b\.status === 'FINAL'\) return bStart - aStart/);
  assert.doesNotMatch(gameService, /return \(data \?\? \[\]\)\.map\(mapGame\);/);
});

test('default selected event can be a live or halftime game', () => {
  assert.match(app, /data\.find\(\(g\) => g\.status === 'LIVE' \|\| g\.status === 'HALFTIME'\)/);
});
