# P0-A — Canonical Profile Source of Truth

## Decision

For authenticated RallyOn accounts, `public.profiles` is the sole source of truth for mutable profile attributes. Supabase Auth remains authoritative for the Auth user ID, email, email-verification state, provider, and account creation timestamp.

The browser must not read mutable profile fields from `auth.users.raw_user_meta_data` / `user_metadata` after signup. Auth metadata may remain a bootstrap payload for the existing profile-creation trigger, but it is not a second profile database.

## Implemented behavior in the combined P0-A/P0-C remediation branch

- Auth hydration loads the matching `public.profiles` row before publishing an authenticated RallyOn user.
- The profile mapper rejects a missing row or a row whose ID does not match the Auth user ID.
- Mutable profile fields are mapped from `public.profiles`; Auth metadata is not a fallback for null or missing profile values.
- A profile query error or missing row fails closed. It is not converted into a synthetic user.
- Profile edits are persisted through the invoker-rights `save_profile_and_favorite_teams` RPC. The RPC derives ownership from `auth.uid()` and commits profile changes and optional complete favorite-team replacement in one transaction.
- The client does not create missing profiles through an upsert. Bootstrap/schema defects must be repaired through a separately reviewed database change.
- Auth hydration and direct sign-in/sign-up completions use revision/session guards so stale asynchronous results cannot publish an older identity.
- Relational favorite teams are authoritative. A failed relational read is surfaced; legacy JSON is not used as a fallback.

## Field ownership

| Application field | Canonical owner |
| --- | --- |
| `id`, `email`, `emailVerified`, `authProvider`, `createdAt` | Supabase Auth |
| `firstName`, `lastName`, `name`, `username`, `profilePhotoUrl` | `public.profiles` |
| `onboardingCompleted`, `onboardingStep` | `public.profiles` |
| `homeCity`, `homeState`, `homeZip`, `latitude`, `longitude` | `public.profiles` |
| `favoriteSports`, `favoriteLeagues`, `preferredExperience`, `currentIntent`, `preferences` | `public.profiles` |
| `favoriteTeams` | `public.user_favorite_teams` |
| `privacySettings`, `notificationPreferences`, `savedVenueIds` | `public.profiles` |
| `locationPermissionStatus`, `notificationPermissionStatus` | Device/session permission state |

The legacy `privacy` compatibility field remains in the application type but is not hydrated from Auth metadata. Remove it only in a separately coordinated API/type cleanup.

## Schema and rollout assumptions

The profile table, its signup/bootstrap trigger, grants, and owner-scoped RLS policies are pre-existing infrastructure. The P0-A application change does not create or repair them. The P0-C migration in this combined branch performs a strict preflight and stops if the expected profile/RLS/bootstrap contract is not present.

Before rollout, validate against an isolated local Supabase stack:

1. Confirm `public.profiles.id` is unique and matches `auth.users.id`.
2. Confirm the bootstrap trigger creates exactly one profile row per Auth user.
3. Confirm authenticated SELECT/UPDATE are owner-scoped and UPDATE has both USING and WITH CHECK.
4. Confirm anonymous users cannot read or mutate profiles.
5. Exercise two separate users through Auth and PostgREST APIs, including cross-user read/update/delete attempts.
6. Confirm missing profile rows and profile query failures fail closed.
7. Confirm profile edits persist across sign-out/sign-in and session restoration.

## Production and migration safety

- No production Supabase schema, policy, trigger, or row was changed during this work.
- Do not replay repository migrations against production; production migration history/schema has been independently identified as divergent.
- Do not apply PR #18's original P0-C migration independently. The combined remediation branch replaces that migration with a guarded preflight version and adds the transactional RPC migration.
- If the original P0-C migration has already been applied in any environment, stop and prepare a separately reviewed forward migration; editing a historical migration will not rerun it.
- Do not delete Auth metadata or bulk-copy it over populated profile columns without an explicit, reviewed backfill policy.

## Regression coverage

`tests/profile-source-of-truth.test.mjs` guards canonical mapping, matching profile IDs, missing-row failure, transactional writes, authoritative relational favorites, and stale auth completion guards. It complements—not replaces—the local Supabase Auth/RLS API integration suite in PR #20.
