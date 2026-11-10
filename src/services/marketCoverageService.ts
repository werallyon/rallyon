import {
  MarketCoverage,
  MarketReadiness,
  MarketLaunchChecklist,
  Venue,
  VenueGameProgramming,
  Presence,
  SportsGame
} from '../types';

/**
 * Configurable weights and criteria for Market Coverage & Readiness formulas.
 * Centralized here so algorithms remain dynamically configurable without UI couplings.
 */
export interface MarketScoringConfig {
  coverageWeights: {
    venueDiscoveryPct: number; // 0.25
    claimedRatio: number; // 0.20
    verifiedRatio: number; // 0.15
    programmingRatio: number; // 0.20
    venueTruthCompleteness: number; // 0.10
    sportsDataCompleteness: number; // 0.10
  };
  readinessWeights: {
    venueCoverage: number; // 0.30
    claimedVenues: number; // 0.20
    gameProgramming: number; // 0.20
    sportsDataQuality: number; // 0.15
    userActivity: number; // 0.15
  };
  readinessThresholds: {
    minReadinessScore: number; // 80%
    minCoverageScore: number; // 70%
    minClaimedVenues: number; // 5
    minProgrammedVenues: number; // 3
    minSportsDataQuality: number; // 80%
  };
}

export const DEFAULT_MARKET_SCORING_CONFIG: MarketScoringConfig = {
  coverageWeights: {
    venueDiscoveryPct: 0.25,
    claimedRatio: 0.2,
    verifiedRatio: 0.15,
    programmingRatio: 0.2,
    venueTruthCompleteness: 0.1,
    sportsDataCompleteness: 0.1
  },
  readinessWeights: {
    venueCoverage: 0.3,
    claimedVenues: 0.2,
    gameProgramming: 0.2,
    sportsDataQuality: 0.15,
    userActivity: 0.15
  },
  readinessThresholds: {
    minReadinessScore: 78,
    minCoverageScore: 70,
    minClaimedVenues: 5,
    minProgrammedVenues: 3,
    minSportsDataQuality: 80
  }
};

export class MarketCoverageService {
  private config: MarketScoringConfig;

  constructor(customConfig?: Partial<MarketScoringConfig>) {
    this.config = {
      ...DEFAULT_MARKET_SCORING_CONFIG,
      ...customConfig
    };
  }

  /**
   * Update scoring formula weights dynamically
   */
  public updateConfig(newConfig: Partial<MarketScoringConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  public getConfig(): MarketScoringConfig {
    return { ...this.config };
  }

  /**
   * Dynamically calculate Market Coverage metrics for a given market
   */
  public calculateMarketCoverage(
    marketId: string,
    allVenues: Venue[],
    allProgramming: VenueGameProgramming[],
    allCheckins: Presence[],
    gamesToday: SportsGame[],
    estimatedRelevantVenues?: number
  ): MarketCoverage {
    // 1. Filter venues belonging to this market
    const marketVenues = allVenues.filter((v) => v.market_id === marketId);
    const rallyOnCount = marketVenues.length;

    // Estimate total relevant venue universe in this metro if not passed
    // (In Texarkana: ~25-35 sports-relevant bars/restaurants; in DFW: ~1,200)
    const totalRelevant =
      estimatedRelevantVenues ||
      Math.max(
        rallyOnCount,
        marketId === 'market_texarkana'
          ? 28
          : marketId === 'market_dfw'
          ? 1240
          : marketId === 'market_houston'
          ? 1150
          : marketId === 'market_austin'
          ? 480
          : marketId === 'market_littlerock'
          ? 160
          : rallyOnCount * 2 || 20
      );

    const claimedCount = marketVenues.filter((v) => v.claimed).length;

    // Verified venues (venues with rich truth data verified & claimed)
    const verifiedCount = marketVenues.filter(
      (v) =>
        v.claimed &&
        v.venueTruth?.sports.numTvs &&
        v.venueTruth.sports.numTvs > 0 &&
        (v.venueTruth.sports.sportsPackages?.length || 0) > 0
    ).length;

    // Active venues (have live states or recent signals)
    const activeCount = marketVenues.filter(
      (v) => (v.baseline?.capacity || 0) > 0 || v.claimed
    ).length;

    // Programmed venues today
    const marketVenueIds = new Set(marketVenues.map((v) => v.id));
    const programmedVenuesToday = new Set(
      allProgramming
        .filter(
          (p) =>
            marketVenueIds.has(p.venue_id) &&
            (p.is_confirmed || p.status === 'CONFIRMED' || p.status === 'GAME_ON')
        )
        .map((p) => p.venue_id)
    );
    const programmedCount = programmedVenuesToday.size;

    // Check-ins today in this market
    const activeCheckins = allCheckins.filter((p) =>
      marketVenueIds.has(p.venueId)
    ).length;

    // Games programmed today
    const programmedGamesToday = allProgramming.filter(
      (p) =>
        marketVenueIds.has(p.venue_id) &&
        (p.is_confirmed || p.status === 'CONFIRMED' || p.status === 'GAME_ON')
    ).length;

    // Venue Truth Completeness (0 - 100%)
    const completenessScores = marketVenues.map((v) => {
      let score = 20; // baseline identity
      if (v.venueTruth?.sports.numTvs) score += 20;
      if (v.venueTruth?.sports.sportsPackages?.length) score += 20;
      if (v.venueTruth?.sports.gameAudio !== undefined) score += 15;
      if (v.venueTruth?.environment?.energyBaseline) score += 15;
      if (v.venueTruth?.audience?.hardcoreFanRatio) score += 10;
      return score;
    });

    const avgVenueTruthCompleteness =
      completenessScores.length > 0
        ? Math.round(
            completenessScores.reduce((a, b) => a + b, 0) /
              completenessScores.length
          )
        : 0;

    // Sports Data Completeness (0 - 100%)
    const sportsDataCompleteness =
      gamesToday.length > 0
        ? Math.min(
            100,
            Math.round(
              (gamesToday.filter(
                (g) => g.status === 'LIVE' || g.status === 'FINAL' || g.liveDetails
              ).length /
                gamesToday.length) *
                70 +
                30
            )
          )
        : 85;

    // Compute dynamic coverage score using centralized weights
    const w = this.config.coverageWeights;
    const discoveryRatio = Math.min(1, rallyOnCount / Math.max(1, totalRelevant));
    const claimedRatio = rallyOnCount > 0 ? claimedCount / rallyOnCount : 0;
    const verifiedRatio = rallyOnCount > 0 ? verifiedCount / rallyOnCount : 0;
    const programmingRatio =
      rallyOnCount > 0
        ? Math.min(1, (programmedCount * 1.5) / rallyOnCount)
        : 0;

    const rawScore =
      discoveryRatio * w.venueDiscoveryPct +
      claimedRatio * w.claimedRatio +
      verifiedRatio * w.verifiedRatio +
      programmingRatio * w.programmingRatio +
      (avgVenueTruthCompleteness / 100) * w.venueTruthCompleteness +
      (sportsDataCompleteness / 100) * w.sportsDataCompleteness;

    const coverageScore = Math.min(99, Math.max(15, Math.round(rawScore * 100)));

    return {
      id: `cov_${marketId}`,
      market_id: marketId,
      total_relevant_venues: totalRelevant,
      RallyOn_venues: rallyOnCount,
      claimed_venues: claimedCount,
      verified_venues: verifiedCount,
      active_venues: activeCount,
      programmed_venues: programmedCount,
      games_today: gamesToday.length,
      games_programmed_today: programmedGamesToday,
      live_venues: Math.max(1, Math.round(activeCount * 0.75)),
      active_checkins: activeCheckins,
      active_users: Math.max(activeCheckins * 5, 42),
      venue_data_completeness: avgVenueTruthCompleteness,
      sports_data_completeness: sportsDataCompleteness,
      coverage_score: coverageScore,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Dynamically calculate Market Readiness for aggressive expansion/activation
   */
  public calculateMarketReadiness(
    marketId: string,
    coverage: MarketCoverage
  ): MarketReadiness {
    const {
      total_relevant_venues,
      RallyOn_venues,
      claimed_venues,
      verified_venues,
      active_venues,
      programmed_venues,
      sports_data_completeness,
      active_checkins
    } = coverage;

    const venue_coverage_pct =
      total_relevant_venues > 0
        ? Math.min(100, Math.round((RallyOn_venues / total_relevant_venues) * 100))
        : 0;

    const claimed_venue_pct =
      RallyOn_venues > 0
        ? Math.min(100, Math.round((claimed_venues / RallyOn_venues) * 100))
        : 0;

    const verified_venue_pct =
      RallyOn_venues > 0
        ? Math.min(100, Math.round((verified_venues / RallyOn_venues) * 100))
        : 0;

    const active_venue_pct =
      RallyOn_venues > 0
        ? Math.min(100, Math.round((active_venues / RallyOn_venues) * 100))
        : 0;

    const game_programming_pct =
      RallyOn_venues > 0
        ? Math.min(100, Math.round((programmed_venues / RallyOn_venues) * 100))
        : 0;

    const user_activity_score = Math.min(
      100,
      Math.round(active_checkins * 3.5 + 20)
    );

    const venue_participation_score = Math.round(
      claimed_venue_pct * 0.6 + game_programming_pct * 0.4
    );

    // Weighted composite readiness score
    const rw = this.config.readinessWeights;
    const compositeReadiness =
      (venue_coverage_pct / 100) * rw.venueCoverage +
      (claimed_venue_pct / 100) * rw.claimedVenues +
      (game_programming_pct / 100) * rw.gameProgramming +
      (sports_data_completeness / 100) * rw.sportsDataQuality +
      (user_activity_score / 100) * rw.userActivity;

    const readinessScore = Math.min(
      99,
      Math.max(10, Math.round(compositeReadiness * 100))
    );

    // Evaluate against configurable thresholds
    const t = this.config.readinessThresholds;
    const recommendations: string[] = [];

    if (readinessScore < t.minReadinessScore) {
      recommendations.push(
        `Increase overall readiness score to at least ${t.minReadinessScore}% (currently ${readinessScore}%)`
      );
    }
    if (claimed_venues < t.minClaimedVenues) {
      recommendations.push(
        `Onboard ${t.minClaimedVenues - claimed_venues} more claimed venues to reach the target of ${t.minClaimedVenues}`
      );
    }
    if (programmed_venues < t.minProgrammedVenues) {
      recommendations.push(
        `Confirm game programming at ${t.minProgrammedVenues - programmed_venues} additional sports bars`
      );
    }
    if (coverage.coverage_score < t.minCoverageScore) {
      recommendations.push(
        `Enrich venue truth data to raise market coverage score to ${t.minCoverageScore}%`
      );
    }

    const is_ready_for_launch = recommendations.length === 0;

    return {
      market_id: marketId,
      readiness_score: readinessScore,
      venue_coverage_pct,
      claimed_venue_pct,
      verified_venue_pct,
      active_venue_pct,
      game_programming_pct,
      sports_data_quality_pct: sports_data_completeness,
      user_activity_score,
      venue_participation_score,
      is_ready_for_launch,
      recommendations
    };
  }

  /**
   * Generates the 11-step Market Launch Checklist
   */
  public getMarketLaunchChecklist(
    coverage: MarketCoverage,
    readiness: MarketReadiness
  ): MarketLaunchChecklist {
    const venueDiscovery = coverage.RallyOn_venues >= 8;
    const venueNormalization = coverage.venue_data_completeness >= 65;
    const duplicateCleanup = true;
    const sportsData = coverage.sports_data_completeness >= 75;
    const venueClaims = coverage.claimed_venues >= 4;
    const venueProgramming = coverage.programmed_venues >= 2;
    const checkinsEnabled = true;
    const promotionsEnabled = true;
    const analyticsActive = true;
    const coverageThreshold = coverage.coverage_score >= 65;
    const readyForLaunch =
      venueDiscovery &&
      venueNormalization &&
      sportsData &&
      venueClaims &&
      venueProgramming &&
      coverageThreshold;

    return {
      venue_discovery_complete: venueDiscovery,
      venue_normalization_complete: venueNormalization,
      duplicate_cleanup_complete: duplicateCleanup,
      sports_data_active: sportsData,
      venue_claims_started: venueClaims,
      venue_programming_active: venueProgramming,
      checkins_enabled: checkinsEnabled,
      promotions_enabled: promotionsEnabled,
      analytics_active: analyticsActive,
      coverage_threshold_reached: coverageThreshold,
      ready_for_launch: readyForLaunch
    };
  }
}

export const marketCoverageService = new MarketCoverageService();
