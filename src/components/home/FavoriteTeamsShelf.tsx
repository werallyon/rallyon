import React, { useState } from 'react';
import { Star, Plus, Check, ChevronRight, X, Search, Trophy } from 'lucide-react';
import { TeamReference, SportsGame } from '../../types';
import { TeamLogo } from '../common/TeamLogo';
import { getFavoriteTeamGameStatus } from '../../services/teamPreferenceService';
import { TEAMS_DATABASE, searchTeams } from '../../data/teamsDatabase';

interface FavoriteTeamsShelfProps {
  favoriteTeams: TeamReference[];
  games: SportsGame[];
  selectedGame: SportsGame | null;
  onSelectGame: (game: SportsGame | null) => void;
  onUpdateFavoriteTeams: (teams: TeamReference[]) => void;
}

export const FavoriteTeamsShelf: React.FC<FavoriteTeamsShelfProps> = ({
  favoriteTeams,
  games,
  selectedGame,
  onSelectGame,
  onUpdateFavoriteTeams
}) => {
  const [showManageModal, setShowManageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSelectedGameForTeam = (team: TeamReference) => {
    if (!selectedGame) return false;
    const homeName = selectedGame.homeTeam.name.toLowerCase();
    const awayName = selectedGame.awayTeam.name.toLowerCase();
    const teamName = team.name.toLowerCase();
    return homeName.includes(teamName) || awayName.includes(teamName) || teamName.includes(homeName) || teamName.includes(awayName);
  };

  const handleTeamClick = (team: TeamReference) => {
    const status = getFavoriteTeamGameStatus(team, games);
    if (status.game) {
      if (selectedGame?.id === status.game.id) {
        // Toggle off if already selected
        onSelectGame(null);
      } else {
        onSelectGame(status.game);
      }
    }
  };

  const handleToggleFavorite = (team: TeamReference) => {
    const exists = favoriteTeams.some((t) => t.id === team.id);
    if (exists) {
      onUpdateFavoriteTeams(favoriteTeams.filter((t) => t.id !== team.id));
    } else {
      onUpdateFavoriteTeams([...favoriteTeams, team]);
    }
  };

  const filteredSearchTeams = searchQuery.trim()
    ? searchTeams(searchQuery)
    : TEAMS_DATABASE.slice(0, 16);

  if (!favoriteTeams || favoriteTeams.length === 0) {
    return (
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
            <Star className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">Select Your Favorite Teams</h3>
            <p className="text-[11px] text-neutral-400">See your teams first with live scores and dedicated fan hubs.</p>
          </div>
        </div>
        <button
          onClick={() => setShowManageModal(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all flex items-center gap-1 shadow-sm flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Teams</span>
        </button>

        {showManageModal && (
          <TeamSelectorModal
            favoriteTeams={favoriteTeams}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredSearchTeams={filteredSearchTeams}
            onToggleFavorite={handleToggleFavorite}
            onClose={() => {
              setShowManageModal(false);
              setSearchQuery('');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Your Favorited Teams
          </span>
          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {favoriteTeams.length}
          </span>
        </div>

        <button
          onClick={() => setShowManageModal(true)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Manage</span>
        </button>
      </div>

      {/* Horizontal Favorited Teams Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        {favoriteTeams.map((team) => {
          const status = getFavoriteTeamGameStatus(team, games);
          const isSelected = isSelectedGameForTeam(team);

          return (
            <button
              key={team.id}
              onClick={() => handleTeamClick(team)}
              className={`flex-shrink-0 text-left p-2.5 rounded-2xl border transition-all relative min-w-[175px] max-w-[210px] group ${
                isSelected
                  ? 'bg-gradient-to-br from-amber-500/25 to-neutral-900 border-amber-400 ring-1 ring-amber-400/50 shadow-md shadow-amber-500/10'
                  : status.isLive
                  ? 'bg-neutral-900/95 border-red-500/40 hover:border-red-500/70 hover:bg-neutral-850'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
              }`}
            >
              {/* Top Row: Logo, Name, League */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <TeamLogo logo={team.logo} name={team.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {team.name}
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 flex-shrink-0 uppercase">
                  {team.league}
                </span>
              </div>

              {/* Bottom Row: Game Broadcast or Matchup Status */}
              <div className="text-[10px]">
                {status.hasGame ? (
                  status.isLive ? (
                    <div className="flex items-center justify-between text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded-lg border border-red-500/20">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        LIVE
                      </span>
                      <span className="font-mono text-white text-[11px] font-black">
                        {status.scoreSummary}
                      </span>
                      <span className="text-[9px] text-neutral-400 truncate max-w-[50px]">
                        vs {status.opponentAbbrev || status.opponent}
                      </span>
                    </div>
                  ) : status.isUpcoming ? (
                    <div className="flex items-center justify-between text-neutral-300 bg-neutral-800/80 px-1.5 py-0.5 rounded-lg border border-neutral-700/50">
                      <span className="text-amber-400 font-bold text-[9px] truncate">
                        {status.periodOrTime || 'Upcoming'}
                      </span>
                      <span className="text-neutral-400 text-[9px] truncate max-w-[70px]">
                        vs {status.opponentAbbrev || status.opponent}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-neutral-400 px-1.5 py-0.5">
                      <span>Final</span>
                      <span className="font-mono text-neutral-300">{status.scoreSummary}</span>
                    </div>
                  )
                ) : (
                  <div className="text-[10px] text-neutral-500 italic px-0.5">
                    No game scheduled today
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Team Selector / Management Modal */}
      {showManageModal && (
        <TeamSelectorModal
          favoriteTeams={favoriteTeams}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredSearchTeams={filteredSearchTeams}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => {
            setShowManageModal(false);
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
};

interface TeamSelectorModalProps {
  favoriteTeams: TeamReference[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredSearchTeams: TeamReference[];
  onToggleFavorite: (team: TeamReference) => void;
  onClose: () => void;
}

const TeamSelectorModal: React.FC<TeamSelectorModalProps> = ({
  favoriteTeams,
  searchQuery,
  setSearchQuery,
  filteredSearchTeams,
  onToggleFavorite,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Manage Favorite Teams</h3>
              <p className="text-[10px] text-neutral-400">Favorited teams appear first in all live views</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NFL, NCAA, NBA, Soccer..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            autoFocus
          />
        </div>

        {/* Currently Favorited Teams */}
        {favoriteTeams.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              Selected Teams ({favoriteTeams.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {favoriteTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => onToggleFavorite(team)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition-colors group"
                  title="Click to remove"
                >
                  <TeamLogo logo={team.logo} name={team.name} size="xs" />
                  <span>{team.name}</span>
                  <X className="w-3 h-3 text-amber-400 group-hover:text-red-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Team Database List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[160px]">
          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
            {searchQuery ? 'Search Results' : 'Suggested Franchise & College Teams'}
          </span>
          <div className="space-y-1">
            {filteredSearchTeams.map((team) => {
              const isFav = favoriteTeams.some((t) => t.id === team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => onToggleFavorite(team)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs ${
                    isFav
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-neutral-950/80 text-white hover:bg-neutral-800 border border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo logo={team.logo} name={team.name} size="sm" />
                    <div className="min-w-0">
                      <div className="font-bold truncate">{team.name}</div>
                      <div className="text-[10px] text-neutral-400">{team.league}</div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isFav ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isFav ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-colors shadow-lg shadow-amber-500/10"
        >
          Done
        </button>
      </div>
    </div>
  );
};
