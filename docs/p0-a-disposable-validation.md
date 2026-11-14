# P0-A — Disposable Supabase Validation Runbook

This runbook is for a **local Supabase stack only** for the current automated validation task. Never run destructive lifecycle steps against production or a shared development database.

## Preconditions

- Start the isolated local stack through the repository's Supabase CLI workflow.
- Use only synthetic test accounts and local Auth/PostgREST endpoints.
- Use the anon/publishable key for user-facing API tests. A service-role key may be used only at runtime for test cleanup inside the isolated CI job.
- Verify the API URL resolves to loopback before running any test.
- Never provide hosted project credentials, production credentials, or real user data to this suite.

## Profile schema and security inspection

Run these read-only queries against the local database after migrations are applied.

### Columns and types

```sql
select ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;
```

Verify the expected profile columns and types match the app contract. In particular, `id` must uniquely identify the matching Auth user.

### Constraints and RLS

```sql
select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass
order by conname;

select c.relrowsecurity, c.relforcerowsecurity
from pg_class c
where c.oid = 'public.profiles'::regclass;

select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;
```

Verify authenticated SELECT and UPDATE are owner-scoped to `auth.uid() = id`, UPDATE has both USING and WITH CHECK, anonymous users cannot access profile rows, and bootstrap INSERT is not broadly available to authenticated users.

### Bootstrap trigger

```sql
select t.tgname, pg_get_triggerdef(t.oid, true) as trigger_definition,
       p.proname as function_name, pg_get_functiondef(p.oid) as function_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal and nspname = 'auth' and c.relname = 'users';
```

Confirm the Auth-user bootstrap creates one matching profile row and inspect the function owner, SECURITY DEFINER setting, pinned search_path, and EXECUTE grants.

## Lifecycle and API assertions

The PR #20 local Auth/RLS integration suite should verify with two synthetic users A and B:

1. Signup/bootstrap creates one profile row whose ID matches the Auth UUID.
2. A can read and update A's profile; B cannot read, update, or delete A's profile.
3. Anonymous requests cannot read or mutate profile rows.
4. Profile changes survive sign-out/sign-in and session restoration.
5. Stale Auth metadata never overrides canonical profile values.
6. A missing profile row or failed profile read does not publish a synthetic authenticated user.
7. A can manage A's relational favorites; B cannot read or modify A's favorites.
8. A successful empty favorites response is authoritative `[]`; a failed favorites read is an error, not a legacy fallback.
9. A combined profile/favorites RPC failure rolls back both changes.
10. Cleanup removes only synthetic users created by the local test.

Do not interpret source-contract tests or a successful frontend build as evidence of real RLS/API isolation. The CI local-stack job is the evidence for the Auth/PostgREST checks.

## Migration ordering

The current combined remediation branch uses forward-only root migration versions `20261114150000` (relational favorites) and `20261114151000` (transactional profile/favorites RPC), both newer than the inspected production ledger maximum `20261112152519`. The earlier proposed versions `20261112120000` and `20261112140000` were not recorded in the inspected production ledger and have been removed from the branch. Do not apply PR #18's original migration independently or revive the old versions. Check every target environment's migration ledger and actual schema before rollout.

## Production safety

No production or hosted Supabase project should be used by this runbook. The repo's migration history and production database history have previously been found to diverge; do not replay the repository migration chain against production.
