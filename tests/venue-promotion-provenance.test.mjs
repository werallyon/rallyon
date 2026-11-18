import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../supabase/migrations/20261118140000_venue_promotion_provenance.sql', import.meta.url), 'utf8');
const original = readFileSync(new URL('../supabase/migrations/20261117110000_create_venue_promotions.sql', import.meta.url), 'utf8');

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
  assert.ok(original.includes("venue_promotions_owner_insert"));
  assert.ok(original.includes("venue_promotions_owner_update"));
  assert.ok(original.includes("venue_promotions_owner_delete"));
});
