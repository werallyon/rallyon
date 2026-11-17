# P0-A / P0-C database validation and production rollout gate

## Decision

**Production deployment is NO-GO.** PR #22's current-head isolated validation passes, but repository evidence does not establish the provenance of every historical migration or prove a real production GoTrue signup after the final Auth adjustment. Passing local CI is not production approval.

## Forward-only migration versions

PR #22 contains these root migrations:

- `20261114150000_p0c_relational_favorite_teams.sql`
- `20261114151000_p0_auth_rls_review_remediation.sql`

The earlier proposed versions `20261112120000` and `20261112140000` were not recorded in the inspected production ledger and were replaced. Do not revive the old filenames, delete migration-history rows, mark migrations reverted, or manually replay historical SQL.

The PR #22 workflow validates uniqueness across the actual root migration filenames, checks PR #17's `20261113120000` version against that list, and byte-compares the staged combined P0-B migration with PR #17's exact SQL.

## Production migration history — read-only observation

The most recent inspected production ledger contained 15 entries and ended at `20261116230833`. The PR #22 versions `20261114150000` and `20261114151000` were absent from that ledger at the time of inspection.

This is a dated observation, not a guarantee about another environment or a later state. Before any deployment decision, an authorized operator must independently query each target environment:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```

Compare the complete ledger with the actual schema and data. An absent row does not prove that no manual SQL was applied. If a conflicting relation or migration state exists, stop and prepare a separately reviewed forward migration; preserve existing history and data.

## Current Auth bootstrap contract

The inspected production `public.handle_new_user()` is SECURITY INVOKER, owned by postgres, with `search_path=public`. Its body inserts the profile, parses `onboardingCompleted` defensively (only literal true is true), defaults the onboarding step to `welcome`, and has no ON CONFLICT clause.

The final operational adjustment preserved INVOKER rights and pinned `search_path` to `pg_catalog, public`. `supabase_auth_admin` receives schema USAGE and profile INSERT only, constrained by a dedicated Auth-admin INSERT RLS policy. It receives no profile SELECT/UPDATE/DELETE. Direct API execution of the trigger function is revoked.

A synthetic trigger smoke test passed inside a rolled-back transaction. A real GoTrue signup previously returned HTTP 500 before the final no-SELECT-dependency adjustment. **No successful real signup has yet been confirmed after that final adjustment.** Keep the gate open until a normal signup through the RallyOn app creates exactly one profile matching the new Auth user.

## Isolated validation evidence

Current-head Build Check #454 (run `44028935777`) passed on PR #22 head `72a79f6c5ed3f3932b2990f484086dc181ed7caf`. Its two jobs passed:
- Exact combined P0-B/P0-C/RPC migration replay on an isolated local Supabase stack.
- Profile/favorite contract, canonical sports constraints, provider ACLs, league-scoped game references, Auth/PostgREST/RLS lifecycle tests, and negative preflight cases.
- Root and cross-PR migration-version uniqueness, byte-identical P0-B staging, regression tests, Edge Function types, TypeScript, and production build.

This validates the proposed SQL against the synthetic fixture contract. It does not establish production schema compatibility, historical source provenance, or successful hosted signup.

## Missing historical SQL and rollout constraints

Five historical SQL source files remain a provenance gap. Do not reconstruct them from the current schema and present them as original source. Recover authoritative files from source control, backups, or owner-supplied originals; document hashes and provenance. Where exact source cannot be recovered, record the gap and design a separately reviewed forward reconciliation migration rather than rewriting history.

Before any future production rollout:
1. Complete the independent migration-history and security review.
2. Verify exact target ledger, schema, policies, grants, trigger/function owner/body/search_path, and existing relational favorite data.
3. Rehearse the exact approved forward migration path against a faithful clone with synthetic data.
4. Confirm backup/PITR recovery and a tested restoration process.
5. Verify successful real signup, two-user PostgREST ownership, anonymous denial, transactional rollback, and profile/favorite lifecycle.
6. Obtain explicit owner authorization before production changes.
7. Retain legacy `profiles.favorite_teams` through the rollback window; dropping it requires a later separately reviewed migration.

No broad `supabase db push`, root reset, migration repair, or manual production SQL is authorized by this document.
