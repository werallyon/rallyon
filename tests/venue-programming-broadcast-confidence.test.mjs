import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboard = readFileSync(new URL('../src/components/business/VenueDashboard.tsx', import.meta.url), 'utf8');

test('venue programming stores only a broadcast network supplied by game metadata', () => {
  assert.match(dashboard, /network: game\.broadcast\?\.network \|\| game\.broadcastNetwork \|\| undefined/);
  assert.doesNotMatch(dashboard, /network: game\.broadcastNetwork \|\| 'ESPN'/);
});

test('venue programming UI does not present missing network data as ESPN', () => {
  assert.match(dashboard, /prog\.network \|\| 'Network not confirmed'/);
  assert.doesNotMatch(dashboard, /prog\.network \|\| 'ESPN'/);
});
