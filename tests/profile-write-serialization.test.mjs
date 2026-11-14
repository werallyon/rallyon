import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../src/services/authService.ts';

function deferred() {
  let resolve;
  return { promise: new Promise((res) => { resolve = res; }), resolve };
}

test('a failed earlier profile write cannot leak optimistic state into a later failed or successful write', async () => {
  const firstRpc = deferred();
  const secondRpc = deferred();
  let rpcCalls = 0;
  const userId = '00000000-0000-4000-8000-000000000001';
  const authUser = { id: userId, email: 'person@example.com' };
  const client = {
    auth: {
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
      async getUser() { return { data: { user: authUser }, error: null }; }
    },
    async rpc(_name, args) {
      rpcCalls += 1;
      if (rpcCalls === 1) return firstRpc.promise;
      if (rpcCalls === 2) {
        assert.deepEqual(args.p_profile_updates, { homeCity: 'Committed City' });
        return secondRpc.promise;
      }
      throw new Error('Unexpected extra RPC');
    }
  };

  const service = new AuthService(client);
  service.currentUser = {
    id: userId,
    email: authUser.email,
    firstName: 'Canonical',
    lastName: 'User',
    name: 'Canonical User',
    username: 'canonical',
    emailVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    favoriteTeams: [],
    locationPermissionStatus: 'PROMPT',
    notificationPermissionStatus: 'PROMPT'
  };

  const firstSave = service.updateUser(userId, { firstName: 'Uncommitted Name' });
  const secondSave = service.updateUser(userId, { homeCity: 'Committed City' });

  // Persisted profile state is not optimistically published.
  assert.equal(service.getCurrentUser().firstName, 'Canonical');
  assert.equal(service.getCurrentUser().homeCity, undefined);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rpcCalls, 1, 'writes are serialized');

  firstRpc.resolve({ data: null, error: { message: 'simulated first-write failure' } });
  const firstResult = await firstSave;
  assert.equal(firstResult.success, false);
  assert.match(firstResult.error, /simulated first-write failure/);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rpcCalls, 2, 'the second write starts after the first has settled');

  secondRpc.resolve({
    data: {
      id: userId,
      username: 'canonical',
      first_name: 'Canonical',
      last_name: 'User',
      display_name: 'Canonical User',
      onboarding_completed: false,
      onboarding_step: 'welcome',
      home_city: 'Committed City',
      favorite_sports: [],
      favorite_leagues: [],
      preferred_experience: [],
      preferences: {},
      privacy_settings: {},
      notification_preferences: {},
      saved_venue_ids: [],
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-11-13T00:00:00.000Z'
    },
    error: null
  });
  const secondResult = await secondSave;
  await service.profileWriteQueue;
  assert.equal(secondResult.success, true);

  assert.equal(service.getCurrentUser().firstName, 'Canonical');
  assert.equal(service.getCurrentUser().homeCity, 'Committed City');
});
