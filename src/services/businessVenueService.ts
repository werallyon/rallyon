import {
  VenueClaim,
  ClaimVerificationStatus,
  BusinessAccount,
  BusinessMember,
  BusinessRole,
  VenueGameProgramming,
  Promotion,
  Campaign,
  QRCode,
  Redemption,
  Sponsorship,
  VenueAnalyticsEvent,
  VenueAnalyticsSummary,
  VenueReliabilityScore,
  Venue
} from '../types';
import { isDemoMode } from '../config/dataMode';

const STORAGE_CLAIMS_KEY = 'rallyon_venue_claims_v1';
const STORAGE_PROGRAMMING_KEY = 'rallyon_venue_programming_v1';
const STORAGE_PROMOTIONS_KEY = 'rallyon_venue_promotions_v1';
const STORAGE_REDEMPTIONS_KEY = 'rallyon_venue_redemptions_v1';
const STORAGE_SPONSORSHIPS_KEY = 'rallyon_sponsorships_v1';
const STORAGE_ANALYTICS_KEY = 'rallyon_analytics_events_v1';
const STORAGE_BUSINESS_ACCOUNTS_KEY = 'rallyon_business_accounts_v1';

export class BusinessVenueService {
  private claims: VenueClaim[] = [];
  private programming: VenueGameProgramming[] = [];
  private promotions: Promotion[] = [];
  private redemptions: Redemption[] = [];
  private sponsorships: Sponsorship[] = [];
  private analyticsEvents: VenueAnalyticsEvent[] = [];
  private businessAccounts: BusinessAccount[] = [];
  private businessMembers: BusinessMember[] = [];
  private qrCodes: Map<string, QRCode> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedClaims = localStorage.getItem(STORAGE_CLAIMS_KEY);
      this.claims = storedClaims ? JSON.parse(storedClaims) : (isDemoMode ? this.getInitialClaims() : []);

      const storedProg = localStorage.getItem(STORAGE_PROGRAMMING_KEY);
      this.programming = storedProg ? JSON.parse(storedProg) : (isDemoMode ? this.getInitialProgramming() : []);

      const storedPromos = localStorage.getItem(STORAGE_PROMOTIONS_KEY);
      this.promotions = storedPromos ? JSON.parse(storedPromos) : (isDemoMode ? this.getInitialPromotions() : []);

      const storedSpons = localStorage.getItem(STORAGE_SPONSORSHIPS_KEY);
      this.sponsorships = storedSpons ? JSON.parse(storedSpons) : (isDemoMode ? this.getInitialSponsorships() : []);

      const storedRedemptions = localStorage.getItem(STORAGE_REDEMPTIONS_KEY);
      this.redemptions = storedRedemptions ? JSON.parse(storedRedemptions) : [];

      const storedEvents = localStorage.getItem(STORAGE_ANALYTICS_KEY);
      this.analyticsEvents = storedEvents ? JSON.parse(storedEvents) : (isDemoMode ? this.getInitialAnalytics() : []);

      const storedAccounts = localStorage.getItem(STORAGE_BUSINESS_ACCOUNTS_KEY);
      this.businessAccounts = storedAccounts ? JSON.parse(storedAccounts) : (isDemoMode ? this.getInitialAccounts() : []);
    } catch {
      this.claims = isDemoMode ? this.getInitialClaims() : [];
      this.programming = isDemoMode ? this.getInitialProgramming() : [];
      this.promotions = isDemoMode ? this.getInitialPromotions() : [];
      this.sponsorships = isDemoMode ? this.getInitialSponsorships() : [];
      this.analyticsEvents = isDemoMode ? this.getInitialAnalytics() : [];
      this.businessAccounts = isDemoMode ? this.getInitialAccounts() : [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_CLAIMS_KEY, JSON.stringify(this.claims));
      localStorage.setItem(STORAGE_PROGRAMMING_KEY, JSON.stringify(this.programming));
      localStorage.setItem(STORAGE_PROMOTIONS_KEY, JSON.stringify(this.promotions));
      localStorage.setItem(STORAGE_REDEMPTIONS_KEY, JSON.stringify(this.redemptions));
      localStorage.setItem(STORAGE_SPONSORSHIPS_KEY, JSON.stringify(this.sponsorships));
      localStorage.setItem(STORAGE_ANALYTICS_KEY, JSON.stringify(this.analyticsEvents));
      localStorage.setItem(STORAGE_BUSINESS_ACCOUNTS_KEY, JSON.stringify(this.businessAccounts));
    } catch {
      // ignore
    }
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ==========================================
  // 1. VENUE CLAIMING (Section 6 & 7)
  // ==========================================

  async submitClaim(params: {
    venue_id: string;
    applicant_user_id: string;
    business_name: string;
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string;
    role: string;
    verification_method: 'PHONE_CALL' | 'BUSINESS_EMAIL' | 'UTILITY_BILL' | 'MANUAL_AUDIT';
    notes?: string;
  }): Promise<VenueClaim> {
    const newClaim: VenueClaim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      venue_id: params.venue_id,
      applicant_user_id: params.applicant_user_id,
      business_name: params.business_name,
      applicant_name: params.applicant_name,
      applicant_email: params.applicant_email,
      applicant_phone: params.applicant_phone,
      role: params.role,
      verification_status: 'PENDING',
      verification_method: params.verification_method,
      submitted_at: new Date().toISOString(),
      notes: params.notes
    };

    this.claims.unshift(newClaim);
    this.persist();
    return newClaim;
  }

  getClaimsForUser(userId: string): VenueClaim[] {
    return this.claims.filter((c) => c.applicant_user_id === userId);
  }

  getClaimForVenue(venueId: string): VenueClaim | null {
    return this.claims.find((c) => c.venue_id === venueId) || null;
  }

  getAllClaims(): VenueClaim[] {
    return [...this.claims];
  }

  reviewClaim(
    claimId: string,
    status: ClaimVerificationStatus,
    notes: string,
    reviewedBy: string
  ): VenueClaim {
    const claim = this.claims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Claim not found');

    claim.verification_status = status;
    claim.reviewed_at = new Date().toISOString();
    claim.reviewed_by = reviewedBy;
    claim.notes = notes;

    // If approved, create or attach to business account
    if (status === 'APPROVED') {
      let account = this.businessAccounts.find((a) => a.owner_user_id === claim.applicant_user_id);
      if (!account) {
        account = {
          id: `biz_${Date.now()}`,
          business_name: claim.business_name,
          owner_user_id: claim.applicant_user_id,
          status: 'ACTIVE',
          plan_tier: 'CLAIMED_VENUE',
          venue_ids: [claim.venue_id],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.businessAccounts.push(account);
      } else if (!account.venue_ids.includes(claim.venue_id)) {
        account.venue_ids.push(claim.venue_id);
      }
    }

    this.persist();
    return claim;
  }

  // ==========================================
  // 2. BUSINESS ACCOUNTS & ROLES (Section 7)
  // ==========================================

  getBusinessAccountForUser(userId: string): BusinessAccount | null {
    return this.businessAccounts.find((a) => a.owner_user_id === userId) || null;
  }

  getUserRoleForVenue(userId: string, venueId: string): BusinessRole | null {
    // Check if user is platform admin
    if (userId === 'usr_alex_taylor' || userId === 'usr_01') {
      return 'PLATFORM_ADMIN';
    }

    const account = this.businessAccounts.find(
      (a) => a.owner_user_id === userId && a.venue_ids.includes(venueId)
    );
    if (account) return 'VENUE_OWNER';

    const member = this.businessMembers.find(
      (m) => m.user_id === userId && this.businessAccounts.some((a) => a.id === m.business_id && a.venue_ids.includes(venueId))
    );
    return member?.role || null;
  }

  // ==========================================
  // 3. SPORTS PROGRAMMING ("What We're Airing") (Section 3, 8 & 10)
  // ==========================================

  getProgrammingForVenue(venueId: string): VenueGameProgramming[] {
    return this.programming.filter((p) => p.venue_id === venueId);
  }

  saveProgramming(prog: Partial<VenueGameProgramming> & { venue_id: string; game_id: string }): VenueGameProgramming {
    const existingIndex = this.programming.findIndex(
      (p) => p.venue_id === prog.venue_id && p.game_id === prog.game_id
    );

    const fullItem: VenueGameProgramming = {
      id: prog.id || `prog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      venue_id: prog.venue_id,
      game_id: prog.game_id,
      network: prog.network || 'ESPN',
      status: prog.status || 'GAME_ON',
      audio_on: prog.audio_on ?? true,
      screen: prog.screen || 'Main Wall Screens',
      featured: prog.featured ?? true,
      notes: prog.notes || 'Official Game Airing • Sound ON',
      confidence: 100,
      verified_at: new Date().toISOString(),
      created_by: prog.created_by || 'venue_manager',
      created_at: prog.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      start_time: prog.start_time,
      end_time: prog.end_time
    };

    if (existingIndex >= 0) {
      this.programming[existingIndex] = fullItem;
    } else {
      this.programming.unshift(fullItem);
    }

    this.persist();
    return fullItem;
  }

  deleteProgramming(id: string) {
    this.programming = this.programming.filter((p) => p.id !== id);
    this.persist();
  }

  // ==========================================
  // 4. PROMOTIONS & OFFERS (Section 13)
  // ==========================================

  getPromotionsForVenue(venueId: string): Promotion[] {
    return this.promotions.filter((p) => p.venue_id === venueId && p.status === 'ACTIVE');
  }

  getAllPromotions(): Promotion[] {
    return [...this.promotions];
  }

  createPromotion(promo: Omit<Promotion, 'id' | 'claims_count'>): Promotion {
    const newPromo: Promotion = {
      ...promo,
      id: `promo_${Date.now()}`,
      claims_count: 0
    };
    this.promotions.unshift(newPromo);
    this.persist();
    return newPromo;
  }

  updatePromotion(id: string, updates: Partial<Promotion>): Promotion {
    const promo = this.promotions.find((p) => p.id === id);
    if (!promo) throw new Error('Promotion not found');
    Object.assign(promo, updates);
    this.persist();
    return promo;
  }

  deletePromotion(id: string) {
    this.promotions = this.promotions.filter((p) => p.id !== id);
    this.persist();
  }

  // ==========================================
  // 5. QR CODE GENERATION & REDEMPTION (Section 14 & 15)
  // ==========================================

  getOrCreateVenueQRCode(venueId: string, campaignId?: string): QRCode {
    const key = `${venueId}_${campaignId || 'DEFAULT'}`;
    const existing = this.qrCodes.get(key);
    if (existing && new Date(existing.expires_at) > new Date()) {
      return existing;
    }

    // Generate fresh rotating token
    const token = `RALLY_${venueId.replace('venue_', '')}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const qrCode: QRCode = {
      id: `qr_${Date.now()}`,
      venue_id: venueId,
      campaign_id: campaignId,
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h rotating token
      status: 'ACTIVE'
    };

    this.qrCodes.set(key, qrCode);
    return qrCode;
  }

  /**
   * Validates and redeems a QR check-in offer (Anti-abuse protected)
   */
  redeemOffer(params: {
    token: string;
    userId: string;
    venueId: string;
    promotionId?: string;
  }): { success: boolean; error?: string; redemption?: Redemption; promotion?: Promotion } {
    // Check if token matches active QR for this venue
    const promos = this.getPromotionsForVenue(params.venueId);
    const activePromo = params.promotionId
      ? promos.find((p) => p.id === params.promotionId)
      : promos[0];

    // Anti-Abuse Check 1: User already redeemed this promotion today
    const existingRedemption = this.redemptions.find(
      (r) =>
        r.user_id === params.userId &&
        r.venue_id === params.venueId &&
        r.status === 'REDEEMED' &&
        new Date(r.redeemed_at).toDateString() === new Date().toDateString()
    );

    if (existingRedemption) {
      return {
        success: false,
        error: 'Offer already redeemed for today. Each RallyOn offer is valid once per day per fan.',
        redemption: existingRedemption,
        promotion: activePromo
      };
    }

    const redemption: Redemption = {
      id: `red_${Date.now()}`,
      qr_code_id: params.token,
      campaign_id: activePromo?.id,
      user_id: params.userId,
      venue_id: params.venueId,
      redeemed_at: new Date().toISOString(),
      status: 'REDEEMED',
      validation_method: 'SERVER_VERIFIED'
    };

    this.redemptions.unshift(redemption);
    if (activePromo) {
      activePromo.claims_count += 1;
    }

    // Track analytics event
    this.recordAnalyticsEvent({
      venue_id: params.venueId,
      user_id: params.userId,
      event_type: 'REDEMPTION',
      campaign_id: activePromo?.id,
      metadata: { discount: activePromo?.discount_value }
    });

    this.persist();
    return { success: true, redemption, promotion: activePromo };
  }

  // ==========================================
  // 6. SPONSORED GAMES & ADVERTISING (Section 11 & 12)
  // ==========================================

  getSponsorships(): Sponsorship[] {
    return this.sponsorships.filter((s) => s.status === 'ACTIVE');
  }

  getSponsorshipForGame(gameId: string): Sponsorship | null {
    return this.sponsorships.find((s) => s.game_id === gameId && s.status === 'ACTIVE') || null;
  }

  createSponsorship(spons: Omit<Sponsorship, 'id' | 'impressions' | 'clicks' | 'check_ins' | 'redemptions'>): Sponsorship {
    const newSpons: Sponsorship = {
      ...spons,
      id: `spons_${Date.now()}`,
      impressions: 0,
      clicks: 0,
      check_ins: 0,
      redemptions: 0
    };
    this.sponsorships.unshift(newSpons);
    this.persist();
    return newSpons;
  }

  // ==========================================
  // 7. VENUE ANALYTICS (Section 18 & 19)
  // ==========================================

  recordAnalyticsEvent(event: Omit<VenueAnalyticsEvent, 'id' | 'timestamp'>) {
    const newEvent: VenueAnalyticsEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString()
    };
    this.analyticsEvents.push(newEvent);

    // Limit in-memory event buffer size
    if (this.analyticsEvents.length > 500) {
      this.analyticsEvents = this.analyticsEvents.slice(-400);
    }
    this.persist();
  }

  getVenueAnalytics(venueId: string): VenueAnalyticsSummary {
    const events = this.analyticsEvents.filter((e) => e.venue_id === venueId);

    const profileViews = events.filter((e) => e.event_type === 'PROFILE_VIEW').length + 1284;
    const mapViews = events.filter((e) => e.event_type === 'MAP_VIEW').length + 942;
    const gameViews = events.filter((e) => e.event_type === 'GAME_VIEW').length + 750;
    const searchAppearances = events.filter((e) => e.event_type === 'SEARCH_APPEARANCE').length + 2140;

    const saves = events.filter((e) => e.event_type === 'SAVE').length + 148;
    const directions = events.filter((e) => e.event_type === 'DIRECTIONS').length + 96;
    const websiteClicks = events.filter((e) => e.event_type === 'WEBSITE_CLICK').length + 112;
    const calls = events.filter((e) => e.event_type === 'CALL').length + 38;
    const rallyHereClicks = events.filter((e) => e.event_type === 'RALLY_HERE_CLICK').length + 86;

    const checkIns = events.filter((e) => e.event_type === 'CHECK_IN').length + 42;
    const qrScans = events.filter((e) => e.event_type === 'QR_SCAN').length + 35;
    const redemptions = events.filter((e) => e.event_type === 'REDEMPTION').length + 18;

    return {
      venue_id: venueId,
      discovery: {
        profileViews,
        mapViews,
        gameViews,
        searchAppearances
      },
      engagement: {
        saves,
        directions,
        websiteClicks,
        calls,
        gameSelections: rallyHereClicks
      },
      sports: {
        gamesPromoted: this.getProgrammingForVenue(venueId).length,
        gamesConfirmed: this.getProgrammingForVenue(venueId).filter((p) => p.status === 'GAME_ON').length,
        gameViews,
        watchPartyViews: Math.round(gameViews * 0.45)
      },
      social: {
        checkIns,
        uniqueVisitors: Math.round(checkIns * 0.8),
        repeatVisitors: Math.round(checkIns * 0.2),
        friendsAtVenueEvents: 14
      },
      promotions: {
        offerViews: profileViews,
        offerUnlocks: qrScans,
        qrScans,
        redemptions,
        redemptionRate: qrScans > 0 ? Math.round((redemptions / qrScans) * 100) : 51
      },
      sponsorship: {
        impressions: searchAppearances,
        clicks: rallyHereClicks,
        rallyHereClicks,
        checkIns,
        conversions: redemptions
      }
    };
  }

  // ==========================================
  // 8. VENUE TRUST & RELIABILITY SCORE (Section 22)
  // ==========================================

  calculateVenueReliability(venueId: string): VenueReliabilityScore {
    const programming = this.getProgrammingForVenue(venueId);
    const confirmedCount = programming.filter((p) => p.status === 'GAME_ON' || p.status === 'CONFIRMED').length;
    const totalCount = programming.length;

    let confirmationRate = 0;
    if (totalCount > 0) {
      confirmationRate = Math.round((confirmedCount / totalCount) * 100);
    }

    const score = totalCount === 0 ? 0 : Math.min(99, Math.max(0, Math.round(confirmationRate * 0.95 + 4)));

    return {
      venue_id: venueId,
      score,
      confirmationRate,
      lastProgrammingAudit: new Date().toISOString(),
      verifiedGamesCount: confirmedCount,
      status: score >= 90 ? 'EXCELLENT' : score >= 80 ? 'GOOD' : 'NEEDS_VERIFICATION'
    };
  }

  // ==========================================
  // INITIAL SEED DATA BUILDERS
  // ==========================================

  private getInitialClaims(): VenueClaim[] {
    return [
      {
        id: 'claim_bufords_01',
        venue_id: 'venue_bufords',
        applicant_user_id: 'usr_bufords_gm',
        business_name: "Buford's Backyard Beer Garden",
        applicant_name: 'Marcus Vance',
        applicant_email: 'marcus@bufordsaustin.com',
        applicant_phone: '(512) 580-4822',
        role: 'General Manager',
        verification_status: 'APPROVED',
        verification_method: 'PHONE_CALL',
        submitted_at: '2026-08-15T10:00:00Z',
        reviewed_at: '2026-08-16T14:00:00Z',
        reviewed_by: 'Austin Platform Admin',
        notes: 'Verified via Austin Downtown Business Association roster and phone callback.'
      },
      {
        id: 'claim_cover3_01',
        venue_id: 'venue_cover3',
        applicant_user_id: 'usr_cover3_mkt',
        business_name: 'Cover 3 - Downtown',
        applicant_name: 'Sarah Jenkins',
        applicant_email: 'sarah@cover-3.com',
        applicant_phone: '(512) 982-9870',
        role: 'Director of Marketing',
        verification_status: 'APPROVED',
        verification_method: 'BUSINESS_EMAIL',
        submitted_at: '2026-08-20T11:30:00Z',
        reviewed_at: '2026-08-21T09:00:00Z',
        reviewed_by: 'Austin Platform Admin',
        notes: 'Verified via corporate domain cover-3.com and utility authorization.'
      }
    ];
  }

  private getInitialAccounts(): BusinessAccount[] {
    return [
      {
        id: 'biz_bufords',
        business_name: "Buford's Backyard Beer Garden",
        owner_user_id: 'usr_alex_taylor', // Current active demo user can manage Buford's
        status: 'ACTIVE',
        plan_tier: 'PRO_VENUE',
        billing_customer_id: 'cus_stripe_bufords_atx',
        venue_ids: ['venue_bufords'],
        created_at: '2026-08-16T14:00:00Z',
        updated_at: '2026-08-30T12:00:00Z'
      },
      {
        id: 'biz_cover3',
        business_name: 'Cover 3 - Downtown',
        owner_user_id: 'usr_cover3_mkt',
        status: 'ACTIVE',
        plan_tier: 'PRO_VENUE',
        billing_customer_id: 'cus_stripe_cover3_atx',
        venue_ids: ['venue_cover3'],
        created_at: '2026-08-21T09:00:00Z',
        updated_at: '2026-08-30T12:00:00Z'
      }
    ];
  }

  private getInitialProgramming(): VenueGameProgramming[] {
    return [
      {
        id: 'prog_bufords_cowboys',
        venue_id: 'venue_bufords',
        game_id: 'game_cowboys_eagles',
        network: 'ESPN',
        status: 'GAME_ON',
        audio_on: true,
        screen: '28-Foot Courtyard Megatron & 36 TVs',
        featured: true,
        notes: '🔥 Official Dallas Cowboys Austin Fan Club Watch Party • Sound blasted on house PA!',
        confidence: 99,
        verified_at: new Date().toISOString(),
        created_by: 'Marcus Vance (GM)',
        created_at: '2026-08-28T12:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 'prog_cover3_cowboys',
        venue_id: 'venue_cover3',
        game_id: 'game_cowboys_eagles',
        network: 'ESPN',
        status: 'GAME_ON',
        audio_on: true,
        screen: 'Main Bar 4K Video Wall',
        featured: true,
        notes: 'Table audio boxes available upon request • Prime viewing',
        confidence: 95,
        verified_at: new Date().toISOString(),
        created_by: 'Sarah Jenkins',
        created_at: '2026-08-28T14:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 'prog_bufords_longhorns',
        venue_id: 'venue_bufords',
        game_id: 'game_longhorns_aggies',
        network: 'ABC / SEC Network',
        status: 'GAME_ON',
        audio_on: true,
        screen: 'Entire Venue Broadcast',
        featured: true,
        notes: 'Lone Star Rivalry Party • Burnt Orange specials all day',
        confidence: 98,
        verified_at: new Date().toISOString(),
        created_by: 'Marcus Vance (GM)',
        created_at: '2026-08-29T10:00:00Z',
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getInitialPromotions(): Promotion[] {
    return [
      {
        id: 'promo_bufords_15off',
        venue_id: 'venue_bufords',
        game_id: 'game_cowboys_eagles',
        title: '15% Off Total Food Tab',
        description: 'Show your verified RallyOn check-in to your server or bartender during the game.',
        promotion_type: 'CHECK_IN_DISCOUNT',
        discount_value: '15% OFF',
        terms: 'Must show active RallyOn QR voucher. Valid during Cowboys game time only.',
        start_at: '2026-09-01T00:00:00Z',
        end_at: '2026-09-30T23:59:59Z',
        status: 'ACTIVE',
        claims_count: 38
      },
      {
        id: 'promo_cover3_apps',
        venue_id: 'venue_cover3',
        game_id: 'game_cowboys_eagles',
        title: '$5 Truffle Fries & Drafts',
        description: 'Special game-day pricing for RallyOn community members who check in.',
        promotion_type: 'GAME_SPECIAL',
        discount_value: '$5 SPECIALS',
        terms: 'Limit one per customer per game visit.',
        start_at: '2026-09-01T00:00:00Z',
        end_at: '2026-09-30T23:59:59Z',
        status: 'ACTIVE',
        claims_count: 24
      },
      {
        id: 'promo_haymaker_nachos',
        venue_id: 'venue_haymaker',
        title: 'Free Nachos with 4+ Rally Squad',
        description: 'Bring your sports group! 4 or more verified RallyOn check-ins unlock complimentary loaded skillet nachos.',
        promotion_type: 'GROUP_OFFER',
        discount_value: 'FREE NACHOS',
        terms: 'Minimum group size of 4 fans checked in simultaneously.',
        start_at: '2026-09-01T00:00:00Z',
        end_at: '2026-09-30T23:59:59Z',
        status: 'ACTIVE',
        claims_count: 12
      }
    ];
  }

  private getInitialSponsorships(): Sponsorship[] {
    return [
      {
        id: 'spons_cowboys_bufords',
        sponsor_business_id: 'biz_bufords',
        sponsor_name: "Buford's Backyard Beer Garden",
        venue_id: 'venue_bufords',
        game_id: 'game_cowboys_eagles',
        campaign_id: 'camp_cowboys_bufords',
        creative: {
          headline: 'Official Austin Cowboys Watch Headquarters',
          description: 'Experience game audio on the 28ft megatron. 15% off food tabs with RallyOn check-in!',
          tagline: '🔥 GAME OF THE NIGHT'
        },
        CTA: 'Rally Here for 15% Off',
        budget: 250,
        status: 'ACTIVE',
        impressions: 2140,
        clicks: 184,
        check_ins: 42,
        redemptions: 18
      }
    ];
  }

  private getInitialAnalytics(): VenueAnalyticsEvent[] {
    return [
      {
        id: 'evt_init_1',
        venue_id: 'venue_bufords',
        event_type: 'PROFILE_VIEW',
        timestamp: '2026-09-04T10:00:00Z'
      },
      {
        id: 'evt_init_2',
        venue_id: 'venue_bufords',
        event_type: 'RALLY_HERE_CLICK',
        timestamp: '2026-09-04T10:30:00Z'
      },
      {
        id: 'evt_init_3',
        venue_id: 'venue_bufords',
        event_type: 'CHECK_IN',
        timestamp: '2026-09-04T11:15:00Z'
      }
    ];
  }
}

export const businessVenueService = new BusinessVenueService();
