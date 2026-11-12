import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20261112120000_p0c_relational_favorite_teams.sql');
const favoriteService = read('src/services/teamPreferenceService.ts');
const authService = read('src/services/authService.ts');
const profileService = read('src/services/profileService.ts');

test('favorite teams use a user-scoped relational table with a stable composite key', () => {
  assert.ok(migration.includes('create table if not exists public.user_favorite_teams'));
  assert.ok(migration.includes('user_id uuid not null references auth.users(id) on delete cascade'));
  assert.ok(migration.includes('primary key (user_id, team_id)'));
  assert.ok(migration.includes('sort_order integer not null'));
});

test('favorite-team rows are protected by owner-only RLS policies', () => {
  assert.ok(migration.includes('alter table public.user_favorite_teams enable row level security'));
  for (const operation of ['select', 'insert', 'update', 'delete']) {
    assert.ok(migration.includes('user_favorite_teams_' + operation + '_own'));
  }
  assert.ok(migration.includes('revoke all on table public.user_favorite_teams from anon'));
  assert.ok(migration.includes('(select auth.uid()) = user_id'));
});

test('migration backfills legacy JSON in original selection order without overwriting rows', () => {
  assert.ok(migration.includes('jsonb_array_elements')) ;
  assert.ok(migration.includes('p.favorite_teams::jsonb'));
  assert.ok(migration.includes('(team.ordinality - 1)::integer'));
  assert.ok(migration.includes('on conflict (user_id, team_id) do nothing'));
  assert.equal(/drop column.*favorite_teams/i.test(migration), false);
});

test('favorite-team service maps the existing TeamReference contract and persists relationally', () => {
  for (const fragment of [
    'export function mapFavoriteTeamRow',
    'export function toFavoriteTeamRow',
    "from('user_favorite_teams')",
    ".order('sort_order'",
    "upsert(rows, { onConflict: 'user_id,team_id' })",
    'new Set(uniqueTeams.map'
  ]) assert.ok(favoriteService.includes(fragment), 'missing service behavior: ' + fragment);
});

test('auth hydration prefers a successful relational result and keeps a migration fallback', () => {
  assert.ok(authService.includes('getFavoriteTeams(authUser.id)'));
  assert.ok(authService.includes('Relational favorite teams unavailable; retaining legacy profile values'));
  assert.ok(authService.includes('replaceFavoriteTeams(id, favoriteTeams)'));
});

test('profile writes no longer persist favoriteTeams to the legacy JSON column', () => {
  assert.equal(profileService.includes("favoriteTeams:'favorite_teams'"), false);
});

test('optimistic profile and favorite writes roll back on persistence failure', () => {
  assert.match(authService, /private profileWriteRevision = 0/);
  assert.ok(authService.includes('writeRevision === this.profileWriteRevision'));
  assert.ok(authService.includes('this.currentUser = previousUser;'));
});

test('canonical profile failures are not converted into synthetic Auth-only users', () => {
  const hydrator = authService.slice(
    authService.indexOf('private async hydrateUser'),
    authService.indexOf('private notify')
  );
  assert.match(hydrator, /getUserWithProfile\(authUser\)/);
  assert.equal(/return mergeAuthUserWithProfile\(authUser\)/.test(hydrator), false);
  assert.match(hydrator, /Relational favorite teams unavailable; retaining legacy profile values/);
  assert.equal(authService.includes('function mapUser'), false);
  assert.match(authService, /const revision = \+\+this\.authRevision/);
  assert.match(authService, /revision === this\.authRevision/);
});
