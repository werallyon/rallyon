import { ISportsDataProvider } from './types';
import { ESPNSportsDataProvider } from './espnProvider';
import { CommercialSportsDataProvider } from './commercialProvider';
import { CuratedSportsDataProvider } from './curatedProvider';

/**
 * Provider Registry for RallyOn Sports Data Layer
 * Encapsulates provider instantiation and switching.
 */
export class SportsDataProviderRegistry {
  private providers: Map<string, ISportsDataProvider> = new Map();
  private activeProviderId: string;

  constructor() {
    const espn = new ESPNSportsDataProvider();
    const commercial = new CommercialSportsDataProvider();
    const curated = new CuratedSportsDataProvider();

    this.registerProvider(espn);
    this.registerProvider(commercial);
    this.registerProvider(curated);

    // Default to ESPN Public Provider (no API key needed, real-time live feeds)
    this.activeProviderId = espn.id;
  }

  registerProvider(provider: ISportsDataProvider): void {
    this.providers.set(provider.id, provider);
  }

  getActiveProvider(): ISportsDataProvider {
    const active = this.providers.get(this.activeProviderId);
    if (!active) {
      // Fallback
      return Array.from(this.providers.values())[0];
    }
    return active;
  }

  setActiveProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
      return true;
    }
    return false;
  }

  getProvider(providerId: string): ISportsDataProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): ISportsDataProvider[] {
    return Array.from(this.providers.values());
  }
}

export const sportsProviderRegistry = new SportsDataProviderRegistry();
