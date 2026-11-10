import {
  SportsGame,
  SportsLeague,
  BroadcastIntelligence
} from '../../types';
import {
  ISportsDataProvider,
  SportsProviderStatus,
  GameScheduleFilter,
  GameSummaryData
} from './types';
import { SEEDED_GAMES } from '../../data/seedData';

/**
 * Curated Seeded Sports Data Provider
 * Guaranteed high-fidelity fallback when offline or in simulated demo mode.
 */
export class CuratedSportsDataProvider implements ISportsDataProvider {
  readonly id = 'curated-seed-v1';
  readonly name = 'RallyOn Curated Sports Schedule';
  readonly type = 'CURATED_SEEDED';
  readonly requiresApiKey = false;
  isConfigured = true;

  getStatus(): SportsProviderStatus {
    return {
      providerId: this.id,
      name: this.name,
      type: this.type,
      isConfigured: true,
      requiresApiKey: false,
      mode: 'DEMO_FALLBACK',
      activeEndpoints: ['Local High-Fidelity Sports Fixtures Matrix'],
      lastSync: new Date().toISOString(),
      cachedGamesCount: SEEDED_GAMES.length
    };
  }

  async getLeagues(): Promise<SportsLeague[]> {
    return ['NFL', 'NCAA_FB', 'NBA', 'NCAA_BB', 'MLB', 'NHL', 'MLS', 'SOCCER', 'UFC', 'PGA'];
  }

  async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    return {
      success: true,
      latencyMs: 1,
      message: 'Local Curated Fixtures Matrix responding instantly.'
    };
  }

  async getGames(filter?: GameScheduleFilter): Promise<SportsGame[]> {
    let list = [...SEEDED_GAMES];
    if (filter?.league) {
      list = list.filter((g) => g.league === filter.league);
    }
    if (filter?.status) {
      list = list.filter((g) => g.status === filter.status);
    }
    return list;
  }

  async getGameById(gameId: string): Promise<SportsGame | null> {
    return SEEDED_GAMES.find((g) => g.id === gameId || g.externalGameId === gameId) || null;
  }

  async getGameSummary(gameId: string, league?: SportsLeague): Promise<GameSummaryData | null> {
    const game = await this.getGameById(gameId);
    if (!game) return null;
    return {
      gameId,
      league: game.league,
      venue: { name: game.venueName || 'Downtown Sports Bar Stadium' },
      situationText: game.liveDetails?.situation,
      lastUpdated: new Date().toISOString()
    };
  }

  async getBroadcastForGame(gameId: string): Promise<BroadcastIntelligence | null> {
    const game = await this.getGameById(gameId);
    return game?.broadcast || null;
  }
}
