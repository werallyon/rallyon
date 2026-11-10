import { Market, City, MarketLaunchStatus, Venue } from '../types';
import { SEEDED_MARKETS, SEEDED_CITIES } from '../data/marketsData';

const STORAGE_MARKETS_KEY = 'rallyon_markets_v2';
const STORAGE_CITIES_KEY = 'rallyon_cities_v2';
const STORAGE_ACTIVE_MARKET_ID_KEY = 'rallyon_active_market_id_v2';

// Standard Haversine distance in miles
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class MarketService {
  private markets: Market[] = [];
  private cities: City[] = [];
  private activeMarketId: string = 'market_texarkana';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedMarkets = localStorage.getItem(STORAGE_MARKETS_KEY);
      this.markets = storedMarkets ? JSON.parse(storedMarkets) : SEEDED_MARKETS;

      const storedCities = localStorage.getItem(STORAGE_CITIES_KEY);
      this.cities = storedCities ? JSON.parse(storedCities) : SEEDED_CITIES;

      const storedActiveId = localStorage.getItem(STORAGE_ACTIVE_MARKET_ID_KEY);
      if (storedActiveId && this.markets.some((m) => m.id === storedActiveId)) {
        this.activeMarketId = storedActiveId;
      } else {
        // Ensure default is the initial live market: Texarkana
        this.activeMarketId = 'market_texarkana';
      }
    } catch {
      this.markets = [...SEEDED_MARKETS];
      this.cities = [...SEEDED_CITIES];
      this.activeMarketId = 'market_texarkana';
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_MARKETS_KEY, JSON.stringify(this.markets));
      localStorage.setItem(STORAGE_CITIES_KEY, JSON.stringify(this.cities));
      localStorage.setItem(STORAGE_ACTIVE_MARKET_ID_KEY, this.activeMarketId);
    } catch {
      // ignore storage quota errors
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('MarketService listener error:', err);
      }
    });
  }

  // ==========================================
  // ACTIVE MARKET MANAGEMENT
  // ==========================================

  public getActiveMarket(): Market {
    const found = this.markets.find((m) => m.id === this.activeMarketId);
    if (found) return found;
    // Fallback to Texarkana
    const fallback =
      this.markets.find((m) => m.id === 'market_texarkana') || this.markets[0];
    return fallback;
  }

  public setActiveMarket(marketId: string): void {
    const market = this.markets.find((m) => m.id === marketId);
    if (market) {
      this.activeMarketId = marketId;
      this.saveToStorage();
    }
  }

  public getAllMarkets(): Market[] {
    return [...this.markets];
  }

  public getLiveMarkets(): Market[] {
    return this.markets.filter(
      (m) => m.launch_status === 'LIVE' || m.launch_status === 'EXPANDING'
    );
  }

  public getExpansionCandidates(): Market[] {
    return this.markets.filter(
      (m) =>
        m.launch_status === 'PREPARING' ||
        m.launch_status === 'SOFT_LAUNCH' ||
        m.launch_status === 'PLANNED'
    );
  }

  public getMarketById(id: string): Market | undefined {
    return this.markets.find((m) => m.id === id);
  }

  public getCitiesForMarket(marketId: string): City[] {
    return this.cities.filter((c) => c.market_id === marketId);
  }

  public getAllCities(): City[] {
    return [...this.cities];
  }

  // ==========================================
  // GEOGRAPHIC RESOLUTION (GPS -> MARKET)
  // ==========================================

  /**
   * Resolves the closest market given GPS latitude & longitude.
   * If within the market's defined radius, returns that market.
   * If outside all market boundaries, returns the closest market.
   */
  public detectMarketFromCoordinates(
    latitude: number,
    longitude: number
  ): { market: Market; distanceMiles: number; isWithinBoundary: boolean } {
    let closestMarket = this.getActiveMarket();
    let minDistance = Infinity;

    for (const market of this.markets) {
      const dist = calculateDistanceMiles(
        latitude,
        longitude,
        market.latitude,
        market.longitude
      );

      // Check if inside defined radius
      if (dist <= market.radius) {
        return {
          market,
          distanceMiles: dist,
          isWithinBoundary: true
        };
      }

      if (dist < minDistance) {
        minDistance = dist;
        closestMarket = market;
      }
    }

    return {
      market: closestMarket,
      distanceMiles: Math.round(minDistance * 10) / 10,
      isWithinBoundary: false
    };
  }

  // ==========================================
  // SEARCH MARKETS (FOR "WATCHING SOMEWHERE ELSE?")
  // ==========================================

  public searchMarkets(query: string): Market[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAllMarkets();

    return this.markets.filter((m) => {
      const matchName = m.name.toLowerCase().includes(q);
      const matchState =
        m.state.toLowerCase().includes(q) ||
        m.state_code.toLowerCase().includes(q);
      const matchSlug = m.slug.toLowerCase().includes(q);

      // Also check if any child city matches
      const matchingCities = this.cities.some(
        (c) => c.market_id === m.id && c.name.toLowerCase().includes(q)
      );

      return matchName || matchState || matchSlug || matchingCities;
    });
  }

  // ==========================================
  // MARKET ADMIN OPERATIONS
  // ==========================================

  public createMarket(
    data: Omit<Market, 'id' | 'created_at' | 'updated_at'>
  ): Market {
    const id = `market_${Date.now()}`;
    const now = new Date().toISOString();
    const newMarket: Market = {
      ...data,
      id,
      created_at: now,
      updated_at: now
    };
    this.markets.unshift(newMarket);
    this.saveToStorage();
    return newMarket;
  }

  public updateMarket(id: string, updates: Partial<Market>): Market {
    const idx = this.markets.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error(`Market ${id} not found`);

    const updated: Market = {
      ...this.markets[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.markets[idx] = updated;
    this.saveToStorage();
    return updated;
  }

  public setMarketLaunchStatus(
    id: string,
    launch_status: MarketLaunchStatus
  ): Market {
    return this.updateMarket(id, {
      launch_status,
      status: launch_status === 'PAUSED' ? 'INACTIVE' : 'ACTIVE',
      launch_date:
        launch_status === 'LIVE' ? new Date().toISOString() : undefined
    });
  }

  public addCity(cityData: Omit<City, 'id'>): City {
    const id = `city_${Date.now()}`;
    const newCity: City = {
      ...cityData,
      id
    };
    this.cities.push(newCity);
    this.saveToStorage();
    return newCity;
  }

  // ==========================================
  // VENUE FILTERING BY MARKET
  // ==========================================

  /**
   * Filter a list of venues by active market or specified marketId.
   * If a venue has an explicit market_id, it is matched directly.
   * If not, its coordinates are checked against the market's center and radius.
   */
  public filterVenuesByMarket(venues: Venue[], marketId?: string): Venue[] {
    const targetId = marketId || this.activeMarketId;
    const targetMarket = this.getMarketById(targetId) || this.getActiveMarket();

    return venues.filter((v) => {
      if (v.market_id) {
        return v.market_id === targetId;
      }
      // Geographic radius fallback
      const dist = calculateDistanceMiles(
        v.latitude,
        v.longitude,
        targetMarket.latitude,
        targetMarket.longitude
      );
      return dist <= targetMarket.radius;
    });
  }
}

export const marketService = new MarketService();
