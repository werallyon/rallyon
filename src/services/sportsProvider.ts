/**
 * RallyOn Centralized Sports Data Provider Layer
 * Backwards-compatible export layer delegating to the modular Sports Provider Architecture.
 */

export * from './sports/types';
export * from './sports/espnProvider';
export * from './sports/commercialProvider';
export * from './sports/curatedProvider';
export * from './sports/sportsRegistry';
export * from './sports/sportsService';

// Legacy Aliases for seamless backward compatibility
import {
  ISportsDataProvider,
  SportsProviderStatus as NewSportsProviderStatus
} from './sports/types';
import { ESPNSportsDataProvider } from './sports/espnProvider';
import { sportsService, SportsService } from './sports/sportsService';

export type ISportsProvider = ISportsDataProvider;
export type SportsProviderStatus = NewSportsProviderStatus;
export const ESPNProvider = ESPNSportsDataProvider;

export const sportsProvider = {
  name: 'ESPN Public Sports Data Feed',
  isExternalConfigured: true,
  getGames: (filter?: any) => sportsService.getGames(filter),
  getGameById: (id: string) => sportsService.getGameById(id),
  getStatus: () => sportsService.getStatus(),
  refresh: () => sportsService.refreshGames()
};
