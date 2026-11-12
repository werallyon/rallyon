import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const profileService = read('src/services/profileService.ts');
const authService = read('src/services/authService.ts');

test('canonical profile mapping never reads mutable fields from Auth user metadata', () => {
  const mapper = profileService.slice(
    profileService.indexOf('export function mergeAuthUserWithProfile'),
    profileService.indexOf('export async function getProfile')
  );
  assert.equal(/user_metadata|raw_user_meta_data/.test(mapper), false);
  assert.match(mapper, /firstName = p\.first_name/);
  assert.match(mapper, /username: p\.username/);
});

test('authenticated hydration requires a real public.profiles row', () => {
  const hydration = profileService.slice(
    profileService.indexOf('export async function getUserWithProfile'),
    profileService.indexOf('const PROFILE_FIELD_MAP')
  );
  assert.match(hydration, /if \(!profile\)/);
  assert.match(hydration, /throw new Error/);
  assert.match(hydration, /mergeAuthUserWithProfile\(authUser, profile\)/);
});

test('profile updates are explicit updates and fail when no row is returned', () => {
  const updater = profileService.slice(profileService.indexOf('export async function updateProfile'));
  assert.match(updater, /\.update\(patch\)/);
  assert.equal(/\.upsert\(/.test(updater), false);
  assert.match(updater, /if \(!data\) throw new Error/);
});

test('no-op profile writes still require an existing canonical row', () => {
  assert.match(profileService, /if \(!Object\.keys\(patch\)\.length\) \{[\s\S]*?if \(!profile\) throw new Error/);
});

test('auth hydration propagates profile failures instead of synthesizing defaults', () => {
  const hydrator = authService.slice(
    authService.indexOf('private async hydrateUser'),
    authService.indexOf('private notify')
  );
  assert.match(hydrator, /return getUserWithProfile\(authUser\)/);
  assert.equal(/catch/.test(hydrator), false);
  assert.equal(/return mergeAuthUserWithProfile\(authUser\)/.test(hydrator), false);
});

test('optimistic profile writes roll back on persistence failure and ignore stale completions', () => {
  assert.match(authService, /private profileWriteRevision = 0/);
  assert.ok(authService.includes('writeRevision === this.profileWriteRevision'));
  assert.ok(authService.includes('this.currentUser = previousUser;'));
});

test('auth-state hydration ignores stale completions and clears a previous identity', () => {
  assert.match(authService, /const revision = \+\+this\.authRevision/);
  assert.match(authService, /revision === this\.authRevision/);
  assert.match(authService, /this\.currentUser = null;\s*this\.notify\(\);/);
});
