import {
  Venue,
  VenueLiveState,
  UserIntent,
  SportsGame,
  VenueGame,
  Presence,
  RallyMatchResult,
  RallyMatchBreakdown
} from '../types';

export interface MatchScoringOptions {
  intent: UserIntent;
  selectedGame?: SportsGame | null;
  venueGames: VenueGame[];
  presenceList: Presence[];
  userLocation?: { latitude: number; longitude: number };
  userFavoriteTeams?: string[];
  userFavoriteSports?: string[];
}

// Haversine formula for distance in miles
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function computeRallyMatch(
  venue: Venue,
  liveState: VenueLiveState,
  options: MatchScoringOptions
): RallyMatchResult {
  const { intent, selectedGame, venueGames, presenceList, userLocation } = options;

  // 1. Calculate distance (default to Austin center if no GPS)
  const userLat = userLocation?.latitude ?? 30.2672;
  const userLon = userLocation?.longitude ?? -97.7431;
  const distanceMiles = calculateDistanceMiles(userLat, userLon, venue.latitude, venue.longitude);

  // 2. Friends inside this venue
  const friendsInside = presenceList.filter((p) => p.venueId === venue.id);
  const friendCount = friendsInside.length;

  // 3. Game matching
  const activeGameStatus = selectedGame
    ? venueGames.find((vg) => vg.venueId === venue.id && vg.gameId === selectedGame.id)
    : venueGames.find((vg) => vg.venueId === venue.id);

  let gameWeight = 0;
  if (selectedGame) {
    if (activeGameStatus) {
      if (activeGameStatus.verificationStatus === 'GAME_ON') {
        gameWeight = activeGameStatus.audioConfirmed ? 30 : 25;
      } else if (activeGameStatus.verificationStatus === 'LIKELY') {
        gameWeight = 16;
      } else {
        gameWeight = 5;
      }
    } else {
      gameWeight = -25; // Significant penalty if game is not shown
    }
  }

  // 4. Intent Scoring
  let intentAlignment = 50;
  let sportsAffinity = liveState.sportsIntensity;
  let crowdEnergyScore = liveState.energy;
  let viewingScore = liveState.viewingQuality;
  let seatingScore = liveState.seatingAvailability;
  let friendBonus = Math.min(friendCount * 10, 25);

  const whyYouShouldGo: string[] = [];
  const maybeSkipIf: string[] = [];

  switch (intent) {
    case 'HIGH_ENERGY': {
      // Loves high crowd, high energy, high noise, game audio
      const energyMatch = liveState.energy * 0.4;
      const crowdMatch = liveState.crowd * 0.35;
      const noiseMatch = liveState.noise * 0.25;
      intentAlignment = energyMatch + crowdMatch + noiseMatch;

      if (liveState.energy >= 90) whyYouShouldGo.push('Electric high-energy crowd atmosphere');
      if (liveState.trendingVelocity >= 20)
        whyYouShouldGo.push(`Trending upward rapidly (+${liveState.trendingVelocity}%)`);
      if (venue.venueTruth.sports.gameAudio) whyYouShouldGo.push('Game audio priority on house speakers');
      if (friendCount > 0) whyYouShouldGo.push(`${friendCount} friend${friendCount > 1 ? 's' : ''} already inside`);

      if (liveState.crowd < 65)
        maybeSkipIf.push('Crowd is too mellow right now for a peak high-energy experience');
      if (liveState.seatingAvailability < 10)
        maybeSkipIf.push('Virtually zero open seats (standing room only)');
      break;
    }

    case 'CHILL': {
      // Wants available seating, lower crowd, lower noise, good food/drinks
      const seatingReward = liveState.seatingAvailability * 0.45;
      const lowNoiseReward = (100 - liveState.noise) * 0.3;
      const relaxedCrowd = (100 - liveState.crowd) * 0.25;
      intentAlignment = seatingReward + lowNoiseReward + relaxedCrowd;

      if (liveState.seatingAvailability >= 50)
        whyYouShouldGo.push('Plenty of comfortable open seating available right now');
      if (liveState.noise <= 65) whyYouShouldGo.push('Conversational noise level — easy to talk');
      if (venue.venueTruth.environment.hasPatio) whyYouShouldGo.push('Spacious relaxed open-air patio');

      if (liveState.crowd >= 85)
        maybeSkipIf.push('Too packed and noisy for your Chill preference right now');
      if (liveState.seatingAvailability < 25)
        maybeSkipIf.push('Seating is tight — you may have to wait or stand');
      break;
    }

    case 'WITH_FRIENDS': {
      // Prioritizes friends present, group tables, patio, social openness
      const friendFactor = friendCount > 0 ? 30 + friendCount * 10 : 10;
      const tableFactor = (venue.venueTruth.environment.seatingRatio.tables / 100) * 30;
      const socialFactor = (liveState.social / 100) * 30;
      intentAlignment = friendFactor + tableFactor + socialFactor;

      if (friendCount > 0)
        whyYouShouldGo.push(`${friendCount} friend${friendCount > 1 ? 's' : ''} already checked in here`);
      if (venue.venueTruth.audience.groupFriendly)
        whyYouShouldGo.push('Excellent group tables and shared pitcher/platter options');
      if (liveState.social >= 88) whyYouShouldGo.push('High social openness — great crowd chemistry');

      if (friendCount === 0 && liveState.seatingAvailability < 20)
        maybeSkipIf.push('Crowded with no friends currently checked in to save seats');
      if (!venue.venueTruth.audience.groupFriendly)
        maybeSkipIf.push('Layout favors small bar pairs rather than large friend groups');
      break;
    }

    case 'SOLO': {
      // Prioritizes bar seating ratio, direct screen view, friendly environment
      const barSeatFactor = (venue.venueTruth.environment.seatingRatio.bar / 100) * 45;
      const viewingFactor = (liveState.viewingQuality / 100) * 35;
      const soloFactor = venue.venueTruth.audience.soloFriendly ? 20 : 0;
      intentAlignment = barSeatFactor + viewingFactor + soloFactor;

      if (venue.venueTruth.environment.seatingRatio.bar >= 30)
        whyYouShouldGo.push('High bar seating ratio — easy to grab a solo stool');
      if (liveState.viewingQuality >= 85)
        whyYouShouldGo.push('Direct 360° screen sightlines with zero awkward neck strain');
      if (venue.venueTruth.audience.soloFriendly)
        whyYouShouldGo.push('Welcoming solo atmosphere with active sports chatter');

      if (venue.venueTruth.environment.seatingRatio.bar < 20)
        maybeSkipIf.push('Very limited bar seating — mostly reserved group tables');
      if (liveState.crowd >= 95)
        maybeSkipIf.push('Shoulder-to-shoulder crowd makes solo bar maneuvering tough');
      break;
    }

    case 'HARDCORE_FANS': {
      // Prioritizes team affiliation, sports intensity, game audio
      let teamBonus = 0;
      if (selectedGame) {
        const homeMatch = venue.venueTruth.sports.teamAffiliations.includes(selectedGame.homeTeam.name);
        const awayMatch = venue.venueTruth.sports.teamAffiliations.includes(selectedGame.awayTeam.name);
        if (homeMatch || awayMatch) teamBonus = 25;
      }
      const intensityFactor = (liveState.sportsIntensity / 100) * 45;
      const audioFactor = venue.venueTruth.sports.gameAudio ? 25 : 5;
      intentAlignment = intensityFactor + audioFactor + teamBonus;

      if (venue.venueTruth.sports.gameAudio)
        whyYouShouldGo.push('Full house audio broadcast with every whistle and crowd call');
      if (liveState.sportsIntensity >= 90)
        whyYouShouldGo.push('Die-hard fan intensity — everyone is locked into the game');
      if (venue.venueTruth.sports.teamAffiliations.length > 0)
        whyYouShouldGo.push(`Affiliated fan base: ${venue.venueTruth.sports.teamAffiliations.slice(0, 2).join(', ')}`);

      if (!venue.venueTruth.sports.gameAudio)
        maybeSkipIf.push('Game audio not prioritized over background music');
      if (liveState.sportsIntensity < 70)
        maybeSkipIf.push('More casual dining vibe than hardcore sports fan base');
      break;
    }

    case 'BEST_VIEWING': {
      // Prioritizes TVs, projector, viewing quality, sound clarity
      const screenScore = Math.min((venue.venueTruth.sports.numTvs / 40) * 35, 35);
      const qualityScore = (liveState.viewingQuality / 100) * 45;
      const projScore = venue.venueTruth.sports.hasProjector ? 20 : 10;
      intentAlignment = screenScore + qualityScore + projScore;

      whyYouShouldGo.push(`${venue.venueTruth.sports.numTvs}+ HD/4K screens throughout venue`);
      if (venue.venueTruth.sports.hasProjector)
        whyYouShouldGo.push('Laser projector / mega stadium screen active');
      if (liveState.viewingQuality >= 90)
        whyYouShouldGo.push('Exceptional viewing quality with optimal screen angles');

      if (venue.venueTruth.sports.numTvs < 20)
        maybeSkipIf.push('Fewer screens than top-tier viewing venues in the area');
      break;
    }
  }

  // Distance penalty/decay: -1.5 points per mile past 2 miles
  let distanceScore = 100 - Math.max(0, (distanceMiles - 2) * 2.5);
  distanceScore = Math.max(20, Math.min(100, distanceScore));

  // User Preferences Team & Sports Boost
  let preferenceBonus = 0;
  let matchedFavoriteTeam: string | undefined;
  let isFavoriteTeamHub = false;

  if (options.userFavoriteTeams && options.userFavoriteTeams.length > 0) {
    const venueAffiliations = venue.venueTruth.sports.teamAffiliations || [];
    const fanBases = (venue.fanBases || []).map((fb) => (typeof fb === 'string' ? fb : fb.team));
    const teamEvents = venue.venueTruth.experience.teamEvents || [];

    const matchedAffiliation = options.userFavoriteTeams.find((myTeam) => {
      const myTeamLower = myTeam.toLowerCase();
      return (
        venueAffiliations.some(
          (aff) => aff.toLowerCase().includes(myTeamLower) || myTeamLower.includes(aff.toLowerCase())
        ) ||
        fanBases.some(
          (fb) => fb.toLowerCase().includes(myTeamLower) || myTeamLower.includes(fb.toLowerCase())
        ) ||
        teamEvents.some((te) => te.toLowerCase().includes(myTeamLower))
      );
    });

    if (matchedAffiliation) {
      preferenceBonus += 22; // High priority boost so user's teams appear first!
      matchedFavoriteTeam = matchedAffiliation;
      isFavoriteTeamHub = true;
      whyYouShouldGo.unshift(`⭐ Official fan hub for your team: ${matchedAffiliation}`);
    }

    // Also check if this venue is actively broadcasting a game featuring the user's favorite team
    if (options.venueGames) {
      const activeFavGame = options.venueGames.find((vg) => {
        if (vg.venueId !== venue.id || vg.verificationStatus !== 'GAME_ON') return false;
        const game = options.selectedGame?.id === vg.gameId ? options.selectedGame : null;
        if (!game) return false;
        const homeName = game.homeTeam.name.toLowerCase();
        const awayName = game.awayTeam.name.toLowerCase();
        return options.userFavoriteTeams?.some((fav) => {
          const favLower = fav.toLowerCase();
          return homeName.includes(favLower) || awayName.includes(favLower);
        });
      });

      if (activeFavGame) {
        preferenceBonus += 15;
        if (!matchedFavoriteTeam && options.selectedGame) {
          matchedFavoriteTeam = options.selectedGame.homeTeam.name;
        }
        whyYouShouldGo.unshift(`📺 Verified live broadcast of your team with sound`);
      }
    }
  }

  // Compute final composite score
  let compositeScore = 0;
  if (selectedGame) {
    // When a game is selected, game verification is critical
    compositeScore =
      intentAlignment * 0.45 +
      (gameWeight + 50) * 0.35 +
      (distanceScore / 100) * 10 +
      friendBonus * 0.1 +
      preferenceBonus;
  } else {
    compositeScore =
      intentAlignment * 0.65 +
      (liveState.sportsIntensity / 100) * 15 +
      (distanceScore / 100) * 10 +
      friendBonus * 0.1 +
      preferenceBonus;
  }

  // Boundary clamp
  const finalScore = Math.max(15, Math.min(99, Math.round(compositeScore)));

  // Fallback reasons if none generated
  if (whyYouShouldGo.length === 0) {
    whyYouShouldGo.push(`${venue.baseline.category} in ${venue.baseline.neighborhood}`);
    whyYouShouldGo.push(`${venue.venueTruth.sports.numTvs} TVs with good sports coverage`);
  }

  const breakdown: RallyMatchBreakdown = {
    intentAlignment: Math.round(intentAlignment),
    sportsAffinity: Math.round(sportsAffinity),
    crowdEnergyScore: Math.round(crowdEnergyScore),
    viewingScore: Math.round(viewingScore),
    seatingScore: Math.round(seatingScore),
    friendBonus: Math.round(friendBonus)
  };

  return {
    venueId: venue.id,
    venue,
    liveState,
    score: finalScore,
    breakdown,
    whyYouShouldGo: whyYouShouldGo.slice(0, 4),
    maybeSkipIf: maybeSkipIf.slice(0, 3),
    activeGameStatus,
    friendsInside,
    distanceMiles,
    matchedFavoriteTeam,
    isFavoriteTeamHub
  };
}

export function rankVenues(
  venues: Venue[],
  liveStates: Record<string, VenueLiveState>,
  options: MatchScoringOptions
): RallyMatchResult[] {
  const results = venues.map((venue) => {
    const liveState = liveStates[venue.id] || {
      venueId: venue.id,
      energy: venue.venueTruth.environment.energyBaseline,
      crowd: venue.venueTruth.environment.crowdBaseline,
      noise: venue.venueTruth.environment.noiseBaseline,
      social: venue.venueTruth.environment.socialOpenness,
      sportsIntensity: 75,
      viewingQuality: 80,
      seatingAvailability: 40,
      trendingVelocity: 5,
      currentStatus: 'LIVE',
      lastUpdated: new Date().toISOString()
    };
    return computeRallyMatch(venue, liveState, options);
  });

  return results.sort((a, b) => b.score - a.score);
}
