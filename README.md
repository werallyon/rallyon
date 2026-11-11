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

Never put the Supabase service-role key in frontend code or commit it to the repository.

## Sports Sync

RallyOn syncs sports schedules and scores from ESPN into the Supabase `games` table.

Because ESPN blocks requests from the Supabase Edge runtime, the production sync runs from GitHub Actions:

- Workflow: `.github/workflows/sports-sync.yml`
- Schedule: hourly
- Manual trigger: GitHub Actions → **RallyOn Sports Sync** → **Run workflow**

### Required GitHub Actions secrets

In the repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

- `SUPABASE_URL` — the Supabase project API URL.
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase service-role key.

The service-role key is server-side only and must never be added to `.env.example`, frontend code, or committed source.

After the secrets are configured, run **RallyOn Sports Sync** manually once to verify the connection. Successful runs will report the number of games synced.

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
npm run lint
npm run build
```

GitHub Actions also runs these checks on pushes and pull requests to `main`.
