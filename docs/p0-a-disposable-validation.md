# P0-A — Disposable Supabase Validation Runbook

This runbook is for an **isolated local Supabase stack only**. Never run destructive lifecycle steps against production or a shared development database.

## Preconditions

- Start the isolated stack through the repository's Supabase CLI workflow.
- Use synthetic test accounts and local Auth/PostgREST endpoints only.
- Use the anon/publishable key for user-facing API tests. A service-role key may be used only at runtime for cleanup inside the isolated CI job.
- Verify the API URL resolves to loopback before running tests.
- Never provide hosted project credentials, production credentials, or real user data to this suite.

## Profile schema and security inspection

Run read-only catalog queries against the local database after migrations are applied. Inspect profile columns/types/defaults, primary and foreign keys, RLS state, every policy (including permissive policy OR-composition), table ACLs, column ACLs, and effective privileges.

The canonical profile row must have an ID matching the Auth UUID. Authenticated profile reads/updates must remain owner-scoped. Anonymous and PUBLIC roles must have no profile table or column access.

## Auth bootstrap trigger — current contract

The reviewed production-compatible `public.handle_new_user()` trigger function is deliberately **SECURITY INVOKER**, not SECURITY DEFINER. Its `search_path` is pinned to `pg_catalog, public`. The enabled `AFTER INSERT FOR EACH ROW` trigger on `auth.users` invokes this function.

The invoker-rights design is intentional: `supabase_auth_admin` receives only public-schema USAGE and profile INSERT, constrained by the dedicated `profiles_insert_auth_admin` RLS policy. It must not receive profile SELECT, UPDATE, or DELETE, and API roles must not be able to execute the trigger function directly. Do not change this to SECURITY DEFINER as a shortcut.

The migration accepts only the exact reviewed, metadata-tolerant bootstrap body observed in production. Unknown/older bodies fail closed for manual reconciliation. The body treats malformed `onboardingCompleted` metadata as false and defaults the onboarding step to `welcome`.

## Lifecycle and API assertions

The local Auth/RLS integration suite uses synthetic users A and B and verifies:

1. Signup/bootstrap creates exactly one profile whose ID matches the Auth UUID.
2. A can read/update A's profile; B cannot read, update, or delete A's profile.
3. Anonymous requests cannot read or mutate profile rows.
4. Profile changes survive sign-out/sign-in and session restoration.
5. Stale Auth metadata never overrides canonical profile values.
6. A missing profile or failed profile read does not publish a synthetic authenticated user.
7. A can manage A's relational favorites; B cannot read or modify A's favorites.
8. A successful empty favorites response is authoritative `[]`; a failed read is an error, not a legacy fallback.
9. A combined profile/favorites RPC failure rolls back both changes.
10. Cleanup removes only synthetic users created by the local test.

A successful frontend build or source-contract test is not evidence of real RLS/API isolation. The isolated CI local-stack job is the evidence for Auth/PostgREST behavior.

## Migration ordering

The current PR #22 root migrations are:

- `20261114150000_p0c_relational_favorite_teams.sql`
- `20261114151000_p0_auth_rls_review_remediation.sql`

The combined PR #17/#22 workflow checks the actual root migration version list, checks cross-PR version uniqueness, and byte-compares the staged P0-B migration with PR #17. The isolated replay copies the exact executable contents of the two PR #22 root migrations after synthetic fixture migrations; only the staging version prefixes differ.

The inspected production ledger has 15 entries and ends at `20261116230833`. The two PR #22 versions above were not present in the inspected ledger. This observation is environment- and time-specific; re-check the ledger and actual schema in every target environment before rollout.

## Production safety

The isolated runbook must never target hosted Supabase. Production deployment remains NO-GO until the historical SQL provenance and migration-history reconciliation are independently reviewed, the final Auth signup gate is closed with a real app signup, and rollout is explicitly authorized. Do not replay the repository migration chain against production.
