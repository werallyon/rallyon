import { SportsGame, TeamReference, Venue, VenueGame } from '../types';

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
