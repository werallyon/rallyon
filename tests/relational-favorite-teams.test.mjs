import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20261112120000_p0c_relational_favorite_teams.sql') + read('supabase/migrations/20261112140000_p0_auth_rls_review_remediation.sql');
const favoriteService = read('src/services/teamPreferenceService.ts');
const authService = read('src/services/authService.ts');
const profileService = read('src/services/profileService.ts');

test('favorite teams use a user-scoped relational table with a stable composite key', () => {
  assert.ok(migration.includes('create table public.user_favorite_teams'));
  assert.ok(migration.includes('user_id uuid not null references auth.users(id) on delete cascade'));
  assert.ok(migration.includes('primary key (user_id, team_id)'));
  assert.ok(migration.includes('sort_order integer not null'));
});

test('favorite-team rows are protected by owner-only RLS policies', () => {
  assert.ok(migration.includes('alter table public.user_favorite_teams enable row level security'));
  for (const operation of ['select', 'insert', 'update', 'delete']) {
    assert.ok(migration.includes('user_favorite_teams_' + operation + '_own'));
  }
  assert.ok(migration.includes('revoke all on table public.user_favorite_teams from anon, authenticated'));
  assert.ok(migration.includes('grant select, insert, update, delete on table public.user_favorite_teams to authenticated'));
  assert.equal(/grant all on table public\\.user_favorite_teams to authenticated/i.test(migration), false);
  assert.ok(migration.includes('(select auth.uid()) = user_id'));
});

test('migration backfills legacy JSON deterministically and preserves the legacy column', () => {
  assert.ok(migration.includes('jsonb_array_elements'));
  assert.ok(migration.includes('p.favorite_teams::jsonb'));
  assert.ok(migration.includes('(ordinality - 1)::integer'));
  assert.ok(migration.includes("distinct on (p.id, t.value->>'id')"));
  assert.equal(/drop column.*favorite_teams/i.test(migration), false);
});

test('migration refuses unsafe legacy data and unknown pre-existing relations', () => {
  assert.ok(migration.includes("found %; inspect and repair explicitly before migration"));
  assert.ok(migration.includes("user_favorite_teams already exists"));
  assert.ok(migration.includes("v_broad_policies"));
  assert.ok(migration.includes("v_anon_grants"));
  assert.ok(migration.includes("jsonb_typeof(favorite_teams::jsonb)"));
  assert.ok(migration.includes("distinct on (p.id, t.value->>'id')"));
  assert.equal(/create table if not exists public\\.user_favorite_teams/i.test(migration), false);
});

test('canonical profile mapper requires a matching non-null profile row', () => {
  assert.ok(profileService.includes('mergeAuthUserWithProfile(authUser: any, profile: ProfileRow): User'));
  assert.ok(profileService.includes('profile.id !== authUser.id'));
  assert.equal(profileService.includes('profile?: ProfileRow | null'), false);
  assert.equal(profileService.includes('profile ?? { id: authUser.id }'), false);
});

test('favorite-team service maps the existing TeamReference contract and persists relationally', () => {
  for (const fragment of [
    'export function mapFavoriteTeamRow',
    'export function toFavoriteTeamRow',
    "from('user_favorite_teams')",
    ".order('sort_order'",
    "rpc('save_profile_and_favorite_teams'",
    'normalizeFavoriteTeams'
  ]) assert.ok(favoriteService.includes(fragment), 'missing service behavior: ' + fragment);
});

test('auth hydration treats relational favorites as authoritative and propagates failures', () => {
  assert.ok(authService.includes('getFavoriteTeams(authUser.id)'));
  assert.equal(authService.includes('Relational favorite teams unavailable; retaining legacy profile values'), false);
  assert.ok(authService.includes('save_profile_and_favorite_teams'));
});

test('profile writes no longer persist favoriteTeams to the legacy JSON column', () => {
  assert.equal(profileService.includes("favoriteTeams:'favorite_teams'"), false);
});

test('profile and favorite writes use one transactional RPC rather than independent promises', () => {
  assert.ok(authService.includes("rpc('save_profile_and_favorite_teams'"));
  assert.equal(authService.includes('Promise.all([profileSave, favoriteTeamsSave])'), false);
  assert.ok(migration.includes('create or replace function public.save_profile_and_favorite_teams'));
});

test('favorite-team replacement validates input and uses the transactional RPC', () => {
  assert.ok(favoriteService.includes('export function normalizeFavoriteTeams'));
  assert.ok(favoriteService.includes("rpc('save_profile_and_favorite_teams'"));
  assert.ok(favoriteService.includes('Favorite teams require non-empty IDs and names'));
});

test('optimistic profile and favorite writes roll back on persistence failure', () => {
  assert.match(authService, /private profileWriteRevision = 0/);
  assert.ok(authService.includes('writeRevision === this.profileWriteRevision'));
  assert.ok(authService.includes('this.currentUser = previousUser;'));
});

test('sign-in and sign-up completion are guarded against superseded auth actions', () => {
  assert.ok(authService.includes('private authActionRevision = 0'));
  assert.ok(authService.includes('private async isCurrentAuthAction'));
  assert.ok(authService.includes('isCurrentAuthAction(actionRevision, this.authActionRevision, userId'));
  assert.ok(authService.includes('isCurrentAuthHydration'));
  assert.ok(authService.includes('revision !== this.authRevision'));
  assert.ok(authService.includes('this.authActionRevision++; this.profileWriteRevision++;'));
});

test('no-op profile writes still require an existing canonical row', () => {
  assert.match(profileService, /if \(!Object\.keys\(patch\)\.length\) \{[\s\S]*?if \(!profile\) throw new Error/);
});

test('canonical profile failures are not converted into synthetic Auth-only users', () => {
  const hydrator = authService.slice(
    authService.indexOf('private async hydrateUser'),
    authService.indexOf('private notify')
  );
  assert.match(hydrator, /getUserWithProfile\(authUser\)/);
  assert.equal(/return mergeAuthUserWithProfile\(authUser\)/.test(hydrator), false);
  assert.equal(hydrator.includes('Relational favorite teams unavailable; retaining legacy profile values'), false);
  assert.equal(authService.includes('function mapUser'), false);
  assert.match(authService, /const revision = \+\+this\.authRevision/);
  assert.match(authService, /revision === this\.authRevision/);
});
