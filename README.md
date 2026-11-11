# RallyOn

RallyOn is a sports, entertainment, and venue discovery platform.

## Run Locally

**Prerequisites:** Node.js 20+ and Deno 2+ for Edge Function checks.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Add the required local API keys/secrets to `.env.local`.
4. Run the app: `npm run dev`

The app runs on port 3000.

## Supabase

RallyOn uses Supabase for authentication, profiles, games, venues, venue programming, favorites, check-ins, presence, and venue signals.

Set these client-side variables in `.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put a Supabase secret/service-role key or the sports sync token in frontend code or commit them to the repository.

## Production Sports Ingestion

**The single scheduled production ingestion path is:**

`Supabase Cron → sync-games Edge Function → ESPN scoreboard API → public.games`

GitHub Actions is not a production scheduler. The Supabase Edge Function is the only routinely scheduled writer to `public.games`.

### Schedules

Both jobs are managed by the migrations in `supabase/migrations/` and run in UTC:

- `rallyon-sync-games-hourly`: `0 * * * *` — refreshes the current calendar day.
- `rallyon-sync-games-upcoming-daily`: `15 0 * * *` — refreshes the next seven calendar days.

The function requests each ESPN league/date separately using `site.web.api.espn.com`. Calendar dates use `America/Chicago`, RallyOn's default market timezone, rather than UTC midnight.

### Authentication and secrets

- Scheduled calls are made by Supabase Cron using `net.http_post`.
- The raw `x-rallyon-sync-token` is stored in Supabase Vault as `rallyon_sync_games_token`.
- `public.system_sync_tokens` stores only the SHA-256 token hash. Client roles are denied access by the production-hardening migration.
- The Edge Function compares the supplied token hash with the stored hash before doing any ESPN or database work.
- The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` server-side only for the token lookup and games upsert.
- `supabase/config.toml` sets `verify_jwt = false` for this function only because scheduled requests do not carry a user JWT. This does **not** make the handler unauthenticated: the handler requires the high-entropy custom sync token and returns 401 when it is absent or incorrect.
- Do not add the sync token to GitHub, app configuration, browser requests, logs, or source control.

The browser app reads stored games from Supabase. It does not trigger the production sync; Cron owns that responsibility.

### Provider failure and empty results

- A successful ESPN response with no events is a valid empty result. The function returns HTTP 200 with `synced: 0`; it does not manufacture fixtures.
- If one or more league/date requests fail, the function still upserts valid games returned by successful requests, then returns HTTP 502 with diagnostics. Partial data is retained, but the run is visibly incomplete.
- If the Supabase upsert fails, the function returns HTTP 500.
- No demo or seeded game fixtures are imported or used by the Edge Function.
- Upserts use `on_conflict=league,external_game_id`; the core migration defines the matching unique constraint `(league, external_game_id)`. Replays update the existing record rather than inserting a duplicate.

**Scope note:** Edge Function fixture isolation does not by itself guarantee that every UI fallback is production-safe. The separate application demo-isolation work in [PR #4](https://github.com/werallyon/rallyon/pull/4) remains a prerequisite for eliminating seeded fallback behavior outside the ingestion function.

### Migrations and deployment

The scheduling migrations are intentionally ordered:

1. `20261111043646_rallyon_sync_games_schedule_v2.sql` creates/rotates the Vault-backed token and the hourly job.
2. `20261111043830_rallyon_sync_games_schedule_v3.sql` replaces the hourly definition and adds the daily upcoming job.

These migrations have already been applied to the production project `nqdrfwvxomecduxmmzrc`. Do not manually re-run them in production: v2 generates a new token and updates the stored hash. On a fresh environment, apply them once in timestamp order after the core data-model and production-hardening migrations.

Deploy the function from the repository with:

```bash
supabase functions deploy sync-games --project-ref nqdrfwvxomecduxmmzrc
```

Ensure the deployed function uses the repository's `supabase/config.toml` setting and the required Supabase runtime secrets are present. Never print or export the Vault token while verifying the setup.

### Operational verification

Use read-only checks in the Supabase SQL Editor.

Confirm the two jobs are present and active:

```sql
select jobname, schedule, active
from cron.job
where jobname in (
  'rallyon-sync-games-hourly',
  'rallyon-sync-games-upcoming-daily'
)
order by jobname;
```

Review recent scheduler executions:

```sql
select jobid, status, start_time, end_time, return_message
from cron.job_run_details
order by start_time desc
limit 20;
```

Because `net.http_post` is asynchronous, inspect HTTP responses as well; a successful cron enqueue does not prove the Edge Function returned 2xx:

```sql
select id, status_code, content, created
from net._http_response
order by created desc
limit 20;
```

Check real external IDs by league:

```sql
select league, count(*) as games_with_external_ids
from public.games
where external_game_id is not null and btrim(external_game_id) <> ''
group by league
order by league;
```

Check for duplicate external IDs:

```sql
select league, external_game_id, count(*) as duplicate_count
from public.games
where external_game_id is not null
group by league, external_game_id
having count(*) > 1;
```

Also inspect the `sync-games` Edge Function logs for its completion/incomplete diagnostics. Never select or display `vault.decrypted_secrets.decrypted_secret` during routine verification.

### Manual recovery only

`.github/workflows/sports-sync.yml` is now `workflow_dispatch` only and requires an explicit production-write confirmation. It is a manual recovery/backfill tool, **not** a second scheduler. It uses GitHub Actions secrets `SUPABASE_URL` and `SUPABASE_SECRET_KEY`; those values must remain server-side and must never be printed.

The manual script uses the same ESPN host, explicit daily date requests, Chicago calendar dates, and idempotent conflict key. It preserves successful league results, then exits non-zero if any provider request failed. A clean empty response remains empty and is not treated as a provider error.

## Core Data Model

The Supabase schema is managed by migrations under `supabase/migrations/`.

Core entities include markets, cities, venues, games, venue/game programming, venue favorites, venue check-ins, venue presence, and venue signals.

The intended product flow is:

**Sports feed → Supabase Games → Rally Match Engine → specific venue → “Where should I watch?”**

## Build Verification

Run:

```bash
npm test
deno check supabase/functions/sync-games/index.ts
npm run lint
npm run build
```

GitHub Actions runs these checks on pushes and pull requests to `main`.
