import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../supabase/migrations/20261118140000_venue_promotion_provenance.sql', import.meta.url), 'utf8');
const original = readFileSync(new URL('../supabase/migrations/20261117110000_create_venue_promotions.sql', import.meta.url), 'utf8');
const service = readFileSync(new URL('../src/services/venueService.ts', import.meta.url), 'utf8');
const types = readFileSync(new URL('../src/types.ts', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../src/components/VenueDetailModal.tsx', import.meta.url), 'utf8');

test('publicly advertised specials require explicit source attribution and review', () => {
  assert.ok(migration.includes("OFFICIAL_PUBLIC_SOURCE"));
  assert.ok(migration.includes("source_url is not null"));
  assert.ok(migration.includes("source_label is not null"));
  assert.ok(migration.includes("verified_at is not null"));
  assert.ok(migration.includes("verified_by is not null"));
  assert.ok(migration.includes("source_type in ('OFFICIAL_PUBLIC_SOURCE', 'COMMUNITY_REPORTED')"));
});

test('unreviewed community reports remain private and cannot self-verify through owner grants', () => {
  assert.ok(migration.includes("source_type = 'COMMUNITY_REPORTED'"));
  assert.ok(migration.includes("(verified_at is null and verified_by is null)"));
  assert.ok(migration.includes("and verified_at is not null"));
  assert.ok(migration.includes("and verified_by is not null"));
  assert.ok(original.includes("grant insert ("));
  assert.ok(original.includes("grant update ("));
  assert.doesNotMatch(original, /source_type|verified_at|verified_by/);
});

test('legacy venue-confirmed offers retain claimed-owner visibility and owner write restrictions', () => {
  assert.ok(migration.includes("source_type = 'VENUE_CONFIRMED'"));
  assert.ok(migration.includes("v.claimed_by_user_id = venue_promotions.created_by"));
  assert.ok(migration.includes("alter column created_by drop not null"));
  assert.ok(migration.includes("Owner insert/update grants intentionally exclude all provenance fields"));
  assert.ok(migration.includes("source_type = 'VENUE_CONFIRMED'\n    and created_by = (select auth.uid())"));
  assert.ok(migration.includes("drop policy if exists venue_promotions_owner_update"));
  assert.ok(migration.includes("drop policy if exists venue_promotions_owner_delete"));
  assert.ok(original.includes("venue_promotions_owner_insert"));
  assert.ok(original.includes("venue_promotions_owner_update"));
  assert.ok(original.includes("venue_promotions_owner_delete"));
});

test('fan offer cards preserve provenance and freshness instead of presenting sourced offers as venue-confirmed', () => {
  assert.ok(types.includes("source_type?: 'VENUE_CONFIRMED' | 'OFFICIAL_PUBLIC_SOURCE' | 'COMMUNITY_REPORTED'"));
  assert.ok(types.includes('source_url?: string'));
  assert.ok(types.includes('verified_at?: string'));
  assert.ok(service.includes("source_type: row.source_type ?? 'VENUE_CONFIRMED'"));
  assert.ok(service.includes('source_label: row.source_label ?? undefined'));
  assert.ok(service.includes('verified_at: row.verified_at ?? undefined'));
  assert.ok(detail.includes('Officially advertised'));
  assert.ok(detail.includes('Community reported · reviewed'));
  assert.ok(detail.includes('Venue confirmed'));
  assert.ok(detail.includes('activePromo.source_url'));
  assert.ok(detail.includes('Checked'));
});
