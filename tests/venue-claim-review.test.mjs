import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/20261118130000_secure_venue_claim_review.sql', 'utf8');

test('only app-metadata platform admins can read all venue claim requests', () => {
  assert.match(migration, /venue_claim_requests_admin_read[\s\S]*auth\.jwt\(\)[\s\S]*app_metadata[\s\S]*role[\s\S]*admin/i);
});

test('claim review is a privileged atomic operation, not a client table update', () => {
  assert.match(migration, /function public\.review_venue_claim_request/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /auth\.uid\(\) is null[\s\S]*app_metadata[\s\S]*role[\s\S]*admin/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /v_claim\.status <> 'PENDING'/i);
  assert.match(migration, /grant execute on function public\.review_venue_claim_request[\s\S]*to authenticated/i);
  assert.match(migration, /revoke all on function public\.review_venue_claim_request[\s\S]*from public, anon/i);
});

test('approval atomically assigns the venue only while it remains unclaimed', () => {
  assert.match(migration, /p_status = 'APPROVED'/i);
  assert.match(migration, /set claimed = true,[\s\S]*claimed_by_user_id = v_claim\.applicant_user_id/i);
  assert.match(migration, /and claimed = false[\s\S]*and claimed_by_user_id is null/i);
  assert.match(migration, /Venue is no longer available to claim/i);
  assert.match(migration, /reviewed_by = auth\.uid\(\)/i);
});
