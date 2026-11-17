import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboard = readFileSync(new URL('../src/components/business/VenueDashboard.tsx', import.meta.url), 'utf8');

test('database-backed venues do not show synthetic ROI figures as production analytics', () => {
  assert.match(dashboard, /\{isDatabaseVenue \? \(/);
  assert.match(dashboard, /Production analytics are not connected yet/);
  assert.match(dashboard, /We will not display estimated views, visits, check-ins, or ROI as real results/);
  assert.match(dashboard, /activeTab === 'ANALYTICS' && isDatabaseVenue/);
});

test('local demo analytics remain limited to non-database venues', () => {
  assert.match(dashboard, /activeTab === 'ANALYTICS' && !isDatabaseVenue && analytics/);
  assert.match(dashboard, /\) : \([\s\S]*ROI Value Proposition Banner/);
});
