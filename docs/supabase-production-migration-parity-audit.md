# Supabase Production / Repository Migration Parity Audit

**Date:** 2026-11-12  
**Scope:** Read-only inspection of RallyOn production Supabase project `nqdrfwvxomecduxmmzrc` and the repository `main` branch.  
**Safety:** No SQL writes, migration applications, data mutations, or production configuration changes were performed. No production row contents or secrets were exported.

## Executive finding

A clean local migration replay is not currently safe or reproducible. The production migration ledger and the checked-in migration directory do not have a one-to-one version match. In addition, the checked-in sports-sync scheduling migrations contain a hard-coded production Edge Function URL.

Do not run `supabase db reset` or replay the current migration directory until the ledger is reconciled and the production-bound scheduling behavior is isolated.

## Migration ledger comparison

Production Supabase reports these ten migration entries:

| Production version | Production name | Repository match |
|---|---|---|
| `20261110231015` | `create_profiles_and_auth_triggers` | Missing |
| `20261110232218` | `create_rallyon_core_data_model` | Similar core-model file exists as `20261110_create_rallyon_core_data_model.sql`, but its migration version does not match |
| `20261111022535` | `venue_game_programming_claimed_owner_rls` | Missing |
| `20261111022546` | `20261110_venue_programming_claimed_operator_policies` | Missing |
| `20261111024400` | `schedule_sync_games_daily` | Missing |
| `20261111024425` | `add_sync_token_guard` | Missing |
| `20261111040641` | `rallyon_production_hardening_v1` | Similar file exists as `20261111_rallyon_production_hardening_v1.sql`, but its migration version does not match |
| `20261111043646` | `rallyon_sync_games_schedule_v2` | Exact version/file match |
| `20261111043827` | `rallyon_sync_games_schedule_v3` | Repository file is `20261111043830_rallyon_sync_games_schedule_v3.sql` (version differs) |
| `20261112152519` | `expand_sports_event_model` | Similar file exists as `20261111090000_expand_sports_event_model.sql`, but its migration version does not match |

The repository also contains `20261111050000_rallyon_sync_games_schedule_timeout_v4.sql`, but production's migration ledger has no corresponding v4 entry. The README says v4 was applied to production; the live migration ledger does not confirm that statement. This must be resolved before treating the README as authoritative.

## Production schema facts relevant to P0-A / P0-C

- `public.profiles` exists, has RLS enabled, and has a UUID primary key referencing `auth.users(id)`.
- `favorite_teams` is JSONB with default `[]`, satisfying the legacy-column type prerequisite for PR #18.
- `public.user_favorite_teams` is not present in production, consistent with PR #18 remaining unmerged.
- `public.profiles` currently reports zero rows. No production profile rows were read.
- The Auth trigger `on_auth_user_created` exists on `auth.users` and calls `public.handle_new_user()`.
- `public.handle_new_user()` is not SECURITY DEFINER, is owned by `postgres`, and sets `search_path = public`.
- `supabase_auth_admin` has neither INSERT privilege on `public.profiles` nor BYPASSRLS. The profile insert policy is limited to the `authenticated` role and `auth.uid() = id`.
- This combination is a significant signup-bootstrap risk. It does not by itself prove the Auth execution path fails, but the trigger's existence cannot be treated as proof of successful profile creation. Verify with disposable Auth signup before P0-A can pass.
- Two profile UPDATE triggers, `profiles_set_updated_at` and `profiles_updated_at`, invoke the same `set_profiles_updated_at()` function. This is redundant and should be reviewed separately; do not remove either trigger as part of this validation setup.

## Live sports-sync cron facts

Read-only inspection of `cron.job` found two active jobs:

- `rallyon-sync-games-hourly`: schedule `0 * * * *`; calls the production `sync-games` URL with the `today` window.
- `rallyon-sync-games-upcoming-daily`: schedule `15 * * * *`; the SQL command conditionally calls the production URL only when the current Chicago-local hour is zero.

This live job definition does not match the README's documented daily schedule `15 0 * * *`, nor the checked-in v4 migration's daily schedule. It appears to implement a quarter-hourly conditional gate instead. Do not alter the live cron job during this validation work. The discrepancy requires a separate operational review.

The current live job commands reference the Vault secret by name; no decrypted secret value was selected or exposed.

## Local replay safety blocker

The checked-in scheduling migrations v2, v3, and v4 call:

`https://nqdrfwvxomecduxmmzrc.supabase.co/functions/v1/sync-games`

A fresh local replay could therefore schedule requests against the production Edge Function. Do not replay these migrations in a local stack until they are changed to be environment-safe or the local validation workflow explicitly excludes their execution through a reviewed, reproducible mechanism.

The scheduling migrations also manage a Vault-backed token. Never rotate or print the production token during validation.

## Required reconciliation work

1. Obtain and preserve the exact SQL source for production-only migration entries from a trusted source, or reconstruct a schema-only baseline from catalog metadata with explicit review.
2. Resolve the version/name mismatches for the core model, production hardening, v3 scheduling, and sports-event expansion migrations. Do not rename applied migration files casually; Supabase tracks migration versions, not just descriptive names.
3. Determine whether the v4 timeout migration was applied outside the recorded migration ledger or whether the README is inaccurate. Reconcile the live cron job command/schedule with README and migration source without modifying production in this task.
4. Prepare a safe local migration path that cannot call the production URL, rotate production secrets, or write production data.
5. Review the Auth bootstrap function's privilege model and add a disposable signup test. Any correction should be a separately reviewed migration; do not modify production as part of this audit.
6. Once parity and replay safety are established, run local reset against the local stack only, then execute the P0-A and P0-C integration runbooks using synthetic accounts.

## Guardrails retained

- No production Supabase writes or migrations.
- No production data copied into local fixtures.
- PR #16 and PR #18 remain open, draft, and unmerged.
- No changes to production cron jobs, Vault secrets, Edge Function deployment, or Auth triggers.
