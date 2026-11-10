import {
  Venue,
  VenueLiveState,
  SportsGame,
  VenueGame,
  Presence,
  VenueSignal,
  User,
  IntentConfig
} from '../types';
import { TEXARKANA_SEEDED_VENUES } from './marketsData';

export const INTENT_CONFIGS: Record<string, IntentConfig> = {
  HIGH_ENERGY: {
    id: 'HIGH_ENERGY',
    label: 'High Energy',
    emoji: '🔥',
    tagline: 'Loud, packed, electric crowd & party vibes',
    description: 'Prioritizes venues with packed crowds, roaring game audio, high social energy, and watch party atmospheres.',
    priorityMetrics: ['Energy > 85%', 'Crowd > 80%', 'Game Audio On', 'Social Buzz']
  },
  CHILL: {
    id: 'CHILL',
    label: 'Chill',
    emoji: '🧊',
    tagline: 'Easy conversation, comfortable seating & lower noise',
    description: 'Prioritizes venues with plenty of open seats, moderate noise levels, great food/drinks, and relaxed sightlines.',
    priorityMetrics: ['Seating > 70%', 'Noise < 65%', 'Crowd < 60%', 'Comfortable Viewing']
  },
  WITH_FRIENDS: {
    id: 'WITH_FRIENDS',
    label: 'With Friends',
    emoji: '👥',
    tagline: 'Large tables, group patios, friends present',
    description: 'Prioritizes venues where friends are already inside, table/booth availability, group pitcher/platter specials, and spacious seating.',
    priorityMetrics: ['Friends Present', 'Group Table Seating', 'Social Openness', 'Patio Space']
  },
  SOLO: {
    id: 'SOLO',
    label: 'Solo',
    emoji: '🙋',
    tagline: 'Prime bar stools, low pressure, clear screens',
    description: 'Prioritizes top-tier bar seating with attentive bartenders, clear sightlines to multiple screens, and welcoming solo atmosphere.',
    priorityMetrics: ['Bar Stool Availability', 'Direct TV Sightlines', 'Friendly Bartenders', 'Low Group Pressure']
  },
  HARDCORE_FANS: {
    id: 'HARDCORE_FANS',
    label: 'Hardcore Fans',
    emoji: '📣',
    tagline: 'Die-hard team hub, game audio blasted, fight songs',
    description: 'Prioritizes official team booster bars, full game sound system priority, heavy fan gear presence, and high sports intensity.',
    priorityMetrics: ['Official Team Hub', 'Full Audio Priority', 'Sports Intensity > 90%', 'Chants & Reactions']
  },
  BEST_VIEWING: {
    id: 'BEST_VIEWING',
    label: 'Best Viewing',
    emoji: '📺',
    tagline: 'Massive 4K walls, zero bad angles, pristine sightlines',
    description: 'Prioritizes venues with 30+ 4K displays, stadium projection walls, dedicated audio zones, and unobstructed sightlines.',
    priorityMetrics: ['Screen Quality & Count', 'Zero Bad Angles', 'Sound Zones', 'Multi-Game Matrix']
  }
};

export const CURRENT_USER: User = {
  id: 'usr_01',
  name: 'Alex Taylor',
  firstName: 'Alex',
  lastName: 'Taylor',
  username: 'txk_rally',
  email: 'alex.taylor@rallyon.app',
  profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  authProvider: 'DEMO',
  emailVerified: true,
  onboardingCompleted: true,
  onboardingStep: 'complete',
  createdAt: '2026-08-01T12:00:00Z',
  updatedAt: '2026-08-01T12:00:00Z',
  lastActiveAt: '2026-08-01T12:00:00Z',
  locationPermissionStatus: 'GRANTED',
  notificationPermissionStatus: 'GRANTED',
  homeCity: 'Texarkana',
  homeState: 'TX',
  homeZip: '75501',
  latitude: 33.4251,
  longitude: -94.0477,
  city: 'Texarkana, TX',
  favoriteSports: ['NFL', 'COLLEGE_FOOTBALL', 'SOCCER'],
  favoriteLeagues: ['NFL', 'NCAA_FB', 'SOCCER'],
  favoriteTeams: [
    { id: 'nfl_dal', name: 'Dallas Cowboys', sportId: 'NFL', league: 'NFL', abbrev: 'DAL', logo: '⭐', color: '#003594' },
    { id: 'ncaa_fb_ark', name: 'Arkansas Razorbacks', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'ARK', logo: '🐗', color: '#9D2235' },
    { id: 'ncaa_fb_tex', name: 'Texas Longhorns', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'TEX', logo: '🤘', color: '#BF5700' }
  ],
  preferredExperience: ['HIGH_ENERGY', 'WITH_FRIENDS'],
  privacySettings: {
    profileVisibility: 'FRIENDS_ONLY',
    friendVisibility: 'ALL_FRIENDS',
    checkInVisibility: 'FRIENDS_ONLY',
    locationSharing: 'PRECISE',
    presenceVisibility: 'SHOW_VENUE'
  },
  notificationPreferences: {
    favoriteTeamGames: true,
    gameStartingSoon: true,
    gameNearYou: true,
    venueTrending: true,
    friendsCheckingIn: true,
    recommendations: true
  },
  preferences: {
    energy: 80,
    crowd: 75,
    social: 85,
    sportsIntensity: 90,
    viewingPreference: 95
  },
  currentIntent: 'HIGH_ENERGY',
  privacy: 'FRIENDS_ONLY',
  savedVenueIds: ['v_cover3', 'v_pluckers', 'v_haymaker']
};

export const SEEDED_GAMES: SportsGame[] = [
  {
    id: 'game_cowboys_eagles',
    league: 'NFL',
    homeTeam: {
      name: 'Dallas Cowboys',
      abbrev: 'DAL',
      logo: '⭐',
      record: '11-4',
      color: '#003594'
    },
    awayTeam: {
      name: 'Philadelphia Eagles',
      abbrev: 'PHI',
      logo: '🦅',
      record: '12-3',
      color: '#004C54'
    },
    startTime: 'LIVE NOW',
    status: 'LIVE',
    broadcastNetwork: 'FOX / NFL Sunday Ticket',
    liveDetails: {
      currentScore: { home: 24, away: 21 },
      period: 'Q3',
      clock: '8:42',
      headline: 'NFC East First Place Battle',
      situation: '3rd & 4 at PHI 38'
    }
  },
  {
    id: 'game_longhorns_sooners',
    league: 'NCAA_FB',
    homeTeam: {
      name: 'Texas Longhorns',
      abbrev: 'TEX',
      logo: '🤘',
      record: '10-1',
      color: '#BF5700'
    },
    awayTeam: {
      name: 'Oklahoma Sooners',
      abbrev: 'OU',
      logo: '🔴',
      record: '9-2',
      color: '#841617'
    },
    startTime: 'LIVE NOW',
    status: 'LIVE',
    broadcastNetwork: 'ABC / ESPN',
    liveDetails: {
      currentScore: { home: 31, away: 28 },
      period: 'Q4',
      clock: '4:15',
      headline: 'Red River Rivalry Showdown',
      situation: 'Texas driving inside Sooners 25'
    }
  },
  {
    id: 'game_razorbacks_aggies',
    league: 'NCAA_FB',
    homeTeam: {
      name: 'Arkansas Razorbacks',
      abbrev: 'ARK',
      logo: '🐗',
      record: '8-3',
      color: '#9D2235'
    },
    awayTeam: {
      name: 'Texas A&M Aggies',
      abbrev: 'TAMU',
      logo: '👍',
      record: '9-2',
      color: '#500000'
    },
    startTime: 'LIVE NOW',
    status: 'LIVE',
    broadcastNetwork: 'SEC Network / ESPN',
    liveDetails: {
      currentScore: { home: 27, away: 24 },
      period: 'Q3',
      clock: '6:54',
      headline: 'Southwest Classic - SEC Showdown',
      situation: 'Razorbacks 2nd & 6 at TAMU 42'
    }
  },
  {
    id: 'game_spurs_lakers',
    league: 'NBA',
    homeTeam: {
      name: 'San Antonio Spurs',
      abbrev: 'SAS',
      logo: '🏀',
      record: '34-22',
      color: '#C4CED4'
    },
    awayTeam: {
      name: 'Los Angeles Lakers',
      abbrev: 'LAL',
      logo: '👑',
      record: '36-21',
      color: '#552583'
    },
    startTime: 'LIVE NOW',
    status: 'LIVE',
    broadcastNetwork: 'ESPN',
    liveDetails: {
      currentScore: { home: 48, away: 52 },
      period: 'Q2',
      clock: '6:30',
      headline: 'Wembanyama vs LeBron',
      situation: 'Timeout Lakers'
    }
  },
  {
    id: 'game_ufc_312',
    league: 'UFC',
    homeTeam: {
      name: 'Adesanya',
      abbrev: 'ADE',
      logo: '🥊',
      record: '24-3',
      color: '#D20A0A'
    },
    awayTeam: {
      name: 'Du Plessis',
      abbrev: 'DUP',
      logo: '🏆',
      record: '21-2',
      color: '#FFB81C'
    },
    startTime: 'LIVE NOW',
    status: 'LIVE',
    broadcastNetwork: 'ESPN+ PPV',
    liveDetails: {
      currentScore: { home: 19, away: 19 },
      period: 'Rd 3',
      clock: '3:12',
      headline: 'Middleweight World Championship Bout',
      situation: 'Heavy exchange in the center of the Octagon'
    }
  },
  {
    id: 'game_arsenal_mancity',
    league: 'SOCCER',
    homeTeam: {
      name: 'Arsenal FC',
      abbrev: 'ARS',
      logo: '🔴',
      record: '18-4-3',
      color: '#EF0107'
    },
    awayTeam: {
      name: 'Manchester City',
      abbrev: 'MCI',
      logo: '🔵',
      record: '17-5-3',
      color: '#6CABDD'
    },
    startTime: 'FT',
    status: 'FINAL',
    broadcastNetwork: 'Peacock / NBC Sports',
    liveDetails: {
      currentScore: { home: 2, away: 1 },
      period: 'FT',
      clock: '90+6',
      headline: 'Stoppage Time Winner at Emirates'
    }
  },
  {
    id: 'game_astros_rangers',
    league: 'MLB',
    homeTeam: {
      name: 'Houston Astros',
      abbrev: 'HOU',
      logo: '⚾',
      record: '82-64',
      color: '#002D62'
    },
    awayTeam: {
      name: 'Texas Rangers',
      abbrev: 'TEX',
      logo: '🤠',
      record: '80-66',
      color: '#003278'
    },
    startTime: 'Today, 7:05 PM',
    status: 'UPCOMING',
    broadcastNetwork: 'Bally Sports SW / Apple TV+'
  }
];

export const SEEDED_VENUES: Venue[] = [
  ...TEXARKANA_SEEDED_VENUES,
  {
    id: 'v_cover3',
    market_id: 'market_austin',
    name: 'Cover 3',
    address: '1717 W 6th St / Anderson Ln',
    neighborhood: 'North Austin / Anderson',
    city: 'Austin',
    state: 'TX',
    latitude: 30.3601,
    longitude: -97.7289,
    phone: '(512) 693-2683',
    website: 'https://cover-3.com',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    categories: ['Sports Bar', 'Upscale Dining', 'Craft Cocktails'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Anderson Lane',
      priceLevel: '$$$',
      capacity: 240
    },
    venueTruth: {
      sports: {
        numTvs: 42,
        screenSizes: '42 crisp 4K 75-inch Sony displays + dual 120-inch laser projection walls',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'NBA League Pass', 'ESPN College Extra', 'SEC Network'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'Texas Longhorns', 'Denver Broncos']
      },
      environment: {
        energyBaseline: 82,
        noiseBaseline: 78,
        crowdBaseline: 85,
        socialOpenness: 84,
        seatingRatio: { bar: 30, tables: 55, standing: 15 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 88,
        casualRatio: 12,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '25-55, young professionals & alumni'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Certified Angus Beef Sliders', 'Hong Kong Salmon', 'Brick Chicken'],
        drinkSpecials: ['House Infused Bloody Marys', 'Local IPA Pitchers'],
        teamEvents: ['Official Cowboys Game Day Hub']
      },
      goodFor: [
        'Best overall viewing quality in North Austin',
        'Pristine game audio during critical 4th quarters',
        'Upscale food that crushes typical pub food',
        'Comfortable bar booths with individual audio dials'
      ],
      avoidIf: [
        'Avoid if you want dive bar beer prices ($3 cans)',
        'Avoid if you prefer a rowdy college dance party'
      ]
    }
  },
  {
    id: 'v_the_tavern',
    name: 'The Tavern',
    address: '922 W 12th St',
    neighborhood: 'Old West Austin',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2785,
    longitude: -97.7523,
    phone: '(512) 320-8377',
    website: 'https://tavernaustin.com',
    imageUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80',
    categories: ['Historic Pub', 'Sports Bar', 'Fan Hub'],
    claimed: true,
    baseline: {
      category: 'Pub',
      neighborhood: 'Old West Austin',
      priceLevel: '$$',
      capacity: 180
    },
    venueTruth: {
      sports: {
        numTvs: 34,
        screenSizes: '34 HD screens across 2 floors with wrap-around tavern angles',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'Big 12 Network', 'SEC Network'],
        blackoutRestrictions: [],
        teamAffiliations: ['Kansas Jayhawks', 'New Orleans Saints', 'Texas Longhorns']
      },
      environment: {
        energyBaseline: 90,
        noiseBaseline: 88,
        crowdBaseline: 92,
        socialOpenness: 95,
        seatingRatio: { bar: 35, tables: 40, standing: 25 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 94,
        casualRatio: 6,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '21-60, intense fan base & multi-gen Austinites'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Original Tavern White Wings', 'Loaded Pub Fries'],
        drinkSpecials: ['Shiner Pitchers', 'Saints Touchdown Jello Shots'],
        teamEvents: ['Official Austin Kansas & Saints Flagship Bar']
      },
      goodFor: [
        'Insanely authentic historic sports pub energy since 1933',
        'Fans who scream at the TV together with strangers',
        'Upstairs German-style bier hall room'
      ],
      avoidIf: [
        'Avoid if you want quiet conversation during games',
        'Avoid if you need guaranteed parking right out front'
      ]
    }
  },
  {
    id: 'v_lavaca_downtown',
    name: 'Lavaca Street Bar',
    address: '405 Lavaca St',
    neighborhood: 'Downtown / Warehouse District',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2673,
    longitude: -97.7472,
    phone: '(512) 469-0106',
    website: 'https://lavacastreet.com',
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80',
    categories: ['Sports Bar', 'Downtown Hub', 'Late Night'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Downtown',
      priceLevel: '$$',
      capacity: 190
    },
    venueTruth: {
      sports: {
        numTvs: 32,
        screenSizes: '32 flat-screens wrapped around central island bar',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'NBA Pass', 'MLB Extra Innings'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'Houston Texans', 'LSU Tigers']
      },
      environment: {
        energyBaseline: 88,
        noiseBaseline: 85,
        crowdBaseline: 90,
        socialOpenness: 92,
        seatingRatio: { bar: 50, tables: 25, standing: 25 },
        hasPatio: false,
        patioTvs: false,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 86,
        casualRatio: 14,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '22-40, downtown crowd & sports enthusiasts'
      },
      experience: {
        watchParties: true,
        liveDj: true,
        giveaways: false,
        foodSpecials: ['Turf N Surf Po-Boys Kitchen inside', 'Blackened Crawfish Tacos'],
        drinkSpecials: ['Lone Star Tallboys', 'Espresso Martinis'],
        teamEvents: ['NFL Sunday Mega Watch']
      },
      goodFor: [
        'Best downtown bar for watching games solo or in small groups',
        'Incredible seafood po-boys from Turf N Surf inside',
        'Central island bar gives every seat 360-degree TV views'
      ],
      avoidIf: [
        'Avoid if you have kids or strollers',
        'Avoid if you require outdoor open-air seating'
      ]
    }
  },
  {
    id: 'v_haymaker',
    name: 'Haymaker',
    address: '2310 Manor Rd',
    neighborhood: 'East Austin',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2842,
    longitude: -97.7176,
    phone: '(512) 243-6702',
    website: 'https://haymakeraustin.com',
    imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80',
    categories: ['Beer Garden', 'Soccer Pub', 'Poutine & Sandwiches'],
    claimed: true,
    baseline: {
      category: 'Beer Garden',
      neighborhood: 'East Austin',
      priceLevel: '$$',
      capacity: 250
    },
    venueTruth: {
      sports: {
        numTvs: 28,
        screenSizes: '28 HD screens indoor and along covered climate-controlled porch',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['Premier League Peacock', 'MLS Season Pass', 'NFL Ticket', 'Champions League'],
        blackoutRestrictions: [],
        teamAffiliations: ['Arsenal FC', 'Austin FC', 'Chelsea FC', 'Green Bay Packers']
      },
      environment: {
        energyBaseline: 84,
        noiseBaseline: 76,
        crowdBaseline: 86,
        socialOpenness: 90,
        seatingRatio: { bar: 25, tables: 60, standing: 15 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 82,
        casualRatio: 18,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '24-45, East Austin locals, soccer buffs'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Signature Montreal Poutine', 'Pastrami Rueben', 'Pretzel Bites'],
        drinkSpecials: ['Rotating 30+ Texas Drafts', 'Cider Buckets'],
        teamEvents: ['Arsenal Austin Supporters Matchday HQ']
      },
      goodFor: [
        'Premier soccer viewing with European match morning audio',
        'Spacious picnic table layout great for 4-8 friends',
        'Phenomenal poutine and craft beer selection'
      ],
      avoidIf: [
        'Avoid if you expect white tablecloth dining',
        'Avoid if you dislike dogs on outdoor patios'
      ]
    }
  },
  {
    id: 'v_bouldin_acres',
    name: 'Bouldin Acres',
    address: '2027 S Lamar Blvd',
    neighborhood: 'South Lamar',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2458,
    longitude: -97.7712,
    phone: '(512) 531-9810',
    website: 'https://bouldinacres.com',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    categories: ['Entertainment Venue', 'Pickleball', 'Patio Bar'],
    claimed: true,
    baseline: {
      category: 'Entertainment',
      neighborhood: 'South Lamar',
      priceLevel: '$$',
      capacity: 450
    },
    venueTruth: {
      sports: {
        numTvs: 38,
        screenSizes: 'Gigantic outdoor LED stadium wall + 36 screens across turf yard & sports pavilions',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'SEC Network', 'Big 12', 'College Playoff'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Dallas Cowboys', 'Texas A&M Aggies']
      },
      environment: {
        energyBaseline: 86,
        noiseBaseline: 74,
        crowdBaseline: 88,
        socialOpenness: 94,
        seatingRatio: { bar: 20, tables: 65, standing: 15 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 72,
        casualRatio: 28,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: false,
        typicalCrowdAge: 'All ages, young families, dog owners, active 20s-40s'
      },
      experience: {
        watchParties: true,
        liveDj: true,
        giveaways: true,
        foodSpecials: ['Smoked BBQ Brisket Sandwiches', 'Birria Tacos'],
        drinkSpecials: ['Frozen Margaritas', 'Ranch Water on Tap'],
        teamEvents: ['Big Game Tailgate on the Turf']
      },
      goodFor: [
        'Huge outdoor watch parties with giant LED screen',
        'Large groups of friends and families with dogs',
        'Playing pickleball between game quarters'
      ],
      avoidIf: [
        'Avoid if you want an intimate, quiet solo bar corner',
        'Avoid if rain is torrential (though pavilions are covered)'
      ]
    }
  },
  {
    id: 'v_pluckers',
    name: 'Pluckers Wing Bar',
    address: '2222 Rio Grande St',
    neighborhood: 'West Campus / UT',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2868,
    longitude: -97.7479,
    phone: '(512) 469-9464',
    website: 'https://pluckers.com',
    imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80',
    categories: ['Sports Bar', 'Wing Hub', 'Campus Game Day'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'West Campus',
      priceLevel: '$$',
      capacity: 220
    },
    venueTruth: {
      sports: {
        numTvs: 48,
        screenSizes: '48 high-contrast screens covering every single booth angle',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network', 'Big 10', 'Big 12'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Houston Texans', 'Dallas Cowboys']
      },
      environment: {
        energyBaseline: 96,
        noiseBaseline: 94,
        crowdBaseline: 97,
        socialOpenness: 92,
        seatingRatio: { bar: 20, tables: 70, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 96,
        casualRatio: 4,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '18-35, UT students, college football fanatics'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Baker\'s Gold Wings', 'Holy Macaroni', 'Fried Pickles'],
        drinkSpecials: ['Psychedelic Frog Bowl', 'Texas Draft Pitchers'],
        teamEvents: ['Texas Longhorn Game Day Headquarters']
      },
      goodFor: [
        'The absolute loudest, most insane college football watch crowd in Austin',
        'Legendary wings with 25+ sauces',
        'Zero blind spots — you can see at least 5 screens from any seat'
      ],
      avoidIf: [
        'Avoid if you hate waitlists (arrive 1 hour early for big games)',
        'Avoid if you want low noise or quiet conversation'
      ]
    }
  },
  {
    id: 'v_bufords',
    name: 'Buford\'s Backyard Beer Garden',
    address: '700 W 6th St',
    neighborhood: 'West 6th / Downtown',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2701,
    longitude: -97.7511,
    phone: '(512) 480-8400',
    website: 'https://bufordsaustin.com',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    categories: ['Beer Garden', 'Mega Sports Bar', 'Nightlife'],
    claimed: true,
    baseline: {
      category: 'Beer Garden',
      neighborhood: 'West 6th',
      priceLevel: '$$',
      capacity: 500
    },
    venueTruth: {
      sports: {
        numTvs: 40,
        screenSizes: '30-foot outdoor Jumbotron LED wall + 40 indoor/outdoor screens',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'SEC Network', 'College Football Playoff'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'Texas Longhorns', 'LSU Tigers', 'Georgia Bulldogs']
      },
      environment: {
        energyBaseline: 95,
        noiseBaseline: 92,
        crowdBaseline: 94,
        socialOpenness: 96,
        seatingRatio: { bar: 25, tables: 40, standing: 35 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 84,
        casualRatio: 16,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: false,
        typicalCrowdAge: '21-34, high-energy weekend crowd'
      },
      experience: {
        watchParties: true,
        liveDj: true,
        giveaways: true,
        foodSpecials: ['On-site Smashburger & Taco Trucks'],
        drinkSpecials: ['Giant Beer Towers', 'Red Bull Infusions'],
        teamEvents: ['West 6th Mega Tailgates']
      },
      goodFor: [
        'Massive outdoor game watch party with booming club-grade audio',
        'Large groups wanting to celebrate and party post-game',
        'Insane atmosphere during Cowboys & Longhorns rivalry games'
      ],
      avoidIf: [
        'Avoid if you want quiet, relaxed viewing or intimate booths',
        'Avoid if you dislike loud bass or crowded beer lines'
      ]
    }
  },
  {
    id: 'v_scholz_garten',
    name: 'Scholz Garten',
    address: '1607 San Jacinto Blvd',
    neighborhood: 'Downtown / Capitol',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2781,
    longitude: -97.7378,
    phone: '(512) 474-1958',
    website: 'https://scholzgarten.com',
    imageUrl: 'https://images.unsplash.com/photo-1546768292-fb12f6c92568?w=800&auto=format&fit=crop&q=80',
    categories: ['Historic Biergarten', 'Longhorn Hub', 'Patio Dining'],
    claimed: true,
    baseline: {
      category: 'Beer Garden',
      neighborhood: 'Capitol / UT',
      priceLevel: '$$',
      capacity: 350
    },
    venueTruth: {
      sports: {
        numTvs: 24,
        screenSizes: 'Large outdoor courtyard projection + 22 screens throughout historic hall',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: false,
        sportsPackages: ['SEC Network', 'ABC/ESPN', 'FOX Sports'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns']
      },
      environment: {
        energyBaseline: 89,
        noiseBaseline: 82,
        crowdBaseline: 90,
        socialOpenness: 94,
        seatingRatio: { bar: 20, tables: 70, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 98,
        casualRatio: 2,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'All ages, multi-generation Texas Exes alumni & state workers'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Authentic German Schnitzel', 'Bratwurst Platters', 'Giant Pretzels'],
        drinkSpecials: ['German Hefeweizen Steins', 'Live Oak Pilz'],
        teamEvents: ['Texas Exes Official Game Day Tailgate & Brass Band']
      },
      goodFor: [
        'The longest-running beer garden in America (1866)',
        'Iconic Longhorn traditions: brass band plays "Eyes of Texas"',
        'Open-air shade under century-old pecan trees'
      ],
      avoidIf: [
        'Avoid if you are rooting for Oklahoma or Texas A&M (hostile territory!)',
        'Avoid if you need 40 different NFL games on at once'
      ]
    }
  },
  {
    id: 'v_skinnys',
    name: 'Skinny\'s Off Grove',
    address: '1806 E 12th St',
    neighborhood: 'East Austin',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2764,
    longitude: -97.7214,
    phone: '(512) 524-1188',
    website: 'https://skinnysaustin.com',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    categories: ['Retro Sports Lounge', 'Craft Beer', 'Cocktails'],
    claimed: false,
    baseline: {
      category: 'Lounge',
      neighborhood: 'East Austin',
      priceLevel: '$$',
      capacity: 120
    },
    venueTruth: {
      sports: {
        numTvs: 16,
        screenSizes: '16 well-placed screens with vintage wood panel frames',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'MLB Extra Innings', 'NBA Pass'],
        blackoutRestrictions: [],
        teamAffiliations: ['Casual all-sports hub', 'Dallas Cowboys', 'Houston Astros']
      },
      environment: {
        energyBaseline: 68,
        noiseBaseline: 62,
        crowdBaseline: 65,
        socialOpenness: 86,
        seatingRatio: { bar: 40, tables: 50, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 55,
        casualRatio: 45,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '24-42, Eastside creatives, relaxed sports fans'
      },
      experience: {
        watchParties: false,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Smash burgers', 'Crinkle Cut Chili Cheese Fries'],
        drinkSpecials: ['Old Fashioned on draft', 'Boilermakers'],
        teamEvents: ['Sunday Chill Screenings']
      },
      goodFor: [
        'Best chill sports bar in East Austin with 1970s living room vibes',
        'Comfortable booth seating with clear, glare-free TV angles',
        'Solo viewing at the vintage curved bar'
      ],
      avoidIf: [
        'Avoid if you want deafening stadium cheers or college ragers',
        'Avoid if you want 40 screens simultaneously'
      ]
    }
  },
  {
    id: 'v_crown_and_anchor',
    name: 'Crown & Anchor Pub',
    address: '2911 San Jacinto Blvd',
    neighborhood: 'North Campus',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2921,
    longitude: -97.7335,
    phone: '(512) 472-1245',
    website: 'https://crownandanchorpub.com',
    imageUrl: 'https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=800&auto=format&fit=crop&q=80',
    categories: ['Neighborhood Pub', 'Casual Sports', 'Burgers & Darts'],
    claimed: true,
    baseline: {
      category: 'Pub',
      neighborhood: 'North Campus',
      priceLevel: '$',
      capacity: 150
    },
    venueTruth: {
      sports: {
        numTvs: 18,
        screenSizes: '18 TVs across dark wood bar and covered dog-friendly patio',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'SEC Network', 'ESPN'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Dallas Cowboys', 'Green Bay Packers']
      },
      environment: {
        energyBaseline: 72,
        noiseBaseline: 68,
        crowdBaseline: 75,
        socialOpenness: 90,
        seatingRatio: { bar: 30, tables: 55, standing: 15 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 78,
        casualRatio: 22,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '21-65, grad students, professors, longtime Austin locals'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Award-winning $8 Pub Burger', 'Spicy Fried Cheese Bites'],
        drinkSpecials: ['30+ Draft Beers under $6', 'Daily Pitcher Specials'],
        teamEvents: ['Packers Game Day Beer Specials']
      },
      goodFor: [
        'Unpretentious, honest neighborhood pub experience',
        'Top-rated cheap cheeseburgers in Austin',
        'Low-key sports watching with friends without corporate gloss'
      ],
      avoidIf: [
        'Avoid if you want 4K laser projection or ultra-high tech setup',
        'Avoid if you want craft mixology cocktails'
      ]
    }
  },
  {
    id: 'v_little_woodrows_w6',
    name: 'Little Woodrow\'s',
    address: '520 W 6th St',
    neighborhood: 'West 6th',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2692,
    longitude: -97.7488,
    phone: '(512) 477-2337',
    website: 'https://littlewoodrows.com',
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80',
    categories: ['Patio Sports Bar', 'West 6th Hub', 'Outdoor Games'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'West 6th',
      priceLevel: '$$',
      capacity: 320
    },
    venueTruth: {
      sports: {
        numTvs: 35,
        screenSizes: '35 screens wrapping around indoor and outdoor misted deck',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network', 'MLB Extra Innings'],
        blackoutRestrictions: [],
        teamAffiliations: ['Houston Texans', 'Texas A&M Aggies', 'Dallas Cowboys']
      },
      environment: {
        energyBaseline: 89,
        noiseBaseline: 84,
        crowdBaseline: 90,
        socialOpenness: 95,
        seatingRatio: { bar: 30, tables: 50, standing: 20 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 80,
        casualRatio: 20,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '22-38, energetic West 6th crowd'
      },
      experience: {
        watchParties: true,
        liveDj: true,
        giveaways: true,
        foodSpecials: ['Brooklyn Dumplings', 'Woodrow\'s Stadium Nachos'],
        drinkSpecials: ['Texas Sized Buckets', 'Draft Pitcher Deals'],
        teamEvents: ['Aggie & Texans Watch Parties']
      },
      goodFor: [
        'Huge lively covered patio with misters and heaters',
        'Fun energetic social crowd that talks to adjacent tables',
        'Great multi-game NFL Sunday layout'
      ],
      avoidIf: [
        'Avoid if you want quiet sit-down dinner with kids',
        'Avoid if you want fine dining'
      ]
    }
  },
  {
    id: 'v_armadillo_den',
    name: 'Armadillo Den',
    address: '10106 Menchaca Rd',
    neighborhood: 'South Manchaca',
    city: 'Austin',
    state: 'TX',
    latitude: 30.1789,
    longitude: -97.8281,
    phone: '(512) 358-6938',
    website: 'https://armadilloden.com',
    imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80',
    categories: ['3-Acre Outdoor Park', 'Food Trucks', 'Projector Screens'],
    claimed: true,
    baseline: {
      category: 'Entertainment',
      neighborhood: 'South Austin',
      priceLevel: '$$',
      capacity: 600
    },
    venueTruth: {
      sports: {
        numTvs: 26,
        screenSizes: '2 gigantic 20-foot outdoor LED wall screens + 24 yard displays',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'SEC Network', 'ESPN'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Dallas Cowboys', 'Kansas City Chiefs']
      },
      environment: {
        energyBaseline: 83,
        noiseBaseline: 70,
        crowdBaseline: 82,
        socialOpenness: 92,
        seatingRatio: { bar: 15, tables: 70, standing: 15 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 74,
        casualRatio: 26,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: false,
        typicalCrowdAge: '21-45 (Strictly 21+), South Austin dog owners & friend groups'
      },
      experience: {
        watchParties: true,
        liveDj: true,
        giveaways: true,
        foodSpecials: ['6 on-site food trucks: Birria, gourmet sliders, fried chicken'],
        drinkSpecials: ['Draft Cocktails on tap', 'Bourbon Slushies'],
        teamEvents: ['South Austin Sunday Football Festivals']
      },
      goodFor: [
        'Unmatched 3-acre oak tree atmosphere with massive outdoor screens',
        'Large groups with dogs who want outdoor festival feeling',
        '6 rotating food trucks offering endless food variety'
      ],
      avoidIf: [
        'Avoid if you have guests under 21 (strictly 21+ at all times)',
        'Avoid if you prefer a climate-controlled dark indoor pub'
      ]
    }
  },
  {
    id: 'v_mister_tramps',
    name: 'Mister Tramps Sports Pub',
    address: '8565 Research Blvd',
    neighborhood: 'North Austin / Research',
    city: 'Austin',
    state: 'TX',
    latitude: 30.3644,
    longitude: -97.7198,
    phone: '(512) 837-3500',
    website: 'https://mistertramps.com',
    imageUrl: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&auto=format&fit=crop&q=80',
    categories: ['Dedicated Sports Pub', 'Rugby & Soccer', 'Fan Rooms'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'North Austin',
      priceLevel: '$$',
      capacity: 200
    },
    venueTruth: {
      sports: {
        numTvs: 36,
        screenSizes: '36 screens including private sound-zoned fan viewing rooms',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'Premier League', 'Rugby Network', 'NHL Center Ice'],
        blackoutRestrictions: [],
        teamAffiliations: ['Tottenham Hotspur', 'Arsenal FC', 'Dallas Stars', 'Denver Broncos']
      },
      environment: {
        energyBaseline: 85,
        noiseBaseline: 82,
        crowdBaseline: 80,
        socialOpenness: 88,
        seatingRatio: { bar: 30, tables: 55, standing: 15 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 92,
        casualRatio: 8,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '25-60, die-hard international soccer & hockey fans'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Handmade Pizza', 'Pub Wings', 'British Fish & Chips'],
        drinkSpecials: ['Guinness Imperial Pints', 'Local Texas Drafts'],
        teamEvents: ['Spurs vs Arsenal North London Derby Live Audio']
      },
      goodFor: [
        'Dedicated multi-room sound zones: hear your specific game audio',
        'Premier hockey (Dallas Stars) and soccer viewing',
        'Genuine sports fans who actually watch every play'
      ],
      avoidIf: [
        'Avoid if you want flashy nightclub lighting or trendy DJ sets',
        'Avoid if you are looking for downtown walkable bar hopping'
      ]
    }
  },
  {
    id: 'v_the_park_slamar',
    name: 'The Park on South Lamar',
    address: '4024 S Lamar Blvd',
    neighborhood: 'South Lamar',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2361,
    longitude: -97.7942,
    phone: '(512) 730-0700',
    website: 'https://thepark.net',
    imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80',
    categories: ['Gastropub', 'Booth TVs', 'Sunday Brunch Sports'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'South Lamar',
      priceLevel: '$$',
      capacity: 260
    },
    venueTruth: {
      sports: {
        numTvs: 44,
        screenSizes: '44 HD displays + private audio channels in custom leather booths',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'NBA Pass', 'SEC Network'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Dallas Cowboys', 'Chicago Bears']
      },
      environment: {
        energyBaseline: 80,
        noiseBaseline: 74,
        crowdBaseline: 84,
        socialOpenness: 82,
        seatingRatio: { bar: 25, tables: 65, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 80,
        casualRatio: 20,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '25-50, South Austin professionals & couples'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Chorizo Mac & Cheese', 'Craft Burgers', 'Sunday Mimosa Towers'],
        drinkSpecials: ['Draft Flights', 'Espresso Martinis'],
        teamEvents: ['Sunday Football Buffet & Game Watching']
      },
      goodFor: [
        'Private audio box in booths lets your group listen to your game',
        'Comfortable high-back booths with excellent direct sightlines',
        'Great weekend brunch and dinner menu'
      ],
      avoidIf: [
        'Avoid if you want standing-room beer garden chaos',
        'Avoid if you want late night 2 AM ragers'
      ]
    }
  },
  {
    id: 'v_pinthouse_benwhite',
    name: 'Pinthouse Brewing',
    address: '2201 E Ben White Blvd',
    neighborhood: 'South Austin',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2223,
    longitude: -97.7445,
    phone: '(512) 992-1969',
    website: 'https://pinthouse.com',
    imageUrl: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=800&auto=format&fit=crop&q=80',
    categories: ['Award-Winning Craft Brewery', 'Huge Beer Hall', 'Pizza'],
    claimed: true,
    baseline: {
      category: 'Brewery',
      neighborhood: 'South Austin',
      priceLevel: '$$',
      capacity: 380
    },
    venueTruth: {
      sports: {
        numTvs: 30,
        screenSizes: '30 large screens across sweeping industrial beer hall and mezzanine',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'SEC Network', 'MLB'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Houston Astros', 'Austin FC']
      },
      environment: {
        energyBaseline: 84,
        noiseBaseline: 78,
        crowdBaseline: 88,
        socialOpenness: 90,
        seatingRatio: { bar: 20, tables: 70, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 76,
        casualRatio: 24,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'All ages, craft beer enthusiasts, friend groups'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Electric Jellyfish IPA', 'Sourdough Artisan Pizzas'],
        drinkSpecials: ['Freshly tapped experimental IPAs', 'Beer Flights'],
        teamEvents: ['Austin FC Away Match Screenings']
      },
      goodFor: [
        'Home of world-famous Electric Jellyfish IPA',
        'Communal long tables ideal for 6-12 friends watching games',
        'Top notch stone-fired sourdough pizzas'
      ],
      avoidIf: [
        'Avoid if you want hard liquor or shots (beer & wine only)',
        'Avoid if you dislike bustling open beer hall acoustics'
      ]
    }
  },
  {
    id: 'v_warehouse_billiard',
    name: 'Warehouse Billiard Bar',
    address: '509 E Ben White Blvd',
    neighborhood: 'South 1st / Ben White',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2205,
    longitude: -97.7618,
    phone: '(512) 443-8799',
    website: 'https://warehousebilliardbar.com',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    categories: ['Billiards & Sports Bar', 'Pool Tables', 'Casual Dive'],
    claimed: false,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'South Austin',
      priceLevel: '$',
      capacity: 220
    },
    venueTruth: {
      sports: {
        numTvs: 32,
        screenSizes: '32 HD screens hanging over pool tables and central bar',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'NBA Pass', 'Billiards Tournaments'],
        blackoutRestrictions: [],
        teamAffiliations: ['Casual Texas sports', 'Dallas Cowboys']
      },
      environment: {
        energyBaseline: 70,
        noiseBaseline: 66,
        crowdBaseline: 72,
        socialOpenness: 86,
        seatingRatio: { bar: 40, tables: 40, standing: 20 },
        hasPatio: false,
        patioTvs: false,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 65,
        casualRatio: 35,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '21-65, pool players, casual game viewers'
      },
      experience: {
        watchParties: false,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Cheesesteaks', 'Mozzarella Sticks'],
        drinkSpecials: ['Cold beer pitchers', 'Well drink specials'],
        teamEvents: ['Sunday Billiards & Football']
      },
      goodFor: [
        'Playing pool and darts while checking scores',
        'Easy bar seating without waiting in lines',
        'Affordable prices and laid back crowd'
      ],
      avoidIf: [
        'Avoid if you want high-end craft cocktails or stadium fanfare',
        'Avoid if you require outdoor seating'
      ]
    }
  },
  {
    id: 'v_corner_restaurant',
    name: 'Corner Restaurant & Lounge',
    address: '98 San Jacinto Blvd',
    neighborhood: 'Downtown / Congress',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2642,
    longitude: -97.7419,
    phone: '(512) 608-4488',
    website: 'https://cornerrestaurantaustin.com',
    imageUrl: 'https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=800&auto=format&fit=crop&q=80',
    categories: ['Upscale Lounge', 'Hotel Sports Bar', 'Craft Cocktails'],
    claimed: true,
    baseline: {
      category: 'Lounge',
      neighborhood: 'Downtown',
      priceLevel: '$$$',
      capacity: 160
    },
    venueTruth: {
      sports: {
        numTvs: 16,
        screenSizes: '16 high-end 4K flush-mounted architectural displays',
        hasProjector: false,
        gameAudio: false,
        multipleGamesSimultaneous: true,
        sportsPackages: ['ESPN', 'Golf Channel', 'Tennis Channel', 'NFL Network'],
        blackoutRestrictions: [],
        teamAffiliations: ['National broadcast sports', 'PGA Tour', 'Formula 1']
      },
      environment: {
        energyBaseline: 55,
        noiseBaseline: 50,
        crowdBaseline: 58,
        socialOpenness: 70,
        seatingRatio: { bar: 45, tables: 50, standing: 5 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 40,
        casualRatio: 60,
        familyFriendly: true,
        groupFriendly: false,
        soloFriendly: true,
        typicalCrowdAge: '30-65, business travelers, downtown executives'
      },
      experience: {
        watchParties: false,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Texas Wagyu Sliders', 'Baja Fish Tacos', 'Truffle Fries'],
        drinkSpecials: ['Smoked Mesquite Old Fashioned', 'Premium Tequila Flights'],
        teamEvents: ['Major Golf Major Championship Lounges']
      },
      goodFor: [
        'Watching the game alone or on a date without screaming crowds',
        'Conducting business conversations while casually following sports',
        'Top shelf bourbon and craft culinary appetizers'
      ],
      avoidIf: [
        'Avoid if you want roaring stadium game audio',
        'Avoid if you are looking for college fan chants and beer bongs'
      ]
    }
  },
  {
    id: 'v_docs_backyard',
    name: 'Doc\'s Backyard Grill',
    address: '5207 Brodie Ln',
    neighborhood: 'Sunset Valley',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2289,
    longitude: -97.8225,
    phone: '(512) 892-5200',
    website: 'https://docsbackyardgrill.com',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    categories: ['Family Sports Grill', 'Huge Covered Deck', 'Playground'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Southwest Austin',
      priceLevel: '$$',
      capacity: 300
    },
    venueTruth: {
      sports: {
        numTvs: 32,
        screenSizes: '32 screens spread across massive covered cedar deck',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'SEC Network', 'Big 12'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Texas A&M', 'Dallas Cowboys']
      },
      environment: {
        energyBaseline: 75,
        noiseBaseline: 70,
        crowdBaseline: 78,
        socialOpenness: 88,
        seatingRatio: { bar: 20, tables: 75, standing: 5 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 70,
        casualRatio: 30,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'All ages, parents with kids, neighborhood sports fans'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Texas Sized Chicken Fried Steak', 'Backyard Burgers'],
        drinkSpecials: ['Draft Margaritas', 'Austin Craft Beer Buckets'],
        teamEvents: ['Saturday College Football Deck Watch']
      },
      goodFor: [
        'Parents who want to watch the game while kids play safely on the enclosed playground',
        'Spacious covered deck seating with great shade and breeze',
        'Casual family and group sports dining'
      ],
      avoidIf: [
        'Avoid if you want an adult-only singles scene',
        'Avoid if you hate hearing children laughing nearby'
      ]
    }
  },
  {
    id: 'v_clive_annex',
    name: 'Clive Bar & Sports Annex',
    address: '609 Davis St',
    neighborhood: 'Rainey Street',
    city: 'Austin',
    state: 'TX',
    latitude: 30.2592,
    longitude: -97.7388,
    phone: '(512) 524-4989',
    website: 'https://clivebar.com',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    categories: ['Rainey Street Bar', 'Mescal Lounge', 'Sports Annex'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Rainey Street',
      priceLevel: '$$',
      capacity: 220
    },
    venueTruth: {
      sports: {
        numTvs: 22,
        screenSizes: '22 screens in the modern two-story back annex + yard screens',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Ticket', 'SEC Network'],
        blackoutRestrictions: [],
        teamAffiliations: ['LSU Tigers', 'Dallas Cowboys', 'Texas Longhorns']
      },
      environment: {
        energyBaseline: 92,
        noiseBaseline: 88,
        crowdBaseline: 94,
        socialOpenness: 97,
        seatingRatio: { bar: 30, tables: 35, standing: 35 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 75,
        casualRatio: 25,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '21-36, Rainey Street socialites & game day partiers'
      },
      experience: {
        watchParties: true,
        liveDj: true,
        giveaways: true,
        foodSpecials: ['Taco truck on back patio'],
        drinkSpecials: ['Clive Mezcalita', 'Shot & Shiner combos'],
        teamEvents: ['LSU Tiger Watch Hub']
      },
      goodFor: [
        'Watching the game in the middle of Rainey Street nightlife action',
        'Meeting people and socializing with high energy',
        'Seamless transition from game watching into evening bar hopping'
      ],
      avoidIf: [
        'Avoid if you want quiet sit-down dinner with guaranteed booth seats',
        'Avoid if you get overwhelmed by large energetic crowds'
      ]
    }
  },
  {
    id: 'v_oasis_brewing',
    name: 'Oasis Texas Brewing Co',
    address: '6550 Comanche Trl',
    neighborhood: 'Lake Travis',
    city: 'Austin',
    state: 'TX',
    latitude: 30.4074,
    longitude: -97.8745,
    phone: '(512) 284-9407',
    website: 'https://oasistxbrewing.com',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    categories: ['Lakeview Brewery', 'Sunset Deck', 'Craft Beer'],
    claimed: true,
    baseline: {
      category: 'Brewery',
      neighborhood: 'Lake Travis',
      priceLevel: '$$',
      capacity: 350
    },
    venueTruth: {
      sports: {
        numTvs: 24,
        screenSizes: '24 screens inside taproom barrel hall and covered cliffside deck',
        hasProjector: true,
        gameAudio: false,
        multipleGamesSimultaneous: true,
        sportsPackages: ['ESPN', 'FOX Sports', 'NFL Network'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Casual scenic sports']
      },
      environment: {
        energyBaseline: 64,
        noiseBaseline: 58,
        crowdBaseline: 70,
        socialOpenness: 82,
        seatingRatio: { bar: 25, tables: 65, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 52,
        casualRatio: 48,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'All ages, couples, tourists, lake visitors'
      },
      experience: {
        watchParties: false,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Lake Travis Smoked Wings', 'Pub Pretzels with Beer Cheese'],
        drinkSpecials: ['Luchesa Lager', 'Meta Modern Session IPA'],
        teamEvents: ['Sunset Game Viewing']
      },
      goodFor: [
        'World-class cliffside sunset views overlooking Lake Travis',
        'Relaxed craft beer watching with light noise and stunning natural scenery',
        'Date-friendly sports viewing'
      ],
      avoidIf: [
        'Avoid if you want 100dB roaring game audio in your ears',
        'Avoid if you do not want to drive out to Lake Travis'
      ]
    }
  }
];

export const INITIAL_LIVE_STATES: Record<string, VenueLiveState> = {
  v_txk_hopkins: {
    venueId: 'v_txk_hopkins',
    energy: 92,
    crowd: 88,
    noise: 86,
    social: 94,
    sportsIntensity: 95,
    viewingQuality: 92,
    seatingAvailability: 14,
    trendingVelocity: 38,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_txk_fat_jacks: {
    venueId: 'v_txk_fat_jacks',
    energy: 95,
    crowd: 94,
    noise: 91,
    social: 96,
    sportsIntensity: 97,
    viewingQuality: 90,
    seatingAvailability: 8,
    trendingVelocity: 44,
    currentStatus: 'PEAK',
    lastUpdated: new Date().toISOString()
  },
  v_txk_bww: {
    venueId: 'v_txk_bww',
    energy: 90,
    crowd: 91,
    noise: 85,
    social: 88,
    sportsIntensity: 92,
    viewingQuality: 96,
    seatingAvailability: 22,
    trendingVelocity: 26,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_txk_walk_ons: {
    venueId: 'v_txk_walk_ons',
    energy: 88,
    crowd: 86,
    noise: 83,
    social: 90,
    sportsIntensity: 91,
    viewingQuality: 95,
    seatingAvailability: 19,
    trendingVelocity: 30,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_txk_gusanos: {
    venueId: 'v_txk_gusanos',
    energy: 85,
    crowd: 82,
    noise: 78,
    social: 89,
    sportsIntensity: 88,
    viewingQuality: 88,
    seatingAvailability: 28,
    trendingVelocity: 18,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_txk_silver_star: {
    venueId: 'v_txk_silver_star',
    energy: 86,
    crowd: 84,
    noise: 79,
    social: 91,
    sportsIntensity: 89,
    viewingQuality: 91,
    seatingAvailability: 20,
    trendingVelocity: 22,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_cover3: {
    venueId: 'v_cover3',
    energy: 94,
    crowd: 92,
    noise: 88,
    social: 91,
    sportsIntensity: 96,
    viewingQuality: 98,
    seatingAvailability: 18, // 18% seats open (packed!)
    trendingVelocity: 34, // +34% spike
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_the_tavern: {
    venueId: 'v_the_tavern',
    energy: 96,
    crowd: 95,
    noise: 94,
    social: 93,
    sportsIntensity: 98,
    viewingQuality: 88,
    seatingAvailability: 12,
    trendingVelocity: 28,
    currentStatus: 'PEAK',
    lastUpdated: new Date().toISOString()
  },
  v_pluckers: {
    venueId: 'v_pluckers',
    energy: 98,
    crowd: 98,
    noise: 97,
    social: 95,
    sportsIntensity: 100,
    viewingQuality: 92,
    seatingAvailability: 5, // practically zero tables open
    trendingVelocity: 42, // hottest trending
    currentStatus: 'PEAK',
    lastUpdated: new Date().toISOString()
  },
  v_bufords: {
    venueId: 'v_bufords',
    energy: 97,
    crowd: 96,
    noise: 95,
    social: 98,
    sportsIntensity: 92,
    viewingQuality: 94,
    seatingAvailability: 15,
    trendingVelocity: 38,
    currentStatus: 'PEAK',
    lastUpdated: new Date().toISOString()
  },
  v_lavaca_downtown: {
    venueId: 'v_lavaca_downtown',
    energy: 88,
    crowd: 86,
    noise: 84,
    social: 90,
    sportsIntensity: 91,
    viewingQuality: 89,
    seatingAvailability: 24,
    trendingVelocity: 19,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_haymaker: {
    venueId: 'v_haymaker',
    energy: 86,
    crowd: 84,
    noise: 78,
    social: 92,
    sportsIntensity: 89,
    viewingQuality: 88,
    seatingAvailability: 28,
    trendingVelocity: 22,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_bouldin_acres: {
    venueId: 'v_bouldin_acres',
    energy: 85,
    crowd: 85,
    noise: 76,
    social: 94,
    sportsIntensity: 80,
    viewingQuality: 90,
    seatingAvailability: 35,
    trendingVelocity: 15,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_scholz_garten: {
    venueId: 'v_scholz_garten',
    energy: 91,
    crowd: 89,
    noise: 82,
    social: 92,
    sportsIntensity: 95,
    viewingQuality: 84,
    seatingAvailability: 20,
    trendingVelocity: 25,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_skinnys: {
    venueId: 'v_skinnys',
    energy: 66,
    crowd: 62,
    noise: 58,
    social: 82,
    sportsIntensity: 72,
    viewingQuality: 85,
    seatingAvailability: 68, // plenty of open booth seating
    trendingVelocity: 6,
    currentStatus: 'CHILL',
    lastUpdated: new Date().toISOString()
  },
  v_crown_and_anchor: {
    venueId: 'v_crown_and_anchor',
    energy: 74,
    crowd: 72,
    noise: 68,
    social: 88,
    sportsIntensity: 80,
    viewingQuality: 76,
    seatingAvailability: 52,
    trendingVelocity: 12,
    currentStatus: 'STEADY',
    lastUpdated: new Date().toISOString()
  },
  v_little_woodrows_w6: {
    venueId: 'v_little_woodrows_w6',
    energy: 90,
    crowd: 88,
    noise: 85,
    social: 94,
    sportsIntensity: 87,
    viewingQuality: 86,
    seatingAvailability: 22,
    trendingVelocity: 24,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_armadillo_den: {
    venueId: 'v_armadillo_den',
    energy: 82,
    crowd: 80,
    noise: 68,
    social: 91,
    sportsIntensity: 78,
    viewingQuality: 88,
    seatingAvailability: 45,
    trendingVelocity: 18,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_mister_tramps: {
    venueId: 'v_mister_tramps',
    energy: 84,
    crowd: 81,
    noise: 80,
    social: 86,
    sportsIntensity: 94,
    viewingQuality: 92,
    seatingAvailability: 32,
    trendingVelocity: 16,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_the_park_slamar: {
    venueId: 'v_the_park_slamar',
    energy: 79,
    crowd: 82,
    noise: 72,
    social: 80,
    sportsIntensity: 85,
    viewingQuality: 93,
    seatingAvailability: 38,
    trendingVelocity: 14,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_pinthouse_benwhite: {
    venueId: 'v_pinthouse_benwhite',
    energy: 85,
    crowd: 87,
    noise: 80,
    social: 90,
    sportsIntensity: 83,
    viewingQuality: 88,
    seatingAvailability: 30,
    trendingVelocity: 20,
    currentStatus: 'LIVE',
    lastUpdated: new Date().toISOString()
  },
  v_warehouse_billiard: {
    venueId: 'v_warehouse_billiard',
    energy: 68,
    crowd: 65,
    noise: 64,
    social: 82,
    sportsIntensity: 75,
    viewingQuality: 78,
    seatingAvailability: 62,
    trendingVelocity: 5,
    currentStatus: 'CHILL',
    lastUpdated: new Date().toISOString()
  },
  v_corner_restaurant: {
    venueId: 'v_corner_restaurant',
    energy: 52,
    crowd: 50,
    noise: 48,
    social: 66,
    sportsIntensity: 58,
    viewingQuality: 82,
    seatingAvailability: 75, // very open
    trendingVelocity: 2,
    currentStatus: 'CHILL',
    lastUpdated: new Date().toISOString()
  },
  v_docs_backyard: {
    venueId: 'v_docs_backyard',
    energy: 76,
    crowd: 79,
    noise: 72,
    social: 86,
    sportsIntensity: 81,
    viewingQuality: 82,
    seatingAvailability: 40,
    trendingVelocity: 11,
    currentStatus: 'STEADY',
    lastUpdated: new Date().toISOString()
  },
  v_clive_annex: {
    venueId: 'v_clive_annex',
    energy: 92,
    crowd: 91,
    noise: 89,
    social: 96,
    sportsIntensity: 84,
    viewingQuality: 85,
    seatingAvailability: 16,
    trendingVelocity: 29,
    currentStatus: 'PEAK',
    lastUpdated: new Date().toISOString()
  },
  v_oasis_brewing: {
    venueId: 'v_oasis_brewing',
    energy: 62,
    crowd: 68,
    noise: 56,
    social: 80,
    sportsIntensity: 62,
    viewingQuality: 80,
    seatingAvailability: 58,
    trendingVelocity: 8,
    currentStatus: 'CHILL',
    lastUpdated: new Date().toISOString()
  }
};

export const SEEDED_VENUE_GAMES: VenueGame[] = [
  {
    venueId: 'v_txk_hopkins',
    gameId: 'game_cowboys_eagles',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Main Taproom Wall + Courtyard 85" Screens',
    lastVerifiedAt: '2 mins ago',
    fanBase: 'Dallas Cowboys Booster Club'
  },
  {
    venueId: 'v_txk_hopkins',
    gameId: 'game_razorbacks_aggies',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Front Bar & Courtyard Projection',
    lastVerifiedAt: '4 mins ago',
    fanBase: 'Ark-La-Tex Razorbacks Watch Group'
  },
  {
    venueId: 'v_txk_fat_jacks',
    gameId: 'game_cowboys_eagles',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'All 28 HDTVs with sound on throughout bar',
    lastVerifiedAt: '1 min ago',
    fanBase: 'Cowboys & Razorbacks Fanatics'
  },
  {
    venueId: 'v_txk_fat_jacks',
    gameId: 'game_razorbacks_aggies',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Main oyster bar and sports stage screens',
    lastVerifiedAt: '3 mins ago'
  },
  {
    venueId: 'v_txk_bww',
    gameId: 'game_cowboys_eagles',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Projection walls & 56 screens wall-to-wall',
    lastVerifiedAt: '1 min ago',
    fanBase: 'Official Cowboys Watch Party'
  },
  {
    venueId: 'v_txk_bww',
    gameId: 'game_longhorns_sooners',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'West Dining Wing 18 Screens',
    lastVerifiedAt: '5 mins ago'
  },
  {
    venueId: 'v_txk_walk_ons',
    gameId: 'game_razorbacks_aggies',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: '64 Ultra-HD screens 360 sound coverage',
    lastVerifiedAt: '2 mins ago',
    fanBase: 'SEC Game Day Central'
  },
  {
    venueId: 'v_txk_gusanos',
    gameId: 'game_razorbacks_aggies',
    confidence: 95,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Main Pizzeria Bar & projection screens',
    lastVerifiedAt: '6 mins ago',
    fanBase: 'Arkansas Alumni Association'
  },
  {
    venueId: 'v_cover3',
    gameId: 'game_cowboys_eagles',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Main Wall 120" + 18 TVs in sports bar zone',
    lastVerifiedAt: '3 mins ago',
    fanBase: 'Dallas Cowboys Booster Section'
  },
  {
    venueId: 'v_cover3',
    gameId: 'game_longhorns_sooners',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: false,
    screenAllocations: 'East Dining Wall + 12 TVs',
    lastVerifiedAt: '5 mins ago'
  },
  {
    venueId: 'v_pluckers',
    gameId: 'game_longhorns_sooners',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'All 48 screens & main sound system blasted',
    lastVerifiedAt: '1 min ago',
    fanBase: 'Texas Longhorns Central'
  },
  {
    venueId: 'v_pluckers',
    gameId: 'game_cowboys_eagles',
    confidence: 95,
    verificationStatus: 'GAME_ON',
    audioConfirmed: false,
    screenAllocations: '10 screens in North Wing',
    lastVerifiedAt: '6 mins ago'
  },
  {
    venueId: 'v_bufords',
    gameId: 'game_cowboys_eagles',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: '30-foot outdoor Jumbotron with stadium audio',
    lastVerifiedAt: '2 mins ago',
    fanBase: 'Massive Cowboys Watch Party'
  },
  {
    venueId: 'v_the_tavern',
    gameId: 'game_cowboys_eagles',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Main tavern floor + downstairs bar audio',
    lastVerifiedAt: '4 mins ago'
  },
  {
    venueId: 'v_the_tavern',
    gameId: 'game_longhorns_sooners',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Upstairs Hall with full crowd audio',
    lastVerifiedAt: '4 mins ago'
  },
  {
    venueId: 'v_haymaker',
    gameId: 'game_arsenal_mancity',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'All porch and indoor screens',
    lastVerifiedAt: '10 mins ago',
    fanBase: 'Arsenal Austin Official'
  },
  {
    venueId: 'v_haymaker',
    gameId: 'game_cowboys_eagles',
    confidence: 95,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Main bar 14 screens',
    lastVerifiedAt: '8 mins ago'
  },
  {
    venueId: 'v_lavaca_downtown',
    gameId: 'game_cowboys_eagles',
    confidence: 98,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Center 360 island bar',
    lastVerifiedAt: '5 mins ago'
  },
  {
    venueId: 'v_bouldin_acres',
    gameId: 'game_cowboys_eagles',
    confidence: 94,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'Turf Stadium LED Wall',
    lastVerifiedAt: '7 mins ago'
  },
  {
    venueId: 'v_mister_tramps',
    gameId: 'game_ufc_312',
    confidence: 100,
    verificationStatus: 'GAME_ON',
    audioConfirmed: true,
    screenAllocations: 'West Sports Room PPV Screen',
    lastVerifiedAt: '3 mins ago'
  },
  {
    venueId: 'v_skinnys',
    gameId: 'game_spurs_lakers',
    confidence: 85,
    verificationStatus: 'LIKELY',
    audioConfirmed: false,
    screenAllocations: 'Bar front 4 screens',
    lastVerifiedAt: '15 mins ago'
  }
];

export const SEEDED_PRESENCE: Presence[] = [
  {
    id: 'pres_txk_1',
    userId: 'usr_cody',
    userName: 'Cody Miller',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_txk_hopkins',
    statusMessage: 'At Hopkins patio courtyard, sound on for the Cowboys!',
    activityType: 'WATCHING_GAME',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 95 * 60000).toISOString()
  },
  {
    id: 'pres_txk_2',
    userId: 'usr_hannah',
    userName: 'Hannah Davis',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_txk_hopkins',
    statusMessage: 'Razorbacks watch crew is here in full force',
    activityType: 'WITH_FRIENDS',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 75 * 60000).toISOString()
  },
  {
    id: 'pres_txk_3',
    userId: 'usr_brett',
    userName: 'Brett Thompson',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_txk_fat_jacks',
    statusMessage: 'Fat Jacks is packed! Fresh oysters and game audio on point',
    activityType: 'WATCHING_GAME',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 105 * 60000).toISOString()
  },
  {
    id: 'pres_txk_4',
    userId: 'usr_lauren',
    userName: 'Lauren Vance',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_txk_bww',
    statusMessage: '56 screens going, crazy energy in here tonight',
    activityType: 'WATCHING_GAME',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 90 * 60000).toISOString()
  },
  {
    id: 'pres_1',
    userId: 'usr_john',
    userName: 'John Mercer',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_cover3',
    statusMessage: 'Watching Cowboys vs Eagles at the bar!',
    activityType: 'WATCHING_GAME',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 85 * 60000).toISOString()
  },
  {
    id: 'pres_2',
    userId: 'usr_mike',
    userName: 'Mike Castillo',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_cover3',
    statusMessage: 'Already here, grabbed a high-top table',
    activityType: 'WITH_FRIENDS',
    createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 70 * 60000).toISOString()
  },
  {
    id: 'pres_3',
    userId: 'usr_sarah',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_cover3',
    statusMessage: 'Hanging out, game audio is loud and clear',
    activityType: 'WATCHING_GAME',
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 100 * 60000).toISOString()
  },
  {
    id: 'pres_4',
    userId: 'usr_marcus',
    userName: 'Marcus Cole',
    userAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_pluckers',
    statusMessage: 'Longhorns game day is insane in here',
    activityType: 'WATCHING_GAME',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 80 * 60000).toISOString()
  },
  {
    id: 'pres_5',
    userId: 'usr_elena',
    userName: 'Elena Rodriguez',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_pluckers',
    statusMessage: 'Singing Texas fight song with 200 people!',
    activityType: 'WATCHING_GAME',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 105 * 60000).toISOString()
  },
  {
    id: 'pres_6',
    userId: 'usr_david',
    userName: 'David Park',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_bufords',
    statusMessage: 'Jumbotron is crazy. Standing room only near the stage.',
    activityType: 'WATCHING_GAME',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 95 * 60000).toISOString()
  },
  {
    id: 'pres_7',
    userId: 'usr_chloe',
    userName: 'Chloe Bennett',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_haymaker',
    statusMessage: 'Arsenal win celebration with Poutine!',
    activityType: 'WITH_FRIENDS',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 75 * 60000).toISOString()
  },
  {
    id: 'pres_8',
    userId: 'usr_tyler',
    userName: 'Tyler Vance',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    venueId: 'v_skinnys',
    statusMessage: 'Super relaxed, great booth, watching basketball solo',
    activityType: 'LOOKING_TO_SOCIALIZE',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 110 * 60000).toISOString()
  }
];

export const SEEDED_SIGNALS: VenueSignal[] = [
  {
    id: 'sig_1',
    venueId: 'v_bufords',
    signalType: 'TRENDING_SPIKE',
    title: 'Activity Spike (+38%)',
    message: 'Massive Cowboys crowd surging into outdoor beer garden as Q4 approaches',
    source: 'SYSTEM',
    confidence: 98,
    timestamp: '2 mins ago'
  },
  {
    id: 'sig_2',
    venueId: 'v_cover3',
    signalType: 'AUDIO_REPORT',
    title: 'Game Audio Verified On',
    message: 'Staff prioritized Cowboys audio on main sound system after halftime',
    source: 'VENUE',
    confidence: 100,
    timestamp: '5 mins ago'
  },
  {
    id: 'sig_3',
    venueId: 'v_pluckers',
    signalType: 'CROWD_REPORT',
    title: 'Peak Capacity Reached (98%)',
    message: 'All indoor booths and bar stools occupied. Standing room queue forming.',
    source: 'USER',
    confidence: 95,
    timestamp: '8 mins ago'
  },
  {
    id: 'sig_4',
    venueId: 'v_the_tavern',
    signalType: 'GAME_CONFIRMATION',
    title: 'Game On: Both Big Games Verified',
    message: 'Tavern confirming Cowboys on floor 1, Longhorns on floor 2 with sound',
    source: 'VENUE',
    confidence: 100,
    timestamp: '12 mins ago'
  },
  {
    id: 'sig_5',
    venueId: 'v_skinnys',
    signalType: 'SEATING_REPORT',
    title: 'Open Seating Available',
    message: '68% booth and bar seating open for casual watching & conversation',
    source: 'USER',
    confidence: 90,
    timestamp: '15 mins ago'
  }
];
