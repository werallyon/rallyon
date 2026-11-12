import { SportsGame, TeamReference, Venue, VenueGame } from '../types';
import { supabase } from '../lib/supabaseClient';

export interface FavoriteGameMatch {
  isFavorite: boolean;
  matchedTeam?: TeamReference;
  isHomeTeam: boolean;
  isAwayTeam: boolean;
}

export interface FavoriteTeamGameStatus {
  team: TeamReference;
  game?: SportsGame;
  hasGame: boolean;
  isLive: boolean;
  isUpcoming: boolean;
  isFinal: boolean;
  isHome: boolean;
  opponent?: string;
  opponentAbbrev?: string;
  scoreSummary?: string;
  periodOrTime?: string;
}

/**
 * Checks if a sports game involves any of the user's favorited teams.
 */
export function isFavoriteTeamGame(
  game: SportsGame,
  favoriteTeams?: TeamReference[] | null
): FavoriteGameMatch {
  if (!favoriteTeams || favoriteTeams.length === 0) {
    return { isFavorite: false, isHomeTeam: false, isAwayTeam: false };
  }

  const homeName = (game.homeTeam?.name || '').toLowerCase().trim();
  const homeAbbrev = (game.homeTeam?.abbrev || '').toLowerCase().trim();
  const awayName = (game.awayTeam?.name || '').toLowerCase().trim();
  const awayAbbrev = (game.awayTeam?.abbrev || '').toLowerCase().trim();

  for (const team of favoriteTeams) {
    const teamNameLower = (team.name || '').toLowerCase().trim();
    const teamAbbrevLower = (team.abbrev || '').toLowerCase().trim();

    const homeMatches =
      homeName === teamNameLower ||
      (homeAbbrev && teamAbbrevLower && homeAbbrev === teamAbbrevLower) ||
      (teamNameLower.length > 3 && homeName.includes(teamNameLower)) ||
      (homeName.length > 3 && teamNameLower.includes(homeName));

    if (homeMatches) {
      return {
        isFavorite: true,
        matchedTeam: team,
        isHomeTeam: true,
        isAwayTeam: false
      };
    }

    const awayMatches =
      awayName === teamNameLower ||
      (awayAbbrev && teamAbbrevLower && awayAbbrev === teamAbbrevLower) ||
      (teamNameLower.length > 3 && awayName.includes(teamNameLower)) ||
      (awayName.length > 3 && teamNameLower.includes(awayName));

    if (awayMatches) {
      return {
        isFavorite: true,
        matchedTeam: team,
        isHomeTeam: false,
        isAwayTeam: true
      };
    }
  }

  return { isFavorite: false, isHomeTeam: false, isAwayTeam: false };
}

/**
 * Sorts games so that games featuring the user's favorited teams appear FIRST.
 * Within favorited games, LIVE games appear ahead of UPCOMING games.
 * Non-favorited games follow, with LIVE games appearing ahead of UPCOMING/FINAL.
 */
export function sortGamesByFavorites(
  games: SportsGame[],
  favoriteTeams?: TeamReference[] | null
): SportsGame[] {
  if (!games || games.length === 0) return [];

  const hasFavorites = favoriteTeams && favoriteTeams.length > 0;

  return [...games].sort((a, b) => {
    if (hasFavorites) {
      const aFav = isFavoriteTeamGame(a, favoriteTeams).isFavorite;
      const bFav = isFavoriteTeamGame(b, favoriteTeams).isFavorite;

      // 1. Favorited team games ALWAYS come first
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
    }

    // 2. LIVE games precede non-live within the same priority bracket
    const aIsLive = a.status === 'LIVE' || a.status === 'HALFTIME';
    const bIsLive = b.status === 'LIVE' || b.status === 'HALFTIME';

    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    // 3. UPCOMING games precede FINAL games
    const aIsUpcoming = a.status === 'UPCOMING';
    const bIsUpcoming = b.status === 'UPCOMING';
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;

    return 0;
  });
}

/**
 * Derives current broadcast/game status for a specific user favorite team.
 */
export function getFavoriteTeamGameStatus(
  team: TeamReference,
  games: SportsGame[]
): FavoriteTeamGameStatus {
  const matchingGame = games.find((g) => {
    const check = isFavoriteTeamGame(g, [team]);
    return check.isFavorite;
  });

  if (!matchingGame) {
    return {
      team,
      hasGame: false,
      isLive: false,
      isUpcoming: false,
      isFinal: false,
      isHome: false
    };
  }

  const check = isFavoriteTeamGame(matchingGame, [team]);
  const isHome = check.isHomeTeam;
  const opponent = isHome ? matchingGame.awayTeam.name : matchingGame.homeTeam.name;
  const opponentAbbrev = isHome ? matchingGame.awayTeam.abbrev : matchingGame.homeTeam.abbrev;
  const isLive = matchingGame.status === 'LIVE' || matchingGame.status === 'HALFTIME';
  const isUpcoming = matchingGame.status === 'UPCOMING';
  const isFinal = matchingGame.status === 'FINAL';

  let scoreSummary = '';
  if (matchingGame.liveDetails) {
    const myScore = isHome
      ? matchingGame.liveDetails.currentScore.home
      : matchingGame.liveDetails.currentScore.away;
    const oppScore = isHome
      ? matchingGame.liveDetails.currentScore.away
      : matchingGame.liveDetails.currentScore.home;
    scoreSummary = `${myScore}-${oppScore}`;
  }

  let periodOrTime = matchingGame.startTime;
  if (matchingGame.liveDetails) {
    periodOrTime = `${matchingGame.liveDetails.period}${
      matchingGame.liveDetails.clock ? ` ${matchingGame.liveDetails.clock}` : ''
    }`;
  }

  return {
    team,
    game: matchingGame,
    hasGame: true,
    isLive,
    isUpcoming,
    isFinal,
    isHome,
    opponent,
    opponentAbbrev,
    scoreSummary,
    periodOrTime
  };
}

/**
 * Checks if a venue is an official fan hub or dedicated watch venue for any user favorite teams.
 */
export function checkVenueFavoriteTeamAffiliation(
  venue: Venue,
  favoriteTeams?: TeamReference[] | null
): { isAffiliated: boolean; matchedTeam?: TeamReference; affiliationName?: string } {
  if (!favoriteTeams || favoriteTeams.length === 0) {
    return { isAffiliated: false };
  }

  const venueAffiliations = venue.venueTruth.sports.teamAffiliations || [];
  const fanBases = venue.fanBases || [];
  const goodFor = venue.venueTruth.goodFor || [];
  const teamEvents = venue.venueTruth.experience.teamEvents || [];

  for (const team of favoriteTeams) {
    const tName = team.name.toLowerCase();
    const tAbbrev = team.abbrev?.toLowerCase();

    // Check sports team affiliations
    const matchedAff = venueAffiliations.find(
      (a) => a.toLowerCase().includes(tName) || tName.includes(a.toLowerCase())
    );
    if (matchedAff) {
      return { isAffiliated: true, matchedTeam: team, affiliationName: matchedAff };
    }

    // Check fanBases
    const matchedFanBase = fanBases.find((fb) => {
      if (typeof fb === 'string') {
        return fb.toLowerCase().includes(tName) || tName.includes(fb.toLowerCase());
      }
      return fb.team.toLowerCase().includes(tName) || tName.includes(fb.team.toLowerCase());
    });
    if (matchedFanBase) {
      const name = typeof matchedFanBase === 'string' ? matchedFanBase : matchedFanBase.team;
      return { isAffiliated: true, matchedTeam: team, affiliationName: name };
    }

    // Check team events (e.g. "Arsenal Austin Supporters Matchday HQ")
    const matchedEvent = teamEvents.find((e) => e.toLowerCase().includes(tName));
    if (matchedEvent) {
      return { isAffiliated: true, matchedTeam: team, affiliationName: matchedEvent };
    }

    // Check goodFor mentions
    const matchedGoodFor = goodFor.find((g) => g.toLowerCase().includes(tName));
    if (matchedGoodFor) {
      return { isAffiliated: true, matchedTeam: team, affiliationName: team.name };
    }
  }

  return { isAffiliated: false };
}


/** Database representation of a user's selected team. */
export interface FavoriteTeamRow {
  user_id: string;
  team_id: string;
  team_name: string;
  sport_id: string;
  league: string;
  abbrev: string;
  logo: string;
  color: string | null;
  sort_order: number;
}

/** Convert the normalized row into the existing app-facing team model. */
export function mapFavoriteTeamRow(row: FavoriteTeamRow): TeamReference {
  return {
    id: row.team_id,
    name: row.team_name,
    sportId: row.sport_id,
    league: row.league,
    abbrev: row.abbrev,
    logo: row.logo,
    ...(row.color ? { color: row.color } : {})
  };
}

/** Convert the existing app-facing model into a relational row. */
export function toFavoriteTeamRow(userId: string, team: TeamReference, sortOrder: number): FavoriteTeamRow {
  return {
    user_id: userId,
    team_id: team.id,
    team_name: team.name,
    sport_id: team.sportId,
    league: team.league,
    abbrev: team.abbrev,
    logo: team.logo,
    color: team.color ?? null,
    sort_order: sortOrder
  };
}

/** Read the user's relational favorites in the order selected. */
export async function getFavoriteTeams(userId: string): Promise<TeamReference[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('user_favorite_teams')
    .select('user_id, team_id, team_name, sport_id, league, abbrev, logo, color, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapFavoriteTeamRow(row as FavoriteTeamRow));
}

/**
 * Validate and normalize a complete favorite selection before sending it to
 * the transactional RPC. First occurrence wins for duplicate team IDs.
 */
export function normalizeFavoriteTeams(teams: TeamReference[]): TeamReference[] {
  if (!Array.isArray(teams)) throw new TypeError('Favorite teams must be an array.');
  const seen = new Set<string>();
  const normalized: TeamReference[] = [];
  for (const team of teams) {
    if (!team || typeof team !== 'object') throw new TypeError('Every favorite team must be an object.');
    const id = typeof team.id === 'string' ? team.id.trim() : '';
    const name = typeof team.name === 'string' ? team.name.trim() : '';
    if (!id || !name) throw new TypeError('Favorite teams require non-empty IDs and names.');
    for (const field of ['sportId', 'league', 'abbrev', 'logo'] as const) {
      if (typeof team[field] !== 'string') throw new TypeError(`Favorite team ${field} must be a string.`);
    }
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      ...team,
      id,
      name,
      sportId: team.sportId.trim() || 'OTHER',
      league: team.league.trim() || 'OTHER',
      abbrev: team.abbrev.trim(),
      logo: team.logo.trim(),
      ...(team.color ? { color: team.color.trim() } : {})
    });
  }
  return normalized;
}

/**
 * Replace the entire favorite selection in one Postgres transaction.
 * The RPC derives ownership from auth.uid(); no caller-supplied user ID reaches
 * the database write. An empty array intentionally clears the selection.
 */
export async function replaceFavoriteTeams(userId: string, teams: TeamReference[]): Promise<TeamReference[]> {
  if (!supabase) return normalizeFavoriteTeams(teams);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user || authData.user.id !== userId) {
    throw new Error('Favorite-team replacement requires the matching authenticated user.');
  }
  const normalized = normalizeFavoriteTeams(teams);
  const { error } = await supabase.rpc('save_profile_and_favorite_teams', {
    p_profile_updates: {},
    p_favorite_teams: normalized
  });
  if (error) throw error;
  return normalized;
}
