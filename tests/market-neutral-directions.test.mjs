import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../src/components/HomeScreen.tsx', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../src/components/VenueDetailModal.tsx', import.meta.url), 'utf8');

test('home directions omit missing city or state fields', () => {
  assert.match(home, /\[venue\.name, venue\.address, venue\.city, venue\.state\]\.filter\(Boolean\)\.join\(' '\)/);
  assert.doesNotMatch(home, /\$\{venue\.name\} \$\{venue\.address\} \$\{venue\.city\} \$\{venue\.state\}/);
});

test('venue detail directions omit missing city or state fields', () => {
  assert.match(detail, /\[venue\.name, venue\.address, venue\.city, venue\.state\]\.filter\(Boolean\)\.join\(' '\)/);
  assert.doesNotMatch(detail, /\$\{venue\.name\} \$\{venue\.address\} \$\{venue\.city\} \$\{venue\.state\}/);
});
