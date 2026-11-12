# Production migration readiness — P0-A / P0-C

This note records the production-specific compatibility work added to the P0-A/P0-C migration candidate.

## Read-only production observations

Project `nqdrfwvxomecduxmmzrc` was inspected without executing DDL or modifying data.

- Migration versions `20261112120000` and `20261112140000` are absent from `supabase_migrations.schema_migrations`.
- The existing `public.profiles` table has the expected UUID primary key and Auth foreign key, JSONB `favorite_teams` with a NOT NULL/default contract, and owner-scoped SELECT/INSERT/UPDATE policies.
- `public.user_favorite_teams` and the transactional RPC are absent.
- `auth.on_auth_user_created` invokes `public.handle_new_user()`.
- The current bootstrap function is owned by `postgres`, inserts only into `public.profiles` using the new Auth user's metadata, but is SECURITY INVOKER and has `search_path=public`.
- `anon` has explicit table privileges on `public.profiles`; no column-level profile grants were found.
- The production profile table had zero rows at inspection time. This is a point-in-time observation, not a guarantee about future data.

## Migration behavior added

The pending P0-C migration now recognizes only the observed canonical bootstrap function (trusted owner, PL/pgSQL trigger function, exact profile insert/upsert behavior). It then:

1. Changes that function to SECURITY DEFINER with `search_path=pg_catalog, public, pg_temp`.
2. Revokes direct EXECUTE from PUBLIC, anon, authenticated, and service_role; the function is intended to be invoked by its Auth trigger only.
3. Revokes anon and PUBLIC table privileges on `public.profiles`, preserving authenticated/service_role table grants and the existing RLS policies.
4. Runs the strict trigger, policy, grants, schema, and legacy-data preflight before creating/backfilling relational favorites.

Unknown trigger implementations, unsafe policies, malformed legacy favorites, schema drift, and unsafe grants still fail closed.

## Required rollout procedure

Do not run a broad migration push blindly. Before any production deployment:

1. Re-run the read-only migration-history query and confirm the two target versions remain absent.
2. Run `supabase migration list` against the exact production project and inspect every local/remote difference. The repository's local pending set must be understood in full; do not use `migration repair` to conceal missing history.
3. Confirm the deployment plan applies the reviewed P0-C migration before the dependent RPC migration, and that no unrelated pending migrations are swept into the release.
4. Take and verify a recoverable backup/PITR point.
5. Run the reviewed migrations in the approved maintenance/release window.
6. Verify trigger function owner/security/search_path/EXECUTE ACL, profile grants, RLS, relational favorite row counts, RPC grants, and real Auth signup/profile hydration.
7. Keep `profiles.favorite_teams` until a separately reviewed retirement decision.

## Safety boundary

The compatibility migration and fixture changes are committed to the PR #22 branch. Only isolated local validation may execute them before approval. No production DDL, DML, grants, trigger changes, or migration-history changes were made during this work.

## Validation detail

The missing-trigger negative fixture deliberately removes the Auth trigger. The migration leaves that case to the strict trigger preflight so it fails with the dedicated missing-trigger diagnostic; it does not misclassify absence as an unknown function implementation. If a trigger exists but its function body differs from the reviewed canonical profile-insert implementation, the migration aborts before changing function privileges.
