# Supabase production / repository migration parity audit

**Inspection date:** 2026-11-14  
**Project:** `nqdrfwvxomecduxmmzrc`  
**Scope:** Read-only production migration ledger, catalog, ACL, Auth bootstrap, sports schema, and Cron/HTTP-response inspection.  
**Safety:** No production SQL writes, migrations, DDL, DML, Cron changes, Edge Function deployments, or Vault changes were performed.

## Executive decision

**Production rollout remains NO-GO.** The proposed P0-B/P0-C/P0-A changes now have passing isolated CI, and read-only production preflight checks match their intended starting schema. However, the hosted migration ledger does not have a one-to-one source match with the current repository. Five historical migration SQL files are absent from every inspected repository branch/tree, and several candidate files have version mismatches.

Do not run a broad `supabase db push`, root `supabase db reset`, migration repair, or production migration until the historical SQL provenance and complete forward-only plan are resolved.

## Hosted migration ledger

Production currently reports these 10 entries:

| Hosted version | Hosted name | Repository source status |
|---|---|---|
| `20261110231015` | `create_profiles_and_auth_triggers` | Missing |
| `20261110232218` | `create_rallyon_core_data_model` | Similar root file exists as `20261110_create_rallyon_core_data_model.sql`; version differs |
| `20261111022535` | `venue_game_programming_claimed_owner_rls` | Missing |
| `20261111022546` | `20261110_venue_programming_claimed_operator_policies` | Missing |
| `20261111024400` | `schedule_sync_games_daily` | Missing |
| `20261111024425` | `add_sync_token_guard` | Missing |
| `20261111040641` | `rallyon_production_hardening_v1` | Similar root file exists as `20261111_rallyon_production_hardening_v1.sql`; version differs |
| `20261111043646` | `rallyon_sync_games_schedule_v2` | Exact root filename/version correspondence |
| `20261111043827` | `rallyon_sync_games_schedule_v3` | Root file is `20261111043830_rallyon_sync_games_schedule_v3.sql`; version differs |
| `20261112152519` | `expand_sports_event_model` | Similar root file exists as `20261111090000_expand_sports_event_model.sql`; version differs |

The current root migration directory also contained an unrecorded `20261111050000_rallyon_sync_games_schedule_timeout_v4.sql`. PR #28 replaces that pending out-of-order filename with `20261114170000_rallyon_sync_games_schedule_timeout_v4.sql`, which sorts after the hosted maximum. This is not yet applied to production.

The five missing SQL files were not found in the current main tree, merged PR #6 tree, backup PR #6 branch, or the other inspected development branches. The Supabase migration ledger stores version/name metadata, not the original SQL body. Exact checksums and source cannot be recovered from the ledger alone. Obtain those SQL files from an authoritative backup, deployment artifact, or operator-controlled source; do not invent replacements or mark history applied.

## Proposed forward-only migration order

After the historical source gap is resolved and all reviewers approve, the currently proposed new migrations sort after the hosted maximum:

1. PR #17 P0-B canonical sports schema: `20261113120000_p0b_canonical_sports_leagues_teams.sql`
2. PR #22 P0-C relational favorites: `20261114150000_p0c_relational_favorite_teams.sql`
3. PR #22 transactional profile/favorites RPC: `20261114151000_p0_auth_rls_review_remediation.sql`
4. PR #28 Cron timeout hardening: `20261114170000_rallyon_sync_games_schedule_timeout_v4.sql`

P0-C must precede its transactional RPC migration. P0-B is independent of those profile migrations. The schedule migration is independent but must preserve the current Chicago-local daily guard.

This proposed sequence fixes the out-of-order timestamps for these new changes only. It does **not** solve the four missing historical SQL sources or other hosted/root version mismatches.

## Production P0-A / P0-C facts

Read-only catalog and data-count checks found:

- `public.profiles` exists, RLS is enabled, the UUID primary key and Auth foreign key are present, and the profile column contract matches all 23 required fields.
- `favorite_teams` is JSONB, NOT NULL, default `[]`; all observed roots are arrays and all entries have non-empty string IDs and names.
- `public.user_favorite_teams` and the transactional RPC are absent.
- `auth.users` and `public.profiles` both had zero rows at inspection time.
- The enabled `auth.on_auth_user_created` AFTER INSERT row trigger invokes `public.handle_new_user()`.
- The current function body is an exact normalized match for the legacy implementation recognized by the P0-C migration, but it is SECURITY INVOKER with `search_path=public`.
- `supabase_auth_admin` is neither superuser nor BYPASSRLS and has neither INSERT nor SELECT privilege on `public.profiles`. The existence of the trigger therefore does not prove Auth signup can bootstrap a profile; this is a serious signup-path failure risk.
- `anon` currently has SELECT/INSERT/UPDATE/DELETE table privileges on `public.profiles`. No explicit anon/PUBLIC column grants or PUBLIC table grants were found.
- Authenticated retains the SELECT/INSERT/UPDATE privileges required by the proposed RPC and current profile RLS policies have no permissive predicate outliers.

The P0-C migration is designed to recognize the exact observed legacy trigger body, change the function to SECURITY DEFINER with pinned `pg_catalog, public, pg_temp`, revoke direct API EXECUTE, and remove anon/PUBLIC profile-table privileges after checking column ACLs. The local disposable suite now reproduces the production legacy grants and trigger.

## Production P0-B facts

- None of the six target canonical/provider relations currently exists: `sports`, `leagues`, `teams`, and the three provider-ID mapping tables.
- None of `games.league_id`, `games.home_team_id`, or `games.away_team_id` exists.
- `public.games` currently contains 421 rows; the legacy `participants`, `home_team`, and `away_team` payload columns remain.
- None of the proposed canonical game FK/check constraints already exists.

This matches the P0-B migration's empty-target / nullable-additive preflight shape. It is a catalog observation, not an execution test or deployment approval.

## Live sports-sync Cron and HTTP facts

Read-only inspection found:

- `rallyon-sync-games-hourly`: `0 * * * *`, sending the `today` window.
- `rallyon-sync-games-upcoming-daily`: `15 * * * *` with a SQL guard that sends the `upcoming` request only when the current `America/Chicago` hour is zero. The guard runs hourly; the HTTP request is intended for 00:15 Chicago time.
- The Vault secret name `rallyon_sync_games_token` is present. No secret value was selected or exposed.
- The latest recorded `net._http_response` at 2026-11-14 16:00 UTC timed out after the pg_net default 5,000 ms with no HTTP status. The four preceding hourly requests returned HTTP 200.

The pending PR #28 migration raises both request timeouts to 120,000 ms while preserving the current Chicago-local daily guard. A fixed `15 0 * * *` UTC schedule is not equivalent and shifts the request to early evening Chicago time during standard time.

## Local replay safety

The root v2/v3 scheduling migrations contain the production Edge Function URL. The proposed v4 migration also targets the production function URL. A root local migration replay can therefore enqueue HTTP requests toward production even when the database itself is local.

Use the isolated `validation/` Supabase workdir for Auth/RLS migration tests. Do not run root `supabase db reset` locally until scheduling migrations have an explicitly reviewed environment-safe strategy. Never copy production Vault secrets into local fixtures.

## Validation evidence

- PR #17 Build Check #338 passed the canonical sports migration replay and positive/negative SQL verification on an isolated local Supabase stack.
- PR #20 Build Check #347 passed the local Auth/PostgREST/RLS API integration suite after staging the exact PR #22 P0-C and RPC migration SQL byte-for-byte; the fixture reproduced the production legacy trigger and anon profile grants.
- PR #22 Build Check #361 passed the exact root migration staging, local Supabase reset, profile/favorite/RLS/RPC verification, real Auth/PostgREST lifecycle tests, negative preflight cases, clean positive reset, and stack shutdown.
- PR #28 Build Check #368 passed the actual forward-only Cron timeout migration inside an uncommitted transaction on an isolated local Supabase stack; both job schedules, 120-second timeouts, request windows, and the Chicago-local guard were verified, then the transaction was rolled back and no Cron job rows remained.

CI proves the tested local fixture contract. It does not establish missing migration source provenance or authorize production rollout.

## Required next steps

1. Recover the four missing historical SQL files from an authoritative source and compare all hosted candidate migrations to repository SQL.
2. Inspect production schema, functions, policies, grants, cron jobs, and data against the full historical source set; preserve the current migration ledger.
3. Rehearse the complete forward-only plan against a schema-faithful disposable clone with synthetic data.
4. Obtain fresh independent reviews against the current heads of PRs #17, #19, #20, #22, and #28.
5. Only after approval, plan a controlled deployment with a verified recovery point, then run post-deployment Auth signup/profile-bootstrap, RLS, RPC, Cron, and data-integrity smoke tests.

## Safety boundary

- No production SQL writes, migrations, DDL, DML, Cron changes, Vault changes, or Edge Function deployments were performed.
- No production rows or secrets were copied into local fixtures.
- All five relevant PRs remain open and unmerged.
- Production rollout remains **NO-GO** until historical migration provenance and independent reviews are resolved.
