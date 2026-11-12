import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parse as parseDotenv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import test from 'node:test';
import { getUserWithProfile } from '../../src/services/profileService.ts';

// Node 20 does not expose a global WebSocket; Supabase Auth clients initialize Realtime.
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

const PROJECT_WORKDIR = 'validation';

function decodeJwtPayload(token, label) {
  const parts = token.split('.');
  assert.equal(parts.length, 3, `${label} must be a JWT from the local Supabase stack`);
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
}

/**
 * Read connection material only from the active local Supabase CLI stack.
 * Deliberately ignores process.env so hosted credentials cannot be selected
 * accidentally by a developer shell or GitHub Actions secret.
 */
function getLocalCredentials() {
  const result = spawnSync(
    'supabase',
    ['--workdir', PROJECT_WORKDIR, 'status', '--output', 'env', '--output-format', 'text'],
    { encoding: 'utf8', timeout: 20_000 }
  );

  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `Could not read local Supabase status. Start the local stack first. ${result.stderr || ''}`
  );

  const values = parseDotenv(result.stdout);
  const url = values.API_URL;
  const anonKey = values.ANON_KEY;
  const serviceRoleKey = values.SERVICE_ROLE_KEY;

  assert.ok(url && anonKey && serviceRoleKey, 'Local CLI status must provide API_URL, ANON_KEY and SERVICE_ROLE_KEY');
  const parsedUrl = new URL(url);
  assert.equal(parsedUrl.protocol, 'http:', 'Integration tests refuse non-local HTTPS endpoints');
  assert.ok(
    ['127.0.0.1', 'localhost', '::1'].includes(parsedUrl.hostname),
    `Refusing to run integration tests against non-local host: ${parsedUrl.hostname}`
  );
  assert.equal(decodeJwtPayload(anonKey, 'ANON_KEY').role, 'anon', 'ANON_KEY must have the anon role');
  assert.equal(
    decodeJwtPayload(serviceRoleKey, 'SERVICE_ROLE_KEY').role,
    'service_role',
    'SERVICE_ROLE_KEY must have the service_role role'
  );

  return { url, anonKey, serviceRoleKey };
}

function createApiClient(url, key) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function assertNoVisibleRowsOrDenied(result, description) {
  if (result.error) {
    assert.ok(result.error.code || result.error.status, `${description}: API denial should include an error code/status`);
    return;
  }
  assert.deepEqual(result.data ?? [], [], `${description}: no foreign rows may be returned or changed`);
}

test('P0-A/P0-C local Auth and PostgREST enforce user ownership', { timeout: 90_000 }, async (t) => {
  const { url, anonKey, serviceRoleKey } = getLocalCredentials();
  const anonymous = createApiClient(url, anonKey);
  const admin = createApiClient(url, serviceRoleKey);
  const suffix = randomUUID();
  const password = `RallyOn-local-${randomBytes(24).toString('base64url')}!`;
  const createdUserIds = [];
  const userClients = [];

  async function createSyntheticUser(label) {
    const client = createApiClient(url, anonKey);
    userClients.push(client);
    const email = `rallyon-p0-${label}-${suffix}@example.test`;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: `p0_${label}_${suffix.slice(0, 8)}`,
          firstName: 'RallyOn',
          lastName: label.toUpperCase(),
          name: `RallyOn ${label.toUpperCase()}`
        }
      }
    });
    if (data.user?.id) createdUserIds.push(data.user.id);
    if (error) {
      throw new Error(
        `Local Auth signup failed for ${label}: ${error.name || 'AuthError'} ${error.status || ''} ${error.code || ''} ${error.message || String(error)}`
      );
    }
    assert.ok(data.user?.id, `Local Auth signup must create user ${label}`);
    assert.ok(data.session?.access_token, 'Local email confirmations must be disabled so signup returns a session');
    return { client, user: data.user };
  }

  let userA;
  let userB;
  let favoriteId;

  try {
    userA = await createSyntheticUser('a');
    userB = await createSyntheticUser('b');

    await t.test('Auth signup bootstraps one canonical profile for each user', async () => {
      for (const [label, account] of [['A', userA], ['B', userB]]) {
        const { data, error } = await account.client
          .from('profiles')
          .select('id, username, first_name, last_name, display_name')
          .eq('id', account.user.id)
          .single();
        assert.ifError(error);
        assert.equal(data.id, account.user.id);
        assert.equal(data.first_name, 'RallyOn');
        assert.equal(data.last_name, label);
        assert.equal(data.display_name, `RallyOn ${label}`);
      }
    });

    await t.test('A and B can each read and update only their own profile', async () => {
      const updateA = await userA.client
        .from('profiles')
        .update({ display_name: 'Alpha Profile Updated' })
        .eq('id', userA.user.id)
        .select('id, display_name')
        .single();
      assert.ifError(updateA.error);
      assert.equal(updateA.data.display_name, 'Alpha Profile Updated');

      const updateB = await userB.client
        .from('profiles')
        .update({ display_name: 'Bravo Profile Updated' })
        .eq('id', userB.user.id)
        .select('id, display_name')
        .single();
      assert.ifError(updateB.error);
      assert.equal(updateB.data.display_name, 'Bravo Profile Updated');

      const ownA = await userA.client.from('profiles').select('id, display_name').eq('id', userA.user.id).single();
      const ownB = await userB.client.from('profiles').select('id, display_name').eq('id', userB.user.id).single();
      assert.ifError(ownA.error);
      assert.ifError(ownB.error);
      assert.equal(ownA.data.display_name, 'Alpha Profile Updated');
      assert.equal(ownB.data.display_name, 'Bravo Profile Updated');
    });

    await t.test('A cannot read, update, or delete B profile', async () => {
      const readForeign = await userA.client.from('profiles').select('id, display_name').eq('id', userB.user.id);
      assertNoVisibleRowsOrDenied(readForeign, 'A reading B profile');

      const updateForeign = await userA.client
        .from('profiles')
        .update({ display_name: 'UNAUTHORIZED PROFILE UPDATE' })
        .eq('id', userB.user.id)
        .select('id');
      assertNoVisibleRowsOrDenied(updateForeign, 'A updating B profile');

      const deleteForeign = await userA.client
        .from('profiles')
        .delete()
        .eq('id', userB.user.id)
        .select('id');
      assertNoVisibleRowsOrDenied(deleteForeign, 'A deleting B profile');

      const stillOwnedByB = await userB.client
        .from('profiles')
        .select('id, display_name')
        .eq('id', userB.user.id)
        .single();
      assert.ifError(stillOwnedByB.error);
      assert.equal(stillOwnedByB.data.display_name, 'Bravo Profile Updated');
    });

    await t.test('A can create, read, update and delete A favorite teams', async () => {
      favoriteId = `api-test-${suffix}`;
      const insert = await userA.client.from('user_favorite_teams').insert({
        user_id: userA.user.id,
        team_id: favoriteId,
        team_name: 'Local Test Team',
        sport_id: 'FOOTBALL',
        league: 'NFL',
        abbrev: 'LTT',
        logo: 'local-test.svg',
        sort_order: 0
      }).select('user_id, team_id, team_name').single();
      assert.ifError(insert.error);
      assert.equal(insert.data.user_id, userA.user.id);
      assert.equal(insert.data.team_id, favoriteId);

      const read = await userA.client
        .from('user_favorite_teams')
        .select('team_id, team_name')
        .eq('user_id', userA.user.id)
        .eq('team_id', favoriteId)
        .single();
      assert.ifError(read.error);
      assert.equal(read.data.team_name, 'Local Test Team');

      const update = await userA.client
        .from('user_favorite_teams')
        .update({ team_name: 'Local Test Team Updated' })
        .eq('user_id', userA.user.id)
        .eq('team_id', favoriteId)
        .select('team_name')
        .single();
      assert.ifError(update.error);
      assert.equal(update.data.team_name, 'Local Test Team Updated');

      const remove = await userA.client
        .from('user_favorite_teams')
        .delete()
        .eq('user_id', userA.user.id)
        .eq('team_id', favoriteId)
        .select('team_id');
      assert.ifError(remove.error);
      assert.deepEqual(remove.data, [ { team_id: favoriteId } ]);

      const emptyAfterDelete = await userA.client
        .from('user_favorite_teams')
        .select('team_id')
        .eq('user_id', userA.user.id);
      assert.ifError(emptyAfterDelete.error);
      assert.deepEqual(emptyAfterDelete.data, [], 'A successful empty response is a real empty favorite list');
    });

    await t.test('B gets an authoritative empty favorites result and cannot access A favorites', async () => {
      // Create a retained A row specifically for the cross-user isolation checks.
      const insert = await userA.client.from('user_favorite_teams').insert({
        user_id: userA.user.id,
        team_id: favoriteId,
        team_name: 'A Private Favorite',
        sport_id: 'OTHER',
        league: 'OTHER',
        sort_order: 0
      }).select('team_id').single();
      assert.ifError(insert.error);

      const emptyB = await userB.client
        .from('user_favorite_teams')
        .select('team_id, team_name')
        .eq('user_id', userB.user.id);
      assert.ifError(emptyB.error);
      assert.deepEqual(emptyB.data, [], 'A successful empty favorites query must remain authoritative');

      const readA = await userB.client
        .from('user_favorite_teams')
        .select('team_id, team_name')
        .eq('user_id', userA.user.id);
      assertNoVisibleRowsOrDenied(readA, 'B reading A favorites');

      const updateA = await userB.client
        .from('user_favorite_teams')
        .update({ team_name: 'UNAUTHORIZED FAVORITE UPDATE' })
        .eq('user_id', userA.user.id)
        .eq('team_id', favoriteId)
        .select('team_id');
      assertNoVisibleRowsOrDenied(updateA, 'B updating A favorite');

      const deleteA = await userB.client
        .from('user_favorite_teams')
        .delete()
        .eq('user_id', userA.user.id)
        .eq('team_id', favoriteId)
        .select('team_id');
      assertNoVisibleRowsOrDenied(deleteA, 'B deleting A favorite');

      const verifyA = await userA.client
        .from('user_favorite_teams')
        .select('team_id, team_name')
        .eq('user_id', userA.user.id)
        .eq('team_id', favoriteId)
        .single();
      assert.ifError(verifyA.error);
      assert.equal(verifyA.data.team_name, 'A Private Favorite');
    });

    await t.test('profile-only writes preserve favorites and favorite replacement is atomic', async () => {
      const profileOnly = await userA.client.rpc('save_profile_and_favorite_teams', {
        p_profile_updates: { name: 'Profile Only Keeps Favorites' }
      });
      assert.ifError(profileOnly.error);
      assert.equal(profileOnly.data.display_name, 'Profile Only Keeps Favorites');
      const preserved = await userA.client
        .from('user_favorite_teams')
        .select('team_id')
        .eq('user_id', userA.user.id);
      assert.ifError(preserved.error);
      assert.deepEqual(preserved.data, [{ team_id: favoriteId }], 'profile-only writes must not clear favorites');

      const initial = await userA.client.rpc('save_profile_and_favorite_teams', {
        p_profile_updates: { name: 'Atomic Profile Before Failure' },
        p_favorite_teams: [{
          id: favoriteId,
          name: 'Atomic Favorite',
          sportId: 'FOOTBALL',
          league: 'NFL',
          abbrev: 'ATF',
          logo: 'atomic.svg'
        }],
        p_replace_favorite_teams: true
      });
      assert.ifError(initial.error);
      assert.equal(initial.data.display_name, 'Atomic Profile Before Failure');

      const beforeFailure = await userA.client
        .from('user_favorite_teams')
        .select('team_id, team_name')
        .eq('user_id', userA.user.id);
      assert.ifError(beforeFailure.error);
      assert.deepEqual(beforeFailure.data, [{ team_id: favoriteId, team_name: 'Atomic Favorite' }]);

      const rejected = await userA.client.rpc('save_profile_and_favorite_teams', {
        p_profile_updates: { name: 'MUST ROLL BACK' },
        p_favorite_teams: [{ id: '   ', name: 'Malformed Favorite' }],
        p_replace_favorite_teams: true
      });
      assert.ok(rejected.error, 'malformed favorite input must be rejected');

      const afterFailureProfile = await userA.client
        .from('profiles')
        .select('display_name')
        .eq('id', userA.user.id)
        .single();
      assert.ifError(afterFailureProfile.error);
      assert.equal(afterFailureProfile.data.display_name, 'Atomic Profile Before Failure');

      const afterFailureFavorites = await userA.client
        .from('user_favorite_teams')
        .select('team_id, team_name')
        .eq('user_id', userA.user.id);
      assert.ifError(afterFailureFavorites.error);
      assert.deepEqual(afterFailureFavorites.data, [{ team_id: favoriteId, team_name: 'Atomic Favorite' }]);

      const cleared = await userA.client.rpc('save_profile_and_favorite_teams', {
        p_profile_updates: { name: 'Atomic Clear Succeeded' },
        p_favorite_teams: [],
        p_replace_favorite_teams: true
      });
      assert.ifError(cleared.error);
      assert.equal(cleared.data.display_name, 'Atomic Clear Succeeded');
      const empty = await userA.client
        .from('user_favorite_teams')
        .select('team_id')
        .eq('user_id', userA.user.id);
      assert.ifError(empty.error);
      assert.deepEqual(empty.data, [], 'an empty array must atomically clear the relational selection');
    });

    await t.test('RPC rejects caller-supplied ownership identifiers and preserves both accounts', async () => {
      const beforeA = await userA.client.from('profiles').select('display_name').eq('id', userA.user.id).single();
      const beforeB = await userB.client.from('profiles').select('display_name').eq('id', userB.user.id).single();
      assert.ifError(beforeA.error);
      assert.ifError(beforeB.error);

      for (const field of ['id', 'user_id']) {
        const rejected = await userA.client.rpc('save_profile_and_favorite_teams', {
          p_profile_updates: { [field]: userB.user.id, name: 'UNAUTHORIZED CROSS-ACCOUNT WRITE' },
          p_favorite_teams: [],
          p_replace_favorite_teams: false
        });
        assert.ok(rejected.error, `RPC must reject caller-supplied ${field}`);
      }

      const afterA = await userA.client.from('profiles').select('display_name').eq('id', userA.user.id).single();
      const afterB = await userB.client.from('profiles').select('display_name').eq('id', userB.user.id).single();
      assert.ifError(afterA.error);
      assert.ifError(afterB.error);
      assert.equal(afterA.data.display_name, beforeA.data.display_name);
      assert.equal(afterB.data.display_name, beforeB.data.display_name);
    });

    await t.test('A cannot insert a favorite row owned by B', async () => {
      const rejected = await userA.client.from('user_favorite_teams').insert({
        user_id: userB.user.id,
        team_id: `cross-owner-${suffix}`,
        team_name: 'Must Not Persist',
        sport_id: 'OTHER',
        league: 'OTHER',
        abbrev: '',
        logo: '',
        sort_order: 0
      }).select('team_id');
      assert.ok(rejected.error, 'RLS must reject a favorite row with another owner ID');
      const absent = await userB.client.from('user_favorite_teams').select('team_id')
        .eq('user_id', userB.user.id).eq('team_id', `cross-owner-${suffix}`);
      assert.ifError(absent.error);
      assert.deepEqual(absent.data, []);
    });

    await t.test('missing canonical profile causes application hydration to fail closed', async () => {
      const missingAccount = await createSyntheticUser('missing');
      const removed = await admin.from('profiles').delete().eq('id', missingAccount.user.id).select('id').single();
      assert.ifError(removed.error);
      await assert.rejects(
        () => getUserWithProfile(missingAccount.user, missingAccount.client),
        /no public\\.profiles row/
      );
      const otherProfile = await userB.client.from('profiles').select('id').eq('id', userB.user.id).single();
      assert.ifError(otherProfile.error);
      assert.equal(otherProfile.data.id, userB.user.id);
    });

    await t.test('anonymous client cannot read or mutate profiles, favorites, or invoke the RPC', async () => {
      const profileRead = await anonymous.from('profiles').select('id').eq('id', userA.user.id);
      assertNoVisibleRowsOrDenied(profileRead, 'anonymous profile read');

      const favoriteRead = await anonymous.from('user_favorite_teams').select('team_id').eq('user_id', userA.user.id);
      assertNoVisibleRowsOrDenied(favoriteRead, 'anonymous favorite read');

      const profileInsert = await anonymous.from('profiles')
        .insert({ id: userA.user.id, display_name: 'ANONYMOUS INSERT' }).select('id');
      assertNoVisibleRowsOrDenied(profileInsert, 'anonymous profile insert');

      const profileUpdate = await anonymous.from('profiles').update({ display_name: 'ANONYMOUS UPDATE' })
        .eq('id', userA.user.id).select('id');
      assertNoVisibleRowsOrDenied(profileUpdate, 'anonymous profile update');

      const profileDelete = await anonymous.from('profiles').delete()
        .eq('id', userA.user.id).select('id');
      assertNoVisibleRowsOrDenied(profileDelete, 'anonymous profile delete');

      const favoriteInsert = await anonymous.from('user_favorite_teams').insert({
        user_id: userA.user.id,
        team_id: `anon-${suffix}`,
        team_name: 'Anonymous Favorite',
        sport_id: 'OTHER',
        league: 'OTHER',
        abbrev: '',
        logo: '',
        sort_order: 0
      }).select('team_id');
      assertNoVisibleRowsOrDenied(favoriteInsert, 'anonymous favorite insert');

      const favoriteUpdate = await anonymous.from('user_favorite_teams')
        .update({ team_name: 'ANONYMOUS UPDATE' })
        .eq('user_id', userA.user.id).select('team_id');
      assertNoVisibleRowsOrDenied(favoriteUpdate, 'anonymous favorite update');

      const favoriteDelete = await anonymous.from('user_favorite_teams').delete()
        .eq('user_id', userA.user.id).select('team_id');
      assertNoVisibleRowsOrDenied(favoriteDelete, 'anonymous favorite delete');

      const rpc = await anonymous.rpc('save_profile_and_favorite_teams', {
        p_profile_updates: { name: 'ANONYMOUS RPC' },
        p_favorite_teams: [],
        p_replace_favorite_teams: true
      });
      assert.ok(rpc.error, 'anonymous RPC execution must be denied');

      const profileStillOwned = await userA.client.from('profiles')
        .select('id,display_name').eq('id', userA.user.id).single();
      assert.ifError(profileStillOwned.error);
      assert.equal(profileStillOwned.data.id, userA.user.id);
      assert.notEqual(profileStillOwned.data.display_name, 'ANONYMOUS UPDATE');

      const anonymousFavoriteAbsent = await userA.client.from('user_favorite_teams')
        .select('team_id').eq('user_id', userA.user.id).eq('team_id', `anon-${suffix}`);
      assert.ifError(anonymousFavoriteAbsent.error);
      assert.deepEqual(anonymousFavoriteAbsent.data, []);
    });
  } finally {
    // Revoke client sessions first, then delete the synthetic Auth users with
    // the service-role key obtained only from this local CLI stack.
    const cleanupErrors = [];
    for (const client of userClients) {
      try {
        await client.auth.signOut({ scope: 'global' });
      } catch (error) {
        cleanupErrors.push(`session revocation failed: ${error.message}`);
      }
    }
    for (const userId of [...createdUserIds].reverse()) {
      try {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error && !/not found|user not found/i.test(error.message)) {
          cleanupErrors.push(`user ${userId}: ${error.message}`);
        }
      } catch (error) {
        cleanupErrors.push(`user ${userId}: ${error.message}`);
      }
    }
    if (cleanupErrors.length > 0) {
      throw new Error(`Local Auth integration-test cleanup failed: ${cleanupErrors.join('; ')}`);
    }
  }
});
