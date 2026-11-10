import { Venue, GooglePlaceData, VenuePlaceMatch } from '../types';

export interface PlacesServiceStatus {
  isConfigured: boolean;
  mode: 'CONFIGURED' | 'USING_DEMO_CACHE';
  apiKeyFound: boolean;
  placesCachedCount: number;
}

// Pre-seeded Google Places intelligence for verified Austin sports venues
const SEEDED_GOOGLE_PLACES: Record<string, GooglePlaceData> = {
  place_bufords: {
    placeId: 'ChIJz2x3w7m1RIYRC_G7uIqyf9c',
    name: "Buford's Backyard Beer Garden",
    formattedAddress: '700 W 6th St, Austin, TX 78701',
    formattedPhoneNumber: '(512) 580-4822',
    website: 'https://bufordsaustin.com',
    location: { lat: 30.2694, lng: -97.7495 },
    rating: 4.4,
    userRatingsTotal: 1850,
    businessStatus: 'OPERATIONAL',
    priceLevel: 2,
    openNow: true,
    weekdayText: [
      'Monday: 4:00 PM – 2:00 AM',
      'Tuesday: 4:00 PM – 2:00 AM',
      'Wednesday: 4:00 PM – 2:00 AM',
      'Thursday: 2:00 PM – 2:00 AM',
      'Friday: 12:00 PM – 2:00 AM',
      'Saturday: 11:00 AM – 2:00 AM',
      'Sunday: 11:00 AM – 2:00 AM'
    ],
    photos: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80'
    ],
    types: ['bar', 'restaurant', 'point_of_interest', 'establishment'],
    googleMapsUrl: 'https://maps.google.com/?cid=12847192847192',
    lastFetchedAt: '2026-08-30T14:00:00Z'
  },
  place_cover3: {
    placeId: 'ChIJN568Rre1RIYRe_O946r3k4I',
    name: 'Cover 3 - Downtown',
    formattedAddress: '1717 W 6th St, Austin, TX 78703',
    formattedPhoneNumber: '(512) 982-9870',
    website: 'https://cover-3.com',
    location: { lat: 30.2764, lng: -97.7661 },
    rating: 4.6,
    userRatingsTotal: 2120,
    businessStatus: 'OPERATIONAL',
    priceLevel: 2,
    openNow: true,
    weekdayText: [
      'Monday: 11:00 AM – 11:00 PM',
      'Tuesday: 11:00 AM – 11:00 PM',
      'Wednesday: 11:00 AM – 11:00 PM',
      'Thursday: 11:00 AM – 12:00 AM',
      'Friday: 11:00 AM – 12:00 AM',
      'Saturday: 10:00 AM – 12:00 AM',
      'Sunday: 10:00 AM – 11:00 PM'
    ],
    photos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
    ],
    types: ['bar', 'restaurant', 'sports_bar'],
    googleMapsUrl: 'https://maps.google.com/?cid=9847192837192',
    lastFetchedAt: '2026-08-30T14:00:00Z'
  },
  place_haymaker: {
    placeId: 'ChIJP6KeqLG1RIYRz89kLgQ1X1U',
    name: 'Haymaker',
    formattedAddress: '2310 Manor Rd, Austin, TX 78722',
    formattedPhoneNumber: '(512) 243-6702',
    website: 'https://haymakeraustin.com',
    location: { lat: 30.2842, lng: -97.7176 },
    rating: 4.5,
    userRatingsTotal: 1940,
    businessStatus: 'OPERATIONAL',
    priceLevel: 2,
    openNow: true,
    weekdayText: ['Monday–Sunday: 11:00 AM – 2:00 AM'],
    photos: [
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80'
    ],
    types: ['bar', 'restaurant', 'sports_bar'],
    googleMapsUrl: 'https://maps.google.com/?cid=472918471928',
    lastFetchedAt: '2026-08-30T14:00:00Z'
  },
  place_lavaca: {
    placeId: 'ChIJ5740Gba1RIYRj3KLaaB9410',
    name: 'Lavaca Street Bar',
    formattedAddress: '405 Lavaca St, Austin, TX 78701',
    formattedPhoneNumber: '(512) 469-0106',
    website: 'https://lavacastreet.com',
    location: { lat: 30.2678, lng: -97.7461 },
    rating: 4.3,
    userRatingsTotal: 1420,
    businessStatus: 'OPERATIONAL',
    priceLevel: 2,
    openNow: true,
    weekdayText: ['Monday–Sunday: 11:00 AM – 2:00 AM'],
    photos: [
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80'
    ],
    types: ['bar', 'sports_bar'],
    googleMapsUrl: 'https://maps.google.com/?cid=194827491028',
    lastFetchedAt: '2026-08-30T14:00:00Z'
  },
  place_jack_allens: {
    placeId: 'ChIJ8194a2e1RIYRh_M03901LkU',
    name: "Jack Allen's Kitchen",
    formattedAddress: '7720 TX-71, Austin, TX 78735',
    formattedPhoneNumber: '(512) 852-8558',
    website: 'https://jackallenskitchen.com',
    location: { lat: 30.2458, lng: -97.8653 },
    rating: 4.7,
    userRatingsTotal: 3410,
    businessStatus: 'OPERATIONAL',
    priceLevel: 2,
    openNow: true,
    weekdayText: ['Monday–Sunday: 11:00 AM – 10:00 PM'],
    photos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
    ],
    types: ['restaurant', 'bar'],
    googleMapsUrl: 'https://maps.google.com/?cid=894729182741',
    lastFetchedAt: '2026-08-30T14:00:00Z'
  }
};

const STORAGE_MATCHES_KEY = 'rallyon_venue_place_matches_v1';

export class GooglePlacesService {
  private apiKey: string;
  private placesCache: Map<string, GooglePlaceData> = new Map();
  private venueMatches: Map<string, VenuePlaceMatch> = new Map();

  constructor() {
    this.apiKey =
      (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY ||
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      '';

    // Seed initial places
    Object.values(SEEDED_GOOGLE_PLACES).forEach((place) => {
      this.placesCache.set(place.placeId, place);
    });

    this.loadPersistedMatches();
  }

  private loadPersistedMatches() {
    try {
      const stored = localStorage.getItem(STORAGE_MATCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([venueId, match]) => {
          this.venueMatches.set(venueId, match as VenuePlaceMatch);
        });
      } else {
        // Initial default mappings for seeded venues
        this.venueMatches.set('venue_bufords', {
          venueId: 'venue_bufords',
          placeId: SEEDED_GOOGLE_PLACES.place_bufords.placeId,
          matchConfidence: 99,
          matchSource: 'AUTOMATIC',
          matchedAt: '2026-08-30T12:00:00Z'
        });
        this.venueMatches.set('venue_cover3', {
          venueId: 'venue_cover3',
          placeId: SEEDED_GOOGLE_PLACES.place_cover3.placeId,
          matchConfidence: 98,
          matchSource: 'AUTOMATIC',
          matchedAt: '2026-08-30T12:00:00Z'
        });
        this.venueMatches.set('venue_haymaker', {
          venueId: 'venue_haymaker',
          placeId: SEEDED_GOOGLE_PLACES.place_haymaker.placeId,
          matchConfidence: 99,
          matchSource: 'AUTOMATIC',
          matchedAt: '2026-08-30T12:00:00Z'
        });
        this.venueMatches.set('venue_lavaca', {
          venueId: 'venue_lavaca',
          placeId: SEEDED_GOOGLE_PLACES.place_lavaca.placeId,
          matchConfidence: 96,
          matchSource: 'AUTOMATIC',
          matchedAt: '2026-08-30T12:00:00Z'
        });
      }
    } catch {
      // ignore
    }
  }

  private persistMatches() {
    try {
      const obj: Record<string, VenuePlaceMatch> = {};
      this.venueMatches.forEach((v, k) => {
        obj[k] = v;
      });
      localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(obj));
    } catch {
      // ignore
    }
  }

  getStatus(): PlacesServiceStatus {
    return {
      isConfigured: Boolean(this.apiKey && this.apiKey.length > 5),
      mode: this.apiKey && this.apiKey.length > 5 ? 'CONFIGURED' : 'USING_DEMO_CACHE',
      apiKeyFound: Boolean(this.apiKey && this.apiKey.length > 5),
      placesCachedCount: this.placesCache.size
    };
  }

  /**
   * Normalizes raw Google Places API result into RallyOn GooglePlaceData model
   */
  normalizeGooglePlace(raw: any): GooglePlaceData {
    return {
      placeId: raw.place_id || raw.id,
      name: raw.name || '',
      formattedAddress: raw.formatted_address || raw.vicinity || '',
      formattedPhoneNumber: raw.formatted_phone_number || raw.international_phone_number,
      website: raw.website,
      location: {
        lat: raw.geometry?.location?.lat || 0,
        lng: raw.geometry?.location?.lng || 0
      },
      rating: raw.rating,
      userRatingsTotal: raw.user_ratings_total,
      businessStatus: raw.business_status || 'OPERATIONAL',
      priceLevel: raw.price_level,
      openNow: raw.opening_hours?.open_now,
      weekdayText: raw.opening_hours?.weekday_text,
      photos: raw.photos?.map(
        (p: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${this.apiKey}`
      ),
      types: raw.types,
      googleMapsUrl: raw.url,
      lastFetchedAt: new Date().toISOString()
    };
  }

  /**
   * Venue Identity / Place Matching algorithm (Section 5)
   * Prevents duplicates by computing cross-attribute similarity
   */
  computeMatchConfidence(venue: Venue, place: GooglePlaceData): number {
    let score = 0;

    // 1. Name match (case insensitive normalized)
    const normVenueName = venue.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normPlaceName = place.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normVenueName === normPlaceName) {
      score += 45;
    } else if (normVenueName.includes(normPlaceName) || normPlaceName.includes(normVenueName)) {
      score += 35;
    }

    // 2. Coordinate proximity (< 150 meters)
    const latDiff = Math.abs(venue.latitude - place.location.lat);
    const lngDiff = Math.abs(venue.longitude - place.location.lng);
    const approxDistMeters = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000;
    if (approxDistMeters < 50) {
      score += 35;
    } else if (approxDistMeters < 200) {
      score += 25;
    }

    // 3. Address match
    if (venue.address && place.formattedAddress) {
      const venueStreet = venue.address.toLowerCase().split(',')[0];
      if (place.formattedAddress.toLowerCase().includes(venueStreet)) {
        score += 20;
      }
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Get enriched Google Place Data for a RallyOn venue
   */
  getPlaceForVenue(venueId: string): GooglePlaceData | null {
    const match = this.venueMatches.get(venueId);
    if (!match || match.matchSource === 'UNMATCHED') return null;
    return this.placesCache.get(match.placeId) || null;
  }

  /**
   * Get match details for a venue
   */
  getVenueMatch(venueId: string): VenuePlaceMatch | null {
    return this.venueMatches.get(venueId) || null;
  }

  /**
   * Administrator manual override to resolve or re-link a place
   */
  resolveMatch(venueId: string, placeId: string, reason: string): VenuePlaceMatch {
    const match: VenuePlaceMatch = {
      venueId,
      placeId,
      matchConfidence: 100,
      matchSource: 'ADMIN_OVERRIDE',
      matchedAt: new Date().toISOString(),
      discrepancies: [reason]
    };
    this.venueMatches.set(venueId, match);
    this.persistMatches();
    return match;
  }

  /**
   * Administrator manual unlink
   */
  unlinkMatch(venueId: string) {
    this.venueMatches.delete(venueId);
    this.persistMatches();
  }

  /**
   * Enriches a list of venues with external Google Place metadata,
   * keeping RallyOn's proprietary intelligence strictly separated.
   */
  enrichVenues(venues: Venue[]): Venue[] {
    return venues.map((venue) => {
      const placeData = this.getPlaceForVenue(venue.id);
      if (!placeData) return venue;

      return {
        ...venue,
        googlePlaceId: placeData.placeId,
        googlePlaceData: placeData
      };
    });
  }
}

export const googlePlacesService = new GooglePlacesService();
