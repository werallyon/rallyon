import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20261118120000_create_venue_claim_requests.sql', 'utf8');
const service = readFileSync('src/services/venueService.ts', 'utf8');
const modal = readFileSync('src/components/business/VenueClaimModal.tsx', 'utf8');
const detail = readFileSync('src/components/VenueDetailModal.tsx', 'utf8');

test('venue claim requests are durable and tied to an authenticated applicant', () => {
  assert.match(migration, /create table public\.venue_claim_requests/i);
  assert.match(migration, /applicant_user_id uuid not null references auth\.users\(id\)/i);
  assert.match(migration, /applicant_user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /venue_claim_one_pending_per_venue/i);
});

test('claim submission cannot grant ownership or allow client-side review', () => {
  assert.match(migration, /status text not null default 'PENDING'/i);
  assert.match(migration, /grant insert \([\s\S]*verification_method,\s*notes\s*\) on public\.venue_claim_requests to authenticated/i);
  assert.doesNotMatch(migration, /grant update|grant delete/i);
  assert.match(migration, /v\.claimed = false/i);
  assert.match(service, /submitVenueClaimRequest/);
  assert.match(modal, /await submitVenueClaimRequest/);
  assert.match(modal, /does not grant venue access/i);
});

test('a pending claim does not open the operator dashboard', () => {
  assert.match(detail, /onClaimSubmitted=\{\(\) => \{\s*setShowClaimModal\(false\);\s*\}\}/);
  assert.doesNotMatch(detail, /onSuccess=\{\(\) => \{[\s\S]{0,120}onOpenDashboard\(venue\.id\)/);
});
