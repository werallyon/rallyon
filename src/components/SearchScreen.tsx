import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Tv, MapPin, Trophy, Shield, ChevronRight, Users, Flame, Star } from 'lucide-react';
import { Venue, SportsGame, VenueGame, VenueLiveState, TeamReference } from '../types';
import { isFavoriteTeamGame, sortGamesByFavorites } from '../services/teamPreferenceService';

interface SearchScreenProps {
  venues: Venue[];
  games: SportsGame[];
  liveStates: Record<string, VenueLiveState>;
  onSelectVenue: (venue: Venue) => void;
  onSelectGame: (game: SportsGame) => void;
  favoriteTeams?: TeamReference[];
}

type SearchCategory = 'ALL' | 'GAMES' | 'VENUES' | 'TEAMS' | 'NEIGHBORHOODS';

export const SearchScreen: React.FC<SearchScreenProps> = ({
  venues,
  games,
  liveStates,
  onSelectVenue,
  onSelectGame,
  favoriteTeams
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('ALL');

  const popularSearches = [
    'Cowboys',
    'Longhorns',
    'NFL Sunday Ticket',
    'Downtown Austin',
    'South Lamar',
    'Arsenal FC',
    'Laser Projector',
    'Game Audio'
  ];

  // Search Results Computation
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { matchedGames: [], matchedVenues: [], matchedTeams: [] };

    // Games search
    const matched = games.filter(
      (g) =>
        g.homeTeam.name.toLowerCase().includes(q) ||
        g.awayTeam.name.toLowerCase().includes(q) ||
        g.league.toLowerCase().includes(q) ||
        g.broadcastNetwork?.toLowerCase().includes(q)
    );
    const matchedGames = sortGamesByFavorites(matched, favoriteTeams);

    // Venues search (name, neighborhood, address, categories, goodFor, team affiliations)
    const matchedVenues = venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.neighborhood.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        v.baseline.category.toLowerCase().includes(q) ||
        v.venueTruth.sports.teamAffiliations.some((t) => t.toLowerCase().includes(q)) ||
        v.venueTruth.sports.sportsPackages.some((p) => p.toLowerCase().includes(q)) ||
        v.venueTruth.goodFor.some((g) => g.toLowerCase().includes(q))
    );

    return { matchedGames, matchedVenues };
  }, [query, games, venues, favoriteTeams]);

  return (
    <div className="space-y-4 pb-8 animate-fadeIn">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <SearchIcon className="w-4 h-4 text-neutral-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team, game, venue, or neighborhood..."
          className="w-full pl-10 pr-10 py-3 bg-neutral-900 border border-neutral-700/80 rounded-2xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 shadow-xl"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(['ALL', 'GAMES', 'VENUES', 'TEAMS', 'NEIGHBORHOODS'] as SearchCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              category === cat
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
            }`}
          >
            {cat === 'ALL'
              ? 'All'
              : cat === 'GAMES'
              ? 'Games'
              : cat === 'VENUES'
              ? 'Venues'
              : cat === 'TEAMS'
              ? 'Teams & Fans'
              : 'Neighborhoods'}
          </button>
        ))}
      </div>

      {/* When query is empty: show Favorite Teams and Popular Searches */}
      {!query && (
        <div className="space-y-4 pt-2">
          {favoriteTeams && favoriteTeams.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  Your Favorited Teams
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {favoriteTeams.map((team) => (
                  <button
                    key={team.name}
                    onClick={() => setQuery(team.name)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-xs font-bold text-amber-300 transition-colors flex items-center gap-1.5"
                  >
                    <Star className="w-3 h-3 fill-current text-amber-400" />
                    <span>{team.name}</span>
                    <span className="text-[10px] text-amber-400/70 font-normal">({team.league})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Popular Searches in Austin
            </span>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 text-xs font-medium text-neutral-300 transition-colors"
                >
                  🔍 {term}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 space-y-1">
            <span className="font-bold text-white block">RallyOn Universal Sports Index</span>
            <p>
              Type any sports franchise, college team, or venue vibe to discover real-time watch hubs across Austin.
            </p>
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {query && (
        <div className="space-y-4">
          {/* Matched Games Section */}
          {(category === 'ALL' || category === 'GAMES' || category === 'TEAMS') &&
            searchResults.matchedGames.length > 0 && (
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 block mb-2 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" />
                  Matching Sporting Events ({searchResults.matchedGames.length})
                </span>
                <div className="space-y-2">
                  {searchResults.matchedGames.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => onSelectGame(game)}
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                            {game.league}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {game.awayTeam.name} vs {game.homeTeam.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-1">
                          {game.liveDetails
                            ? `${game.liveDetails.period} ${game.liveDetails.clock} (${game.liveDetails.currentScore.away} - ${game.liveDetails.currentScore.home})`
                            : game.startTime}
                        </div>
                      </div>

                      <span className="text-xs text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Match Venues →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Matched Venues Section */}
          {(category === 'ALL' || category === 'VENUES' || category === 'NEIGHBORHOODS') &&
            searchResults.matchedVenues.length > 0 && (
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 block mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Matching Venues ({searchResults.matchedVenues.length})
                </span>
                <div className="space-y-2">
                  {searchResults.matchedVenues.map((venue) => {
                    const live = liveStates[venue.id];
                    return (
                      <div
                        key={venue.id}
                        onClick={() => onSelectVenue(venue)}
                        className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            {venue.name}
                          </h4>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            {venue.neighborhood} • {venue.venueTruth.sports.numTvs} TVs
                            {venue.venueTruth.sports.teamAffiliations.length > 0 && (
                              <span className="text-amber-400/90 ml-1">
                                ({venue.venueTruth.sports.teamAffiliations[0]} Hub)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {live && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-bold">
                              {live.crowd}% Crowd
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-neutral-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* No results */}
          {searchResults.matchedGames.length === 0 && searchResults.matchedVenues.length === 0 && (
            <div className="text-center py-10 bg-neutral-900/40 rounded-2xl border border-neutral-800 p-6">
              <p className="text-sm font-bold text-neutral-300">No matching games or venues found</p>
              <p className="text-xs text-neutral-500 mt-1">
                Try searching for teams like "Cowboys", "Longhorns", or venues like "Cover 3", "Haymaker".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
