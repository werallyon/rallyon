export type UserIntent =
  | 'HIGH_ENERGY'
  | 'CHILL'
  | 'WITH_FRIENDS'
  | 'SOLO'
  | 'HARDCORE_FANS'
  | 'BEST_VIEWING';

export interface IntentConfig {
  id: UserIntent;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  priorityMetrics: string[];
}

export type SportsLeague =
  | 'NFL' | 'NCAA_FB'
  | 'NBA' | 'NCAA_BB' | 'WNBA'
  | 'MLB' | 'NCAA_BASEBALL' | 'WBC' | 'NHL'
  | 'MLS' | 'EPL' | 'LALIGA' | 'BUNDESLIGA' | 'SERIEA' | 'LIGUE1' | 'UCL' | 'UEL' | 'NWSL'
  | 'ATP' | 'WTA'
  | 'UFC'
  | 'PGA' | 'LPGA' | 'LIV' | 'DP_WORLD'
  | 'F1' | 'NASCAR' | 'INDYCAR'
  | 'SOCCER';

export type SportsType =
  | 'FOOTBALL' | 'BASKETBALL' | 'BASEBALL' | 'HOCKEY' | 'SOCCER'
  | 'MMA' | 'TENNIS' | 'GOLF' | 'RACING' | 'OTHER';

export type SportsEventType = 'GAME' | 'MATCH' | 'FIGHT' | 'TOURNAMENT' | 'RACE';

export interface SportsTeam {
  name: string;
  abbrev: string;
  logo: string;
  record?: string;
  color?: string;
}

export type GameStatus =
  | 'UPCOMING'
  | 'LIVE'
  | 'HALFTIME'
  | 'DELAYED'
  | 'FINAL'
  | 'POSTPONED'
  | 'CANCELLED';

export interface BroadcastIntelligence {
  network: string; // e.g. "ESPN", "FOX", "CBS", "NBC", "ABC", "TNT", "SEC Network"
  broadcastType: 'NATIONAL_OTA' | 'CABLE' | 'REGIONAL' | 'STREAMING_EXCLUSIVE';
  regionalAvailability?: string; // "National", "Texas / SW Regional", "Blackout in Austin"
  streamingAvailability?: string[]; // ["ESPN+", "Peacock", "Paramount+"]
  broadcastStartTime?: string;
  externalProvider?: string;
  lastVerified?: string;
}

export interface SportsParticipant {
  name: string;
  abbrev: string;
  logo: string;
  seed?: string | number | null;
  score?: string | number | null;
  winner?: boolean | null;
}

export interface SportsGame {
  id: string;
  league: SportsLeague;
  sport?: SportsType;
  eventType?: SportsEventType;
  participants?: SportsParticipant[];
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
  startTime: string; // ISO or human format
  status: GameStatus;
  liveDetails?: {
    currentScore: { home: number; away: number };
    period: string; // "Q3", "2nd Half", "Rd 2", "Half"
    clock: string; // "8:42", "75'", "2:10"
    headline?: string;
    situation?: string; // "3rd & Goal at PHI 4"
  };
  broadcastNetwork?: string;
  broadcast?: BroadcastIntelligence;
  venueName?: string;
  season?: string;
  externalGameId?: string;
  lastUpdated?: string;
}

export type GameVerificationStatus = 'GAME_ON' | 'LIKELY' | 'NOT_CONFIRMED';

export interface VenueGame {
  venueId: string;
  gameId: string;
  confidence: number; // 0-100
  verificationStatus: GameVerificationStatus;
  audioConfirmed: boolean;
  screenAllocations?: string; // e.g., "Main wall LED + 16 TVs"
  lastVerifiedAt: string;
  fanBase?: string; // e.g. "Dallas Cowboys Fans Hub"
}

export interface VenueTruthSports {
  numTvs: number;
  screenSizes: string; // "Up to 120 inch laser projection, 45 4K TVs"
  hasProjector: boolean;
  gameAudio: boolean;
  multipleGamesSimultaneous: boolean;
  sportsPackages: string[]; // "NFL Sunday Ticket", "NBA League Pass", "Peacock", "Apple TV MLS"
  blackoutRestrictions: string[];
  teamAffiliations: string[]; // ["Dallas Cowboys", "Texas Longhorns", "Arsenal FC"]
}

export interface VenueTruthEnvironment {
  energyBaseline: number; // 0-100
  noiseBaseline: number; // 0-100
  crowdBaseline: number; // 0-100
  socialOpenness: number; // 0-100
  seatingRatio: {
    bar: number; // %
    tables: number; // %
    standing: number; // %
  };
  hasPatio: boolean;
  patioTvs: boolean;
  dogFriendly: boolean;
}

export interface VenueTruthAudience {
  hardcoreFanRatio: number; // 0-100
  casualRatio: number; // 0-100
  familyFriendly: boolean;
  groupFriendly: boolean;
  soloFriendly: boolean;
  typicalCrowdAge: string; // "21-45", "All ages", "Alumni & young pros"
}

export interface VenueTruthExperience {
  watchParties: boolean;
  liveDj: boolean;
  giveaways: boolean;
  foodSpecials: string[];
  drinkSpecials: string[];
  teamEvents: string[];
}

export interface VenueTruth {
  sports: VenueTruthSports;
  environment: VenueTruthEnvironment;
  audience: VenueTruthAudience;
  experience: VenueTruthExperience;
  goodFor?: string[];
  avoidIf?: string[];
}

export interface VenueBaselineCharacteristics {
  category: 'Sports Bar' | 'Pub' | 'Beer Garden' | 'Brewery' | 'Entertainment' | 'Lounge';
  neighborhood: string;
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  capacity: number;
}

export type VenueStatus = 'LIVE' | 'PEAK' | 'BUILDING' | 'STEADY' | 'CHILL' | 'CLOSING';

export interface VenueLiveState {
  venueId: string;
  energy: number; // 0-100
  crowd: number; // 0-100
  noise: number; // 0-100
  social: number; // 0-100
  sportsIntensity: number; // 0-100
  viewingQuality: number; // 0-100
  seatingAvailability: number; // 0-100 (high means seats available!)
  trendingVelocity: number; // e.g. +34%
  currentStatus: VenueStatus;
  lastUpdated: string; // ISO
}

export interface VenueFanBase {
  team: string;
  sport?: string;
  strength?: number;
}

export interface Venue {
  id: string;
  market_id?: string;
  city_id?: string;
  isDemoData?: boolean;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  imageUrl: string;
  categories: string[];
  atmosphere?: string[];
  fanBases?: (string | VenueFanBase)[];
  features?: string[];
  baseline: VenueBaselineCharacteristics;
  venueTruth: VenueTruth;
  claimed: boolean;
  googlePlaceId?: string;
  googlePlaceData?: GooglePlaceData;
  reliabilityScore?: number; // 0-100 (Venue Trust Score)
  claimedByUserId?: string;
  activeProgramming?: VenueGameProgramming[];
  activePromotions?: Promotion[];
  activeSponsorship?: Sponsorship;
}

export type PresenceActivity =
  | 'WATCHING_GAME'
  | 'HANGING_OUT'
  | 'LOOKING_TO_SOCIALIZE'
  | 'WITH_FRIENDS'
  | 'JUST_ARRIVED';

export interface Presence {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  venueId: string;
  statusMessage: string;
  activityType: PresenceActivity;
  createdAt: string;
  expiresAt: string;
}

export type SignalType =
  | 'CHECK_IN'
  | 'CROWD_REPORT'
  | 'AUDIO_REPORT'
  | 'GAME_CONFIRMATION'
  | 'SEATING_REPORT'
  | 'TRENDING_SPIKE';

export interface VenueSignal {
  id: string;
  venueId: string;
  signalType: SignalType;
  title: string;
  message: string;
  value?: any;
  source: 'USER' | 'VENUE' | 'SYSTEM';
  confidence: number;
  timestamp: string;
}

export interface UserPreference {
  energy: number;
  crowd: number;
  social: number;
  sportsIntensity: number;
  viewingPreference: number;
}

export type AuthProviderType = 'EMAIL' | 'GOOGLE' | 'APPLE' | 'DEMO';

export type OnboardingStep =
  | 'welcome'
  | 'sports'
  | 'teams'
  | 'experience'
  | 'location'
  | 'notifications'
  | 'profile'
  | 'complete';

export type PermissionStatus = 'GRANTED' | 'DENIED' | 'PROMPT';

export interface TeamReference {
  id: string;
  name: string;
  sportId: string;
  league: string;
  abbrev: string;
  logo: string;
  color?: string;
}

export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
  friendVisibility: 'ALL_FRIENDS' | 'MUTUAL' | 'NONE';
  checkInVisibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
  locationSharing: 'PRECISE' | 'NEIGHBORHOOD_ONLY' | 'HIDDEN' | 'APPROXIMATE' | 'OFF';
  presenceVisibility: 'SHOW_VENUE' | 'SHOW_ONLINE_ONLY' | 'OFFLINE';
}

export interface NotificationPreferences {
  favoriteTeamGames: boolean;
  gameStartingSoon: boolean;
  gameNearYou: boolean;
  venueTrending: boolean;
  friendsCheckingIn: boolean;
  recommendations: boolean;
}

export type AuthState =
  | 'LOGGED_OUT'
  | 'AUTH_IN_PROGRESS'
  | 'AUTHENTICATED_ONBOARDING_INCOMPLETE'
  | 'AUTHENTICATED_ONBOARDING_COMPLETE'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'AUTH_ERROR';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePhotoUrl: string;
  authProvider: AuthProviderType;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  onboardingStep: OnboardingStep;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  locationPermissionStatus: PermissionStatus;
  notificationPermissionStatus: PermissionStatus;
  homeCity: string;
  homeState: string;
  homeZip?: string;
  latitude?: number;
  longitude?: number;
  favoriteTeams: TeamReference[];
  favoriteSports: string[];
  favoriteLeagues: string[];
  preferredExperience: UserIntent[];
  privacySettings: PrivacySettings;
  notificationPreferences: NotificationPreferences;

  // Compatibility helpers
  name: string;
  avatar: string;
  city: string;
  preferences: UserPreference;
  currentIntent: UserIntent;
  privacy: 'FRIENDS_ONLY' | 'ANONYMOUS' | 'HIDDEN';
  savedVenueIds: string[];

  // Business / Venue management association
  businessAccountId?: string;
  businessRole?: BusinessRole;
}

export interface RallyMatchBreakdown {
  intentAlignment: number;
  sportsAffinity: number;
  crowdEnergyScore: number;
  viewingScore: number;
  seatingScore: number;
  friendBonus: number;
}

export interface RallyMatchResult {
  venueId: string;
  venue: Venue;
  liveState: VenueLiveState;
  score: number; // 0-100
  breakdown: RallyMatchBreakdown;
  whyYouShouldGo: string[];
  maybeSkipIf: string[];
  activeGameStatus?: VenueGame;
  friendsInside: Presence[];
  distanceMiles: number;
  sponsored?: boolean;
  sponsorshipBadge?: string;
  matchedFavoriteTeam?: string;
  isFavoriteTeamHub?: boolean;
}

// =========================================================
// GOOGLE PLACES / IDENTITY DATA MODELS (Section 4 & 5)
// =========================================================

export interface GooglePlaceData {
  placeId: string;
  name: string;
  formattedAddress: string;
  formattedPhoneNumber?: string;
  website?: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  businessStatus?: string; // "OPERATIONAL", "CLOSED_TEMPORARILY"
  priceLevel?: number; // 1-4
  openNow?: boolean;
  weekdayText?: string[];
  photos?: string[];
  types?: string[];
  googleMapsUrl?: string;
  lastFetchedAt: string;
}

export interface VenuePlaceMatch {
  venueId: string;
  placeId: string;
  matchConfidence: number; // 0-100
  matchSource: 'AUTOMATIC' | 'ADMIN_OVERRIDE' | 'UNMATCHED';
  matchedAt: string;
  discrepancies?: string[];
}

// =========================================================
// VENUE CLAIMING & BUSINESS ACCOUNTS (Section 6 & 7)
// =========================================================

export type ClaimVerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'NEEDS_VERIFICATION';

export interface VenueClaim {
  id: string;
  venue_id: string;
  applicant_user_id: string;
  business_name: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  role: string; // e.g., "General Manager", "Owner", "Marketing Director"
  verification_status: ClaimVerificationStatus;
  verification_method: 'PHONE_CALL' | 'BUSINESS_EMAIL' | 'UTILITY_BILL' | 'MANUAL_AUDIT';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
}

export type BusinessRole =
  | 'PLATFORM_ADMIN'
  | 'VENUE_OWNER'
  | 'VENUE_MANAGER'
  | 'VENUE_MARKETING'
  | 'VENUE_STAFF';

export type BusinessPlanTier =
  | 'FREE_VENUE'
  | 'CLAIMED_VENUE'
  | 'PRO_VENUE'
  | 'ENTERPRISE';

export interface BusinessAccount {
  id: string;
  business_name: string;
  owner_user_id: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  plan_tier: BusinessPlanTier;
  billing_customer_id?: string; // Stripe customer ID reference
  venue_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  business_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: BusinessRole;
  invited_at: string;
  status: 'ACTIVE' | 'PENDING';
}

// =========================================================
// VENUE SPORTS PROGRAMMING (Section 3, 8 & 10)
// =========================================================

export type VenueProgrammingStatus =
  | 'PLANNED'
  | 'CONFIRMED'
  | 'GAME_ON'
  | 'CANCELLED'
  | 'NOT_SHOWING';

export interface VenueGameProgramming {
  id: string;
  venue_id: string;
  game_id: string;
  network?: string; // "ESPN", "FOX", "CBS"
  status: VenueProgrammingStatus;
  is_confirmed?: boolean;
  audio_on: boolean;
  screen?: string; // "Main Screen Wall", "Patio TVs", "Bar Screen 1-4"
  featured: boolean;
  notes?: string; // "Official Watch Party • Doors open at 5:00"
  confidence: number; // 0-100
  verified_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
  source_type?: 'MANUAL' | 'VENUE' | 'OFFICIAL' | 'USER_REPORT' | 'SYSTEM';
  source_url?: string;
  verification_notes?: string;
}

// =========================================================
// PROMOTIONS & REWARDS (Section 13, 14, 15 & 16)
// =========================================================

export type PromotionType =
  | 'CHECK_IN_DISCOUNT'
  | 'GAME_SPECIAL'
  | 'TIME_LIMITED'
  | 'FREE_ITEM'
  | 'GROUP_OFFER'
  | 'WATCH_PARTY';

export interface Promotion {
  id: string;
  venue_id: string;
  game_id?: string;
  title: string;
  description: string;
  promotion_type: PromotionType;
  discount_value?: string; // "15% OFF", "$5 Drafts", "Free Queso"
  terms: string;
  start_at: string;
  end_at: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED';
  claims_count: number;
  qr_code_id?: string;
}

export interface Campaign {
  id: string;
  business_id: string;
  venue_id: string;
  game_id?: string;
  campaign_type: 'CHECK_IN_REWARD' | 'SPONSORED_GAME' | 'PROMOTED_VENUE';
  budget: number;
  spent: number;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'PAUSED';
  start_at: string;
  end_at: string;
}

export interface QRCode {
  id: string;
  venue_id: string;
  campaign_id?: string;
  token: string; // Rotating security token
  expires_at: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  qr_image_url?: string;
}

export interface Redemption {
  id: string;
  qr_code_id: string;
  campaign_id?: string;
  user_id: string;
  venue_id: string;
  check_in_id?: string;
  redeemed_at: string;
  status: 'UNREDEEMED' | 'REDEEMED';
  validation_method: 'SERVER_VERIFIED' | 'STAFF_CODE' | 'SCAN';
}

// =========================================================
// SPONSORED GAMES & ADVERTISING (Section 11 & 12)
// =========================================================

export interface Sponsorship {
  id: string;
  sponsor_business_id: string;
  sponsor_name: string;
  venue_id?: string;
  game_id: string;
  campaign_id: string;
  creative: {
    bannerUrl?: string;
    headline: string;
    description: string;
    tagline?: string;
  };
  CTA: string; // e.g., "Rally Here for 20% Off"
  budget: number;
  status: 'ACTIVE' | 'PENDING' | 'ENDED';
  impressions: number;
  clicks: number;
  check_ins: number;
  redemptions: number;
  start_time?: string;
  end_time?: string;
}

// =========================================================
// VENUE ANALYTICS & AUDIT (Section 18, 19 & 24)
// =========================================================

export type AnalyticsEventType =
  | 'PROFILE_VIEW'
  | 'MAP_VIEW'
  | 'GAME_VIEW'
  | 'SEARCH_APPEARANCE'
  | 'SAVE'
  | 'DIRECTIONS'
  | 'WEBSITE_CLICK'
  | 'CALL'
  | 'CHECK_IN'
  | 'OFFER_VIEW'
  | 'OFFER_UNLOCK'
  | 'QR_SCAN'
  | 'REDEMPTION'
  | 'SPONSOR_CLICK'
  | 'RALLY_HERE_CLICK';

export interface VenueAnalyticsEvent {
  id: string;
  venue_id: string;
  user_id?: string;
  event_type: AnalyticsEventType;
  game_id?: string;
  campaign_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface VenueAnalyticsSummary {
  venue_id: string;
  discovery: {
    profileViews: number;
    mapViews: number;
    gameViews: number;
    searchAppearances: number;
  };
  engagement: {
    saves: number;
    directions: number;
    websiteClicks: number;
    calls: number;
    gameSelections: number;
  };
  sports: {
    gamesPromoted: number;
    gamesConfirmed: number;
    gameViews: number;
    watchPartyViews: number;
  };
  social: {
    checkIns: number;
    uniqueVisitors: number;
    repeatVisitors: number;
    friendsAtVenueEvents: number;
  };
  promotions: {
    offerViews: number;
    offerUnlocks: number;
    qrScans: number;
    redemptions: number;
    redemptionRate: number; // e.g. 42.8%
  };
  sponsorship: {
    impressions: number;
    clicks: number;
    rallyHereClicks: number;
    checkIns: number;
    conversions: number;
  };
}

export interface VenueReliabilityScore {
  venue_id: string;
  score: number; // 0-100
  confirmationRate: number; // %
  lastProgrammingAudit: string;
  verifiedGamesCount: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_VERIFICATION';
}

// ==========================================
// MARKET-FIRST EXPANSION ARCHITECTURE TYPES
// ==========================================

export type MarketLaunchStatus =
  | 'PLANNED'
  | 'PREPARING'
  | 'SOFT_LAUNCH'
  | 'LIVE'
  | 'EXPANDING'
  | 'NATIONAL'
  | 'PAUSED';

export type MarketStatus = 'ACTIVE' | 'INACTIVE' | 'PLANNED';

export interface MarketBoundary {
  type: 'RADIUS' | 'BBOX' | 'POLYGON';
  radiusMiles?: number;
  center?: { lat: number; lng: number };
  northEast?: { lat: number; lng: number };
  southWest?: { lat: number; lng: number };
  coordinates?: Array<{ lat: number; lng: number }>;
}

export interface Market {
  id: string;
  name: string; // e.g. "Texarkana (Ark-La-Tex)", "Dallas–Fort Worth"
  slug: string; // e.g. "texarkana", "dallas-fort-worth"
  state: string; // e.g. "Texas / Arkansas", "Texas"
  state_code: string; // e.g. "TX/AR", "TX"
  country: string; // "USA"
  timezone: string; // "America/Chicago"
  latitude: number;
  longitude: number;
  radius: number; // radius in miles (e.g. 35)
  geographic_boundary?: MarketBoundary;
  population: number;
  status: MarketStatus;
  launch_status: MarketLaunchStatus;
  launch_date?: string;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  market_id: string;
  name: string; // e.g. "Texarkana, TX", "Texarkana, AR"
  state: string;
  state_code: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MarketCoverage {
  id: string;
  market_id: string;
  total_relevant_venues: number;
  RallyOn_venues: number;
  claimed_venues: number;
  verified_venues: number;
  active_venues: number;
  programmed_venues: number;
  games_today: number;
  games_programmed_today: number;
  live_venues: number;
  active_checkins: number;
  active_users: number;
  venue_data_completeness: number; // 0-100%
  sports_data_completeness: number; // 0-100%
  coverage_score: number; // 0-100% dynamic
  updated_at: string;
}

export interface MarketReadiness {
  market_id: string;
  readiness_score: number; // 0-100% dynamic
  venue_coverage_pct: number;
  claimed_venue_pct: number;
  verified_venue_pct: number;
  active_venue_pct: number;
  game_programming_pct: number;
  sports_data_quality_pct: number;
  user_activity_score: number;
  venue_participation_score: number;
  is_ready_for_launch: boolean;
  recommendations: string[];
}

export interface MarketLaunchChecklist {
  venue_discovery_complete: boolean;
  venue_normalization_complete: boolean;
  duplicate_cleanup_complete: boolean;
  sports_data_active: boolean;
  venue_claims_started: boolean;
  venue_programming_active: boolean;
  checkins_enabled: boolean;
  promotions_enabled: boolean;
  analytics_active: boolean;
  coverage_threshold_reached: boolean;
  ready_for_launch: boolean;
}


