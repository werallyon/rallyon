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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const now = new Date();
const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const ymd = (d) => d.toISOString().slice(0, 10).replaceAll('-', '');
const dateRange = `${ymd(now)}-${ymd(end)}`;

function statusOf(event) {
  const s = String(event?.status?.type?.name ?? '').toUpperCase();
  if (s.includes('FINAL')) return 'FINAL';
  if (s.includes('POSTPONED')) return 'POSTPONED';
  if (s.includes('CANCEL')) return 'CANCELLED';
  if (s.includes('DELAY')) return 'DELAYED';
  if (s.includes('HALFTIME')) return 'HALFTIME';
  if (s.includes('IN_PROGRESS') || s.includes('LIVE')) return 'LIVE';
  return 'UPCOMING';
}

function team(competitor) {
  const t = competitor?.team ?? {};
  return {
    name: t.displayName ?? t.name ?? '',
    abbrev: t.abbreviation ?? t.shortDisplayName ?? '',
    logo: t.logo ?? t.logos?.[0]?.href ?? '',
    record: competitor?.records?.[0]?.summary,
  };
}

const allGames = [];
const diagnostics = [];

for (const [sport, league, leagueCode] of leagues) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?limit=100&dates=${dateRange}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RallyOn/1.0 sports sync',
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      diagnostics.push({ league: leagueCode, status: response.status });
      continue;
    }

    const payload = await response.json();
    for (const event of payload.events ?? []) {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors ?? [];
      const home = competitors.find((c) => c.homeAway === 'home');
      const away = competitors.find((c) => c.homeAway === 'away');
      if (!home || !away || !event.id || !event.date) continue;

      allGames.push({
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
  } catch (error) {
    diagnostics.push({ league: leagueCode, error: String(error) });
  }
}

if (!allGames.length) {
  console.log(JSON.stringify({ synced: 0, dateRange, diagnostics }));
  process.exit(0);
}

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
    body: JSON.stringify(allGames),
  },
);

if (!response.ok) {
  throw new Error(`Supabase upsert failed: ${response.status} ${await response.text()}`);
}

console.log(JSON.stringify({ synced: allGames.length, dateRange, diagnostics }));
