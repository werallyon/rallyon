# RallyOn isolated Supabase validation

This is a **separate Supabase CLI project** for P0-A / P0-C validation. It intentionally does not replay the production migration directory at `/supabase/migrations`.

## Safety boundary

- Local Docker-backed Supabase only. Do not point these commands at production or the hosted `RallyOn-Validation` project.
- The hosted `RallyOn-Validation` project is a separate manual integration target; its existing synthetic fixture rows persist and are not reset by these commands. The hosted project currently contains 2 synthetic Auth users, 2 profiles, and 2 relational favorites (both belonging to fixture A).
- The local project contains only synthetic `example.test` users and fixture teams.
- Do not add service-role keys or production credentials to this directory or commit them.
- Keep PR #16 and PR #18 draft/unmerged until database and app-level checks pass.
- Root `supabase/migrations` is intentionally not replayed here: its current history is incomplete/drifted and includes production-specific cron, Vault, and Edge Function wiring.

## Automated validation (recommended)

Every pull request runs the isolated database harness on a GitHub-hosted Ubuntu runner. The workflow installs a stable Supabase CLI v3, starts its own Docker-backed Supabase stack, resets only this local project, runs the SQL assertions, and stops the stack even if a prior step fails. It does not use Supabase credentials, link a hosted project, or touch either hosted project.

The GitHub Actions run is the reproducible baseline for contributors who cannot run Docker locally.

## Auth and PostgREST API integration tests

The dedicated integration suite creates two independent synthetic users through the **local Auth signup API**. It then exercises the local PostgREST API with each user's own access token and a separate anonymous client.

After starting and resetting the local stack, run:

```bash
npm ci
npm run test:integration:p0-auth-rls
```

The test obtains `API_URL`, `ANON_KEY`, and `SERVICE_ROLE_KEY` at runtime from:

```bash
supabase --workdir validation status --env --output-format text
```

It does not read shell `.env` files or hosted-project credentials. Before creating any client, it validates that the API URL is plain HTTP on loopback (`127.0.0.1`, `localhost`, or `::1`) and that the local JWT roles are `anon` and `service_role`. The service-role key is held only in the Node test process and is used exclusively to delete the test users during cleanup; it is never printed or written to disk.

The suite verifies:

- Auth signup creates exactly one profile for each synthetic user through the local profile bootstrap trigger.
- A and B can each read and update their own profile.
- A cannot read, update, or delete B's profile.
- A can insert, read, update, and delete A's favorite-team row.
- B cannot read, update, or delete A's favorite-team row.
- A successful empty favorites query returns `[]` without an error (and must not be interpreted as a reason to fall back to legacy data).
- An anonymous client cannot read profiles or favorite-team rows.
- Both Auth users are signed out and deleted in a `finally` cleanup path; Auth foreign-key cascades remove their profiles and favorites.

Each run uses random `example.test` email addresses, a unique username suffix, and a random password. A hard loopback guard prevents the suite from sending test requests to production or any hosted Supabase endpoint.

The same command runs in the GitHub Actions `supabase-validation` job **after** local database reset and SQL fixture verification. It needs no repository secrets, Supabase access token, hosted URL, or database password.

Expected result: all Auth/RLS subtests pass and no `rallyon-p0-*@example.test` users remain after the run. If cleanup fails, the test job fails rather than silently leaving test accounts behind.

## Optional local prerequisites (macOS)

1. Confirm your macOS version is supported by the current Docker Desktop release before installing it; older macOS versions may no longer be supported.
2. Install Docker Desktop only if your machine supports it and has sufficient resources, then start it.
3. Install Supabase CLI: `brew install supabase/tap/supabase`.
4. From the repository root, verify `docker version` and `supabase --version`.

If local Docker is unavailable, use the GitHub Actions database-validation job rather than trying to connect this harness to a hosted database.

## Start/reset

Run from repository root:

```bash
npm run supabase:validation:start
npm run supabase:validation:status
npm run supabase:validation:reset
npm run supabase:validation:verify
```

The isolated CLI config pins PostgreSQL major version 17 and uses non-default ports to avoid colliding with another local Supabase stack. Reset recreates only this local validation database and applies the three migrations in this directory. The verify command runs SQL assertions and exits with an error if the fixture counts, backfill, or RLS flags are wrong.

Stop when finished:

```bash
npm run supabase:validation:stop
```

## Configure RallyOn against local Auth

Use the local API URL and anon/publishable key printed by `npm run supabase:validation:status`. Set them only in an untracked local `.env.local` (never commit):

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54331
VITE_SUPABASE_PUBLISHABLE_KEY=<local-anon-key-from-status>
```

Then run the app in a second terminal:

```bash
npm ci
npm test
npm run lint
npm run build
npm run dev
```

The project uses a local Auth instance with email confirmations disabled. Fixture accounts are database-only synthetic users; create separate throwaway accounts through the UI when testing the signup/session lifecycle.

## Database checks

After reset, the verify script should pass. For manual inspection, open local Studio at http://127.0.0.1:54333 and run:

```sql
-- Expected: two profiles, two Auth fixtures, two relational favorite rows.
select (select count(*) from auth.users) as auth_users,
       (select count(*) from public.profiles) as profiles,
       (select count(*) from public.user_favorite_teams) as favorite_rows;

-- Expected: one profile per fixture and only the two valid, distinct A favorites.
select user_id, team_id, team_name, sort_order
from public.user_favorite_teams
order by user_id, sort_order;

-- Expected: A has 2 favorites, B has 0; legacy JSON remains intact.
select id, jsonb_array_length(favorite_teams) as legacy_count
from public.profiles
order by id;

-- Expected: RLS enabled on both tables.
select c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('profiles','user_favorite_teams');
```

### RLS API checks

Use two separate browser sessions / local app accounts (A and B) with the publishable key, not the service-role key:

- A can read/edit only A's profile.
- B can read/edit only B's profile.
- A can read/replace only A's relational favorites; B cannot see A's rows.
- An empty successful relational read must be authoritative (B has no favorite rows).
- Anonymous requests cannot read profiles or favorite rows.
- Attempts to insert/update/delete another user's rows must be denied or affect zero rows.

The stable database fixture UUIDs are:
- A: `a1000000-0000-4000-8000-000000000001`
- B: `b2000000-0000-4000-8000-000000000002`

The migration fixture validates backfill handling for duplicate IDs, blank IDs, missing names, and an empty array. The local verification script also asserts no anon grants and only CRUD grants for authenticated. It does not validate the production Auth signup provider flow or every possible malformed JSON payload.

## What this harness does not prove

- It does not establish that the root production migration history can be replayed.
- It does not copy or mirror production user data.
- It does not prove signup trigger behavior through every OAuth provider.
- It does not replace live API RLS tests through two real client sessions.
- The hosted disposable project remains separately inspectable; its two synthetic users and related rows were created during earlier hosted SQL validation and are intentionally retained as fixtures. No production data was copied. Never use local reset commands against it.
