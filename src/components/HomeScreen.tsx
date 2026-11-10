import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Tv,
  Users,
  Compass,
  Bookmark,
  Volume2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Sparkles,
  Ticket,
  ShieldCheck,
  Star,
  Radio,
  Info,
  RefreshCw
} from 'lucide-react';
import {
  Venue,
  VenueLiveState,
  UserIntent,
  SportsGame,
  VenueGame,
  Presence,
  RallyMatchResult,
  Sponsorship,
  Promotion
} from '../types';
import { INTENT_CONFIGS } from '../data/seedData';
import { businessVenueService } from '../services/businessVenueService';
import { googlePlacesService } from '../services/googlePlacesService';
import { sportsService, SportsProviderStatus } from '../services/sportsProvider';
import { SportsProviderModal } from './sports/SportsProviderModal';
import { GameIntelligenceModal } from './sports/GameIntelligenceModal';
import { TeamLogo } from './common/TeamLogo';
import { FavoriteTeamsShelf } from './home/FavoriteTeamsShelf';
import { isFavoriteTeamGame } from '../services/teamPreferenceService';
import { User, TeamReference } from '../types';

interface HomeScreenProps {
  games: SportsGame[];
  selectedGame: SportsGame | null;
  onSelectGame: (game: SportsGame | null) => void;
  currentIntent: UserIntent;
  onSelectIntent: (intent: UserIntent) => void;
  rankedVenues: RallyMatchResult[];
  savedVenueIds: string[];
  onToggleSave: (venueId: string) => void;
  onSelectVenue: (venue: Venue) => void;
  onOpenLiveFeed: () => void;
  currentUser?: User | null;
  favoriteTeams?: TeamReference[];
  onUpdateFavoriteTeams?: (teams: TeamReference[]) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  games,
  selectedGame,
  onSelectGame,
  currentIntent,
  onSelectIntent,
  rankedVenues,
  savedVenueIds,
  onToggleSave,
  onSelectVenue,
  onOpenLiveFeed,
  currentUser,
  favoriteTeams,
  onUpdateFavoriteTeams
}) => {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [inspectGame, setInspectGame] = useState<SportsGame | null>(null);
  const [providerStatus, setProviderStatus] = useState<SportsProviderStatus>(sportsService.getStatus());
  const [isRefreshingSports, setIsRefreshingSports] = useState(false);

  useEffect(() => {
    setSponsorships(businessVenueService.getSponsorships());
    const unsub = businessVenueService.subscribe(() => {
      setSponsorships(businessVenueService.getSponsorships());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = sportsService.subscribe(() => {
      setProviderStatus(sportsService.getStatus());
    });
    return unsub;
  }, []);

  const handleRefreshSports = async () => {
    setIsRefreshingSports(true);
    try {
      await sportsService.refreshGames();
    } finally {
      setIsRefreshingSports(false);
    }
  };

  const activeSponsorship = sponsorships[0];
  const sponsoredVenueMatch = activeSponsorship?.venue_id
    ? rankedVenues.find((r) => r.venue.id === activeSponsorship.venue_id)
    : null;
  const intents: UserIntent[] = [
    'HIGH_ENERGY',
    'CHILL',
    'WITH_FRIENDS',
    'SOLO',
    'HARDCORE_FANS',
    'BEST_VIEWING'
  ];

  const activeIntentConfig = INTENT_CONFIGS[currentIntent];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (score >= 60) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    return 'text-neutral-400 bg-neutral-800 border-neutral-700';
  };

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* Hero Question & Subtitle */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          What’s happening near you?
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Find the game. Find your people. Find your place.
        </p>
      </div>

      {/* 1. FAVORITED TEAMS FIRST (Priority Shelf for Logged In Users) */}
      {currentUser && (
        <FavoriteTeamsShelf
          favoriteTeams={favoriteTeams || []}
          games={games}
          selectedGame={selectedGame}
          onSelectGame={onSelectGame}
          onUpdateFavoriteTeams={onUpdateFavoriteTeams || (() => {})}
        />
      )}

      {/* LIVE NOW: CURRENT SPORTING EVENTS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-white">Live Scores</span>
            </div>
            {/* Live Sports Provider Status Badge */}
            <button
              onClick={() => setShowProviderModal(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[10px] font-bold text-neutral-300 transition-colors"
              title="Inspect Sports Data Provider Telemetry & Registry"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  providerStatus.mode === 'LIVE_FEED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-neutral-200">{providerStatus.name.split(' ')[0]}</span>
              <span className="text-[9px] text-neutral-500 font-normal">
                {providerStatus.requiresApiKey ? 'Keyed' : 'Public'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshSports}
              disabled={isRefreshingSports}
              className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
              title="Refresh Live Scores Feed"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingSports ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            {selectedGame && (
              <button
                onClick={() => onSelectGame(null)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Game Ticker */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          {games.map((game) => {
            const isSelected = selectedGame?.id === game.id;
            const isLive = game.status === 'LIVE';
            const favCheck = isFavoriteTeamGame(game, favoriteTeams);

            return (
              <div
                key={game.id}
                className={`flex-shrink-0 w-64 p-3 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/20 to-neutral-900 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                    : favCheck.isFavorite
                    ? 'bg-neutral-900/95 border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20'
                    : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {game.league}
                    </span>
                    {favCheck.isFavorite && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                        My Team
                      </span>
                    )}
                    {isLive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {game.liveDetails && (
                      <span className="text-[11px] font-black text-amber-400">
                        {game.status === 'LIVE' || game.status === 'HALFTIME' ? (
                          <>
                            {game.liveDetails.period}
                            {game.liveDetails.clock ? ` • ${game.liveDetails.clock}` : ''}
                          </>
                        ) : game.status === 'FINAL' ? (
                          'Final'
                        ) : (
                          game.liveDetails.period || 'Upcoming'
                        )}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectGame(game);
                      }}
                      className="p-0.5 rounded text-neutral-500 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                      title="View ESPN situation, broadcast & verified venues"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Teams & Scores */}
                <div
                  onClick={() => onSelectGame(isSelected ? null : game)}
                  className="space-y-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} size="sm" />
                      <span className="truncate">{game.awayTeam.name}</span>
                      {favCheck.isAwayTeam && (
                        <Star className="w-3 h-3 text-amber-400 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <span className="font-mono text-xs font-black text-white tabular-nums flex-shrink-0">
                      {game.status === 'UPCOMING' ? '-' : (game.liveDetails?.currentScore.away ?? '-')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} size="sm" />
                      <span className="truncate">{game.homeTeam.name}</span>
                      {favCheck.isHomeTeam && (
                        <Star className="w-3 h-3 text-amber-400 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <span className="font-mono text-xs font-black text-white tabular-nums flex-shrink-0">
                      {game.status === 'UPCOMING' ? '-' : (game.liveDetails?.currentScore.home ?? '-')}
                    </span>
                  </div>
                </div>

                {/* Broadcast or situation */}
                <div
                  onClick={() => onSelectGame(isSelected ? null : game)}
                  className="mt-2 pt-1.5 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 cursor-pointer"
                >
                  <span className="truncate max-w-[140px]">
                    {game.liveDetails?.situation || game.broadcastNetwork || 'Live Broadcast'}
                  </span>
                  <span className={`font-semibold ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {isSelected ? 'Filtering ✓' : 'Tap to match'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SPONSORED GAME EXPERIENCE (Section 11 & 12) */}
      {activeSponsorship && sponsoredVenueMatch && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/40 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black shadow-sm">
              <Flame className="w-3 h-3 fill-current" />
              {activeSponsorship.creative.tagline || 'GAME OF THE NIGHT'}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Sponsored Placement
            </span>
          </div>

          <div className="space-y-1 mb-3">
            <h3 className="text-sm font-black text-white">
              {activeSponsorship.creative.headline}
            </h3>
            <p className="text-xs text-neutral-300">
              {activeSponsorship.creative.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
            <div className="text-[11px] text-neutral-400">
              Venue: <span className="font-bold text-white">{sponsoredVenueMatch.venue.name}</span> • Match: <span className="text-emerald-400 font-bold">{sponsoredVenueMatch.score}%</span>
            </div>
            <button
              onClick={() => onSelectVenue(sponsoredVenueMatch.venue)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-transform active:scale-95 shadow-md flex items-center gap-1"
            >
              <span>{activeSponsorship.CTA}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* INTENT SELECTOR: "WHERE SHOULD YOU WATCH?" */}
      <div className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Where Should You Watch?
          </span>
          <span className="text-[10px] text-amber-400 font-semibold">
            Dynamic Match Engine
          </span>
        </div>
        <p className="text-[11px] text-neutral-400 mb-3">
          Select your viewing intent to re-rank venues by live crowd energy, seating, and sound.
        </p>

        {/* Intent buttons grid */}
        <div className="grid grid-cols-3 gap-2">
          {intents.map((intentKey) => {
            const config = INTENT_CONFIGS[intentKey];
            const isSelected = currentIntent === intentKey;

            return (
              <button
                key={intentKey}
                onClick={() => onSelectIntent(intentKey)}
                className={`py-2 px-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10'
                    : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="text-base leading-none mb-1">{config.emoji}</div>
                <div className="text-[11px] font-bold truncate leading-tight">{config.label}</div>
              </button>
            );
          })}
        </div>

        {/* Active intent summary chip */}
        <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-start gap-2 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-neutral-200">{activeIntentConfig.label}:</span>{' '}
            <span className="text-neutral-400 text-[11px]">{activeIntentConfig.tagline}</span>
          </div>
        </div>
      </div>

      {/* VENUE MATCH RESULTS LIST */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              {selectedGame
                ? `Ranked Venues for ${selectedGame.awayTeam.abbrev} vs ${selectedGame.homeTeam.abbrev}`
                : `Top Rally Matches (${rankedVenues.length})`}
            </h2>
            <span className="text-[11px] text-neutral-400">
              Ranked dynamically for {activeIntentConfig.label}
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-3.5">
          {rankedVenues.map((match, index) => {
            const { venue, liveState, score, whyYouShouldGo, maybeSkipIf, friendsInside, activeGameStatus, distanceMiles } = match;
            const isSaved = savedVenueIds.includes(venue.id);
            const isTopMatch = index === 0;
            const promos = businessVenueService.getPromotionsForVenue(venue.id);
            const activePromo = promos[0];
            const googlePlace = googlePlacesService.getPlaceForVenue(venue.id);
            const isClaimed = venue.claimed || businessVenueService.getClaimForVenue(venue.id)?.verification_status === 'APPROVED';

            return (
              <div
                key={venue.id}
                onClick={() => onSelectVenue(venue)}
                className={`group relative rounded-2xl bg-neutral-900 border transition-all cursor-pointer overflow-hidden ${
                  isTopMatch
                    ? 'border-amber-500/50 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-neutral-800/90 hover:border-neutral-700'
                }`}
              >
                {/* #1 Badge */}
                {isTopMatch && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-br-xl shadow-md z-10">
                    #1 Top Match
                  </div>
                )}

                <div className="p-4">
                  {/* Top line: Name, Neighborhood, Match Score */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="pr-2">
                      <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-neutral-400 font-medium">
                        <span>{venue.baseline.category}</span>
                        <span>•</span>
                        <span>{venue.neighborhood}</span>
                        <span>•</span>
                        <span>{distanceMiles} mi</span>
                        {googlePlace && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-current text-amber-400" />
                              {googlePlace.rating}
                            </span>
                          </>
                        )}
                        {isClaimed && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Claimed ✓
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                        {venue.name}
                      </h3>
                      {match.matchedFavoriteTeam && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                          <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                          <span>Official {match.matchedFavoriteTeam} Fan Hub</span>
                        </div>
                      )}
                    </div>

                    {/* Rally Match Score Badge */}
                    <div
                      className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-xl border font-black shrink-0 ${getScoreColor(
                        score
                      )}`}
                    >
                      <span className="text-base leading-none">{score}%</span>
                      <span className="text-[8px] uppercase tracking-tighter opacity-80">Rally</span>
                    </div>
                  </div>

                  {/* Active Offer Banner (Section 13 & 26) */}
                  {activePromo && (
                    <div className="mb-3 p-2 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="font-bold text-white truncate max-w-[200px]">
                          {activePromo.title}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black shrink-0">
                        {activePromo.discount_value}
                      </span>
                    </div>
                  )}

                  {/* Status Badges line: GAME ON, Audio, Trending, Friends */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {activeGameStatus?.verificationStatus === 'GAME_ON' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        GAME ON 🔥
                      </span>
                    )}

                    {venue.venueTruth.sports.gameAudio && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        <Volume2 className="w-3 h-3" />
                        Audio On
                      </span>
                    )}

                    {liveState.trendingVelocity >= 20 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        <TrendingUp className="w-3 h-3" />
                        +{liveState.trendingVelocity}% Velocity
                      </span>
                    )}

                    {friendsInside.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                        <Users className="w-3 h-3" />
                        {friendsInside.length} friend{friendsInside.length > 1 ? 's' : ''} here
                      </span>
                    )}
                  </div>

                  {/* Live Telemetry Mini-Grid */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-[10px] mb-3">
                    <div>
                      <span className="text-neutral-500 block">Crowd</span>
                      <span className="font-bold text-white">{liveState.crowd}%</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Energy</span>
                      <span className="font-bold text-amber-400">{liveState.energy}%</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Viewing</span>
                      <span className="font-bold text-emerald-400">
                        {venue.venueTruth.sports.numTvs} TVs
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Seating</span>
                      <span className="font-bold text-neutral-300">{liveState.seatingAvailability}% open</span>
                    </div>
                  </div>

                  {/* "Why this matches you" key points */}
                  <div className="space-y-1 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Why this matches you:
                    </div>
                    {whyYouShouldGo.slice(0, 2).map((reason, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-neutral-300 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* "Not a good fit" warning if there's an issue */}
                  {maybeSkipIf.length > 0 && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-1.5 text-[11px] text-amber-300/90">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{maybeSkipIf[0]}</span>
                    </div>
                  )}

                  {/* Card footer with quick action buttons */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(venue.id);
                        }}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isSaved
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          `${venue.name} ${venue.address} Austin TX`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        <span>Directions</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Venue Intel</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centralized Sports Provider Telemetry & Registry Modal */}
      {showProviderModal && (
        <SportsProviderModal onClose={() => setShowProviderModal(false)} />
      )}

      {/* ESPN Live Game Situation & Intelligence Modal */}
      {inspectGame && (
        <GameIntelligenceModal
          game={inspectGame}
          venues={rankedVenues.map((r) => r.venue)}
          onClose={() => setInspectGame(null)}
          onSelectVenue={onSelectVenue}
        />
      )}
    </div>
  );
};
