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

## Next verification work

1. Search owner-controlled local backups, CI artifacts, release bundles and other repositories for the original five files; preserve any exact originals unchanged with provenance.
2. Compare the four complete-looking SQL fragments and the partial token fragment against live catalog definitions and Git history. Do not equate a pasted fragment with a complete original file.
3. Inspect the live `pg_policies` rows for both venue policy families and test cross-venue INSERT/UPDATE/DELETE attempts using disposable users.
4. Inspect the Edge Function's token validation path and confirm whether the token table's verifier is actually used. Do not disclose the verifier.
5. Reconstruct missing historical state only in a clearly labelled, forward-only baseline/repair plan. Do not backdate reconstructed SQL or pretend it is the original migration.
6. Keep production NO-GO until Auth bootstrap, profile ACLs, cron/environment isolation, migration parity and independent review are resolved.

