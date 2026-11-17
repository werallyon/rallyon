import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboard = readFileSync(new URL('../src/components/business/VenueDashboard.tsx', import.meta.url), 'utf8');

test('database-backed venues do not show synthetic ROI figures as production analytics', () => {
  assert.match(dashboard, /\{isDatabaseVenue \? \(/);
  assert.match(dashboard, /Production analytics are not connected yet/);
  assert.match(dashboard, /We will not display estimated views, visits, check-ins, or ROI as real results/);
  assert.match(dashboard, /activeTab === 'ANALYTICS' && isDatabaseVenue/);
  assert.match(dashboard, /reliabilityScore = isDatabaseVenue\s*\?\s*venue\.reliabilityScore/);
  assert.match(dashboard, /reliabilityScore == null \? 'Not calculated'/);
  assert.match(dashboard, /placeMatch = isDatabaseVenue \? null/);
  assert.match(dashboard, /Match Confidence: \{isDatabaseVenue \? 'Not available from production data'/);
  assert.doesNotMatch(dashboard, /placeMatch\?\.matchConfidence \|\| 99/);
});

test('local demo analytics remain limited to non-database venues', () => {
  assert.match(dashboard, /activeTab === 'ANALYTICS' && !isDatabaseVenue && analytics/);
  assert.match(dashboard, /\) : \([\s\S]*ROI Value Proposition Banner/);
});

test('database-backed venues never hydrate demo promotions, sponsorships, or analytics', () => {
  assert.match(dashboard, /if \(isDatabaseVenue\) \{[\s\S]*setPromotions\(\[\]\);[\s\S]*setSponsorships\(\[\]\);[\s\S]*setAnalytics\(null\);[\s\S]*return;/);
  assert.match(dashboard, /isDatabaseVenue \? \(\) => undefined : businessVenueService\.subscribe/);
  assert.match(dashboard, /Production promotions are not connected yet/);
  assert.match(dashboard, /Production sponsorship management and campaign reporting are not connected yet/);
  assert.match(dashboard, /!isDatabaseVenue && showNewPromoModal/);
  assert.match(dashboard, /if \(isDatabaseVenue\) \{[\s\S]*Production promotions are not connected yet/);
});

test('database-backed venues do not receive demo QR tokens, demo plan claims, or Austin matrix labels', () => {
  assert.match(dashboard, /venueQR = isDatabaseVenue \? null : businessVenueService\.getOrCreateVenueQRCode/);
  assert.match(dashboard, /Production check-ins are not connected yet/);
  assert.match(dashboard, /isDatabaseVenue \? 'Subscription details unavailable' : 'PRO VENUE TIER'/);
  assert.match(dashboard, /isDatabaseVenue \? 'Production venue workspace' : 'Connected to Demo Matrix'/);
  assert.doesNotMatch(dashboard, /Connected to Austin Matrix/);
});

test('operator broadcast and team records do not invent ESPN or placeholder records', () => {
  assert.match(dashboard, /network: game\.broadcast\?\.network \|\| game\.broadcastNetwork \|\| undefined/);
  assert.match(dashboard, /prog\.network \|\| 'Network not confirmed'/);
  assert.match(dashboard, /game\.broadcastNetwork \|\| 'Broadcast not confirmed'/);
  assert.doesNotMatch(dashboard, /game\.broadcastNetwork \|\| 'ESPN/);
  assert.doesNotMatch(dashboard, /record \|\| '7-3'/);
  assert.doesNotMatch(dashboard, /record \|\| '8-2'/);
  assert.match(dashboard, /audio_on: false/);
  assert.match(dashboard, /screen: ''/);
  assert.match(dashboard, /featured: false/);
  assert.match(dashboard, /Venue staff confirmed this game is being shown/);
  assert.doesNotMatch(dashboard, /network: game\.broadcastNetwork \|\| 'Network not confirmed'/);
});
