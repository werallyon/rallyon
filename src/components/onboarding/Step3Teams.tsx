import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, Check, X, Star } from 'lucide-react';
import { TeamReference } from '../../types';
import { searchTeams, getTeamsForSports } from '../../data/teamsDatabase';

interface Step3TeamsProps {
  selectedSports: string[];
  selectedTeams: TeamReference[];
  onToggleTeam: (team: TeamReference) => void;
  onNext: () => void;
  onSkip: () => void;
}

export const Step3Teams: React.FC<Step3TeamsProps> = ({
  selectedSports,
  selectedTeams,
  onToggleTeam,
  onNext,
  onSkip
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically filter teams matching selected sports (or all sports if none chosen)
  const availableTeams = useMemo(() => {
    return searchTeams(searchQuery, selectedSports);
  }, [searchQuery, selectedSports]);

  const isTeamSelected = (id: string) => selectedTeams.some((t) => t.id === id);

  return (
    <div className="flex flex-col justify-between min-h-[520px] py-2">
      <div>
        <div className="space-y-1 mb-3 text-center">
          <h2 className="text-xl font-black text-white tracking-tight">
            Which teams do you care about?
          </h2>
          <p className="text-xs text-neutral-400">
            {selectedSports.length > 0
              ? `Showing teams matching your sports: ${selectedSports.join(', ')}`
              : 'Search or pick your favorite teams across all leagues'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams (Cowboys, Longhorns, Chiefs...)"
            className="w-full pl-9 pr-8 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Teams Badges / Chips */}
        {selectedTeams.length > 0 && (
          <div className="mb-3 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Selected Teams ({selectedTeams.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {selectedTeams.map((team) => (
                <span
                  key={team.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold"
                >
                  <span>{team.logo}</span>
                  <span>{team.name}</span>
                  <button
                    onClick={() => onToggleTeam(team)}
                    className="hover:text-red-400 ml-1 text-xs font-black"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Searchable Teams List */}
        <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
          {availableTeams.length > 0 ? (
            availableTeams.map((team) => {
              const selected = isTeamSelected(team.id);
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => onToggleTeam(team)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    selected
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg w-6 text-center">{team.logo}</span>
                    <div>
                      <span className="text-xs font-bold block text-white">{team.name}</span>
                      <span className="text-[10px] text-neutral-400">
                        {team.league} • {team.abbrev}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      selected
                        ? 'bg-amber-500 text-black'
                        : 'border border-neutral-700'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No teams found matching "{searchQuery}". Try a different term or clear filters.
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-neutral-900 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">
          {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} chosen
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
