import {
  SportsGame,
  SportsLeague,
  SportsTeam,
  GameStatus,
  BroadcastIntelligence
} from '../../types';

export type SportsProviderType = 'ESPN_PUBLIC' | 'COMMERCIAL_LICENSED' | 'CURATED_SEEDED';

export interface SportsProviderStatus {
  providerId: string;
  name: string;
  type: SportsProviderType;
  isConfigured: boolean;
  requiresApiKey: boolean;
  mode: 'LIVE_FEED' | 'DEMO_FALLBACK';
  activeEndpoints: string[];
  lastSync?: string;
  error?: string;
  latencyMs?: number;
  cachedGamesCount: number;
}

export interface SportsProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  providerVendor?: 'ESPN_PUBLIC' | 'SPORTRADAR' | 'STATS_PERFORM' | 'THE_RUNDOWN' | 'CUSTOM_GATEWAY';
  timeoutMs?: number;
  cacheTtlLiveMs?: number;
  cacheTtlScheduledMs?: number;
  headers?: Record<string, string>;
  corsProxyUrl?: string;
}

export interface GameScheduleFilter {
  league?: SportsLeague;
  status?: GameStatus;
  date?: string; // YYYYMMDD or ISO string
  limit?: number;
  featuredOnly?: boolean;
}

export interface ScoringPlay {
  id: string;
  period: string;
  clock: string;
  team: string;
  scoreHome: number;
  scoreAway: number;
  description: string;
}

export interface GameOdds {
  details?: string; // e.g. "TEX -6.5"
  overUnder?: number; // e.g. 52.5
  spread?: number; // e.g. -6.5
  favorite?: string; // e.g. "TEX"
  provider?: string; // e.g. "ESPN BET"
}

export interface TopPerformer {
  name: string;
  team: string;
  position?: string;
  headshot?: string;
  statLine: string; // e.g. "24 PTS, 8 REB" or "285 YDS, 3 TD"
}

export interface GameSummaryData {
  gameId: string;
  league: SportsLeague;
  venue?: {
    name: string;
    city?: string;
    state?: string;
    indoor?: boolean;
    capacity?: number;
  };
  odds?: GameOdds;
  situationText?: string;
  possession?: 'home' | 'away';
  downDistanceText?: string;
  redZone?: boolean;
  baseballSituation?: {
    balls: number;
    strikes: number;
    outs: number;
    onFirst: boolean;
    onSecond: boolean;
    onThird: boolean;
  };
  scoringPlays?: ScoringPlay[];
  topPerformers?: TopPerformer[];
  winProbability?: {
    home: number; // 0-100%
    away: number; // 0-100%
  };
  attendance?: number;
  lastUpdated: string;
}

/**
 * Pluggable Sports Data Provider Interface
 * Allows RallyOn to operate using ESPN's public endpoints today without requiring an API key,
 * while allowing a seamless drop-in swap to commercial sports feeds (Sportradar, Stats Perform, etc.)
 * in the future without altering application architecture.
 */
export interface ISportsDataProvider {
  readonly id: string;
  readonly name: string;
  readonly type: SportsProviderType;
  readonly requiresApiKey: boolean;
  isConfigured: boolean;

  getStatus(): SportsProviderStatus;
  getLeagues(): Promise<SportsLeague[]>;
  getGames(filter?: GameScheduleFilter): Promise<SportsGame[]>;
  getGameById(gameId: string): Promise<SportsGame | null>;
  getGameSummary?(gameId: string, league?: SportsLeague): Promise<GameSummaryData | null>;
  getBroadcastForGame(gameId: string): Promise<BroadcastIntelligence | null>;
  testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }>;
  configure?(config: Partial<SportsProviderConfig>): void;
}
