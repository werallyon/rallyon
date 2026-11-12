# P0-C — Relational Favorite Teams

## Decision

`public.user_favorite_teams` is the canonical persisted source for a user's selected teams. The app-facing `TeamReference` shape remains unchanged so game sorting, venue affinity, onboarding, and profile UI continue to consume `User.favoriteTeams` without a UI contract change.

## Implementation

- Add `user_favorite_teams` with a composite `(user_id, team_id)` primary key, team display metadata, and a `sort_order` column.
- Restrict row reads/writes to the owning authenticated user through RLS.
- Backfill existing `profiles.favorite_teams` JSON arrays into the relational table using an additive migration. The legacy column is intentionally retained; this PR does not drop or rewrite it.
- `teamPreferenceService` reads relational rows in selection order and replaces a user's selection with deduplicated upserts followed by deletion of removed rows. Upserts happen before deletes so a failed write does not erase the prior selection.
- `authService` first requires successful canonical `public.profiles` hydration, then hydrates relational favorites. A successful empty relational result is authoritative; if the favorite-team table is not yet deployed or its query fails, the existing legacy profile value remains a compatibility fallback. A profile-row/query failure is not caught or converted into an Auth-metadata/default profile.
- Profile updates no longer write `favoriteTeams` back into `profiles.favorite_teams`. Existing onboarding/profile UI continues to call the same `updateUser({ favoriteTeams })` contract.

## Migration assumptions and rollout

- The existing `public.profiles` table has an `id` UUID linked to `auth.users` and a `favorite_teams` column containing a JSON/JSONB array of objects shaped like `TeamReference` (`id`, `name`, `sportId`, `league`, `abbrev`, `logo`, optional `color`).
- Verify the actual `profiles.favorite_teams` type and representative values in a disposable Supabase project before applying the migration. The repo's current schema migration does not define `profiles`; this migration therefore documents and relies on the already-provisioned profile table.
- Apply the additive migration first, verify the backfill, row counts and RLS with two test users, then deploy the app. Do not drop `profiles.favorite_teams` until a separate reviewed cleanup after successful rollout.
- Existing `user_favorite_teams` rows are not overwritten by backfill (`ON CONFLICT DO NOTHING`).
- No production Supabase migration or data write was performed as part of this PR.

## Coordination

This branch is based on `main` and is intentionally separate from P0-A and other P0 work. P0-A also touches profile/auth hydration; resolve those overlapping files deliberately when integrating both PRs. Keep the relational favorite-team data contract and P0-A's canonical profile contract intact. P0-C must not reintroduce `user_metadata` fallbacks or catch canonical profile errors; only the relational favorite-team query may use its documented legacy fallback.

## Validation

- `npm test`
- `npm run lint`
- `npm run build`
- In disposable Supabase: apply the migration, verify the backfill, exercise select/insert/update/delete RLS as owner and non-owner, and confirm legacy fallback before migration and relational authority after migration.