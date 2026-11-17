# P0-A / P0-C security-review remediation

This document describes the current PR #22 integration candidate. PR #22 is open and unmerged; production rollout remains blocked.

## Application behavior

- Profile edits and complete favorite-team replacement use `public.save_profile_and_favorite_teams`, a single SECURITY INVOKER Postgres function. It derives ownership from `auth.uid()`, checks the caller-supplied expected user ID against that identity, and performs the profile update and favorite replacement in one transaction.
- The RPC pins `search_path` to `pg_catalog, public, pg_temp`; EXECUTE is granted to authenticated and revoked from PUBLIC/anon.
- Malformed favorite payloads fail the transaction. An empty array is an intentional clear operation.
- Favorite inputs are normalized; malformed required fields are rejected, duplicate team IDs deterministically retain the first entry, and relational favorites are authoritative.
- A failed relational favorite read is surfaced as a hydration failure, never converted into stale legacy JSON.
- Persisted profile writes are serialized and do not publish optimistic persisted state. Callers await the persistence result; failures are surfaced rather than silently treated as success.
- Auth sign-in/sign-out/initialization/account-switch completions are guarded against stale asynchronous results. The profile mapper requires a canonical profile row whose ID matches the Auth user.

## Auth bootstrap security contract

The production-compatible `public.handle_new_user()` function remains **SECURITY INVOKER**. Its `search_path` is pinned to `pg_catalog, public`. The enabled `auth.on_auth_user_created` trigger is an AFTER INSERT row trigger.

The migration accepts only the exact reviewed metadata-tolerant function body observed in production. It does not silently adopt unknown or older bodies. The function's direct EXECUTE privilege is revoked from PUBLIC, anon, authenticated, and service_role.

GoTrue's `supabase_auth_admin` role receives only:
- USAGE on schema `public`;
- INSERT on `public.profiles`;
- a dedicated `profiles_insert_auth_admin` RLS policy scoped to that role.

It receives no profile SELECT, UPDATE, or DELETE privilege. This intentionally avoids an ON CONFLICT/SELECT dependency. Do not convert the trigger to SECURITY DEFINER or grant broader profile access as a workaround.

The bootstrap parses `onboardingCompleted` defensively: only literal true becomes true; false, missing, or malformed values become false. Missing onboarding step defaults to `welcome`.

## Migration preflight and ordering

The forward-only PR #22 migrations are:
1. `20261114150000_p0c_relational_favorite_teams.sql`
2. `20261114151000_p0_auth_rls_review_remediation.sql`

The first migration validates the existing profile schema, RLS policies, trigger/function contract, effective table/column grants, and legacy favorite JSON before creating/backfilling the relational table. It fails closed on unknown pre-existing favorite relations or malformed legacy data. The second installs the transactional RPC.

The PR #22 workflow checks unique versions in the actual root migration list, checks PR #17's migration version against that list, and byte-compares the combined replay SQL with PR #17's exact migration. The isolated Supabase job applies the combined P0-B/P0-C/RPC sequence and tests Auth/PostgREST/RLS behavior.

## Validation evidence and limits

Current-head Build Check #454 (run `44028935777`) passed on PR #22 head `72a79f6c5ed3f3932b2990f484086dc181ed7caf`, including:
- actual root migration-version uniqueness and cross-PR uniqueness checks;
- byte-identical P0-B combined replay check;
- isolated local Supabase reset applying P0-B, P0-C, and the RPC in sequence;
- canonical sports constraints/ACLs, profile contract, favorite backfill, RLS/RPC;
- local Auth, PostgREST, RLS, and lifecycle integration;
- negative preflight cases;
- regression tests, Edge Function types, TypeScript, and production build.

This is isolated synthetic validation, not a production signup test or a substitute for migration provenance review. The hosted production migration ledger was most recently observed with 15 entries ending at `20261116230833`; the two PR #22 versions above were absent in that inspection. Re-check each target environment and its actual schema before any rollout.

## Remaining gates

- Recover authoritative source/provenance for the five missing historical migration files; do not fabricate their original SQL.
- Independently review the combined migration history and security posture against the actual current branch heads.
- Obtain one successful real GoTrue signup through the RallyOn app after the final production Auth adjustment; verify exactly one matching profile is created.
- Keep production deployment NO-GO until the above gates are satisfied and the owner explicitly authorizes a rollout.
