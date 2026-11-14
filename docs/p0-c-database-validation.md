# P0-A / P0-C database validation and production rollout gate

## Decision

**Production deployment is NO-GO.** PR #22 improves the migration safety checks and has an isolated exact-migration test, but repository evidence does not establish the migration-history state of every relevant environment. A passing local test is not production approval.

Code review and branch CI may continue independently. Keep PR #22 draft until the integration owner has reviewed the completed checks. Do not interpret merging as permission to deploy.

## Migration-history reconciliation — forward-only versions `20261114150000` and `20261114151000`

PR #22 replaces PR #18's original SQL at the same migration version:

- `supabase/migrations/20261114150000_p0c_relational_favorite_teams.sql`
- `supabase/migrations/20261114151000_p0_auth_rls_review_remediation.sql`

The earlier proposed versions `20261112120000` and `20261112140000` were older than the latest hosted production version `20261112152519`. They were not recorded in the inspected production ledger and have been replaced with the forward-only versions above, both newer than the hosted maximum. Do not revive the older filenames or delete migration-history rows, mark migrations reverted, or manually replay historical SQL.

Before any deployment decision, an authorized database operator must establish the exact history rows and resulting schema in each relevant environment. The read-only history query is:

```sql
select version, name
from supabase_migrations.schema_migrations
where version in ('20261114150000', '20261114151000')
order by version;
```

Run this independently in every relevant environment and retain the output with the deployment review. An absent row is not proof that no manual SQL was applied; compare the actual table/schema state as well. If the historical version was already applied, inspect the actual table and data, then prepare a separately reviewed forward migration with a new version. Preserve the original history record and reconcile existing relational favorites with the retained legacy JSON without overwriting valid user selections.

The connected production project was inspected read-only on 2026-11-14: its ledger has 10 entries ending at `20261112152519`, and neither new forward-only version is recorded. The same history check is still required in any other deployment environment before rollout.

## Hardened preflight

The current `20261114150000` migration fails closed unless it verifies:

- `public.profiles` exists and RLS is enabled.
- Authenticated SELECT, INSERT, and UPDATE policies use an exact allowlisted owner predicate; every applicable permissive policy for authenticated, anon, or PUBLIC is checked because permissive policies combine with OR semantics.
- The Auth bootstrap is the enabled `AFTER INSERT FOR EACH ROW` trigger `auth.on_auth_user_created`, invoking the exact reviewed legacy `public.handle_new_user` body owned by `postgres` or `supabase_admin`; it then hardens that function to SECURITY DEFINER with pinned `pg_catalog, public, pg_temp` search_path and revokes direct API EXECUTE.
- No effective anon or PUBLIC table/column grants expose `public.profiles`; authenticated retains the table privileges required by the invoker-rights RPC.
- `profiles.id` is the sole primary key and references `auth.users.id`.
- All profile columns and types referenced by the transactional RPC exist and match the application contract.
- Legacy `favorite_teams` is JSON/JSONB, NOT NULL, has a default for Auth bootstrap inserts, and every root is an array containing only objects with non-empty string IDs and names.
- No unknown `public.user_favorite_teams` relation already exists.

The migration explicitly revokes PUBLIC, anon, and authenticated privileges on the new relation before granting authenticated CRUD only. It retains the legacy JSON column. Backfill is deterministic: the first occurrence of each duplicate team ID wins and source order is retained for selected rows.

The expression allowlist is deliberately conservative. A semantically equivalent but differently deparsed policy will fail preflight and require explicit review rather than being accepted automatically.

## Exact local migration validation

The CI job `Exact PR #22 migrations on isolated local Supabase` uses a dedicated Supabase CLI workdir under `validation/`. It:

1. Creates a synthetic profile/Auth schema based on the documented production contract.
2. Creates synthetic Auth users and lets the local bootstrap trigger create their profiles.
3. Copies the executable contents of the two root PR #22 migration files into the isolated project's migration directory (only the version prefixes are renamed to order them after fixtures).
4. Runs a clean local Supabase database reset, applying the exact root migration SQL.
5. Verifies profile bootstrap, deterministic favorite backfill, RLS, grants, and RPC installation.
6. Runs negative preflight cases for a permissive OR policy, a disabled Auth trigger, a missing RPC profile column, and a PUBLIC profile grant. Each case must fail for the expected preflight reason.
7. Performs a final clean positive reset and verification.

This is a synthetic reconstruction, not a production schema dump. It proves that the exact proposed SQL applies to that fixture contract and rejects the tested unsafe variants. It does not establish the live production schema or migration history.

## Safe production plan — only after explicit approval

1. Keep production deployment blocked.
2. Confirm that versions `20261114150000` and `20261114151000` are absent from each target environment's migration ledger; production was checked read-only and both are absent.
3. Inspect the exact target's profile columns/types/nullability/defaults, PK/FK, all policies and their role coverage, effective table/column grants (including inherited roles and PUBLIC), Auth trigger definition/enabled state, function owner/body/search_path, and any existing favorite relation.
4. Arrange a verified backup/PITR recovery point and confirm restoration procedures.
5. Rehearse the exact forward-only versions against a faithful schema-only clone with synthetic data. If another environment already has a conflicting schema or migration state, design a separate forward migration based on that actual state; do not edit or replay history.
6. Compare legacy JSON and relational rows, including duplicate IDs, optional metadata, ordering, empty arrays, malformed records, and orphaned profile IDs. Resolve all discrepancies explicitly.
7. Validate Auth signup, two-user PostgREST ownership, anonymous denial, transactional rollback, and application profile/favorite lifecycle.
8. Deploy only the approved migration path through the normal migration runner in a controlled window.
9. Verify migration history, constraints, RLS, all policies, grants, trigger behavior, row counts, data reconciliation, and Auth/API smoke tests.
10. Retain `profiles.favorite_teams` through the rollback window. Dropping it requires a later, separately reviewed migration.

## Recovery constraints

- The normal Supabase migration runner applies each migration file transactionally unless explicitly configured otherwise; a failed migration should roll back that file's changes. This does not make arbitrary manual SQL execution equivalent.
- Do not use DROP TABLE or delete migration-history rows as an improvised rollback.
- If application writes have reached the relational table, reconcile those writes before considering schema rollback.
- Keep both legacy and relational data until the new path is proven and the rollback window has closed.

## Current boundaries

- Production Supabase was inspected read-only; no hosted or production Supabase changes were made.
- No production migration was applied.
- PR #16 and PR #18 remain separate review history; do not independently apply PR #18's original migration.
- PR #22 remains a draft integration candidate. Production deployment remains NO-GO until the remaining historical SQL provenance, migration history, and target-schema compatibility are established.
