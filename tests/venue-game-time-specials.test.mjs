import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const migration = read('../supabase/migrations/20261117110000_create_venue_promotions.sql');
const service = read('../src/services/venueService.ts');
const dashboard = read('../src/components/business/VenueDashboard.tsx');
const fanDetail = read('../src/components/VenueDetailModal.tsx');
const validation = read('../validation/dfw/verify.sql');

test('venue specials are stored centrally with a strict time window and optional game link', () => {
  assert.match(migration, /create table public\.venue_promotions/);
  assert.match(migration, /game_id uuid references public\.games\(id\)/);
  assert.match(migration, /end_at > start_at/);
  assert.match(migration, /status in \\('ACTIVE','SCHEDULED'\\)[\\s\\S]*start_at <= now\\(\\)/);
  assert.match(migration, /FOOD_SPECIAL/);
  assert.match(migration, /DRINK_SPECIAL/);
  assert.match(service, /from\\('venue_promotions'\\)/);
  assert.match(service, /createVenuePromotion/);
  assert.match(service, /deleteVenuePromotion/);
});

test('only a claimed venue owner can create, edit or remove promotions', () => {
  assert.match(migration, /venue_promotions_owner_insert/);
  assert.match(migration, /created_by = \\(select auth\.uid\\(\\)\\)/);
  assert.match(migration, /v\.claimed = true/);
  assert.match(migration, /v\.claimed_by_user_id = \\(select auth\.uid\\(\\)\\)/);
  assert.match(migration, /venue_promotions_owner_update/);
  assert.match(migration, /venue_promotions_owner_delete/);
  assert.match(migration, /grant insert \\([\\s\\S]*created_by\\) on public\.venue_promotions to authenticated/);
  assert.match(migration, /grant update \\([\\s\\S]*status\\) on public\.venue_promotions to authenticated/);
  assert.match(migration, /revoke all on public\.venue_promotions from public, anon, authenticated/);
  assert.doesNotMatch(migration, /grant update \\([\\s\\S]*claims_count/);
});

test('fans only receive current active offers and database venues do not use browser-local promotion storage', () => {
  assert.match(service, /query = query\.in\\('status', \\[\\'ACTIVE\\', \\'SCHEDULED\\'\\]\\)\.lte\\('start_at', now\\)\.gt\\('end_at', now\\)/);
  assert.match(fanDetail, /getVenuePromotions\\(venue\.id\\)/);
  assert.match(fanDetail, /new Date\\(promo\.start_at\\)\.getTime\\(\\) <= now/);
  assert.match(fanDetail, /new Date\\(promo\.end_at\\)\.getTime\\(\\) > now/);
  assert.match(fanDetail, /Show this offer to staff/);
  assert.match(dashboard, /createVenuePromotion/);
  assert.match(dashboard, /venue\.claimedByUserId !== currentUser\.id/);
  assert.match(dashboard, /newPromoGameId/);
  assert.match(dashboard, /newPromoStartAt/);
  assert.match(dashboard, /newPromoEndAt/);
});

test('isolated DFW replay checks promotion RLS and prevents anonymous writes or claims-count tampering', () => {
  assert.match(validation, /venue_promotions must have row-level security enabled/);
  assert.match(validation, /Anonymous promotion privileges are not read-only/);
  assert.match(validation, /claims_count tampering/);
  assert.match(validation, /DFW promotions must not be seeded/);
});
