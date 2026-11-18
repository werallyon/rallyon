import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  ChevronRight,
  Compass,
  Crosshair,
  Flame,
  MapPin,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  Venue,
  VenueLiveState,
  UserIntent,
  SportsGame,
  VenueGame,
  Presence,
  RallyMatchResult,
  Market
} from '../types';

interface MapScreenProps {
  activeMarket: Market;
  venues: Venue[];
  liveStates: Record<string, VenueLiveState>;
  matchResults: RallyMatchResult[];
  games: SportsGame[];
  selectedGame: SportsGame | null;
  onSelectGame: (game: SportsGame | null) => void;
  currentIntent: UserIntent;
  onSelectIntent: (intent: UserIntent) => void;
  venueGames: VenueGame[];
  presences: Presence[];
  savedVenueIds: string[];
  onToggleSave: (venueId: string) => void;
  onSelectVenue: (venue: Venue) => void;
}

type MarkerCategory = 'ALL' | 'ACTIVE' | 'FRIENDS' | 'TRENDING' | 'GAME_ON';
type LatLng = { lat: number; lng: number };
type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
  addListener: (eventName: string, handler: () => void) => void;
};
type GoogleMap = {
  fitBounds: (bounds: unknown, padding?: number) => void;
  setCenter: (position: LatLng) => void;
  setZoom: (zoom: number) => void;
  panTo: (position: LatLng) => void;
};
type GoogleMapsApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
  Marker: new (options: Record<string, unknown>) => GoogleMarker;
  LatLngBounds: new () => { extend: (position: LatLng) => void };
};

declare global {
  interface Window {
    google?: { maps?: GoogleMapsApi };
  }
}

let googleMapsLoader: { apiKey: string; promise: Promise<GoogleMapsApi> } | null = null;

const loadGoogleMaps = (apiKey: string): Promise<GoogleMapsApi> => {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsLoader) {
    if (googleMapsLoader.apiKey !== apiKey) {
      return Promise.reject(new Error('Google Maps is already loading with a different API key. Reload the page after changing the configured key.'));
    }
    return googleMapsLoader.promise;
  }

  const promise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const script = document.createElement('script');
    const resetLoader = () => {
      if (googleMapsLoader?.promise === promise) googleMapsLoader = null;
      script.remove();
    };
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey) + '&v=weekly';
    script.async = true;
    script.defer = true;
    script.dataset.rallyonGoogleMaps = 'true';
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        resetLoader();
        reject(new Error('Google Maps loaded without its maps library.'));
      }
    };
    script.onerror = () => {
      resetLoader();
      reject(new Error('Google Maps could not load. Check the API key, billing and Maps JavaScript API access.'));
    };
    document.head.appendChild(script);
  });
  googleMapsLoader = { apiKey, promise };
  return promise;
};

const hasValidMapCoordinates = (venue: Venue): boolean =>
  Number.isFinite(venue.latitude) &&
  Number.isFinite(venue.longitude) &&
  venue.latitude >= -90 &&
  venue.latitude <= 90 &&
  venue.longitude >= -180 &&
  venue.longitude <= 180;

const getMapsApiKey = (): string => {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';
};

export const MapScreen: React.FC<MapScreenProps> = ({
  activeMarket,
  venues,
  liveStates,
  matchResults,
  games,
  selectedGame,
  onSelectGame,
  currentIntent: _currentIntent,
  onSelectIntent: _onSelectIntent,
  venueGames,
  presences,
  savedVenueIds,
  onToggleSave,
  onSelectVenue
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [selectedMarkerVenue, setSelectedMarkerVenue] = useState<Venue | null>(null);
  const [markerCategory, setMarkerCategory] = useState<MarkerCategory>('ALL');
  const apiKey = getMapsApiKey();

  const locatedVenues = useMemo(() => venues.filter(hasValidMapCoordinates), [venues]);

  useEffect(() => {
    setSelectedMarkerVenue((current) => {
      if (current) {
        const refreshed = locatedVenues.find((venue) => venue.id === current.id);
        if (refreshed) return refreshed;
      }
      return locatedVenues[0] || null;
    });
  }, [locatedVenues]);

  const getMarkerStatus = (venue: Venue) => {
    const live = liveStates[venue.id];
    const friends = presences.filter((presence) => presence.venueId === venue.id);
    const hasGameOn = venueGames.some(
      (programming) => programming.venueId === venue.id && programming.verificationStatus === 'GAME_ON'
    );

    if (friends.length > 0) return { type: 'FRIENDS', label: 'Friends here', icon: Users };
    if (live && live.trendingVelocity >= 25) return { type: 'TRENDING', label: 'Trending', icon: TrendingUp };
    if (hasGameOn) return { type: 'GAME_ON', label: 'Game on · venue verified', icon: Flame };
    if (live && live.crowd >= 75) return { type: 'ACTIVE', label: 'Active crowd', icon: Flame };
    return { type: 'LOW_ACTIVITY', label: 'Venue', icon: MapPin };
  };

  const matchesMarkerCategory = (venue: Venue, category: MarkerCategory): boolean => {
    if (category === 'ALL') return true;
    if (category === 'FRIENDS') return presences.some((presence) => presence.venueId === venue.id);
    if (category === 'TRENDING') return (liveStates[venue.id]?.trendingVelocity ?? 0) >= 25;
    if (category === 'GAME_ON') return venueGames.some(
      (programming) => programming.venueId === venue.id && programming.verificationStatus === 'GAME_ON'
    );
    return (liveStates[venue.id]?.crowd ?? 0) >= 75;
  };

  const visibleVenues = useMemo(() => locatedVenues.filter((venue) => {
    if (selectedGame && !venueGames.some((programming) => programming.venueId === venue.id && programming.gameId === selectedGame.id)) return false;
    return matchesMarkerCategory(venue, markerCategory);
  }), [locatedVenues, markerCategory, liveStates, presences, venueGames, selectedGame]);

  useEffect(() => {
    let cancelled = false;
    // A market change tears down the previous map. Clear readiness before starting
    // the next load so the marker effect runs after the replacement map is created.
    setMapReady(false);
    setMapError('');
    if (!apiKey) return;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !mapElementRef.current) return;
        const map = new maps.Map(mapElementRef.current, {
          center: { lat: activeMarket.latitude, lng: activeMarket.longitude },
          zoom: 9,
          mapTypeControl: true,
          mapTypeControlOptions: { style: 1 },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: true,
          gestureHandling: 'greedy'
        });
        mapRef.current = map;
        setMapError('');
        setMapReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : 'Google Maps is unavailable.');
          setMapReady(false);
        }
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, [apiKey, activeMarket.latitude, activeMarket.longitude]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new maps.LatLngBounds();
    visibleVenues.forEach((venue) => {
      const position = { lat: venue.latitude, lng: venue.longitude };
      bounds.extend(position);
      const match = matchResults.find((result) => result.venueId === venue.id);
      const status = getMarkerStatus(venue);
      const marker = new maps.Marker({
        map: mapRef.current,
        position,
        title: venue.name + ' · ' + status.label,
        icon: {
          path: 'M -8,0 A 8,8 0 1,1 8,0 A 8,8 0 1,1 -8,0',
          fillColor: status.type === 'GAME_ON' ? '#f59e0b' : status.type === 'FRIENDS' ? '#3b82f6' : status.type === 'TRENDING' ? '#9333ea' : status.type === 'ACTIVE' ? '#10b981' : '#52525b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.4
        },
        label: match ? { text: String(match.score), color: '#111827', fontWeight: '700' } : undefined
      });
      marker.addListener('click', () => setSelectedMarkerVenue(venue));
      markersRef.current.push(marker);
    });

    if (visibleVenues.length === 1) {
      mapRef.current.setCenter({ lat: visibleVenues[0].latitude, lng: visibleVenues[0].longitude });
      mapRef.current.setZoom(14);
    } else if (visibleVenues.length > 1) {
      mapRef.current.fitBounds(bounds, 56);
    } else {
      mapRef.current.setCenter({ lat: activeMarket.latitude, lng: activeMarket.longitude });
      mapRef.current.setZoom(9);
    }
  }, [mapReady, visibleVenues, matchResults, liveStates, presences, venueGames, activeMarket.latitude, activeMarket.longitude]);

  useEffect(() => {
    if (!mapRef.current || !selectedMarkerVenue) return;
    mapRef.current.panTo({ lat: selectedMarkerVenue.latitude, lng: selectedMarkerVenue.longitude });
  }, [selectedMarkerVenue]);

  const selectedVenueMatch = selectedMarkerVenue
    ? matchResults.find((result) => result.venueId === selectedMarkerVenue.id)
    : null;
  const selectedVenueLive = selectedMarkerVenue ? liveStates[selectedMarkerVenue.id] : null;
  const isSaved = selectedMarkerVenue ? savedVenueIds.includes(selectedMarkerVenue.id) : false;
  const marketLabel = activeMarket.name;

  const selectCentralVenue = () => {
    if (!locatedVenues.length) return;
    const center = locatedVenues.reduce(
      (sum, venue) => ({ lat: sum.lat + venue.latitude, lng: sum.lng + venue.longitude }),
      { lat: 0, lng: 0 }
    );
    const target = { lat: center.lat / locatedVenues.length, lng: center.lng / locatedVenues.length };
    const closest = locatedVenues.reduce((best, venue) => {
      const distance = Math.hypot(venue.latitude - target.lat, venue.longitude - target.lng);
      const bestDistance = Math.hypot(best.latitude - target.lat, best.longitude - target.lng);
      return distance < bestDistance ? venue : best;
    }, locatedVenues[0]);
    setSelectedMarkerVenue(closest);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] min-h-[520px] pb-12 animate-fadeIn overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
      <div className="absolute top-2 left-2 right-2 z-20 space-y-2">
        <div className="flex items-center justify-between gap-2 bg-neutral-950/90 backdrop-blur-md p-2 rounded-xl border border-neutral-800 shadow-xl text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 pl-1">Filter:</span>
            {(['ALL', 'GAME_ON', 'FRIENDS', 'TRENDING', 'ACTIVE'] as MarkerCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setMarkerCategory(category)}
                className={'px-2 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap ' +
                  (markerCategory === category ? 'bg-amber-500 text-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800')}
              >
                {category === 'ALL' ? 'All venues' : category === 'GAME_ON' ? 'Game on' : category}
              </button>
            ))}
          </div>
          <span className="hidden sm:block text-[10px] text-neutral-400 whitespace-nowrap">{marketLabel}</span>
        </div>
        {games.length > 0 && (
          <div className="max-w-sm bg-neutral-950/90 border border-neutral-800 rounded-xl p-2">
            <label htmlFor="map-game-filter" className="sr-only">Filter map by game</label>
            <select
              id="map-game-filter"
              value={selectedGame?.id || ''}
              onChange={(event) => onSelectGame(games.find((game) => game.id === event.target.value) || null)}
              className="w-full bg-transparent text-xs text-white outline-none"
            >
              <option value="">All games</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.awayTeam.name} at {game.homeTeam.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-0 bg-[#e8e6df]">
        {apiKey ? (
          <div ref={mapElementRef} className="absolute inset-0 h-full w-full" aria-label="Google map of RallyOn venues" />
        ) : (
          <div className="absolute inset-0 overflow-y-auto bg-[#e8e6df] p-3">
            <div className="mx-auto max-w-lg rounded-2xl border border-neutral-300 bg-white/95 p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 shrink-0 text-amber-600" />
                <div className="min-w-0 text-left">
                  <h3 className="text-base font-black text-neutral-900">{activeMarket.name} venue preview</h3>
                  <p className="text-xs text-neutral-600">Google Maps activates when VITE_GOOGLE_MAPS_API_KEY is configured.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>{activeMarket.name}</span>
                <span>{visibleVenues.length} matching venues</span>
              </div>
              {visibleVenues.length > 0 ? (
                <div className="mt-3 max-h-[calc(100vh-390px)] min-h-28 space-y-2 overflow-y-auto text-left">
                  {visibleVenues.map((venue) => {
                    const status = getMarkerStatus(venue);
                    const match = matchResults.find((result) => result.venueId === venue.id);
                    return (
                      <button
                        key={venue.id}
                        onClick={() => setSelectedMarkerVenue(venue)}
                        className={'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left ' + (selectedMarkerVenue?.id === venue.id ? 'border-amber-500 bg-amber-50' : 'border-neutral-200 bg-neutral-50 hover:bg-amber-50')}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-neutral-900">{venue.name}</span>
                          <span className="block truncate text-[10px] text-neutral-500">{venue.city}, {venue.state} · {status.label}</span>
                        </span>
                        {match && <span className="shrink-0 rounded-lg bg-amber-500 px-2 py-1 text-[10px] font-black text-black">{match.score}%</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-neutral-100 p-4 text-center text-xs text-neutral-600">No venues match these filters yet. Try another game or status filter.</p>
              )}
            </div>
          </div>
        )}
        {apiKey && mapError && (
          <div className="absolute inset-x-3 bottom-3 z-30 rounded-xl border border-red-300 bg-white p-3 text-sm text-red-800 shadow-lg">
            {mapError}
          </div>
        )}
        {apiKey && !mapReady && !mapError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm font-semibold text-neutral-700">
            Loading Google Maps…
          </div>
        )}
      </div>

      <button
        onClick={selectCentralVenue}
        disabled={!locatedVenues.length}
        className="absolute bottom-40 right-4 z-20 p-2.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-white shadow-xl hover:bg-neutral-800 disabled:opacity-40"
        title="Select a venue near the center of this market"
        aria-label="Select a central venue"
      >
        <Crosshair className="w-5 h-5 text-amber-400" />
      </button>

      {selectedMarkerVenue && (
        <div className="absolute bottom-2 left-2 right-2 z-20 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 p-3.5 rounded-2xl shadow-2xl animate-fadeIn">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                <span>{selectedMarkerVenue.baseline.category}</span>
                <span>•</span>
                <span className="truncate">{selectedMarkerVenue.city}, {selectedMarkerVenue.state}</span>
                {selectedVenueMatch && <><span>•</span><span>{selectedVenueMatch.distanceMiles} mi</span></>}
              </div>
              <h3 className="text-base font-black text-white truncate">{selectedMarkerVenue.name}</h3>
              <p className="text-[11px] text-neutral-400 truncate">{selectedMarkerVenue.address}</p>
            </div>
            {selectedVenueMatch && (
              <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-amber-500 text-black font-black">
                <span className="text-base leading-none">{selectedVenueMatch.score}%</span>
                <span className="text-[8px] uppercase tracking-tighter opacity-80">Rally</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5 bg-neutral-900/80 p-2 rounded-xl text-[10px] mb-3 border border-neutral-800">
            <div><span className="text-neutral-500 block">Crowd</span><span className="font-bold text-white">{selectedVenueLive ? selectedVenueLive.crowd + '%' : '—'}</span></div>
            <div><span className="text-neutral-500 block">Energy</span><span className="font-bold text-amber-400">{selectedVenueLive ? selectedVenueLive.energy + '%' : '—'}</span></div>
            <div><span className="text-neutral-500 block">Screens</span><span className="font-bold text-emerald-400">{selectedMarkerVenue.venueTruth.sports.numTvs ? selectedMarkerVenue.venueTruth.sports.numTvs + ' TVs' : '—'}</span></div>
            <div><span className="text-neutral-500 block">Seating</span><span className="font-bold text-neutral-300">{selectedVenueLive ? selectedVenueLive.seatingAvailability + '% open' : '—'}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectVenue(selectedMarkerVenue)}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>View Venue Intelligence</span><ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleSave(selectedMarkerVenue.id)}
              aria-label={isSaved ? 'Unsave venue' : 'Save venue'}
              className={'p-2.5 rounded-xl border ' + (isSaved ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-neutral-900 border-neutral-700 text-neutral-400')}
            >
              <Bookmark className={'w-4 h-4 ' + (isSaved ? 'fill-current' : '')} />
            </button>
            <a
              href={'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(
                [selectedMarkerVenue.name, selectedMarkerVenue.address, selectedMarkerVenue.city, selectedMarkerVenue.state].filter(Boolean).join(' ')
              )}
              target="_blank"
              rel="noreferrer"
              aria-label="Get directions in Google Maps"
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white"
            >
              <Compass className="w-4 h-4 text-amber-400" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
