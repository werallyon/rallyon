import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const migration = read('supabase/migrations/20261112120000_p0c_relational_favorite_teams.sql');
const favoriteService = read('src/services/teamPreferenceService.ts');
const authService = read('src/services/authService.ts');
const profileService = read('src/services/profileService.ts');

test('favorite teams use a user-scoped relational table with a stable composite key', () => {
  assert.match(migration, /create table if not exists public\\.user_favorite_teams/);
  assert.match(migration, /user_id uuid not null references auth\\.users\\(id\\) on delete cascade/);
  assert.match(migration, /primary key \\(user_id, team_id\\)/);
  assert.match(migration, /sort_order integer not null/);
});

test('favorite-team rows are protected by owner-only RLS policies', () => {
  assert.match(migration, /alter table public\\.user_favorite_teams enable row level security/);
  for (const operation of ['select', 'insert', 'update', 'delete']) {
    assert.ok(migration.includes('user_favorite_teams_' + operation + '_own'));
  }
  assert.match(migration, /revoke all on table public\\.user_favorite_teams from anon/);
});

test('migration backfills legacy JSON in original selection order without overwriting rows', () => {
  assert.match(migration, /jsonb_array_elements\\([\\s\\S]*?p\\.favorite_teams::jsonb/);
  assert.match(migration, /team\\.ordinality - 1/);
  assert.match(migration, /on conflict \\(user_id, team_id\\) do nothing/);
  assert.doesNotMatch(migration, /drop column.*favorite_teams/i);
});

test('favorite-team service maps the existing TeamReference contract and persists relationally', () => {
  assert.match(favoriteService, /export function mapFavoriteTeamRow/);
  assert.match(favoriteService, /export function toFavoriteTeamRow/);
  assert.match(favoriteService, /from\\('user_favorite_teams'\\)/);
  assert.match(favoriteService, /order\\('sort_order'/);
  assert.match(favoriteService, /upsert\\(rows, \\{ onConflict: 'user_id,team_id' \\}\\)/);
  assert.match(favoriteService, /new Set\\(uniqueTeams\\.map/);
});

test('auth hydration prefers a successful relational result and keeps a migration fallback', () => {
  assert.match(authService, /getFavoriteTeams\\(authUser\\.id\\)/);
  assert.match(authService, /Relational favorite teams unavailable; retaining legacy profile values/);
  assert.match(authService, /replaceFavoriteTeams\\(id, favoriteTeams\\)/);
});

test('profile writes no longer persist favoriteTeams to the legacy JSON column', () => {
  assert.doesNotMatch(profileService, /favoriteTeams\\s*:\\s*'favorite_teams'/);
});