import {
  SportsGame,
  SportsLeague,
  GameStatus,
  BroadcastIntelligence
} from '../../types';
import {
  ISportsDataProvider,
  SportsProviderStatus,
  GameScheduleFilter,
  GameSummaryData,
  SportsProviderConfig
} from './types';
import { sportsProviderRegistry } from './sportsRegistry';

/**
 * Centralized Sports Service
 * Application-wide singleton for sports schedules, live game states,
 * and broadcast intelligence. Decoupled from specific underlying sports data vendors.
 */
export class SportsService {
  private registry = sportsProviderRegistry;
  private listeners: Set<() => void> = new Set();
  private tickerInterval?: any;
  private isAutoRefreshing = false;

  constructor() {
    this.startLiveScoreTicker();
  }

  getActiveProvider(): ISportsDataProvider {
    return this.registry.getActiveProvider();
  }

  setProvider(provider: ISportsDataProvider): void {
    this.registry.registerProvider(provider);
    this.registry.setActiveProvider(provider.id);
    this.notify();
  }

  setActiveProviderById(providerId: string): boolean {
    const success = this.registry.setActiveProvider(providerId);
    if (success) {
      this.notify();
    }
    return success;
  }

  getAvailableProviders(): ISportsDataProvider[] {
    return this.registry.getAllProviders();
  }

  getStatus(): SportsProviderStatus {
    return this.getActiveProvider().getStatus();
  }

  async testActiveConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    return this.getActiveProvider().testConnection();
  }

  configureActiveProvider(config: Partial<SportsProviderConfig>): void {
    const provider = this.getActiveProvider();
    if (provider.configure) {
      provider.configure(config);
      this.notify();
    }
  }

  async getLeagues(): Promise<SportsLeague[]> {
    return this.getActiveProvider().getLeagues();
  }

  async getGames(filter?: GameScheduleFilter): Promise<SportsGame[]> {
    return this.getActiveProvider().getGames(filter);
  }

  async getGameById(gameId: string): Promise<SportsGame | null> {
    return this.getActiveProvider().getGameById(gameId);
  }

  async getGameSummary(gameId: string, league?: SportsLeague): Promise<GameSummaryData | null> {
    const provider = this.getActiveProvider();
    if (provider.getGameSummary) {
      return provider.getGameSummary(gameId, league);
    }
    return null;
  }

  async getBroadcastForGame(gameId: string): Promise<BroadcastIntelligence | null> {
    return this.getActiveProvider().getBroadcastForGame(gameId);
  }

  /**
   * Manual refresh trigger from UI
   */
  async refreshGames(): Promise<SportsGame[]> {
    const games = await this.getGames();
    this.notify();
    return games;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in sports service subscriber', e);
      }
    });
  }

  /**
   * Live Ticker: periodically pings the active sports provider
   * to keep live score clocks and quarter/period details fresh.
   */
  private startLiveScoreTicker(): void {
    if (typeof window === 'undefined') return;
    if (this.tickerInterval) clearInterval(this.tickerInterval);

    // Refresh every 30 seconds
    this.tickerInterval = setInterval(async () => {
      if (this.isAutoRefreshing) return;
      this.isAutoRefreshing = true;
      try {
        await this.getActiveProvider().getGames();
        this.notify();
      } catch {
        // silent fail in background ticker
      } finally {
        this.isAutoRefreshing = false;
      }
    }, 30000);
  }
}

export const sportsService = new SportsService();
