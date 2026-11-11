import { getSyncDates, getSyncOutcome } from '../supabase/functions/_shared/sync-utils.js';

const leagues = [
  ['football', 'nfl', 'NFL'],
  ['football', 'college-football', 'NCAA_FB'],
  ['basketball', 'nba', 'NBA'],
  ['basketball', 'mens-college-basketball', 'NCAA_BB'],
  ['baseball', 'mlb', 'MLB'],
  ['hockey', 'nhl', 'NHL'],
  ['soccer', 'usa.1', 'MLS'],
];

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
}

// Manual recovery covers today plus the following seven Chicago calendar days.
const syncDates = getSyncDates(new Date(), { days: 8, startOffset: 0 });
const allGames = [];
const diagnostics = [];

function statusOf(event) {
  const status = String(event?.status?.type?.name ?? '').toUpperCase();
  if (status.includes('FINAL')) return 'FINAL';
  if (status.includes('POSTPONED')) return 'POSTPONED';
  if (status.includes('CANCEL')) return 'CANCELLED';
  if (status.includes('DELAY')) return 'DELAYED';
  if (status.includes('HALFTIME')) return 'HALFTIME';
  if (status.includes('IN_PROGRESS') || status.includes('LIVE')) return 'LIVE';
  return 'UPCOMING';
}

function team(competitor) {
  const source = competitor?.team ?? {};
  return {
    name: source.displayName ?? source.name ?? '',
    abbrev: source.abbreviation ?? source.shortDisplayName ?? '',
    logo: source.logo ?? source.logos?.[0]?.href ?? '',
    record: competitor?.records?.[0]?.summary,
  };
}

async function fetchJson(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RallyOn/1.0; +https://github.com/werallyon/rallyon)',
          Accept: 'application/json, text/plain, */*',
        },
      });
      const body = await response.text();
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
        if (response.status >= 400 && response.status < 500 && response.status !== 429) break;
        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        continue;
      }
      const payload = JSON.parse(body);
      if (!payload || !Array.isArray(payload.events)) {
        throw new Error('Invalid ESPN scoreboard payload');
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError ?? new Error('Unknown ESPN request failure');
}

for (const syncDate of syncDates) {
  const results = await Promise.all(leagues.map(async ([sport, league, leagueCode]) => {
    const games = [];
    const issues = [];
    const url = `https://site.web.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?limit=100&dates=${syncDate}`;

    try {
      const payload = await fetchJson(url);
      let invalidEvents = 0;
      for (const event of payload.events) {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors ?? [];
        const home = competitors.find((item) => item.homeAway === 'home');
        const away = competitors.find((item) => item.homeAway === 'away');
        if (!home || !away || !event.id || !event.date) {
          invalidEvents += 1;
          continue;
        }

        games.push({
          league: leagueCode,
          home_team: team(home),
          away_team: team(away),
          start_time: event.date,
          status: statusOf(event),
          live_details: event.status?.type?.state === 'in'
            ? {
                currentScore: { home: Number(home.score ?? 0), away: Number(away.score ?? 0) },
                period: event.status?.period ? String(event.status.period) : '',
                clock: event.status?.displayClock ?? '',
                headline: event.status?.type?.detail ?? '',
              }
            : null,
          broadcast_network: competition?.broadcasts?.[0]?.names?.[0] ?? null,
          broadcast: competition?.broadcasts?.[0] ?? null,
          venue_name: competition?.venue?.fullName ?? null,
          season: event.season?.year ? String(event.season.year) : null,
          external_game_id: String(event.id),
          last_updated: new Date().toISOString(),
        });
      }
      if (invalidEvents > 0) issues.push({ league: leagueCode, date: syncDate, invalidEvents });
    } catch (error) {
      issues.push({ league: leagueCode, date: syncDate, error: String(error) });
    }

    return { games, issues };
  }));

  for (const result of results) {
    allGames.push(...result.games);
    diagnostics.push(...result.issues);
  }
}

const uniqueGames = Array.from(
  new Map(allGames.map((game) => [`${game.league}:${game.external_game_id}`, game])).values(),
);
if (uniqueGames.length > 0) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/games?on_conflict=league,external_game_id`,
    {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(uniqueGames),
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase upsert failed: ${response.status} ${await response.text()}`);
  }
}

const outcome = getSyncOutcome(uniqueGames.length, diagnostics);
const report = {
  synced: outcome.synced,
  complete: outcome.complete,
  partial: outcome.partial,
  dates: syncDates,
  diagnostics,
};

// A successful empty ESPN window is a valid empty result. Provider failures,
// including partial failures, produce a non-zero workflow exit after good
// games have been persisted.
if (outcome.failed) {
  console.error(JSON.stringify(report));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report));
}
