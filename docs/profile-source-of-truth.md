# P0-A — Canonical Profile Source of Truth

## Decision

For authenticated accounts, `public.profiles` is the sole source of truth for mutable RallyOn profile attributes. Supabase Auth remains authoritative for authentication and identity attributes only:

- Auth user ID
- Email address and email-verification state
- Authentication provider
- Auth account creation timestamp

The browser must not treat `auth.users.raw_user_meta_data` / `user_metadata` as a second profile database. Existing Auth metadata may remain as a signup/bootstrap payload for the existing database provisioning flow, but reads must not fall back to it after profile hydration.

## Audit findings

The previous implementation had two competing sources:

1. `src/services/authService.ts` mapped `user_metadata` directly into the application User model on auth-state changes.
2. `src/services/profileService.ts` preferred `public.profiles` values but fell back to Auth metadata field-by-field. That meant a missing/null profile field could silently resurrect stale metadata.
3. `updateProfile()` updated `public.profiles` only, while the sign-in mapping continued to read Auth metadata, so edits and subsequent hydration could disagree.
4. `AuthContext.updateUser()` is intentionally synchronous for existing UI callers; persistence remains asynchronous in AuthService.

## Implemented behavior

- Auth-state changes now hydrate the user from `public.profiles` before publishing an authenticated user; stale asynchronous auth events are ignored. Switching identities clears the previous account's in-memory profile while the new row loads.
- Profile mapping uses `public.profiles` for name, username, avatar, onboarding state, home location, favorites, experience preferences, match preferences, privacy settings, notification preferences, and saved venue IDs.
- Auth metadata is no longer a fallback for profile fields.
- Email, verification state, provider, and account creation time continue to come from the Auth identity.
- `getUserWithProfile()` requires an actual profile row. A missing row or query/RLS failure rejects hydration; it is never converted into a synthetic default profile from Auth identity or metadata.
- Auth-state hydration failures fail closed (no authenticated profile is published) and are logged for diagnosis.
- Profile writes remain explicit updates. The client does not silently upsert/create missing profile rows; a missing row raises a clear error so bootstrap/schema defects are not hidden.

## Field ownership

| Application field | Canonical owner |
| --- | --- |
| `id`, `email`, `emailVerified`, `authProvider`, `createdAt` | Supabase Auth |
| `firstName`, `lastName`, `name`, `username`, `profilePhotoUrl` | `public.profiles` |
| `onboardingCompleted`, `onboardingStep` | `public.profiles` |
| `homeCity`, `homeState`, `homeZip`, `latitude`, `longitude` | `public.profiles` |
| `favoriteSports`, `favoriteLeagues`, `favoriteTeams`, `preferredExperience`, `currentIntent`, `preferences` | `public.profiles` |
| `privacySettings`, `notificationPreferences`, `savedVenueIds` | `public.profiles` |
| `locationPermissionStatus`, `notificationPermissionStatus` | Device/session permission state; not Auth metadata |

The legacy `privacy` compatibility field is retained in the TypeScript User contract but is no longer hydrated from Auth metadata. It should be removed in a separately coordinated type/API cleanup once all consumers use `privacySettings`.

## Schema assumptions and dependencies

This change uses the existing `profiles` relation and the columns already referenced by the previous profile service: `id`, `username`, `first_name`, `last_name`, `display_name`, `avatar_url`, `onboarding_completed`, `onboarding_step`, `home_city`, `home_state`, `home_zip`, `latitude`, `longitude`, `favorite_sports`, `favorite_leagues`, `favorite_teams`, `preferred_experience`, `current_intent`, `preferences`, `privacy_settings`, `notification_preferences`, `saved_venue_ids`, `created_at`, and `updated_at`.

The repository's prior client code demonstrates these column names, but this PR does not independently validate the live database schema or existing trigger/policy definitions. Before a future migration is approved, verify:

1. Every authenticated user receives exactly one `public.profiles` row.
2. The row is keyed by `id = auth.users.id` with the expected foreign key/uniqueness constraint.
3. The auth-user bootstrap trigger (if used) populates profile fields from signup metadata exactly once.
4. RLS allows a user to select/update only their own row and permits the intended profile bootstrap insert path.
5. Existing duplicate metadata is treated as legacy bootstrap data and is not bulk-copied over populated profile columns without an explicit conflict policy.

## Migration and production safety

- No SQL migration is included.
- No production Supabase API, schema, policy, trigger, or row was changed.
- No data backfill or destructive cleanup was performed.
- Do not delete existing Auth metadata until the profile bootstrap path and historical accounts have been audited and a separately reviewed migration/backfill is prepared.

## Files changed

- `src/services/profileService.ts` — canonical profile mapping and update behavior.
- `src/services/authService.ts` — auth identity hydration and stale-event protection.
- `docs/profile-source-of-truth.md` — decision, field ownership, assumptions, dependencies, and rollout notes.
- `tests/profile-source-of-truth.test.mjs` — regression guards for metadata precedence, missing-row behavior, and auth hydration.\n- `docs/p0-a-disposable-validation.md` — schema inspection SQL and reproducible lifecycle/RLS checks for an isolated Supabase environment.

## Validation

Run locally before merge (these commands have not yet been executed in this hosted GitHub editing session):

```bash
npm test
npm run lint
npm run build
```

Follow [the P0-A disposable validation runbook](p0-a-disposable-validation.md) for exact schema-inspection SQL and repeatable signup, edit, metadata-precedence, session-restoration, partial/missing-row, and RLS checks. Do not run these steps against production.

### Current validation status

The repository-level regression tests added by this PR are source-contract tests; they do not replace runtime integration tests. No disposable Supabase instance is currently provisioned or connected in this work session, so signup trigger behavior, real RLS behavior, and persisted session lifecycle remain unverified. Do not approve or merge until those database checks and CI have completed.
