# RallyOn production migration recovery findings

**Inspection date:** 2026-11-16  
**Production project:** nqdrfwvxomecduxmmzrc (us-east-2, PostgreSQL 17)  
**Repository base:** main at d2601b1c656bb6fa286b8341d0acd5dfbd89dae8  
**Scope:** Read-only production catalog and migration-ledger inspection; GitHub branch, commit, and PR-history search.  
**Safety:** No production SQL writes, DDL/DML, migration applications/repairs, cron changes, Vault changes, Auth changes, or Edge Function deployments were performed.

## Executive result

The production migration ledger was re-read directly on 2026-11-16 and still contains ten entries. Five historical migration SQL files remain absent from the checked-in migration directory and were not found by exact-name repository code search or the inspected GitHub commit history. The GitHub history search does not prove that the SQL never existed locally, in another repository, in an unindexed artifact, or under another filename.

**Do not fabricate these five files and label them as originals.** The live catalog can support a clearly marked reconstruction, but it cannot recover the exact original SQL text, ordering of statements, comments, transient objects, or any side effects that no longer exist.

## 1. Production migration ledger

Direct live list_migrations result:

| Version | Name | Recovery status |
|---|---|---|
| 20261110231015 | create_profiles_and_auth_triggers | Missing source |
| 20261110232218 | create_rallyon_core_data_model | Candidate file exists under a different version prefix |
| 20261111022535 | venue_game_programming_claimed_owner_rls | Missing source |
| 20261111022546 | 20261110_venue_programming_claimed_operator_policies | Missing source |
| 20261111024400 | schedule_sync_games_daily | Missing source |
| 20261111024425 | add_sync_token_guard | Missing source |
| 20261111040641 | rallyon_production_hardening_v1 | Candidate file exists under a different version prefix |
| 20261111043646 | rallyon_sync_games_schedule_v2 | Exact version/file match |
| 20261111043827 | rallyon_sync_games_schedule_v3 | Candidate file uses version 20261111043830 |
| 20261112152519 | expand_sports_event_model | Candidate file exists under a different version prefix |

The repository also contains 20261111050000_rallyon_sync_games_schedule_timeout_v4.sql, but the production ledger has no matching v4 entry. More importantly, the live cron command text does not include the v4 migration's timeout_milliseconds := 120000 argument. The v4 timeout migration is therefore not reflected in the currently installed job definitions, regardless of any README/PR claim. The database-level statement_timeout setting is separate and is not a substitute for pg_net's per-request timeout.

## 2. Recovery search performed

- Re-read the production migration ledger using the connected RallyOn Supabase account.
- Rechecked the current production schema and catalog definitions for public RLS policies, functions, triggers, constraints, and cron jobs.
- Searched GitHub code for exact names including create_profiles_and_auth_triggers and venue_game_programming_claimed_owner_rls; no results.
- Searched repository commits for profile/auth-trigger source; no matching commits returned.
- Inspected available repository branches, including main, migration-parity audit, backup, and feature/fix branches previously inventoried. No copies of the five named files were present in the checked-in migration trees.
- Inspected PR #6's changed-file list. It includes the tracked v2/v3/v4 scheduling files and production-hardening file, but none of the five missing historical files.
- Inspected PR #22/#23 migration/readiness descriptions. They document the production ledger and bootstrap/grant risks, but do not contain the missing original migration SQL.

This evidence supports “not found in the inspected GitHub repository history”, not the stronger claim that the files never existed.

## 3. Current production catalog facts

### Auth/profile bootstrap

- public.profiles exists with RLS enabled, UUID primary key and FK to auth.users(id); the table currently reports zero rows.
- The auth.users trigger on_auth_user_created exists and calls public.handle_new_user().
- The current function inserts profile values from new.raw_user_meta_data, uses ON CONFLICT (id) DO NOTHING, and is **SECURITY INVOKER**, not SECURITY DEFINER. Its configured search path is public.
- supabase_auth_admin has neither BYPASSRLS nor an effective INSERT grant on public.profiles in the inspected role/ACL state. The profile INSERT policy applies only to authenticated and requires auth.uid() = id.
- This is a serious signup-bootstrap risk. The trigger's existence does not prove that a real GoTrue signup succeeds in creating a profile. A disposable Auth API signup test is required.
- Two redundant UPDATE triggers, profiles_set_updated_at and profiles_updated_at, both call set_profiles_updated_at().

### Important ACL finding — update to prior audit

The live information_schema.role_table_grants query reports **all seven table privileges** (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) on public.profiles for anon, and the same seven for authenticated. This is broader than least privilege and conflicts with the desired profile privacy model. RLS policies still constrain row access, but table privileges should not be treated as harmless: anon has the table-level capability to attempt operations, and the lack of an anon RLS policy is not a substitute for revoking unnecessary grants.

A separately scoped inspection of explicit grants should distinguish table ACLs, column ACLs, inherited PUBLIC privileges, and default privileges before preparing a remediation. Do not apply a production grant change as part of this recovery task.

### RLS policy facts

- profiles_select_own: authenticated SELECT where auth.uid() = id.
- profiles_insert_own: authenticated INSERT with check auth.uid() = id.
- profiles_update_own: authenticated UPDATE with both ownership USING and WITH CHECK.
- Venue programming has public SELECT plus claimed-owner INSERT/UPDATE/DELETE policies that check the related venue's claimed_by_user_id against auth.uid().
- system_sync_tokens has explicit deny policies for anon/authenticated SELECT/INSERT/UPDATE/DELETE.
- Other public-read and owner-scoped venue policies were inventoried directly from pg_policies; preserve their exact predicates when reconstructing historical SQL.

### Sports-sync cron facts

Two active jobs are present:

- rallyon-sync-games-hourly, schedule 0 * * * *, sends the today window.
- rallyon-sync-games-upcoming-daily, schedule 15 * * * *, has an explicit America/Chicago hour-zero conditional gate before sending the upcoming window.

Both commands call the production sync-games Edge Function URL and read the named Vault secret at execution time. No secret value was selected or exposed. Do not execute these commands in a local replay or change production schedules during parity recovery.

## 4. Version drift and local replay blockers

The following recorded production entries have candidate checked-in SQL files with different version prefixes: core model, production hardening, v3 schedule, and sports-event expansion. Supabase migration history is version-based; renaming a file does not rewrite hosted history. Do not casually rename files or mark migrations repaired.

The repository's scheduling SQL has historically contained a hard-coded production Edge Function URL. A clean local reset/replay could therefore create production-bound scheduled work. Until every relevant migration is made environment-safe and reviewed, do not run root supabase db reset, broad db push, or replay the root migration directory.

The separate hosted RallyOn-Validation project currently has only two recorded migrations (20261112184923 and 20261112184934). It is not a faithful clone of production history and cannot be used to infer the missing production SQL.

## 5. Required recovery plan

1. Continue searching any owner-controlled local backups, CI artifacts, release bundles, other repositories, and unindexed branches for the five original SQL files. Preserve any recovered bytes unchanged and record provenance.
2. If no authoritative originals are found, create a **new, explicitly labelled reconstructed baseline** from reviewed catalog definitions. Do not backdate it or pretend it is the original migration.
3. For each reconstruction, capture exact tables/columns/defaults/constraints/indexes, RLS enablement and policies, functions and ownership/security/search_path, triggers, grants, extensions, cron definitions, and Vault references. Distinguish current state from historical intent and non-recoverable side effects.
4. Resolve the four version-prefix mismatches without rewriting hosted history; define a clean forward-only migration sequence and a documented baseline strategy.
5. Make the local validation path incapable of calling production URLs, using production secrets, or changing production data.
6. Correct and test the Auth bootstrap/grant model in disposable Supabase, including real GoTrue signup and negative anon/authenticated access tests.
7. Only after source provenance, migration parity, local replay, and independent review pass should production rollout be reconsidered.

## 6. Deployment gate

**Production remains NO-GO.** No production migration, schema repair, cron adjustment, Vault change, Auth bootstrap change, or PR merge is authorized by this recovery report. Passing CI is not a substitute for independent review or explicit deployment approval.
