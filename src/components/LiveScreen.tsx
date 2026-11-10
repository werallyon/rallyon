import React, { useState, useMemo } from 'react';
import {
  Radio,
  TrendingUp,
  Tv,
  Volume2,
  Users,
  Flame,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  PlusCircle,
  Activity,
  Star
} from 'lucide-react';
import {
  SportsGame,
  VenueSignal,
  Venue,
  VenueLiveState,
  VenueGame,
  TeamReference
} from '../types';
import { signalEngine } from '../services/signalEngine';
import { CURRENT_USER } from '../data/seedData';
import { TeamLogo } from './common/TeamLogo';
import { isFavoriteTeamGame, sortGamesByFavorites } from '../services/teamPreferenceService';

interface LiveScreenProps {
  games: SportsGame[];
  signals: VenueSignal[];
  venues: Venue[];
  liveStates: Record<string, VenueLiveState>;
  venueGames: VenueGame[];
  onSelectGame: (game: SportsGame) => void;
  onSelectVenue: (venue: Venue) => void;
  favoriteTeams?: TeamReference[];
}

export const LiveScreen: React.FC<LiveScreenProps> = ({
  games,
  signals,
  venues,
  liveStates,
  venueGames,
  onSelectGame,
  onSelectVenue,
  favoriteTeams
}) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'GAMES' | 'TRENDING'>('FEED');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showQuickReportModal, setShowQuickReportModal] = useState(false);
  const [selectedReportVenueId, setSelectedReportVenueId] = useState(venues[0]?.id || '');
  const [reportType, setReportType] = useState<'AUDIO' | 'CROWD' | 'SEATING'>('AUDIO');
  const [reportNote, setReportNote] = useState('');

  // Sort games putting user's favorite teams first!
  const sortedGames = useMemo(() => {
    return sortGamesByFavorites(games, favoriteTeams);
  }, [games, favoriteTeams]);

  const favoriteGamesCount = useMemo(() => {
    if (!favoriteTeams || favoriteTeams.length === 0) return 0;
    return games.filter((g) => isFavoriteTeamGame(g, favoriteTeams).isFavorite).length;
  }, [games, favoriteTeams]);

  const displayedGames = useMemo(() => {
    if (onlyFavorites && favoriteTeams && favoriteTeams.length > 0) {
      return sortedGames.filter((g) => isFavoriteTeamGame(g, favoriteTeams).isFavorite);
    }
    return sortedGames;
  }, [sortedGames, onlyFavorites, favoriteTeams]);

  // Calculate trending velocity sorted venues
  const trendingVenues = [...venues]
    .map((v) => ({
      venue: v,
      liveState: liveStates[v.id] || {
        trendingVelocity: 0,
        crowd: 0,
        energy: 0,
        currentStatus: 'LIVE'
      }
    }))
    .sort((a, b) => b.liveState.trendingVelocity - a.liveState.trendingVelocity);

  const handleQuickReport = (e: React.FormEvent) => {
    e.preventDefault();
    const v = venues.find((item) => item.id === selectedReportVenueId);
    if (!v) return;

    let title = 'Game Audio Verified On';
    let signalType: VenueSignal['signalType'] = 'AUDIO_REPORT';

    if (reportType === 'CROWD') {
      title = 'Crowd Surge Verified';
      signalType = 'CROWD_REPORT';
    } else if (reportType === 'SEATING') {
      title = 'Open Seating Report';
      signalType = 'SEATING_REPORT';
    }

    signalEngine.addSignal({
      id: `sig_${Date.now()}`,
      venueId: v.id,
      signalType,
      title,
      message: reportNote || `${CURRENT_USER.name} verified live status at ${v.name}`,
      source: 'USER',
      confidence: 95,
      timestamp: 'Just now'
    });

    setReportNote('');
    setShowQuickReportModal(false);
  };

  return (
    <div className="space-y-4 pb-8 animate-fadeIn">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Live Intelligence Hub</h1>
              <p className="text-xs text-neutral-400">Real-time games, signals & crowd velocity</p>
            </div>
          </div>

          <button
            onClick={() => setShowQuickReportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 text-xs font-bold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Send Signal</span>
          </button>
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
        <button
          onClick={() => setActiveTab('FEED')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'FEED'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Signal Feed
        </button>
        <button
          onClick={() => setActiveTab('GAMES')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'GAMES'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Live Games
        </button>
        <button
          onClick={() => setActiveTab('TRENDING')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'TRENDING'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Trending Velocity
        </button>
      </div>

      {/* TAB 1: SIGNAL FEED */}
      {activeTab === 'FEED' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>Recent live venue signals (ranked by recency)</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Stream Active
            </span>
          </div>

          <div className="space-y-2.5">
            {signals.map((sig) => {
              const venue = venues.find((v) => v.id === sig.venueId);

              return (
                <div
                  key={sig.id}
                  onClick={() => venue && onSelectVenue(venue)}
                  className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-neutral-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        {sig.signalType === 'TRENDING_SPIKE' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : sig.signalType === 'AUDIO_REPORT' ? (
                          <Volume2 className="w-4 h-4" />
                        ) : sig.signalType === 'CHECK_IN' ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <Flame className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {sig.title}
                        </span>
                        <span className="text-[11px] text-amber-400 font-semibold">
                          {venue?.name} • {venue?.neighborhood}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-neutral-500 font-medium shrink-0">
                      {sig.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 pl-8 leading-relaxed">
                    {sig.message}
                  </p>

                  <div className="mt-2.5 pl-8 flex items-center justify-between text-[10px] text-neutral-500 border-t border-neutral-800/60 pt-1.5">
                    <span>Source: {sig.source === 'USER' ? 'Verified User' : sig.source === 'VENUE' ? 'Venue Staff' : 'RallyOn Engine'}</span>
                    <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
                      View Venue Intel →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE GAMES */}
      {activeTab === 'GAMES' && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-400 px-1">
            Active and upcoming sporting events. Tap any game to filter venue recommendations.
          </p>

          {/* Quick Filter: All vs My Teams */}
          {favoriteTeams && favoriteTeams.length > 0 && (
            <div className="flex items-center gap-2 pt-0.5 pb-1">
              <button
                onClick={() => setOnlyFavorites(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !onlyFavorites
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                All Games ({games.length})
              </button>
              <button
                onClick={() => setOnlyFavorites(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  onlyFavorites
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/80 shadow-md shadow-amber-500/10'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-amber-300 border border-neutral-800'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>My Teams ({favoriteGamesCount})</span>
              </button>
            </div>
          )}

          <div className="space-y-3">
            {displayedGames.map((game) => {
              // Count how many venues have verified GAME ON for this game
              const confirmedVenues = venueGames.filter(
                (vg) => vg.gameId === game.id && vg.verificationStatus === 'GAME_ON'
              );
              const favCheck = isFavoriteTeamGame(game, favoriteTeams);

              return (
                <div
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    favCheck.isFavorite
                      ? 'bg-neutral-900/95 border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20'
                      : 'bg-neutral-900 border-neutral-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-200">
                        {game.league}
                      </span>
                      {favCheck.isFavorite && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current text-amber-400" />
                          My Team
                        </span>
                      )}
                      {game.status === 'LIVE' ? (
                        <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          LIVE
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-neutral-400">
                          {game.startTime}
                        </span>
                      )}
                    </div>

                    {game.liveDetails && (
                      <span className="text-xs font-black text-amber-400">
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
                  </div>

                  {/* Teams and scores */}
                  <div className="space-y-2 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
                    <div className="flex items-center justify-between text-sm font-bold text-white">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                        <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} size="md" />
                        <span className="truncate">{game.awayTeam.name}</span>
                        {favCheck.isAwayTeam && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-current flex-shrink-0" />
                        )}
                        {game.awayTeam.record && (
                          <span className="text-neutral-500 text-xs font-normal flex-shrink-0">
                            ({game.awayTeam.record})
                          </span>
                        )}
                      </div>
                      <span className="text-base font-mono font-bold tabular-nums flex-shrink-0">
                        {game.status === 'UPCOMING' ? '-' : (game.liveDetails?.currentScore.away ?? '-')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm font-bold text-white">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                        <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} size="md" />
                        <span className="truncate">{game.homeTeam.name}</span>
                        {favCheck.isHomeTeam && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-current flex-shrink-0" />
                        )}
                        {game.homeTeam.record && (
                          <span className="text-neutral-500 text-xs font-normal flex-shrink-0">
                            ({game.homeTeam.record})
                          </span>
                        )}
                      </div>
                      <span className="text-base font-mono font-bold tabular-nums flex-shrink-0">
                        {game.status === 'UPCOMING' ? '-' : (game.liveDetails?.currentScore.home ?? '-')}
                      </span>
                    </div>
                  </div>

                  {/* Headline & Situation */}
                  {game.liveDetails?.situation && (
                    <div className="mt-2 text-xs font-semibold text-neutral-300">
                      ⚡ {game.liveDetails.situation}
                    </div>
                  )}

                  {/* Where to watch preview footer */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      GAME ON at {confirmedVenues.length} Austin venues
                    </span>
                    <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Find Venues →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TRENDING VELOCITY */}
      {activeTab === 'TRENDING' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-3 rounded-2xl text-xs text-neutral-300">
            <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-0.5">
              <TrendingUp className="w-4 h-4" />
              Velocity-Based Trending
            </div>
            RallyOn ranks trending by <em>rate of change</em> (check-in spikes & signal velocity), not merely static capacity.
          </div>

          <div className="space-y-2.5">
            {trendingVenues.map(({ venue, liveState }, idx) => (
              <div
                key={venue.id}
                onClick={() => onSelectVenue(venue)}
                className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-neutral-500 w-5">
                    #{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">{venue.name}</h3>
                    <div className="text-[11px] text-neutral-400">
                      {venue.neighborhood} • {venue.baseline.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{liveState.trendingVelocity}%
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      Crowd: {liveState.crowd}%
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Signal Submission Modal */}
      {showQuickReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-black text-white mb-1">Broadcast Live Signal</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Help the RallyOn network verify live conditions in Austin right now.
            </p>

            <form onSubmit={handleQuickReport} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Select Venue
                </label>
                <select
                  value={selectedReportVenueId}
                  onChange={(e) => setSelectedReportVenueId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.neighborhood})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Signal Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportType('AUDIO')}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-bold ${
                      reportType === 'AUDIO'
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    🔊 Game Audio
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('CROWD')}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-bold ${
                      reportType === 'CROWD'
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    🔥 Crowd Surge
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('SEATING')}
                    className={`py-2 px-1 rounded-xl border text-center text-xs font-bold ${
                      reportType === 'SEATING'
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    🪑 Open Seats
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Quick Details
                </label>
                <input
                  type="text"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="e.g. Volume just cranked up for 4th quarter!"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickReportModal(false)}
                  className="flex-1 py-2 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-bold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20"
                >
                  Publish Signal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
