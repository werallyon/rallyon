import assert from 'node:assert/strict';
import test from 'node:test';
import { splitUserUpdatePayload } from '../src/services/userUpdatePayload.js';

test('profile RPC payload excludes device permission state and favorite teams', () => {
  const favoriteTeams = [{ id: 'team-a', name: 'Team A' }];
  const result = splitUserUpdatePayload({
    firstName: 'Ant',
    favoriteTeams,
    locationPermissionStatus: 'GRANTED',
    notificationPermissionStatus: 'DENIED'
  });

  assert.deepEqual(result.profileUpdates, { firstName: 'Ant' });
  assert.deepEqual(result.favoriteTeams, favoriteTeams);
  assert.equal(result.locationPermissionStatus, 'GRANTED');
  assert.equal(result.notificationPermissionStatus, 'DENIED');
});

test('ordinary canonical profile fields remain in the RPC payload', () => {
  const result = splitUserUpdatePayload({
    favoriteSports: ['NFL'],
    homeCity: 'Dallas',
    latitude: 32.78
  });

  assert.deepEqual(result.profileUpdates, {
    favoriteSports: ['NFL'],
    homeCity: 'Dallas',
    latitude: 32.78
  });
});
