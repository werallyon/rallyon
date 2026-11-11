import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  constantTimeEqual,
  getSyncDates,
  getSyncOutcome,
} from "../_shared/sync-utils.js";

const LEAGUES = [
  ["football", "nfl", "NFL"],
  ["football", "college-football", "NCAA_FB"],
  ["basketball", "nba", "NBA"],
  ["basketball", "mens-college-basketball", "NCAA_BB"],
  ["baseball", "mlb", "MLB"],
  ["hockey", "nhl", "NHL"],
  ["soccer", "usa.1", "MLS"],
];

function statusOf(event: any) {
  const status = String(event?.status?.type?.name ?? "").toUpperCase();
  if (status.includes("FINAL")) return "FINAL";
  if (status.includes("POSTPONED")) return "POSTPONED";
  if (status.includes("CANCEL")) return "CANCELLED";
  if (status.includes("DELAY")) return "DELAYED";
  if (status.includes("HALFTIME")) return "HALFTIME";
  if (status.includes("IN_PROGRESS") || status.includes("LIVE")) return "LIVE";
  return "UPCOMING";
}

function team(competitor: any) {
  const source = competitor?.team ?? {};
  return {
    name: source.displayName ?? source.name ?? "",
    abbrev: source.abbreviation ?? source.shortDisplayName ?? "",
    logo: source.logo ?? source.logos?.[0]?.href ?? "",
    record: competitor?.records?.[0]?.summary,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("sync-games is missing required Supabase runtime configuration");
    return jsonResponse({ error: "Sync service is not configured" }, 500);
  }

  const syncToken = req.headers.get("x-rallyon-sync-token") ?? "";
  if (!syncToken) return jsonResponse({ error: "Unauthorized" }, 401);

  const tokenHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(syncToken),
  );
  const tokenHash = Array.from(new Uint8Array(tokenHashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const authHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_sync_tokens?name=eq.sync-games&select=token_sha256&limit=1`,
      { headers: authHeaders },
    );
  } catch (error) {
    console.error("sync-games token lookup failed", String(error));
    return jsonResponse({ error: "Unable to verify sync credentials" }, 503);
  }

  if (!tokenResponse.ok) {
    console.error("sync-games token lookup returned", tokenResponse.status);
    return jsonResponse({ error: "Unable to verify sync credentials" }, 503);
  }

  const tokenRows = await tokenResponse.json();
  if (!tokenRows[0] || !constantTimeEqual(tokenRows[0].token_sha256, tokenHash)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const syncWindow = req.headers.get("x-rallyon-sync-window") ?? "today";
  if (syncWindow !== "today" && syncWindow !== "upcoming") {
    return jsonResponse({ error: "Invalid sync window" }, 400);
  }

  // Use RallyOn's default market timezone rather than UTC midnight.
  const syncDates = syncWindow === "upcoming"
    ? getSyncDates(new Date(), { days: 7, startOffset: 1 })
    : getSyncDates(new Date(), { days: 1 });

  const allGames: any[] = [];
  const diagnostics: any[] = [];

  // Fetch the seven configured leagues concurrently for each date. This keeps
  // the seven-day run bounded without launching 49 simultaneous ESPN requests.
  for (const syncDate of syncDates) {
    const results = await Promise.all(LEAGUES.map(async ([sport, league, leagueCode]) => {
      const games: any[] = [];
      const issues: any[] = [];
      const url = `https://site.web.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?limit=100&dates=${syncDate}`;

      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          issues.push({ league: leagueCode, date: syncDate, status: response.status });
          return { games, issues };
        }

        const payload = await response.json();
        if (!payload || !Array.isArray(payload.events)) {
          issues.push({ league: leagueCode, date: syncDate, error: "Invalid ESPN scoreboard payload" });
          return { games, issues };
        }

        let invalidEvents = 0;
        for (const event of payload.events) {
          const competition = event.competitions?.[0];
          const competitors = competition?.competitors ?? [];
          const home = competitors.find((item: any) => item.homeAway === "home");
          const away = competitors.find((item: any) => item.homeAway === "away");
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

        if (invalidEvents > 0) {
          issues.push({ league: leagueCode, date: syncDate, invalidEvents });
        }
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

  // De-duplicate within this run; the database unique constraint protects
  // repeated runs across invocations.
  const uniqueGames = Array.from(
    new Map(allGames.map((game) => [`${game.league}:${game.external_game_id}`, game])).values(),
  );

  if (uniqueGames.length > 0) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/games?on_conflict=league,external_game_id`,
      {
        method: "POST",
        headers: { ...authHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(uniqueGames),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      console.error("sync-games Supabase upsert failed", response.status, details);
      return jsonResponse({ error: "Supabase game upsert failed", status: response.status }, 500);
    }
  }

  const outcome = getSyncOutcome(uniqueGames.length, diagnostics);
  if (outcome.failed) {
    // Preserve good league results, but return non-2xx so incomplete runs
    // cannot be mistaken for successful ingestion.
    console.error("sync-games incomplete", JSON.stringify({
      synced: outcome.synced,
      diagnostics,
    }));
  } else {
    console.log("sync-games complete", JSON.stringify({
      synced: outcome.synced,
      syncWindow,
      dates: syncDates,
    }));
  }

  return jsonResponse({
    ...outcome,
    diagnostics,
    message: outcome.failed
      ? "Some ESPN league/date requests failed; successful games were retained"
      : outcome.synced === 0
        ? "No games returned for the requested window"
        : "Sports sync completed",
  }, outcome.statusCode);
});
