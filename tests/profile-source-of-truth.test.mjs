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
  assert.match(hydrator, /await getUserWithProfile\(authUser, this.client\)/);
  assert.match(hydrator, /await getFavoriteTeams\(authUser\.id, this.client\)/);
  assert.equal(/catch/.test(hydrator), false);
});

test('initialization, auth-state hydration, and direct auth actions reject stale completions', () => {
  const initialization = authService.slice(
    authService.indexOf('async initialize'),
    authService.indexOf('subscribe(')
  );
  assert.match(initialization, /const actionRevision = this\.authActionRevision/);
  assert.match(initialization, /isCurrentAuthHydration\(revision, this\.authRevision, actionRevision, this\.authActionRevision\)/);
  assert.match(authService, /isCurrentAuthHydration/);
  assert.match(authService, /isAuthActionCurrent/);
  assert.match(authService, /this\.isCurrentAuthAction\(actionRevision, data\.user\.id\)/);
});

test('profile service never maps legacy favorite JSON or exports a direct table-update helper', () => {
  assert.equal(/favorite_teams/.test(profileService), false);
  assert.equal(/export async function updateProfile/.test(profileService), false);
  assert.equal(/\.from\('profiles'\)\.update/.test(profileService), false);
});

test('onboarding is remounted for each authenticated user identity', () => {
  const onboarding = read('src/components/onboarding/OnboardingFlow.tsx');
  assert.match(onboarding, /<OnboardingFlowForUser key=\{currentUser\.id\} \/>/);
});

test('profile RPC rechecks the live authenticated identity before submitting', () => {
  const write = authService.slice(authService.indexOf('updateUser(id:'), authService.indexOf('completeOnboarding'));
  assert.match(write, /auth\.getUser\(\)/);
  assert.match(write, /authData\.user\.id !== id/);
});

test('canonical profile SELECT excludes the retained legacy favorite JSON column', () => {
  assert.match(profileService, /select\('id,username,first_name/);
  assert.equal(/select\('\*'\)/.test(profileService), false);
  assert.equal(/favorite_teams/.test(profileService), false);
});

test('profile display name does not fall back to Auth email identity', () => {
  const mapper = profileService.slice(
    profileService.indexOf('export function mergeAuthUserWithProfile'),
    profileService.indexOf('export async function getProfile')
  );
  assert.match(mapper, /name: displayName,/);
  assert.equal(/authUser\?\.email\?\.split/.test(mapper), false);
});

test('AuthContext publishes profile edits only through AuthService commit notifications', () => {
  const context = read('src/context/AuthContext.tsx');
  const updateHandler = context.slice(context.indexOf('const handleUpdateUser'), context.indexOf('const handleLogout'));
  assert.match(updateHandler, /await authService\.updateUser\(currentUser\.id, updates\)/);
  assert.match(updateHandler, /await authService\.completeOnboarding\(currentUser\.id\)/);
  assert.equal(/setCurrentUser\(updated\)/.test(updateHandler), false);
});

test('AuthContext only clears loading/errors for the latest auth request', () => {
  const context = read('src/context/AuthContext.tsx');
  assert.match(context, /authRequestRevision = useRef\(0\)/);
  assert.match(context, /requestRevision === authRequestRevision\.current/);
  assert.match(context, /if \(user\) setAuthError\(null\)/);
});


test('ProfileScreen routes every persisted mutation through the shared save-result helper', () => {
  const screen = read('src/components/ProfileScreen.tsx');
  assert.equal(/updateUser\\(\\s*\\{/.test(screen), false);
  assert.match(screen, /saveProfileUpdate\\(updateUser, updates, setSaveErrorMsg, onSuccess\\)/);
  assert.match(screen, /profileSaveError/);
  assert.match(screen, /await saveProfile\\(\\{ favoriteTeams: \\[\\.\\.\\.current, team \\] \\}, \\(\\) => \\{/);
});

test('onboarding only advances or completes after the shared profile save helper succeeds', () => {
  const onboarding = read('src/components/onboarding/OnboardingFlow.tsx');
  assert.equal(/updateUser\\(\\s*\\{/.test(onboarding), false);
  assert.match(onboarding, /saveProfileUpdate\\(updateUser, updates, setSaveErrorMsg\\)/);
  assert.match(onboarding, /profileSaveError/);

  const transition = onboarding.slice(
    onboarding.indexOf('const goToNextStep'),
    onboarding.indexOf('const goToPrevStep')
  );
  assert.match(transition, /if \\(!saved\\) return;[\\s\\S]*setCurrentStepIndex/);

  const skip = onboarding.slice(
    onboarding.indexOf('const handleSkipToCompletion'),
    onboarding.indexOf('const handleFinalCompletion')
  );
  const completion = onboarding.slice(
    onboarding.indexOf('const handleFinalCompletion'),
    onboarding.indexOf('return (', onboarding.indexOf('const handleFinalCompletion'))
  );
  assert.match(skip, /await saveOnboardingProgress\\(/);
  assert.match(completion, /await saveOnboardingProgress\\(/);
});
