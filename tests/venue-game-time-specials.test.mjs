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
  assert.ok(migration.includes('create table public.venue_promotions'));
  assert.ok(migration.includes('game_id uuid references public.games(id)'));
  assert.ok(migration.includes('end_at > start_at'));
  assert.ok(migration.includes("status in ('ACTIVE','SCHEDULED')"));
  assert.ok(migration.includes('FOOD_SPECIAL'));
  assert.ok(migration.includes('DRINK_SPECIAL'));
  assert.ok(service.includes("from('venue_promotions')"));
  assert.ok(service.includes('createVenuePromotion'));
  assert.ok(service.includes('deleteVenuePromotion'));
});

test('only a claimed venue owner can create, edit or remove promotions', () => {
  assert.ok(migration.includes('venue_promotions_owner_insert'));
  assert.ok(migration.includes('created_by = (select auth.uid())'));
  assert.ok(migration.includes('v.claimed = true'));
  assert.ok(migration.includes('v.claimed_by_user_id = (select auth.uid())'));
  assert.ok(migration.includes('venue_promotions_owner_update'));
  assert.ok(migration.includes('venue_promotions_owner_delete'));
  assert.ok(migration.includes('grant insert ('));
  assert.ok(migration.includes('grant update ('));
  assert.ok(migration.includes('revoke all on public.venue_promotions from public, anon, authenticated'));
  assert.doesNotMatch(migration, /grant update \([\s\S]*claims_count/);
});

test('fans only receive current active offers and database venues do not use browser-local promotion storage', () => {
  assert.ok(service.includes("query = query.in('status', ['ACTIVE', 'SCHEDULED']).lte('start_at', now).gt('end_at', now);"));
  assert.ok(fanDetail.includes('getVenuePromotions(venue.id)'));
  assert.ok(fanDetail.includes('new Date(promo.start_at).getTime() <= now'));
  assert.ok(fanDetail.includes('new Date(promo.end_at).getTime() > now'));
  assert.ok(fanDetail.includes('Show this offer to staff'));
  assert.ok(dashboard.includes('createVenuePromotion'));
  assert.ok(dashboard.includes("useState<Promotion['promotion_type']>('GAME_SPECIAL')"));
  assert.ok(dashboard.includes('venue.claimedByUserId !== currentUser.id'));
  assert.ok(dashboard.includes('newPromoGameId'));
  assert.ok(dashboard.includes('newPromoStartAt'));
  assert.ok(dashboard.includes('newPromoEndAt'));
});

test('isolated DFW replay checks promotion RLS and prevents anonymous writes or claims-count tampering', () => {
  assert.ok(validation.includes('venue_promotions must have row-level security enabled'));
  assert.ok(validation.includes('Anonymous promotion privileges are not read-only'));
  assert.ok(validation.includes('claims_count tampering'));
  assert.ok(validation.includes('DFW promotions must not be seeded'));
});
