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

test('AuthService strips transient state before the strict profile RPC', async () => {
  const { readFileSync } = await import('node:fs');
  const authService = readFileSync(new URL('../src/services/authService.ts', import.meta.url), 'utf8');
  assert.match(authService, /splitUserUpdatePayload\(updates\)/);
  assert.match(authService, /locationPermissionStatus: locationPermissionStatus \?\? updated\.locationPermissionStatus/);
});

test('onboarding completion is included in the profile save instead of racing a second write', async () => {
  const { readFileSync } = await import('node:fs');
  const onboarding = readFileSync(new URL('../src/components/onboarding/OnboardingFlow.tsx', import.meta.url), 'utf8');
  assert.equal(onboarding.includes('completeOnboarding();'), false);
  assert.match(onboarding, /onboardingCompleted: true/);
  assert.match(onboarding, /onboardingStep: 'complete'/);
});
