import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const profileService = read('src/services/profileService.ts');
const authService = read('src/services/authService.ts');

test('canonical profile mapping never reads mutable fields from Auth metadata', () => {
  const mapper = profileService.slice(
    profileService.indexOf('export function mergeAuthUserWithProfile'),
    profileService.indexOf('export async function getProfile')
  );
  assert.equal(/user_metadata|raw_user_meta_data/.test(mapper), false);
  assert.match(mapper, /firstName = p\.first_name/);
  assert.match(mapper, /username: p\.username/);
});

test('canonical profile mapper requires the authenticated user matching profile row', () => {
  assert.match(profileService, /profile\.id !== authUser\.id/);
  assert.match(profileService, /A matching canonical profile row is required/);
});

test('authenticated hydration rejects missing canonical profile rows', () => {
  const hydration = profileService.slice(
    profileService.indexOf('export async function getUserWithProfile'),
    profileService.indexOf('const PROFILE_FIELD_MAP')
  );
  assert.match(hydration, /if \(!profile\)/);
  assert.match(hydration, /throw new Error/);
  assert.match(hydration, /mergeAuthUserWithProfile\(authUser, profile\)/);
});

test('profile fields are persisted through the transactional profile RPC, not legacy upserts', () => {
  assert.match(authService, /save_profile_and_favorite_teams/);
  assert.match(authService, /p_profile_updates: profileUpdates/);
  assert.equal(/\.from\('profiles'\)\.upsert/.test(authService), false);
});

test('auth hydration treats relational favorites as authoritative and fails closed on errors', () => {
  const hydrator = authService.slice(
    authService.indexOf('private async hydrateUser'),
    authService.indexOf('private async isCurrentAuthAction')
  );
  assert.match(hydrator, /await getUserWithProfile\(authUser\)/);
  assert.match(hydrator, /await getFavoriteTeams\(authUser\.id\)/);
  assert.equal(/catch/.test(hydrator), false);
});

test('initialization, auth-state hydration, and direct auth actions reject stale completions', () => {
  const initialization = authService.slice(
    authService.indexOf('async initialize'),
    authService.indexOf('subscribe(')
  );
  assert.match(initialization, /const actionRevision = this\\.authActionRevision/);
  assert.match(initialization, /isCurrentAuthHydration\\(revision, this\\.authRevision, actionRevision, this\\.authActionRevision\\)/);
  assert.match(authService, /isCurrentAuthHydration/);
  assert.match(authService, /isAuthActionCurrent/);
  assert.match(authService, /this\\.isCurrentAuthAction\\(actionRevision, data\\.user\\.id\\)/);
});
