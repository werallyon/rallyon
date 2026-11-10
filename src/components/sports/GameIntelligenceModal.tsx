import React, { useState, useEffect } from 'react';
import {
  X,
  Tv,
  MapPin,
  Flame,
  Volume2,
  TrendingUp,
  Percent,
  Clock,
  Shield,
  ChevronRight,
  ExternalLink,
  Layers
} from 'lucide-react';
import { SportsGame, Venue } from '../../types';
import {
  sportsService,
  GameSummaryData
} from '../../services/sportsProvider';
import { TeamLogo } from '../common/TeamLogo';

interface GameIntelligenceModalProps {
  game: SportsGame;
  venues: Venue[];
  onClose: () => void;
  onSelectVenue: (venue: Venue) => void;
}

export const GameIntelligenceModal: React.FC<GameIntelligenceModalProps> = ({
  game,
  venues,
  onClose,
  onSelectVenue
}) => {
  const [summary, setSummary] = useState<GameSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    sportsService
      .getGameSummary(game.id, game.league)
      .then((data) => {
        if (mounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [game.id, game.league]);

  // Find venues in Austin confirmed or likely showing this game
  const matchingVenues = venues.filter((v) =>
    v.currentGames.some((cg) => cg.gameId === game.id)
  );

  const isLive = game.status === 'LIVE' || game.status === 'HALFTIME';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Matchup */}
        <div className="p-5 border-b border-neutral-800 bg-gradient-to-b from-neutral-950 to-neutral-900 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
              {game.league}
            </span>
            {isLive ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE • {game.liveDetails?.period} {game.liveDetails?.clock}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-neutral-400">
                {new Date(game.startTime).toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}{' '}
                •{' '}
                {new Date(game.startTime).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>

          {/* Teams Header */}
          <div className="grid grid-cols-5 items-center gap-2">
            {/* Away */}
            <div className="col-span-2 flex items-center gap-2.5">
              <TeamLogo logo={game.awayTeam.logo} name={game.awayTeam.name} size="lg" />
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white truncate">
                  {game.awayTeam.name}
                </h3>
                {game.awayTeam.record && (
                  <span className="text-[10px] text-neutral-400 block">
                    {game.awayTeam.record}
                  </span>
                )}
              </div>
            </div>

            {/* Score or VS */}
            <div className="col-span-1 text-center">
              {isLive || game.status === 'FINAL' ? (
                <div className="text-lg font-black text-white tracking-wider tabular-nums">
                  <span>{game.liveDetails?.currentScore.away ?? '-'}</span>
                  <span className="text-neutral-500 mx-1">-</span>
                  <span>{game.liveDetails?.currentScore.home ?? '-'}</span>
                </div>
              ) : (
                <span className="text-xs font-black text-neutral-500 uppercase">VS</span>
              )}
            </div>

            {/* Home */}
            <div className="col-span-2 flex items-center justify-end gap-2.5 text-right">
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white truncate">
                  {game.homeTeam.name}
                </h3>
                {game.homeTeam.record && (
                  <span className="text-[10px] text-neutral-400 block">
                    {game.homeTeam.record}
                  </span>
                )}
              </div>
              <TeamLogo logo={game.homeTeam.logo} name={game.homeTeam.name} size="lg" />
            </div>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Situation & Field Position (ESPN Live Data) */}
          {(game.liveDetails?.situation || summary?.situationText) && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/5 border border-amber-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Live Field Situation
                </span>
                {summary?.redZone && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                    RED ZONE
                  </span>
                )}
              </div>
              <p className="text-sm font-black text-white">
                {summary?.situationText || game.liveDetails?.situation}
              </p>
            </div>
          )}

          {/* Broadcast & Odds Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Tv className="w-3 h-3 text-amber-400" />
                Broadcast Network
              </span>
              <span className="font-bold text-white text-xs block">
                {game.broadcastNetwork || 'ESPN Broadcast'}
              </span>
              <span className="text-[10px] text-emerald-400 block">
                {game.broadcast?.broadcastType === 'NATIONAL_OTA'
                  ? 'Over-the-Air (Free)'
                  : game.broadcast?.broadcastType === 'STREAMING_EXCLUSIVE'
                  ? 'Streaming Only'
                  : 'Cable & Sports Bars'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-400" />
                Odds & Spread
              </span>
              <span className="font-bold text-white text-xs block truncate">
                {summary?.odds?.details || game.liveDetails?.headline || 'Even Line'}
              </span>
              <span className="text-[10px] text-neutral-400 block">
                {summary?.odds?.overUnder ? `O/U ${summary.odds.overUnder}` : 'Live ESPN Feed'}
              </span>
            </div>
          </div>

          {/* Win Probability Bar (if available from ESPN) */}
          {summary?.winProbability && (
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-neutral-300">
                  {game.awayTeam.abbrev} {summary.winProbability.away}%
                </span>
                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-amber-400" />
                  Live Win Probability
                </span>
                <span className="text-neutral-300">
                  {summary.winProbability.home}% {game.homeTeam.abbrev}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden flex">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${summary.winProbability.away}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${summary.winProbability.home}%` }}
                />
              </div>
            </div>
          )}

          {/* Stadium & Location */}
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-white block">
                  {summary?.venue?.name || game.venueName || 'Host Stadium'}
                </span>
                {summary?.venue?.city && (
                  <span className="text-[10px] text-neutral-400">
                    {summary.venue.city}, {summary.venue.state}
                  </span>
                )}
              </div>
            </div>
            {summary?.attendance && (
              <span className="text-[10px] text-neutral-400">
                {summary.attendance.toLocaleString()} Attending
              </span>
            )}
          </div>

          {/* Confirmed Austin Watch Venues */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                Confirmed Austin Venues Showing Game ({matchingVenues.length})
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Sound & Screens</span>
            </div>

            {matchingVenues.length === 0 ? (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center text-neutral-400">
                <p>No venues currently have sound confirmed for this specific fixture.</p>
                <p className="text-[11px] text-amber-400 mt-1">
                  Check back closer to kick-off or browse popular sports bars nearby!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {matchingVenues.map((v) => {
                  const venueGame = v.currentGames.find((cg) => cg.gameId === game.id);
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        onClose();
                        onSelectVenue(v);
                      }}
                      className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 cursor-pointer flex items-center justify-between group transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-xs group-hover:text-amber-400 transition-colors">
                            {v.name}
                          </h4>
                          {venueGame?.audioConfirmed && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">
                              <Volume2 className="w-2.5 h-2.5" /> Sound ON
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {v.neighborhood} • {venueGame?.screenAllocations || 'Main Wall TVs'}
                        </p>
                      </div>

                      <button className="px-2.5 py-1 rounded-xl bg-neutral-800 group-hover:bg-amber-500 group-hover:text-black font-bold text-[11px] text-white flex items-center gap-1 transition-all">
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ESPN Sports Feed Grounded</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
