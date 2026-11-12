# P0-A — Disposable Supabase Validation Runbook

This runbook is for a **local Supabase stack or a newly created disposable project only**. Never run destructive lifecycle steps below against production or a shared development database.

## 1. Preconditions and safety

- Use a local Supabase stack (supabase start) or a disposable project with no real users/data.
- Apply the repository's existing migrations and seed data only after reviewing them.
- Configure RallyOn against that disposable URL and publishable/anon key.
- Do not use a service-role key in the browser.
- Confirm the target project name/ID before running any SQL or signup tests.
- Keep PR #16 and PR #18 unmerged until all checks in this runbook pass.

## 2. Inspect the actual schema before testing

Run these read-only queries in the disposable database SQL editor.

### Profile columns and types

~~~sql
select
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;
~~~

Expected contract used by the app:

- id — UUID, primary/unique key, matching auth.users.id
- username, first_name, last_name, display_name, avatar_url
- onboarding_completed, onboarding_step
- home_city, home_state, home_zip, latitude, longitude
- favorite_sports, favorite_leagues, favorite_teams
- preferred_experience, current_intent, preferences
- privacy_settings, notification_preferences, saved_venue_ids
- created_at, updated_at

The TypeScript client currently assumes JSON-compatible values for preference/settings fields and arrays for list fields. Confirm actual SQL types are compatible; this PR does not create or alter the table.

### Constraints and ownership key

~~~sql
select
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass
order by conname;
~~~

Verify id is unique/primary and references auth.users(id) (or is otherwise guaranteed to be the exact Auth user UUID). There must not be multiple profile rows per user.

### RLS state and policies

~~~sql
select
  c.relrowsecurity,
  c.relforcerowsecurity
from pg_class c
where c.oid = 'public.profiles'::regclass;

select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;
~~~

For browser authenticated operations, verify:

- SELECT permits only auth.uid() = id.
- UPDATE has both an ownership USING predicate and a matching WITH CHECK predicate.
- INSERT is not broadly available to arbitrary authenticated users. If profile creation is performed by an Auth-user trigger, inspect that trigger/function and its privilege model instead.
- Anonymous users cannot read or mutate profile rows.
- The table is exposed to the Data API only as intended; grants and RLS are separate controls.

### Bootstrap triggers and functions

~~~sql
select
  t.tgname,
  pg_get_triggerdef(t.oid, true) as trigger_definition,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and (
    (n.nspname = 'auth' and c.relname = 'users')
    or (n.nspname = 'public' and c.relname = 'profiles')
  )
order by n.nspname, c.relname, t.tgname;
~~~

Confirm whether an AFTER INSERT ON auth.users trigger creates exactly one matching profile row, how it maps signup metadata, and whether failures abort signup. If it uses a SECURITY DEFINER function, inspect its owner, pinned search_path, and EXECUTE grants. Do not add or alter a trigger as part of this PR without a separately reviewed migration.

## 3. Lifecycle checks

Use two disposable test accounts (A and B) and record their Auth UUIDs.

1. **Signup/bootstrap:** sign up A through the RallyOn UI with unique first/last name and username. Query public.profiles by A's Auth UUID. Confirm exactly one row exists and expected signup fields were copied once.
2. **Profile edit:** edit A's name, username, home location, onboarding state, and one preference through the app. Query the row and verify the columns changed. A successful UI optimistic update alone is not evidence of persistence.
3. **Sign-out/sign-in:** sign out, sign in as A, and verify the app and database still show the edited profile.
4. **Stale metadata precedence:** while signed in as A, call Supabase Auth updateUser({ data: { firstName: 'STALE', name: 'STALE METADATA', username: 'stale_metadata' } }) using the disposable client. Do not update public.profiles. Trigger a token refresh or sign out/sign back in. The app must continue showing the newer values from public.profiles.
5. **Session restoration:** reload the app with A's session still valid. Confirm the first authenticated profile published by the app matches the current database row, not signup metadata.
6. **Partial profile:** on the disposable database only, set selected nullable profile columns (for example display_name, home_city, avatar_url) to NULL while leaving stale values in Auth metadata. Reload/sign in. The app should use the documented empty/default presentation for those missing fields, never stale metadata.
7. **Missing profile:** on the disposable database only, delete A's profile row while retaining the Auth user, then force a fresh session hydration. The app must not publish an Auth-metadata-derived or synthetic authenticated profile. It should fail closed and surface/log the bootstrap error. Recreate the row using the verified bootstrap mechanism before continuing.
8. **RLS isolation:** while authenticated as A, attempt to select/update B's profile by B's UUID. No B data may be returned or changed. Verify B can still access their own row. Also verify anon cannot read either row.

Example row-count check:

~~~sql
select id, count(*) as row_count
from public.profiles
group by id
having count(*) <> 1;
~~~

Expected: zero rows. Also compare A/B Auth UUIDs against profile IDs explicitly.

## 4. Migration and production-data assumptions

- PR #16 contains no SQL migration and assumes public.profiles already exists with the columns above.
- Repository code alone does not prove that the deployed database has this schema, trigger, foreign key, grants, or RLS policy set.
- If the profile table/trigger/policies are missing or incorrect, prepare a separate migration after inspecting the actual disposable schema. Do not silently add client-side upsert behavior to compensate.
- Existing users with no profile row need an explicit, reviewed backfill/repair plan before rollout. Never bulk-copy Auth metadata over populated profile columns without a conflict/precedence policy.
- P0-C's user_favorite_teams migration depends on this pre-existing profiles relation and its legacy favorite_teams column for backfill. P0-C's relational favorites are the explicit exception to the P0-A profile-field ownership table.

## 5. Results recorded for this review

- GitHub Actions RallyOn Build Check #116 for PR #16: **passed** on the reviewed branch head (Regression tests, Edge Function types, TypeScript type check, production build).
- Local npm test, npm run lint, and npm run build: **not run**; this hosted editing environment could not clone GitHub (DNS/network unavailable).
- Disposable Supabase lifecycle, schema, trigger, and RLS checks: **not run**; no disposable/local Supabase instance was provisioned or connected during this review.
- Therefore, database readiness remains a blocker. Do not interpret the CI result as database validation.
