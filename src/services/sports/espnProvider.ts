import {
  SportsGame,
  SportsLeague,
  SportsTeam,
  GameStatus,
  BroadcastIntelligence
} from '../../types';
import {
  ISportsDataProvider,
  SportsProviderStatus,
  SportsProviderConfig,
  GameScheduleFilter,
  GameSummaryData,
  GameOdds,
  ScoringPlay,
  TopPerformer
} from './types';
import { SEEDED_GAMES } from '../../data/seedData';
import { isDemoMode } from '../../config/dataMode';
import { TEAMS_DATABASE } from '../../data/teamsDatabase';

// ESPN Sport & League Endpoints Mapping
export const ESPN_LEAGUE_MAP: Record<
  SportsLeague,
  { sport: string; league: string; displayName: string }
> = {
  NFL: { sport: 'football', league: 'nfl', displayName: 'NFL' },
  NCAA_FB: { sport: 'football', league: 'college-football', displayName: 'NCAA Football' },
  NBA: { sport: 'basketball', league: 'nba', displayName: 'NBA' },
  NCAA_BB: { sport: 'basketball', league: 'mens-college-basketball', displayName: 'NCAA Men\'s Basketball' },
  MLB: { sport: 'baseball', league: 'mlb', displayName: 'MLB' },
  NHL: { sport: 'hockey', league: 'nhl', displayName: 'NHL' },
  MLS: { sport: 'soccer', league: 'usa.1', displayName: 'MLS' },
  SOCCER: { sport: 'soccer', league: 'eng.1', displayName: 'Premier League' },
  UFC: { sport: 'mma', league: 'ufc', displayName: 'UFC / MMA' },
  PGA: { sport: 'golf', league: 'pga', displayName: 'PGA Tour' }
};

/**
 * ESPN Public Sports Data Provider
 * Connects to ESPN's public site endpoints without requiring an API key.
 * Features automated multi-sport aggregation, rich broadcast intelligence,
 * real-time situation extraction, and resilient fallback cascade.
 */
export class ESPNSportsDataProvider implements ISportsDataProvider {
  readonly id = 'espn-public-v2';
  readonly name = 'ESPN Public Sports Data Feeds';
  readonly type = 'ESPN_PUBLIC';
  readonly requiresApiKey = false;
  isConfigured = true;

  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';
  private timeoutMs = 4000;
  private cache: Map<string, { data: SportsGame[]; timestamp: number; ttl: number }> = new Map();
  private summaryCache: Map<string, { data: GameSummaryData; timestamp: number }> = new Map();
  private lastSyncTime?: string;
  private lastError?: string;
  private lastLatencyMs?: number;
  private isUsingFallback = false;
  private activePendingRequests: Map<string, Promise<SportsGame[]>> = new Map();

  constructor(config?: Partial<SportsProviderConfig>) {
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
    if (config?.timeoutMs) {
      this.timeoutMs = config.timeoutMs;
    }
  }

  configure(config: Partial<SportsProviderConfig>): void {
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.timeoutMs) this.timeoutMs = config.timeoutMs;
    // Clear cache on config update
    this.cache.clear();
    this.summaryCache.clear();
  }

  getStatus(): SportsProviderStatus {
    const totalCached = Array.from(this.cache.values()).reduce(
      (acc, entry) => acc + entry.data.length,
      0
    );

    return {
      providerId: this.id,
      name: this.name,
      type: this.type,
      isConfigured: this.isConfigured,
      requiresApiKey: this.requiresApiKey,
      mode: this.isUsingFallback ? 'DEMO_FALLBACK' : 'LIVE_FEED',
      activeEndpoints: Object.entries(ESPN_LEAGUE_MAP).map(
        ([l, conf]) => `${conf.displayName} (${conf.sport}/${conf.league})`
      ),
      lastSync: this.lastSyncTime || new Date().toISOString(),
      error: this.lastError,
      latencyMs: this.lastLatencyMs,
      cachedGamesCount: totalCached
    };
  }

  async getLeagues(): Promise<SportsLeague[]> {
    return [
      'NFL',
      'NCAA_FB',
      'NBA',
      'NCAA_BB',
      'MLB',
      'NHL',
      'MLS',
      'SOCCER',
      'UFC',
      'PGA'
    ];
  }

  /**
   * Health check and latency benchmark against live ESPN endpoints
   */
  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(`${this.baseUrl}/baseball/mlb/scoreboard`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);
      this.lastLatencyMs = latencyMs;

      if (res.ok) {
        this.lastError = undefined;
        this.isUsingFallback = false;
        return {
          success: true,
          latencyMs,
          message: `ESPN Public Endpoints reachable (${latencyMs}ms). Scoreboards responding.`
        };
      } else {
        this.lastError = `HTTP ${res.status}: ${res.statusText}`;
        return {
          success: false,
          latencyMs,
          message: `ESPN responded with status ${res.status}`
        };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      this.lastLatencyMs = latencyMs;
      this.lastError = err.message || 'Connection failed';
      return {
        success: false,
        latencyMs,
        message: `ESPN endpoint test failed: ${err.message || 'Network error'}`
      };
    }
  }

  /**
   * Extracts game situation string (down/distance, baseball counts, etc.)
   */
  private extractSituationText(event: any, league: SportsLeague): string | undefined {
    const comp = event.competitions?.[0];
    const sit = comp?.situation;
    if (!sit) return undefined;

    if (league === 'NFL' || league === 'NCAA_FB') {
      const down = sit.down;
      const dist = sit.distance;
      const yardline = sit.possessionText;
      if (down && dist) {
        const downStr =
          down === 1 ? '1st' : down === 2 ? '2nd' : down === 3 ? '3rd' : `${down}th`;
        return `${downStr} & ${dist === 0 ? 'Goal' : dist}${yardline ? ` at ${yardline}` : ''}`;
      }
    }

    if (league === 'MLB') {
      const balls = sit.balls ?? 0;
      const strikes = sit.strikes ?? 0;
      const outs = sit.outs ?? 0;
      const onBase: string[] = [];
      if (sit.onFirst) onBase.push('1st');
      if (sit.onSecond) onBase.push('2nd');
      if (sit.onThird) onBase.push('3rd');

      const baseText = onBase.length > 0 ? ` • Runners on ${onBase.join(', ')}` : '';
      return `${balls}-${strikes} Count • ${outs} ${outs === 1 ? 'Out' : 'Outs'}${baseText}`;
    }

    if (league === 'NBA' || league === 'NCAA_BB') {
      if (sit.bonus) return 'Bonus in effect';
    }

    return undefined;
  }

  /**
   * Normalizes raw ESPN JSON event to RallyOn SportsGame format
   */
  private normalizeESPNEvent(event: any, league: SportsLeague): SportsGame | null {
    try {
      const competition = event.competitions?.[0];
      if (!competition) return null;

      const homeComp = competition.competitors?.find((c: any) => c.homeAway === 'home');
      const awayComp = competition.competitors?.find((c: any) => c.homeAway === 'away');

      if (!homeComp || !awayComp) return null;

      // Extract ranking if present (e.g. AP Top 25)
      const homeRank = homeComp.curatedRank?.current;
      const awayRank = awayComp.curatedRank?.current;

      const homeRankPrefix = homeRank && homeRank <= 25 ? `#${homeRank} ` : '';
      const awayRankPrefix = awayRank && awayRank <= 25 ? `#${awayRank} ` : '';

      const homeName = `${homeRankPrefix}${homeComp.team?.displayName || homeComp.team?.name || 'Home Team'}`;
      const awayName = `${awayRankPrefix}${awayComp.team?.displayName || awayComp.team?.name || 'Away Team'}`;

      // Check for matching team in database to enrich colors/fallbacks
      const homeAbbrev = homeComp.team?.abbreviation || '';
      const awayAbbrev = awayComp.team?.abbreviation || '';

      const matchedHome = TEAMS_DATABASE.find(
        (t) =>
          (homeAbbrev && t.abbrev.toLowerCase() === homeAbbrev.toLowerCase()) ||
          (t.name && homeName.toLowerCase().includes(t.name.toLowerCase()))
      );

      const matchedAway = TEAMS_DATABASE.find(
        (t) =>
          (awayAbbrev && t.abbrev.toLowerCase() === awayAbbrev.toLowerCase()) ||
          (t.name && awayName.toLowerCase().includes(t.name.toLowerCase()))
      );

      const homeTeam: SportsTeam = {
        name: homeName,
        abbrev: homeAbbrev || matchedHome?.abbrev || 'HOM',
        logo:
          homeComp.team?.logo ||
          matchedHome?.logo ||
          `https://a.espncdn.com/i/teamlogos/${league.toLowerCase()}/500/${homeAbbrev.toLowerCase() || 'default'}.png`,
        record: homeComp.records?.[0]?.summary || '',
        color: homeComp.team?.color ? `#${homeComp.team.color}` : (matchedHome?.color || '#2563eb')
      };

      const awayTeam: SportsTeam = {
        name: awayName,
        abbrev: awayAbbrev || matchedAway?.abbrev || 'AWY',
        logo:
          awayComp.team?.logo ||
          matchedAway?.logo ||
          `https://a.espncdn.com/i/teamlogos/${league.toLowerCase()}/500/${awayAbbrev.toLowerCase() || 'default'}.png`,
        record: awayComp.records?.[0]?.summary || '',
        color: awayComp.team?.color ? `#${awayComp.team.color}` : (matchedAway?.color || '#dc2626')
      };

      // Game status mapping
      const espnState = event.status?.type?.state; // 'in', 'pre', 'post'
      const statusName = event.status?.type?.name || '';
      const statusDesc = event.status?.type?.description || '';

      let status: GameStatus = 'UPCOMING';
      if (espnState === 'in') {
        if (
          statusName.includes('HALFTIME') ||
          statusDesc.toLowerCase() === 'halftime' ||
          statusName.includes('END_PERIOD')
        ) {
          status = 'HALFTIME';
        } else {
          status = 'LIVE';
        }
      } else if (espnState === 'post') {
        status = 'FINAL';
      } else if (statusName.includes('POSTPONED')) {
        status = 'POSTPONED';
      } else if (statusName.includes('CANCELLED')) {
        status = 'CANCELLED';
      } else if (statusName.includes('DELAYED')) {
        status = 'DELAYED';
      }

      // Broadcast Intelligence extraction
      const rawBroadcast = competition.broadcasts?.[0]?.names?.[0] || competition.broadcasts?.[0]?.market || 'ESPN';
      const netUpper = rawBroadcast.toUpperCase();

      let broadcastType: BroadcastIntelligence['broadcastType'] = 'CABLE';
      if (
        netUpper.includes('ABC') ||
        netUpper.includes('FOX') ||
        netUpper.includes('CBS') ||
        netUpper.includes('NBC')
      ) {
        broadcastType = 'NATIONAL_OTA';
      } else if (
        netUpper.includes('+') ||
        netUpper.includes('PEACOCK') ||
        netUpper.includes('PRIME') ||
        netUpper.includes('APPLE') ||
        netUpper.includes('MAX')
      ) {
        broadcastType = 'STREAMING_EXCLUSIVE';
      } else if (
        netUpper.includes('REGIONAL') ||
        netUpper.includes('BALLY') ||
        netUpper.includes('YES') ||
        netUpper.includes('NESN') ||
        netUpper.includes('MARQUEE')
      ) {
        broadcastType = 'REGIONAL';
      }

      const broadcast: BroadcastIntelligence = {
        network: rawBroadcast,
        broadcastType,
        regionalAvailability:
          broadcastType === 'REGIONAL'
            ? 'Regional Sports Network (Check Local Listings)'
            : 'Available Nationally',
        streamingAvailability: netUpper.includes('ESPN')
          ? ['ESPN+']
          : netUpper.includes('NBC')
          ? ['Peacock']
          : netUpper.includes('CBS')
          ? ['Paramount+']
          : undefined,
        externalProvider: 'ESPN Public Feeds',
        lastVerified: new Date().toISOString()
      };

      const situation = this.extractSituationText(event, league);

      // Score parsing
      const homeScore = parseInt(homeComp.score || '0', 10);
      const awayScore = parseInt(awayComp.score || '0', 10);

      // Odds extraction if present in ESPN data
      const rawOdds = competition.odds?.[0];
      const oddsNote = rawOdds?.details
        ? `${rawOdds.details}${rawOdds.overUnder ? ` • O/U ${rawOdds.overUnder}` : ''}`
        : undefined;

      const venueName = competition.venue?.fullName
        ? `${competition.venue.fullName}${competition.venue.address?.city ? ` (${competition.venue.address.city})` : ''}`
        : 'Stadium Arena';

      const isLiveGame = status === 'LIVE' || status === 'HALFTIME';
      const isFinalGame = status === 'FINAL';

      const displayClock =
        isLiveGame && event.status?.displayClock && event.status?.displayClock !== '0:00'
          ? event.status.displayClock
          : '';

      const periodText = isFinalGame
        ? 'Final'
        : event.status?.type?.shortDetail || (isLiveGame ? 'Live' : 'Upcoming');

      return {
        id: `espn_${event.id}`,
        externalGameId: event.id,
        league,
        homeTeam,
        awayTeam,
        startTime: event.date || new Date().toISOString(),
        status,
        venueName,
        broadcastNetwork: rawBroadcast,
        broadcast,
        liveDetails: {
          currentScore: {
            home: isNaN(homeScore) ? 0 : homeScore,
            away: isNaN(awayScore) ? 0 : awayScore
          },
          period: periodText,
          clock: displayClock,
          headline: oddsNote || event.status?.type?.detail || undefined,
          situation
        },
        lastUpdated: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetches scoreboard games for a specific league from ESPN
   */
  private async fetchLeagueScoreboard(
    league: SportsLeague,
    date?: string
  ): Promise<SportsGame[]> {
    const mapping = ESPN_LEAGUE_MAP[league];
    if (!mapping) return [];

    let url = `${this.baseUrl}/${mapping.sport}/${mapping.league}/scoreboard`;
    if (date) {
      url += `?dates=${date}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`ESPN returned status ${res.status}`);
      }

      const json = await res.json();
      const events: any[] = json.events || [];

      const parsedGames = events
        .map((event) => this.normalizeESPNEvent(event, league))
        .filter((g): g is SportsGame => g !== null);

      return parsedGames;
    } catch (err: any) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Primary getGames endpoint with caching and explicit demo-only fallback
   */
  async getGames(filter?: GameScheduleFilter): Promise<SportsGame[]> {
    const cacheKey = `${filter?.league || 'ALL'}_${filter?.status || 'ALL'}_${filter?.date || 'TODAY'}`;
    const cached = this.cache.get(cacheKey);

    // Dynamic TTL: live games get 25s TTL; static schedules get 5 mins
    const now = Date.now();
    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Deduplicate in-flight promises to avoid request stampedes
    if (this.activePendingRequests.has(cacheKey)) {
      return this.activePendingRequests.get(cacheKey)!;
    }

    const fetchPromise = (async () => {
      try {
        let allGames: SportsGame[] = [];

        if (filter?.league) {
          // Single league request
          allGames = await this.fetchLeagueScoreboard(filter.league, filter.date);
        } else {
          // Multi-league concurrent aggregation
          // Focus on active high-demand sports
          const targetLeagues: SportsLeague[] = [
            'MLB',
            'NCAA_FB',
            'NFL',
            'MLS',
            'SOCCER',
            'NBA',
            'NHL',
            'NCAA_BB'
          ];

          const settleResults = await Promise.allSettled(
            targetLeagues.map((l) => this.fetchLeagueScoreboard(l, filter?.date))
          );

          const failures: string[] = [];
          settleResults.forEach((res, index) => {
            if (res.status === 'fulfilled') allGames.push(...res.value);
            else failures.push(`${targetLeagues[index]}: ${String(res.reason)}`);
          });
          if (failures.length) this.lastError = failures.join('; ');
        }

        if (allGames.length > 0) {
          this.isUsingFallback = false;
          this.lastSyncTime = new Date().toISOString();
          this.lastError = undefined;

          // Filter by status if requested
          if (filter?.status) {
            allGames = allGames.filter((g) => g.status === filter.status);
          }

          // Sort games: LIVE games first, then upcoming chronologically, then final
          allGames.sort((a, b) => {
            if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
            if (b.status === 'LIVE' && a.status !== 'LIVE') return 1;
            if (a.status === 'HALFTIME' && b.status !== 'HALFTIME') return -1;
            if (b.status === 'HALFTIME' && a.status !== 'HALFTIME') return 1;
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          });

          // Determine cache TTL: shorter if games are actively live
          const hasLive = allGames.some((g) => g.status === 'LIVE' || g.status === 'HALFTIME');
          const ttl = hasLive ? 25000 : 180000;

          this.cache.set(cacheKey, { data: allGames, timestamp: now, ttl });
          return allGames;
        }
      } catch (err: any) {
        this.lastError = err.message || 'ESPN fetch failed';
        this.isUsingFallback = true;
      }

      // Seeded fixtures are available only when demo mode is explicitly enabled.
      if (isDemoMode) {
        let demoGames = [...SEEDED_GAMES];
        if (filter?.league) demoGames = demoGames.filter((g) => g.league === filter.league);
        if (filter?.status) demoGames = demoGames.filter((g) => g.status === filter.status);
        this.cache.set(cacheKey, { data: demoGames, timestamp: now, ttl: 45000 });
        return demoGames;
      }

      if (!this.lastError) this.lastError = 'ESPN returned no games for the requested schedule.';
      this.isUsingFallback = true;
      this.cache.set(cacheKey, { data: [], timestamp: now, ttl: 45000 });
      return [];
    })();

    this.activePendingRequests.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      this.activePendingRequests.delete(cacheKey);
    }
  }

  async getGameById(gameId: string): Promise<SportsGame | null> {
    const cleanId = gameId.replace(/^espn_/, '');
    const games = await this.getGames();
    const found = games.find((g) => g.id === gameId || g.externalGameId === cleanId);
    if (found) return found;

    // Search across all leagues if not in current general feed
    for (const league of await this.getLeagues()) {
      const leagueGames = await this.getGames({ league });
      const match = leagueGames.find((g) => g.id === gameId || g.externalGameId === cleanId);
      if (match) return match;
    }
    return null;
  }

  /**
   * Fetches deep ESPN event summary (box score, odds, win prob, scoring plays)
   */
  async getGameSummary(gameId: string, league?: SportsLeague): Promise<GameSummaryData | null> {
    const cleanId = gameId.replace(/^espn_/, '');
    const cacheKey = `summary_${cleanId}`;
    const cached = this.summaryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.data;
    }

    // Identify league if not passed
    let targetLeague = league;
    if (!targetLeague) {
      const game = await this.getGameById(gameId);
      if (game) targetLeague = game.league;
    }

    if (!targetLeague || !ESPN_LEAGUE_MAP[targetLeague]) {
      return null;
    }

    const mapping = ESPN_LEAGUE_MAP[targetLeague];
    const url = `${this.baseUrl}/${mapping.sport}/${mapping.league}/summary?event=${cleanId}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      // Extract situation & drive info
      const sit = json.situation;
      let situationText: string | undefined;
      let downDistanceText: string | undefined;
      let redZone: boolean | undefined;

      if (sit?.down && sit?.distance) {
        downDistanceText = `${sit.down === 1 ? '1st' : sit.down === 2 ? '2nd' : sit.down === 3 ? '3rd' : `${sit.down}th`} & ${sit.distance === 0 ? 'Goal' : sit.distance}`;
        situationText = `${downDistanceText} at ${sit.possessionText || ''}`;
        redZone = sit.isRedZone || (sit.yardLine !== undefined && sit.yardLine <= 20);
      }

      // Baseball specifics
      let baseballSituation = undefined;
      if (targetLeague === 'MLB' && sit) {
        baseballSituation = {
          balls: sit.balls || 0,
          strikes: sit.strikes || 0,
          outs: sit.outs || 0,
          onFirst: !!sit.onFirst,
          onSecond: !!sit.onSecond,
          onThird: !!sit.onThird
        };
      }

      // Win probability
      let winProbability = undefined;
      if (json.winProbability && json.winProbability.length > 0) {
        const latest = json.winProbability[json.winProbability.length - 1];
        const homeProb = Math.round(latest.homeWinPercentage * 100);
        winProbability = {
          home: homeProb,
          away: 100 - homeProb
        };
      }

      // Odds
      let odds: GameOdds | undefined;
      const pickcenter = json.pickcenter?.[0];
      if (pickcenter) {
        odds = {
          details: pickcenter.details,
          overUnder: pickcenter.overUnder,
          spread: pickcenter.spread,
          favorite: pickcenter.favorite?.displayName,
          provider: pickcenter.provider?.name || 'ESPN BET'
        };
      }

      // Scoring plays
      const scoringPlays: ScoringPlay[] = (json.scoringPlays || []).slice(-5).map((sp: any) => ({
        id: sp.id || String(Math.random()),
        period: sp.period?.shortDetail || 'Qtr',
        clock: sp.clock?.displayValue || '',
        team: sp.team?.abbreviation || 'Score',
        scoreHome: sp.homeScore || 0,
        scoreAway: sp.awayScore || 0,
        description: sp.text || 'Scoring play'
      }));

      // Top performers / leaders
      const topPerformers: TopPerformer[] = [];
      if (json.leaders) {
        for (const category of json.leaders.slice(0, 2)) {
          const leader = category.leaders?.[0];
          if (leader) {
            topPerformers.push({
              name: leader.athlete?.displayName || 'Key Performer',
              team: leader.team?.abbreviation || '',
              position: leader.athlete?.position?.abbreviation,
              headshot: leader.athlete?.headshot?.href,
              statLine: `${category.displayName}: ${leader.displayValue}`
            });
          }
        }
      }

      const summaryData: GameSummaryData = {
        gameId,
        league: targetLeague,
        venue: json.gameInfo?.venue
          ? {
              name: json.gameInfo.venue.fullName,
              city: json.gameInfo.venue.address?.city,
              state: json.gameInfo.venue.address?.state,
              indoor: json.gameInfo.venue.indoor,
              capacity: json.gameInfo.venue.capacity
            }
          : undefined,
        odds,
        situationText,
        downDistanceText,
        redZone,
        baseballSituation,
        scoringPlays,
        topPerformers,
        winProbability,
        attendance: json.gameInfo?.attendance,
        lastUpdated: new Date().toISOString()
      };

      this.summaryCache.set(cacheKey, { data: summaryData, timestamp: Date.now() });
      return summaryData;
    } catch {
      return null;
    }
  }

  async getBroadcastForGame(gameId: string): Promise<BroadcastIntelligence | null> {
    const game = await this.getGameById(gameId);
    return game?.broadcast || null;
  }
}
