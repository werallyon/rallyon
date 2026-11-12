import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parse as parseDotenv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import test from 'node:test';

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
    ['--workdir', PROJECT_WORKDIR, 'status', '--env', '--output-format', 'text'],
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
    assert.ifError(error);
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

    await t.test('anonymous client cannot read profiles or favorite teams', async () => {
      const profileRead = await anonymous.from('profiles').select('id').eq('id', userA.user.id);
      assertNoVisibleRowsOrDenied(profileRead, 'anonymous profile read');

      const favoriteRead = await anonymous.from('user_favorite_teams').select('team_id').eq('user_id', userA.user.id);
      assertNoVisibleRowsOrDenied(favoriteRead, 'anonymous favorite read');
    });
  } finally {
    // Revoke client sessions first, then delete the synthetic Auth users with
    // the service-role key obtained only from this local CLI stack.
    for (const client of userClients) {
      try { await client.auth.signOut({ scope: 'local' }); } catch { /* cleanup continues */ }
    }
    for (const userId of [...createdUserIds].reverse()) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error && !/not found|user not found/i.test(error.message)) {
        throw new Error(`Failed to clean up local synthetic Auth user ${userId}: ${error.message}`);
      }
    }
    await admin.auth.signOut({ scope: 'local' });
  }
});
