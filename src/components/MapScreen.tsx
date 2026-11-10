import React, { useState, useMemo } from 'react';
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

  // Austin geographic bounds for SVG coordinate mapping:
  // North: 30.43 (Anderson Ln / North Austin / Lake Travis)
  // South: 30.16 (South Manchaca / Armadillo Den)
  // West: -97.89 (Oasis Lake Travis)
  // East: -97.70 (East Austin / Manor Rd)
  const bounds = {
    minLat: 30.16,
    maxLat: 30.43,
    minLon: -97.89,
    maxLon: -97.70
  };

  const projectCoords = (lat: number, lon: number) => {
    const xPercent = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100;
    // Latitude is inverted in SVG (higher lat = lower Y)
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
    return venues.filter((venue) => {
      const markerStatus = getMarkerStatus(venue);
      if (markerCategory === 'ALL') return true;
      if (markerCategory === 'FRIENDS') return markerStatus.type === 'FRIENDS';
      if (markerCategory === 'TRENDING') return markerStatus.type === 'TRENDING';
      if (markerCategory === 'GAME_ON') return markerStatus.type === 'GAME_ON';
      if (markerCategory === 'ACTIVE') return markerStatus.type === 'ACTIVE';
      return true;
    });
  }, [venues, markerCategory, liveStates, presences, venueGames]);

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

      {/* INTERACTIVE AUSTIN VENUE CANVAS / SVG MAP */}
      <div className="relative w-full h-full bg-[#0a0f18] overflow-hidden select-none">
        {/* SVG Base Map with Austin Geography */}
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#161f30" strokeWidth="0.8" />
            </pattern>
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f2744" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          <rect width="1000" height="1000" fill="url(#grid)" />

          {/* Lady Bird Lake / Colorado River Curve across Austin */}
          <path
            d="M 50 150 Q 250 180 400 380 T 550 560 Q 620 590 750 610 T 950 630"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="38"
            strokeLinecap="round"
          />

          {/* Major Austin Arteries / Highway lines (MoPac, I-35, US-183, Ben White) */}
          {/* I-35 North-South */}
          <path d="M 680 50 L 670 450 L 680 950" stroke="#1f2c42" strokeWidth="10" fill="none" />
          {/* MoPac (Loop 1) */}
          <path d="M 420 50 L 400 500 L 430 950" stroke="#1f2c42" strokeWidth="9" fill="none" />
          {/* US-183 (Research Blvd) */}
          <path d="M 200 180 L 800 220" stroke="#1f2c42" strokeWidth="7" fill="none" />
          {/* Ben White / US-290 */}
          <path d="M 200 780 L 850 740" stroke="#1f2c42" strokeWidth="8" fill="none" />

          {/* Austin Region Area Labels */}
          <text x="540" y="200" fill="#2d4365" fontSize="22" fontWeight="800" letterSpacing="4">
            NORTH AUSTIN
          </text>
          <text x="560" y="440" fill="#2d4365" fontSize="22" fontWeight="800" letterSpacing="4">
            UT CAMPUS
          </text>
          <text x="510" y="540" fill="#3b5982" fontSize="26" fontWeight="900" letterSpacing="5">
            DOWNTOWN
          </text>
          <text x="780" y="500" fill="#2d4365" fontSize="20" fontWeight="800" letterSpacing="4">
            EAST AUSTIN
          </text>
          <text x="440" y="720" fill="#2d4365" fontSize="22" fontWeight="800" letterSpacing="4">
            SOUTH LAMAR
          </text>
          <text x="120" y="280" fill="#1e3450" fontSize="18" fontWeight="800" letterSpacing="3">
            LAKE TRAVIS
          </text>

          {/* User Location Pulse (Simulated Downtown / South Austin) */}
          <circle cx="520" cy="560" r="16" fill="#3b82f6" fillOpacity="0.2" className="animate-ping" />
          <circle cx="520" cy="560" r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
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

      {/* Floating GPS Center Button */}
      <button
        onClick={() => {
          // Center on downtown
          const dtVenue = venues.find((v) => v.neighborhood.includes('Downtown'));
          if (dtVenue) setSelectedMarkerVenue(dtVenue);
        }}
        className="absolute bottom-40 right-4 z-20 p-2.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-white shadow-xl hover:bg-neutral-800 transition-colors"
        title="Center on My Location"
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
                `${selectedMarkerVenue.name} ${selectedMarkerVenue.address} Austin TX`
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
