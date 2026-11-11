import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const LEAGUES = [
  ["football","nfl","NFL"],
  ["football","college-football","NCAA_FB"],
  ["basketball","nba","NBA"],
  ["basketball","mens-college-basketball","NCAA_BB"],
  ["baseball","mlb","MLB"],
  ["hockey","nhl","NHL"],
  ["soccer","usa.1","MLS"],
];

function statusOf(event: any) {
  const s = String(event?.status?.type?.name ?? "").toUpperCase();
  if (s.includes("FINAL")) return "FINAL";
  if (s.includes("POSTPONED")) return "POSTPONED";
  if (s.includes("CANCEL")) return "CANCELLED";
  if (s.includes("DELAY")) return "DELAYED";
  if (s.includes("HALFTIME")) return "HALFTIME";
  if (s.includes("IN_PROGRESS") || s.includes("LIVE")) return "LIVE";
  return "UPCOMING";
}

function team(competitor: any) {
  const t = competitor?.team ?? {};
  return {
    name: t.displayName ?? t.name ?? "",
    abbrev: t.abbreviation ?? t.shortDisplayName ?? "",
    logo: t.logo ?? t.logos?.[0]?.href ?? "",
    record: competitor?.records?.[0]?.summary,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const syncToken = req.headers.get("x-rallyon-sync-token") ?? "";
  const tokenHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(syncToken));
  const tokenHash = Array.from(new Uint8Array(tokenHashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  const tokenResponse = await fetch(`${supabaseUrl}/rest/v1/system_sync_tokens?name=eq.sync-games&select=token_sha256&limit=1`, { headers: authHeaders });
  const tokenRows = tokenResponse.ok ? await tokenResponse.json() : [];
  if (!tokenRows[0] || tokenRows[0].token_sha256 !== tokenHash) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const headers = authHeaders;

  const allGames: any[] = [];
  const diagnostics: any[] = [];
  const today = new Date();
  const end = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "");
  const dateRange = `${ymd(today)}-${ymd(end)}`;

  for (const [sport, league, leagueCode] of LEAGUES) {
    const url = `https://site.web.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?limit=100&dates=${dateRange}`;
    try {
      const response = await fetch(url);
      if (!response.ok) { diagnostics.push({ league: leagueCode, status: response.status }); continue; }
      const payload = await response.json();

      for (const event of payload.events ?? []) {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors ?? [];
        const home = competitors.find((c: any) => c.homeAway === "home");
        const away = competitors.find((c: any) => c.homeAway === "away");
        if (!home || !away || !event.id || !event.date) continue;

        allGames.push({
          league: leagueCode,
          home_team: team(home),
          away_team: team(away),
          start_time: event.date,
          status: statusOf(event),
          live_details: event.status?.type?.state === "in" ? {
            currentScore: { home: Number(home.score ?? 0), away: Number(away.score ?? 0) },
            period: event.status?.period ? String(event.status.period) : "",
            clock: event.status?.displayClock ?? "",
            headline: event.status?.type?.detail ?? "",
          } : null,
          broadcast_network: competition?.broadcasts?.[0]?.names?.[0] ?? null,
          broadcast: competition?.broadcasts?.[0] ?? null,
          venue_name: competition?.venue?.fullName ?? null,
          season: event.season?.year ? String(event.season.year) : null,
          external_game_id: String(event.id),
          last_updated: new Date().toISOString(),
        });
      }
    } catch (error) { diagnostics.push({ league: leagueCode, error: String(error) }); }
  }

  if (!allGames.length) {
    return new Response(JSON.stringify({ synced: 0, message: `No games returned for ${dateRange}`, diagnostics }), { headers: { "Content-Type": "application/json" } });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/games?on_conflict=league,external_game_id`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(allGames),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: await response.text() }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ synced: allGames.length }), { headers: { "Content-Type": "application/json" } });
});
