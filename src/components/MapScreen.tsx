import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Crosshair,
  Layers,
  Filter,
  Tv,
  Users,
  Flame,
  Volume2,
  TrendingUp,
  X,
  ChevronRight,
  Bookmark,
  Compass,
  Sparkles
} from 'lucide-react';
import {
  Venue,
  VenueLiveState,
  UserIntent,
  SportsGame,
  VenueGame,
  Presence,
  RallyMatchResult
} from '../types';
import { INTENT_CONFIGS } from '../data/seedData';

interface MapScreenProps {
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

export const MapScreen: React.FC<MapScreenProps> = ({
  venues,
  liveStates,
  matchResults,
  games,
  selectedGame,
  onSelectGame,
  currentIntent,
  onSelectIntent,
  venueGames,
  presences,
  savedVenueIds,
  onToggleSave,
  onSelectVenue
}) => {
  const [selectedMarkerVenue, setSelectedMarkerVenue] = useState<Venue | null>(venues[0] || null);
  const [markerCategory, setMarkerCategory] = useState<MarkerCategory>('ALL');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Keep the selected venue valid when a market loads or its venue list changes.
  useEffect(() => {
    setSelectedMarkerVenue((current) => {
      if (current) {
        const refreshed = venues.find((venue) => venue.id === current.id);
        if (refreshed) return refreshed;
      }
      return venues[0] || null;
    });
  }, [venues]);

  // Only venues with usable coordinates can be positioned on this canvas.
  const locatedVenues = useMemo(() => venues.filter((venue) =>
    Number.isFinite(venue.latitude) && Number.isFinite(venue.longitude)
  ), [venues]);

  // Project the venues actually supplied by the active market, regardless of city.
  const bounds = useMemo(() => {
    const located = locatedVenues;
    if (located.length === 0) {
      return { minLat: -0.01, maxLat: 0.01, minLon: -0.01, maxLon: 0.01 };
    }

    const latitudes = located.map((venue) => venue.latitude);
    const longitudes = located.map((venue) => venue.longitude);
    const rawMinLat = Math.min(...latitudes);
    const rawMaxLat = Math.max(...latitudes);
    const rawMinLon = Math.min(...longitudes);
    const rawMaxLon = Math.max(...longitudes);
    const latPadding = Math.max(0.01, (rawMaxLat - rawMinLat) * 0.15);
    const lonPadding = Math.max(0.01, (rawMaxLon - rawMinLon) * 0.15);

    return {
      minLat: rawMinLat - latPadding,
      maxLat: rawMaxLat + latPadding,
      minLon: rawMinLon - lonPadding,
      maxLon: rawMaxLon + lonPadding
    };
  }, [locatedVenues]);

  const marketLabel = useMemo(() => {
    const cities = [...new Set(venues.map((venue) =>
      [venue.city, venue.state].filter(Boolean).join(', ')
    ).filter(Boolean))];
    if (cities.length === 1) return cities[0];
    return cities.length > 1 ? 'Nearby markets' : 'Your market';
  }, [venues]);

  const centralVenue = useMemo(() => {
    if (locatedVenues.length === 0) return null;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLon = (bounds.minLon + bounds.maxLon) / 2;
    return locatedVenues.reduce((closest, venue) => {
      const currentDistance = Math.hypot(venue.latitude - centerLat, venue.longitude - centerLon);
      const closestDistance = Math.hypot(closest.latitude - centerLat, closest.longitude - centerLon);
      return currentDistance < closestDistance ? venue : closest;
    }, locatedVenues[0]);
  }, [locatedVenues, bounds]);

  const projectCoords = (lat: number, lon: number) => {
    const xPercent = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100;
    // Latitude is inverted in SVG (higher lat = lower Y).
    const yPercent = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, xPercent)),
      y: Math.max(5, Math.min(95, yPercent))
    };
  };

  // Determine marker state
  const getMarkerStatus = (venue: Venue) => {
    const live = liveStates[venue.id];
    const friends = presences.filter((p) => p.venueId === venue.id);
    const hasGameOn = venueGames.some(
      (vg) => vg.venueId === venue.id && vg.verificationStatus === 'GAME_ON'
    );

    if (friends.length > 0) {
      return {
        type: 'FRIENDS',
        color: 'bg-blue-500 text-white ring-4 ring-blue-500/30',
        label: 'Friends Inside',
        icon: Users
      };
    }
    if (live && live.trendingVelocity >= 25) {
      return {
        type: 'TRENDING',
        color: 'bg-purple-600 text-white ring-4 ring-purple-500/30',
        label: 'Trending Velocity',
        icon: TrendingUp
      };
    }
    if (hasGameOn) {
      return {
        type: 'GAME_ON',
        color: 'bg-amber-400 text-black ring-4 ring-amber-400/30',
        label: 'GAME ON Verified',
        icon: Flame
      };
    }
    if (live && live.crowd >= 75) {
      return {
        type: 'ACTIVE',
        color: 'bg-emerald-500 text-black ring-4 ring-emerald-500/30',
        label: 'Active Crowds',
        icon: Flame
      };
    }
    return {
      type: 'LOW_ACTIVITY',
      color: 'bg-neutral-700 text-neutral-300 ring-2 ring-neutral-600',
      label: 'Chill / Steady',
      icon: MapPin
    };
  };

  // Filter venues on map
  const visibleVenues = useMemo(() => {
    return locatedVenues.filter((venue) => {
      const markerStatus = getMarkerStatus(venue);
      if (markerCategory === 'ALL') return true;
      if (markerCategory === 'FRIENDS') return markerStatus.type === 'FRIENDS';
      if (markerCategory === 'TRENDING') return markerStatus.type === 'TRENDING';
      if (markerCategory === 'GAME_ON') return markerStatus.type === 'GAME_ON';
      if (markerCategory === 'ACTIVE') return markerStatus.type === 'ACTIVE';
      return true;
    });
  }, [locatedVenues, markerCategory, liveStates, presences, venueGames]);

  const selectedVenueMatch = selectedMarkerVenue
    ? matchResults.find((m) => m.venueId === selectedMarkerVenue.id)
    : null;

  const selectedVenueLive = selectedMarkerVenue ? liveStates[selectedMarkerVenue.id] : null;
  const isSaved = selectedMarkerVenue ? savedVenueIds.includes(selectedMarkerVenue.id) : false;

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] pb-12 animate-fadeIn overflow-hidden rounded-2xl border border-neutral-800">
      {/* Map Control / Filter Header Bar */}
      <div className="absolute top-2 left-2 right-2 z-20 space-y-2">
        {/* Game Filter / Intent Quick Pill */}
        <div className="flex items-center justify-between bg-neutral-950/90 backdrop-blur-md p-2 rounded-xl border border-neutral-800 shadow-xl text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 pl-1">
              Filter:
            </span>
            {(['ALL', 'GAME_ON', 'FRIENDS', 'TRENDING', 'ACTIVE'] as MarkerCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setMarkerCategory(cat)}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${
                  markerCategory === cat
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                {cat === 'ALL'
                  ? 'All Venues'
                  : cat === 'GAME_ON'
                  ? '🟡 Game On'
                  : cat === 'FRIENDS'
                  ? '🔵 Friends'
                  : cat === 'TRENDING'
                  ? '🟣 Trending'
                  : '🟢 Active'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Market-aware venue location canvas. Pins use the active venues' coordinates. */}
      <div className="relative w-full h-full bg-[#0a0f18] overflow-hidden select-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Venue locations in ${marketLabel}`}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161f30" strokeWidth="0.8" />
            </pattern>
            <radialGradient id="marketGlow">
              <stop offset="0%" stopColor="#1d3557" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0a0f18" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1000" height="1000" fill="url(#grid)" />
          <ellipse cx="500" cy="500" rx="440" ry="440" fill="url(#marketGlow)" />
          <text x="500" y="145" textAnchor="middle" fill="#3b5982" fontSize="24" fontWeight="900" letterSpacing="4">
            {marketLabel.toUpperCase()}
          </text>
          <text x="500" y="180" textAnchor="middle" fill="#52627a" fontSize="14" fontWeight="600" letterSpacing="2">
            VENUE LOCATIONS · RELATIVE POSITIONS
          </text>
        </svg>

        {/* Dynamic Venue Markers Overlay */}
        {visibleVenues.map((venue) => {
          const coords = projectCoords(venue.latitude, venue.longitude);
          const status = getMarkerStatus(venue);
          const isSelected = selectedMarkerVenue?.id === venue.id;
          const match = matchResults.find((m) => m.venueId === venue.id);

          return (
            <div
              key={venue.id}
              onClick={() => setSelectedMarkerVenue(venue)}
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className="absolute z-10 cursor-pointer group transition-all"
            >
              {/* Marker Pin */}
              <div
                className={`relative flex items-center justify-center rounded-2xl px-2 py-1 shadow-2xl transition-transform duration-200 ${
                  status.color
                } ${isSelected ? 'scale-125 ring-4 ring-white z-30 shadow-white/30' : 'hover:scale-110'}`}
              >
                <span className="text-[10px] font-black">{match?.score || 85}%</span>
                {status.type === 'FRIENDS' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-300 ring-1 ring-black" />
                )}
              </div>

              {/* Pin Pointer triangle */}
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-current mx-auto opacity-90 -mt-0.5" />

              {/* Venue Name Mini Tag (Visible if selected or hovered) */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-black/90 border border-neutral-700 text-[9px] font-bold text-white whitespace-nowrap shadow-lg transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {venue.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Select the venue closest to the center of this market's coordinate bounds. */}
      <button
        onClick={() => {
          if (centralVenue) setSelectedMarkerVenue(centralVenue);
        }}
        disabled={!centralVenue}
        className="absolute bottom-40 right-4 z-20 p-2.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-white shadow-xl hover:bg-neutral-800 transition-colors disabled:opacity-40"
        title="Select a central venue"
      >
        <Crosshair className="w-5 h-5 text-amber-400" />
      </button>

      {/* BOTTOM SELECTED VENUE PREVIEW CARD */}
      {selectedMarkerVenue && selectedVenueMatch && selectedVenueLive && (
        <div className="absolute bottom-2 left-2 right-2 z-20 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 p-3.5 rounded-2xl shadow-2xl animate-fadeIn">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                <span>{selectedMarkerVenue.baseline.category}</span>
                <span>•</span>
                <span>{selectedMarkerVenue.neighborhood}</span>
                <span>•</span>
                <span>{selectedVenueMatch.distanceMiles} mi</span>
              </div>
              <h3 className="text-base font-black text-white">
                {selectedMarkerVenue.name}
              </h3>
            </div>

            {/* Match Score Badge */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-amber-500 text-black font-black">
              <span className="text-base leading-none">{selectedVenueMatch.score}%</span>
              <span className="text-[8px] uppercase tracking-tighter opacity-80">Rally</span>
            </div>
          </div>

          {/* Telemetry row */}
          <div className="grid grid-cols-4 gap-1.5 bg-neutral-900/80 p-2 rounded-xl text-[10px] mb-3 border border-neutral-800">
            <div>
              <span className="text-neutral-500 block">Crowd</span>
              <span className="font-bold text-white">{selectedVenueLive.crowd}%</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Energy</span>
              <span className="font-bold text-amber-400">{selectedVenueLive.energy}%</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Screens</span>
              <span className="font-bold text-emerald-400">{selectedMarkerVenue.venueTruth.sports.numTvs} TVs</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Seating</span>
              <span className="font-bold text-neutral-300">{selectedVenueLive.seatingAvailability}% open</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectVenue(selectedMarkerVenue)}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Venue Intelligence</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggleSave(selectedMarkerVenue.id)}
              className={`p-2.5 rounded-xl border transition-colors ${
                isSaved
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                `${selectedMarkerVenue.name} ${selectedMarkerVenue.address} ${selectedMarkerVenue.city} ${selectedMarkerVenue.state}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
            >
              <Compass className="w-4 h-4 text-amber-400" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
