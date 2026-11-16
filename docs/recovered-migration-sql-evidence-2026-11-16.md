# Recovered SQL evidence — production migration gaps

**Captured:** 2026-11-16  
**Repository:** `werallyon/rallyon`  
**Branch:** `recovery/production-migration-parity-evidence`  
**Evidence provenance:** SQL text pasted by the project owner in the RallyOn | AI Development HQ conversation. This is owner-supplied recovery evidence, not an independently verified export of the original files or proof of original byte-for-byte provenance.

## Handling and safety

- No SQL in this document has been executed.
- Sensitive credential/verifier literals are intentionally redacted. The original pasted values must not be committed to Git.
- The scheduling SQL contains a production project URL and a bearer JWT. Even though the pasted JWT identifies the anon role, treat credentials carefully; consider rotating exposed credentials if applicable and ensure no secret/service-role credential is used in client or cron source.
- The token SHA-256 verifier is also redacted. Do not expose or casually rotate it; verify how the Edge Function consumes it first.
- The five migration versions were all located in user-provided text, but one is explicitly partial and all require comparison against the live catalog and historical source if found elsewhere.

## Recovery status

| Version | Historical name | Evidence status |
|---|---|---|
| 20261110231015 | create_profiles_and_auth_triggers | SQL text recovered from owner |
| 20261111022535 | venue_game_programming_claimed_owner_rls | SQL text recovered from owner |
| 20261111022546 | 20261110_venue_programming_claimed_operator_policies | SQL text recovered from owner |
| 20261111024400 | schedule_sync_games_daily | SQL text recovered from owner; credential redacted |
| 20261111024425 | add_sync_token_guard | **Partial** SQL text recovered; verifier redacted |

## 20261110231015 — create_profiles_and_auth_triggers

The owner supplied SQL that:
- creates `public.profiles` with an FK to `auth.users(id)`;
- enables RLS and recreates own-row SELECT/INSERT/UPDATE policies;
- creates `set_profiles_updated_at()` and a before-update trigger;
- creates `handle_new_user()`, mapping selected `raw_user_meta_data` fields into a profile with `ON CONFLICT (id) DO NOTHING`;
- installs `on_auth_user_created` on `auth.users`;
- creates `profiles_username_idx`.

**Review points:** The function is SECURITY INVOKER by default; verify the actual GoTrue trigger execution role and INSERT privileges/RLS interaction in a disposable project. Metadata boolean casting can fail for malformed values. User metadata is user-editable and must not be used for authorization. Compare all columns, defaults, policies, function definitions, trigger state and grants to the live catalog before any forward repair.

## 20261111022535 — venue_game_programming_claimed_owner_rls

Owner-supplied SQL defines:
- `venue_game_programming_insert_claimed_owner` (INSERT, WITH CHECK);
- `venue_game_programming_update_claimed_owner` (UPDATE, USING and WITH CHECK);
- `venue_game_programming_delete_claimed_owner` (DELETE, USING).

Each predicate checks that the referenced `public.venues` row has `claimed_by_user_id = (select auth.uid())`, using the fully qualified outer reference `venue_game_programming.venue_id`.

## 20261111022546 — 20261110_venue_programming_claimed_operator_policies

Owner-supplied SQL defines a second set:
- `venue_programming_insert_claimed`;
- `venue_programming_update_claimed`;
- `venue_programming_delete_claimed`.

These also check the related venue's `claimed_by_user_id` against `auth.uid()`. The supplied predicates use the unqualified `venue_id` reference. Confirm name resolution against the actual table schema.

**Important interaction:** PostgreSQL permissive policies are combined with OR. These two policy families appear functionally overlapping. Do not remove either based on names alone; compare live `pg_policies`, role grants, table constraints and intended policy semantics. If both are present and permissive, their combined effect may be broader than expected.

## 20261111024400 — schedule_sync_games_daily

Owner-supplied SQL:
- ensures `pg_cron` and `pg_net` extensions exist in the `extensions` schema;
- unschedules any job named `rallyon-sync-games-hourly`;
- schedules that job at `0 * * * *`;
- posts to the production `sync-games` Edge Function URL with JSON content type, a bearer JWT, and an empty JSON body.

The production URL is preserved as a project-specific reference in the owner's supplied text, but the bearer JWT is redacted here.

**Review points:** Despite the migration's historical name `schedule_sync_games_daily`, the cron expression is hourly. The SQL is environment-specific and unsafe for generic local replay until parameterized/guarded. Check the live cron command and current scheduling migrations before any change. Never replay this migration against a local or test project while it still targets production.

## 20261111024425 — add_sync_token_guard

Owner-supplied partial SQL:
- creates `public.system_sync_tokens(name text primary key, token_sha256 text not null, created_at timestamptz not null default now())`;
- enables RLS;
- upserts the `sync-games` row with a SHA-256 token verifier (literal redacted).

**Status: PARTIAL.** This fragment does not include any function, Edge Function validation, trigger, grants, policies, or other guard logic that may have been part of the original migration. The live catalog previously showed explicit deny policies for anon/authenticated SELECT/INSERT/UPDATE/DELETE, but that does not establish the original migration's complete contents. Search for the Edge Function implementation and any remaining SQL before reconstructing.

## Follow-up: token guard source and live security verification (2026-11-16)

The owner subsequently supplied the full SQL fragment for `20261111024425`. The verifier literal remains intentionally redacted in repository evidence. The recovered fragment is:

```sql
create table if not exists public.system_sync_tokens (
  name text primary key,
  token_sha256 text not null,
  created_at timestamptz not null default now()
);

alter table public.system_sync_tokens enable row level security;

insert into public.system_sync_tokens(name, token_sha256)
values ('sync-games', '[REDACTED SHA-256 VERIFIER]')
on conflict (name) do update set token_sha256 = excluded.token_sha256;
```

This resolves the previously missing SQL *fragment*; it does not prove that this was the complete original migration file. No additional policy/grant SQL was included in the owner-supplied fragment.

### Edge Function validation found

Inspected `supabase/functions/sync-games/index.ts`, `supabase/functions/_shared/sync-utils.js` and `supabase/config.toml` on this branch:

- `sync-games` requires POST and a non-empty `x-rallyon-sync-token` header.
- It hashes the supplied token with Web Crypto SHA-256.
- It queries `system_sync_tokens` for the `sync-games` verifier using the service-role key held server-side.
- It compares the stored and computed hashes with the shared `constantTimeEqual` helper.
- Missing/invalid tokens return 401; lookup/network failures return 503.
- `verify_jwt = false` is configured for this function because the cron caller uses the custom token instead of a user JWT. The custom token check is therefore the effective application-level gate and must remain mandatory.
- The service-role key is only read from Edge Function environment variables in the inspected code; it is not returned to the caller.

**Assessment:** The repository contains an actual token-validation path consuming this table. Therefore the earlier uncertainty about whether the verifier is used is resolved for the inspected branch. This is a source review, not a live end-to-end request test and not proof that the deployed Edge Function matches this commit.

### Live production catalog check (read-only)

- RLS is enabled on `public.system_sync_tokens`.
- Four explicit RLS policies deny anon/authenticated SELECT, INSERT, UPDATE and DELETE.
- However, the live table ACL also grants all seven table privileges (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) to both `anon` and `authenticated`. The deny policies currently prevent row access through ordinary RLS-governed operations, but broad table grants are unnecessary exposure and make the security posture more fragile if a policy is changed or bypassed.
- Recommended hardening: revoke all table privileges from `anon` and `authenticated`, retain required server-side access for the Edge Function's service-role credential, then verify effective privileges and that the Edge Function can still read the verifier. This has **not** been applied to production.

### Operational/security caveats

- The SQL's upsert overwrites the existing verifier on every replay. Do not replay it casually.
- Because the verifier was pasted into chat, rotate the underlying sync token and update the stored hash plus every cron/secret caller in a coordinated change if the token is still active. Do not paste the raw token into GitHub or chat.
- At the time of the initial source/catalog review, deployment alignment and live request behavior were not yet established. The later production verification and remediation are recorded in the following section.
- The initial recovery investigation made no production writes; subsequent owner-approved production actions are documented separately below.

## Production remediation executed and verified (2026-11-16)

Following explicit owner approval in the project conversation, the following changes and tests were completed against RallyOn production Supabase project `nqdrfwvxomecduxmmzrc`. No raw token or verifier value is recorded here.

### 1. Client table grants

- Applied the grant-hardening migration `20261116225246_harden_system_sync_tokens_client_grants`.
- Re-applied the idempotent `REVOKE ALL PRIVILEGES ON TABLE public.system_sync_tokens FROM anon, authenticated` as part of the follow-up token-rotation migration `20261116225811_sync_games_token_acl_and_rotation_20261116`.
- Verified live ACL: only `postgres` and `service_role` retain table privileges. `has_table_privilege` returns false for anon/authenticated SELECT and INSERT; service_role SELECT remains true.
- RLS remains enabled and the four explicit deny policies for anon/authenticated remain present.

### 2. Token rotation

- Generated a new 256-bit random token inside the database session.
- Updated the existing Vault secret `rallyon_sync_games_token` and the `sync-games` SHA-256 verifier within the same database transaction.
- The token was never returned to chat or committed to Git.
- Both cron jobs continue to read the Vault secret by its unchanged name, so no cron command or schedule change was required.
- The rotation transaction is recorded in the hosted migration ledger as `20261116225811_sync_games_token_acl_and_rotation_20261116`. It is an environment-specific secret rotation and must not be replayed into local/test environments or used as a generic reset migration.

### 3. Deployed Edge Function and authentication tests

- Production `sync-games` is ACTIVE, version 8, with `verify_jwt=false`.
- Inspected the deployed source: it requires POST plus `x-rallyon-sync-token`, computes SHA-256, retrieves the stored verifier using the server-side service-role credential, and compares using the constant-time helper. This matches the authentication design in the reviewed repository source and the `supabase/config.toml` setting.
- Negative test: a deliberately invalid token returned HTTP 401 `Unauthorized`.
- Valid-token gate test: the rotated Vault token with an intentionally invalid sync-window returned HTTP 400 `Invalid sync window`, proving authentication succeeded before request validation.
- Positive end-to-end sync test: the rotated Vault token with the `today` window returned HTTP 200, `complete=true`, `failed=false`, synced 17 events, and returned no diagnostics. This test performed the intended idempotent game upsert.
- No Edge Function redeployment was necessary because the active deployed version already contained the expected guard.

### 4. Cron continuity and platform checks

- Both active cron jobs still reference `rallyon_sync_games_token` from `vault.decrypted_secrets`:
  - `rallyon-sync-games-hourly` — `0 * * * *`, `today` window.
  - `rallyon-sync-games-upcoming-daily` — `15 * * * *`, gated to midnight America/Chicago, `upcoming` window.
- Recent runs for both jobs reported `succeeded`.
- Supabase security advisors returned zero lints after remediation.

**Result:** All four requested sync-token hardening tasks are complete and verified: client grants, coordinated secret rotation, valid/invalid authentication tests, and deployed function/config verification.

**Remaining production readiness caveat:** This work closes the sync-token security items only. It does not resolve the separate RallyOn production NO-GO items concerning Auth profile bootstrap, profile ACLs/triggers, venue policy overlap, or full migration parity. Do not describe the whole product as production-ready until those independent gates and independent review are closed.

## Follow-up production readiness audit — Auth bootstrap and venue RLS (2026-11-16)

Read-only catalog inspection after sync-token remediation found the following remaining items:

### P0 — Profile bootstrap needs a repair and a real signup test

- `public.profiles` has RLS enabled and the three expected owner-scoped policies (SELECT, INSERT, UPDATE).
- The live table ACL grants all seven table privileges to both `anon` and `authenticated`. RLS currently limits rows, but these grants are broader than required. There is no DELETE policy.
- `supabase_auth_admin` has neither effective INSERT nor SELECT privilege on `public.profiles`, and does not BYPASSRLS.
- The live `public.handle_new_user()` trigger function is SECURITY INVOKER, has `search_path=public`, and inserts into `public.profiles`. The `on_auth_user_created` trigger invokes it after inserts to `auth.users`.
- The function casts the user-editable `raw_user_meta_data.onboardingCompleted` text directly to boolean; malformed metadata can throw and fail signup.
- Two BEFORE UPDATE triggers (`profiles_set_updated_at` and `profiles_updated_at`) invoke the same timestamp function; one is redundant.
- The production Auth user count and profile row count were both zero at inspection. Therefore there is no existing user data to validate against and no successful signup has been demonstrated.

**Assessment:** Profile creation on signup is not proven and is likely to fail under the observed invoker role/privilege/RLS combination. Before production readiness, implement a narrowly scoped internal Auth-trigger insert path (prefer an explicit RLS policy and INSERT grant for `supabase_auth_admin` over broadly granting client roles), narrow client ACLs to the operations the app needs, make metadata parsing tolerant of malformed values, remove the duplicate timestamp trigger, and run a disposable Auth signup/rollback test.

### Venue programming RLS

- The live `venue_game_programming` table has one public SELECT policy and one claimed-owner policy each for INSERT, UPDATE and DELETE.
- Only the `venue_programming_*_claimed` policy family is currently present. The second owner-supplied `*_claimed_owner` family is not present in the live catalog, so the suspected permissive-policy OR overlap is not currently active.
- Table-level grants to anon/authenticated remain broad; RLS is the effective write boundary. Review and narrow ACLs in a separate migration after confirming all intended client operations.

**Production gate:** The sync-token work is complete, but production readiness remains blocked on Auth profile bootstrap and a real signup test, plus independent review of the remaining application/security PRs and migration parity. No profile, Auth, or venue production changes were made during this read-only follow-up audit.

## Production Auth/profile remediation — 2026-11-16

Following explicit owner approval, production migrations were applied:

- `20261116230420_fix_profiles_auth_bootstrap_and_acl`
  - Grants `supabase_auth_admin` schema usage and INSERT on `public.profiles`.
  - Adds an INSERT-only RLS policy for `supabase_auth_admin`; the trigger remains SECURITY INVOKER (no RLS bypass).
  - Revokes all profile table privileges from PUBLIC and anon; narrows authenticated to SELECT/INSERT/UPDATE.
  - Removes duplicate `profiles_updated_at`, retaining `profiles_set_updated_at`.
  - Makes `onboardingCompleted` parsing tolerant of malformed user-editable metadata.
- `20261116230732_grant_profiles_auth_admin_conflict_key_select`
  - Grants only column-level SELECT on `profiles.id` to `supabase_auth_admin` for the INSERT conflict key; it does not grant profile-row content access.

### Verification and remaining signup check

- Live ACL verification: Auth admin has INSERT and SELECT(id), but not table-level SELECT. anon has no profile SELECT. authenticated retains SELECT/INSERT/UPDATE. 
- Live RLS catalog verification: `profiles_insert_auth_admin` is scoped only to `supabase_auth_admin`; authenticated owner-scoped SELECT/INSERT/UPDATE policies remain.
- Only one profile timestamp trigger remains.
- Security advisors return zero lints.
- A transaction-scoped database trigger smoke test inserted a synthetic auth.users row with malformed onboarding metadata, verified the resulting profile defaults (`onboarding_completed=false`, `onboarding_step='welcome'`), and rolled the transaction back. This verified trigger SQL behavior but ran as the SQL migration connection, not as the Auth service role.
- A real GoTrue signup request made after the first migration failed with SQLSTATE 42501 (permission denied on profiles). The logs identified the Auth DB role as `supabase_auth_admin`. This exposed the need for the column-level conflict-key SELECT grant added in the second migration.
- A successful GoTrue signup has **not yet been confirmed after the second migration**. Do not mark the Auth signup gate fully passed until one succeeds and its profile row is verified. No test account was left behind.

## Next verification work

1. Search owner-controlled local backups, CI artifacts, release bundles and other repositories for the original five files; preserve any exact originals unchanged with provenance.
2. Compare the four complete-looking SQL fragments and the partial token fragment against live catalog definitions and Git history. Do not equate a pasted fragment with a complete original file.
3. Inspect the live `pg_policies` rows for both venue policy families and test cross-venue INSERT/UPDATE/DELETE attempts using disposable users.
4. Inspect the Edge Function's token validation path and confirm whether the token table's verifier is actually used. Do not disclose the verifier.
5. Reconstruct missing historical state only in a clearly labelled, forward-only baseline/repair plan. Do not backdate reconstructed SQL or pretend it is the original migration.
6. Keep production NO-GO until Auth bootstrap, profile ACLs, cron/environment isolation, migration parity and independent review are resolved.

