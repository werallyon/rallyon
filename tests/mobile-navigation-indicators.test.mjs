import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const navigation = readFileSync(new URL('../src/components/Navigation.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('mobile navigation defaults to no live badge without real game data', () => {
  assert.match(navigation, /liveBadgeCount = 0/);
  assert.doesNotMatch(navigation, /liveBadgeCount = 3|friendActivityCount = 4/);
});

test('profile navigation has no synthetic activity badge', () => {
  assert.match(navigation, /\{ id: 'PROFILE', label: 'Profile', icon: User \}/);
  assert.doesNotMatch(navigation, /friendActivityCount/);
});

test('mobile navigation has accessible primary semantics and thumb-sized targets', () => {
  assert.match(navigation, /aria-label="Primary navigation"/);
  assert.match(navigation, /aria-current=\{isActive \? 'page' : undefined\}/);
  assert.match(navigation, /min-h-\[56px\]/);
  assert.match(navigation, /min-w-0/);
  assert.match(navigation, /focus-visible:ring-2/);
});

test('live navigation count includes active games and halftime', () => {
  assert.match(app, /liveBadgeCount=\{games\.filter\(\(g\) => g\.status === 'LIVE' \|\| g\.status === 'HALFTIME'\)\.length\}/);
});
