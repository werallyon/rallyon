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

The current production jobs are:

- `rallyon-sync-games-hourly`: `0 * * * *` — refreshes the current Chicago calendar day.
- `rallyon-sync-games-upcoming-daily`: a `15 * * * *` cron guard that sends the upcoming request only when `now() AT TIME ZONE 'America/Chicago'` is in hour `00`. The request therefore runs at 00:15 Chicago time; the lightweight guard is evaluated hourly.

Do not replace the conditional daily guard with a fixed `15 0 * * *` UTC schedule: that shifts the request to early evening in Chicago during standard time. The function requests each ESPN league/date separately using `site.web.api.espn.com` and uses `America/Chicago` calendar dates.

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

The production demo-data isolation safeguards from [PR #4](https://github.com/werallyon/rallyon/pull/4) and [PR #5](https://github.com/werallyon/rallyon/pull/5) are integrated. Keep demo mode disabled in production and retain the regression suite for UI fallback paths.

### Migrations and deployment

The live production migration ledger was inspected read-only on 2026-11-14. Migration provenance is not yet fully reconciled:

1. Hosted history records `20261111043646 / rallyon_sync_games_schedule_v2`, matching the checked-in v2 filename.
2. Hosted history records `20261111043827 / rallyon_sync_games_schedule_v3`, while the checked-in file is named `20261111043830_rallyon_sync_games_schedule_v3.sql`. Do not assume these SQL files are identical without an authoritative comparison.
3. The checked-in v4 timeout migration was **not** present in the hosted migration ledger. A recent production `net._http_response` row timed out at the 5-second pg_net default. The proposed forward-only fix is `20261114170000_rallyon_sync_games_schedule_timeout_v4.sql`; it preserves the Chicago-local daily guard and sets both HTTP requests to 120 seconds.

The hosted ledger also contains historical migrations whose SQL files are missing from the current repository, plus other version/name mismatches. **Do not run `supabase db push`, reset production, rename applied migration history, or replay the current root directory until the complete hosted/repository migration parity audit is resolved.** The proposed v4 migration is not applied to production and must remain subject to independent review. The PR #28 CI also starts a separate disposable Supabase stack and executes the actual v4 SQL inside an uncommitted transaction, inspects the two resulting Cron definitions and timeout/Chicago guard, then rolls back and verifies no jobs remain. The scheduled command strings are never committed or executed, so the rehearsal cannot call the production Edge Function.

The v2 migration manages the Vault-backed sync token. Never re-run or reconstruct it casually: it can rotate the token/hash relationship. The v4 migration reuses the existing Vault token and does not expose or rotate it.

Deploy the function from the repository only through the separately approved release process:

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
