# P0-A / P0-C security-review remediation

This branch addresses the independent review findings without changing PR #16, PR #18, or the local validation harness in PR #19.

## Application behavior

- Profile edits and complete favorite-team replacement are submitted through `public.save_profile_and_favorite_teams`, a single invoker-rights Postgres function. The function derives ownership from `auth.uid()`, applies the profile update and favorite replacement in one transaction, and relies on the existing owner-scoped RLS policies.
- A malformed favorite-team payload raises an exception. Because the RPC is one transaction, the accompanying profile update is rolled back as well.
- An empty favorite-team array is an intentional clear operation.
- Favorite-team inputs are normalized before submission; blank IDs/names and malformed required fields are rejected, and the first occurrence wins for duplicate IDs.
- Relational favorites are authoritative. A failed relational read is surfaced as a hydration failure; it is never converted into stale legacy JSON.
- Sign-in and sign-up completions use an action revision and re-check the current Auth session after asynchronous hydration. A superseded request cannot publish a previous identity.
- The profile mapper requires a non-null canonical row whose ID matches the Auth user.

## Migration preflight

The replacement P0-C migration is intentionally conservative and transactional:

1. Requires `public.profiles`, enabled RLS, authenticated owner-scoped SELECT, INSERT, and UPDATE policies (including UPDATE USING and WITH CHECK), a `SECURITY DEFINER` `auth.users` profile-bootstrap trigger, and no potentially broad permissive SELECT/INSERT/UPDATE policy.
2. Rejects effective anon grants on `public.profiles`.
3. Accepts only `json` or `jsonb` for `favorite_teams`; it will not cast arbitrary text.
4. Refuses to adopt a pre-existing `user_favorite_teams` table. An operator must audit its columns, keys, grants, and every policy before writing a separate adoption migration.
5. Rejects NULL/non-array legacy roots and malformed entries without silently dropping user selections.
6. Deduplicates repeated team IDs deterministically: the first occurrence wins, and source order is retained in `sort_order`.

No production database was inspected or changed as part of this branch. Before any rollout, run the preflight against a disposable copy of the exact target schema and data. Any raised preflight exception is a stop condition requiring explicit repair/review, not a reason to bypass the check.

**Migration ordering is mandatory:** this branch replaces the still-unmerged PR #18 migration at version `20261112120000` so preflight runs before table creation/backfill. Do not merge or apply PR #18's original migration independently before this replacement is integrated. If the original migration has already been applied in any environment, stop: the replacement file will not rerun there. Do not apply the new RPC migration by itself as a workaround; first create and review a forward migration that audits the existing relation and establishes what legacy data was preserved before proceeding.

## Local validation

PR #20's local harness now installs the transactional RPC and tests it through two independent Auth sessions and PostgREST:

- successful atomic profile + favorites save;
- malformed favorites rejection;
- rollback of the profile update when favorite validation fails;
- preservation of the existing favorite selection after rollback;
- intentional clearing with an empty array;
- existing two-user and anonymous RLS isolation checks.

The GitHub Actions validation job must pass before this branch is considered verified. The hosted editing environment does not run Docker-backed Supabase itself. Never use production or hosted validation credentials for this suite.

## Remaining deployment checks

- Verify the exact deployed `profiles.favorite_teams` type and all effective grants/policies in a disposable clone before rollout.
- Confirm profile SELECT/UPDATE policy predicates and absence of permissive policy OR-bypasses.
- Run local Supabase reset, SQL verifier, Auth/PostgREST integration suite, regression tests, type check, and production build.
- Keep PR #16, PR #18, PR #19, and PR #20 draft/unmerged until the results and migration assumptions are reviewed.
