# RallyOn

RallyOn is a sports, entertainment, and venue discovery platform.

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`.
3. Add the required local API keys/secrets to `.env.local`.
4. Run the app:
   `npm run dev`

The app runs on port 3000.

## Supabase

RallyOn uses Supabase for authentication, profiles, games, venues, venue programming, favorites, check-ins, presence, and venue signals.

Set these client-side variables in `.env.local`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put the Supabase secret/service-role key in frontend code or commit it to the repository.

## Sports Sync

RallyOn's production sports ingestion uses the Supabase `sync-games` Edge Function. The function fetches authoritative ESPN scoreboard data and upserts it into the Supabase `games` table.

### Production architecture

**Supabase Cron → `sync-games` Edge Function → ESPN → Supabase `games`**

- Hourly Cron job: `rallyon-sync-games-hourly` — refreshes today's games.
- Daily Cron job: `rallyon-sync-games-upcoming-daily` — refreshes the next 7 days.
- ESPN requests use explicit daily scoreboard dates.
- Scheduled calls authenticate with a Vault-backed `x-rallyon-sync-token`; the raw token is not stored in GitHub or frontend code.
- The Edge Function uses the Supabase service role only server-side for its protected database operations.
- Game upserts use the `(league, external_game_id)` conflict key to prevent duplicate games.

The production scheduler is managed in Supabase migrations under `supabase/migrations/`.

### Operational verification

To verify production ingestion:

1. Confirm both named Cron jobs are active in Supabase.
2. Confirm the `sync-games` Edge Function is active.
3. Invoke the function through the authenticated operational path for the appropriate sync window.
4. Confirm `public.games` contains current real provider data.
5. Check function diagnostics for provider failures or partial syncs.
6. Confirm duplicate protection remains intact for `(league, external_game_id)`.

### Legacy GitHub Actions sync

The repository still contains `scripts/sync-espn.mjs` and its historical GitHub Actions workflow for compatibility and operational fallback during the architecture transition. It is **not the intended production scheduler** and must not be enabled alongside the Supabase Cron path as a second production sync.

If the legacy script is run manually, it now exits non-zero when one or more ESPN league requests fail, even when other leagues return data. Successfully retrieved games are still upserted before the failure is surfaced.

## Core Data Model

The Supabase schema is managed by migrations under `supabase/migrations/`.

Core entities include:

- Markets and cities
- Venues
- Games
- Venue/game programming
- Venue favorites
- Venue check-ins
- Venue presence
- Venue signals

The intended product flow is:

**Sports feed → Supabase Games → Rally Match Engine → specific venue → “Where should I watch?”**

## Build Verification

Run:

```bash
npm test
npm run lint
npm run build
```

GitHub Actions also runs these checks on pushes and pull requests to `main`.
