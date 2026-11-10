import { Market, City, Venue } from '../types';

// ==========================================
// 1. FIRST-CLASS SEEDED MARKETS
// ==========================================

export const SEEDED_MARKETS: Market[] = [
  // PHASE 1 — INITIAL LIVE MARKET
  {
    id: 'market_texarkana',
    name: 'Texarkana (Ark-La-Tex)',
    slug: 'texarkana',
    state: 'Texas / Arkansas',
    state_code: 'TX/AR',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 33.4251,
    longitude: -94.0477,
    radius: 35,
    population: 154000,
    status: 'ACTIVE',
    launch_status: 'LIVE',
    launch_date: '2026-08-15T00:00:00Z',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z',
    geographic_boundary: {
      type: 'RADIUS',
      radiusMiles: 35,
      center: { lat: 33.4251, lng: -94.0477 }
    }
  },

  // PHASE 2 — MAJOR U.S. EXPANSION MARKETS
  {
    id: 'market_dfw',
    name: 'Dallas–Fort Worth Metroplex',
    slug: 'dallas-fort-worth',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 32.7767,
    longitude: -96.797,
    radius: 45,
    population: 7637000,
    status: 'ACTIVE',
    launch_status: 'PREPARING',
    created_at: '2026-08-10T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z',
    geographic_boundary: {
      type: 'RADIUS',
      radiusMiles: 45,
      center: { lat: 32.7767, lng: -96.797 }
    }
  },
  {
    id: 'market_houston',
    name: 'Greater Houston',
    slug: 'houston',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 29.7604,
    longitude: -95.3698,
    radius: 45,
    population: 7122000,
    status: 'ACTIVE',
    launch_status: 'PREPARING',
    created_at: '2026-08-10T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z',
    geographic_boundary: {
      type: 'RADIUS',
      radiusMiles: 45,
      center: { lat: 29.7604, lng: -95.3698 }
    }
  },
  {
    id: 'market_littlerock',
    name: 'Little Rock Metro',
    slug: 'little-rock',
    state: 'Arkansas',
    state_code: 'AR',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 34.7465,
    longitude: -92.2896,
    radius: 35,
    population: 750000,
    status: 'ACTIVE',
    launch_status: 'PREPARING',
    created_at: '2026-08-12T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z',
    geographic_boundary: {
      type: 'RADIUS',
      radiusMiles: 35,
      center: { lat: 34.7465, lng: -92.2896 }
    }
  },
  {
    id: 'market_shreveport',
    name: 'Shreveport–Bossier City',
    slug: 'shreveport',
    state: 'Louisiana',
    state_code: 'LA',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 32.5252,
    longitude: -93.7502,
    radius: 30,
    population: 393000,
    status: 'ACTIVE',
    launch_status: 'PREPARING',
    created_at: '2026-08-12T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z',
    geographic_boundary: {
      type: 'RADIUS',
      radiusMiles: 30,
      center: { lat: 32.5252, lng: -93.7502 }
    }
  },
  {
    id: 'market_austin',
    name: 'Austin Metro',
    slug: 'austin',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 30.2672,
    longitude: -97.7431,
    radius: 35,
    population: 2283000,
    status: 'ACTIVE',
    launch_status: 'PREPARING',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z',
    geographic_boundary: {
      type: 'RADIUS',
      radiusMiles: 35,
      center: { lat: 30.2672, lng: -97.7431 }
    }
  },
  {
    id: 'market_sanantonio',
    name: 'San Antonio',
    slug: 'san-antonio',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 29.4241,
    longitude: -98.4936,
    radius: 35,
    population: 2600000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_okc',
    name: 'Oklahoma City',
    slug: 'oklahoma-city',
    state: 'Oklahoma',
    state_code: 'OK',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 35.4676,
    longitude: -97.5164,
    radius: 35,
    population: 1440000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_memphis',
    name: 'Memphis Metro',
    slug: 'memphis',
    state: 'Tennessee',
    state_code: 'TN',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 35.1495,
    longitude: -90.049,
    radius: 35,
    population: 1337000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_neworleans',
    name: 'New Orleans',
    slug: 'new-orleans',
    state: 'Louisiana',
    state_code: 'LA',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 29.9511,
    longitude: -90.0715,
    radius: 30,
    population: 1270000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_atlanta',
    name: 'Atlanta Metro',
    slug: 'atlanta',
    state: 'Georgia',
    state_code: 'GA',
    country: 'USA',
    timezone: 'America/New_York',
    latitude: 33.749,
    longitude: -84.388,
    radius: 45,
    population: 6144000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_nashville',
    name: 'Nashville Metro',
    slug: 'nashville',
    state: 'Tennessee',
    state_code: 'TN',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 36.1627,
    longitude: -86.7816,
    radius: 35,
    population: 2012000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_charlotte',
    name: 'Charlotte Metro',
    slug: 'charlotte',
    state: 'North Carolina',
    state_code: 'NC',
    country: 'USA',
    timezone: 'America/New_York',
    latitude: 35.2271,
    longitude: -80.8431,
    radius: 35,
    population: 2700000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_tampa',
    name: 'Tampa Bay',
    slug: 'tampa',
    state: 'Florida',
    state_code: 'FL',
    country: 'USA',
    timezone: 'America/New_York',
    latitude: 27.9506,
    longitude: -82.4572,
    radius: 40,
    population: 3200000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_miami',
    name: 'Miami–Fort Lauderdale',
    slug: 'miami',
    state: 'Florida',
    state_code: 'FL',
    country: 'USA',
    timezone: 'America/New_York',
    latitude: 25.7617,
    longitude: -80.1918,
    radius: 40,
    population: 6138000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_orlando',
    name: 'Orlando Metro',
    slug: 'orlando',
    state: 'Florida',
    state_code: 'FL',
    country: 'USA',
    timezone: 'America/New_York',
    latitude: 28.5383,
    longitude: -81.3792,
    radius: 35,
    population: 2673000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_phoenix',
    name: 'Phoenix Metro',
    slug: 'phoenix',
    state: 'Arizona',
    state_code: 'AZ',
    country: 'USA',
    timezone: 'America/Phoenix',
    latitude: 33.4484,
    longitude: -112.074,
    radius: 45,
    population: 5015000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_denver',
    name: 'Denver Metro',
    slug: 'denver',
    state: 'Colorado',
    state_code: 'CO',
    country: 'USA',
    timezone: 'America/Denver',
    latitude: 39.7392,
    longitude: -104.9903,
    radius: 40,
    population: 2963000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_chicago',
    name: 'Chicago Metro',
    slug: 'chicago',
    state: 'Illinois',
    state_code: 'IL',
    country: 'USA',
    timezone: 'America/Chicago',
    latitude: 41.8781,
    longitude: -87.6298,
    radius: 45,
    population: 9400000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_newyork',
    name: 'New York City Metro',
    slug: 'new-york',
    state: 'New York',
    state_code: 'NY',
    country: 'USA',
    timezone: 'America/New_York',
    latitude: 40.7128,
    longitude: -74.006,
    radius: 40,
    population: 19500000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_losangeles',
    name: 'Los Angeles Metro',
    slug: 'los-angeles',
    state: 'California',
    state_code: 'CA',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    latitude: 34.0522,
    longitude: -118.2437,
    radius: 45,
    population: 12900000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'market_bayarea',
    name: 'San Francisco Bay Area',
    slug: 'san-francisco',
    state: 'California',
    state_code: 'CA',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 45,
    population: 7750000,
    status: 'PLANNED',
    launch_status: 'PLANNED',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  }
];

// ==========================================
// 2. SEEDED CITIES (MARKET -> CITY)
// ==========================================

export const SEEDED_CITIES: City[] = [
  // Texarkana Market Cities
  {
    id: 'city_txk_tx',
    market_id: 'market_texarkana',
    name: 'Texarkana, TX',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    latitude: 33.4251,
    longitude: -94.0477,
    population: 36500,
    status: 'ACTIVE'
  },
  {
    id: 'city_txk_ar',
    market_id: 'market_texarkana',
    name: 'Texarkana, AR',
    state: 'Arkansas',
    state_code: 'AR',
    country: 'USA',
    latitude: 33.4418,
    longitude: -94.0377,
    population: 29300,
    status: 'ACTIVE'
  },
  {
    id: 'city_nash_tx',
    market_id: 'market_texarkana',
    name: 'Nash, TX',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    latitude: 33.4432,
    longitude: -94.1299,
    population: 3800,
    status: 'ACTIVE'
  },
  {
    id: 'city_wake_village',
    market_id: 'market_texarkana',
    name: 'Wake Village, TX',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    latitude: 33.4237,
    longitude: -94.1032,
    population: 5400,
    status: 'ACTIVE'
  },

  // Dallas–Fort Worth Cities
  {
    id: 'city_dallas',
    market_id: 'market_dfw',
    name: 'Dallas, TX',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    latitude: 32.7767,
    longitude: -96.797,
    population: 1304000,
    status: 'ACTIVE'
  },
  {
    id: 'city_fort_worth',
    market_id: 'market_dfw',
    name: 'Fort Worth, TX',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    latitude: 32.7555,
    longitude: -97.3308,
    population: 935000,
    status: 'ACTIVE'
  },
  {
    id: 'city_arlington',
    market_id: 'market_dfw',
    name: 'Arlington, TX',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    latitude: 32.7357,
    longitude: -97.1081,
    population: 394000,
    status: 'ACTIVE'
  },

  // Houston Cities
  {
    id: 'city_houston',
    market_id: 'market_houston',
    name: 'Houston, TX',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    latitude: 29.7604,
    longitude: -95.3698,
    population: 2300000,
    status: 'ACTIVE'
  },

  // Little Rock Cities
  {
    id: 'city_littlerock',
    market_id: 'market_littlerock',
    name: 'Little Rock, AR',
    state: 'Arkansas',
    state_code: 'AR',
    country: 'USA',
    latitude: 34.7465,
    longitude: -92.2896,
    population: 202000,
    status: 'ACTIVE'
  },
  {
    id: 'city_north_littlerock',
    market_id: 'market_littlerock',
    name: 'North Little Rock, AR',
    state: 'Arkansas',
    state_code: 'AR',
    country: 'USA',
    latitude: 34.7695,
    longitude: -92.2679,
    population: 65000,
    status: 'ACTIVE'
  },

  // Shreveport Cities
  {
    id: 'city_shreveport',
    market_id: 'market_shreveport',
    name: 'Shreveport, LA',
    state: 'Louisiana',
    state_code: 'LA',
    country: 'USA',
    latitude: 32.5252,
    longitude: -93.7502,
    population: 187000,
    status: 'ACTIVE'
  },
  {
    id: 'city_bossier_city',
    market_id: 'market_shreveport',
    name: 'Bossier City, LA',
    state: 'Louisiana',
    state_code: 'LA',
    country: 'USA',
    latitude: 32.516,
    longitude: -93.7321,
    population: 63000,
    status: 'ACTIVE'
  },

  // Austin Cities
  {
    id: 'city_austin',
    market_id: 'market_austin',
    name: 'Austin, TX',
    state: 'Texas',
    state_code: 'TX',
    country: 'USA',
    latitude: 30.2672,
    longitude: -97.7431,
    population: 978000,
    status: 'ACTIVE'
  }
];

// ==========================================
// 3. AUTHENTIC TEXARKANA SPORTS VENUES
// Clearly labeled internally as DEMO_DATA
// ==========================================

export const TEXARKANA_SEEDED_VENUES: Venue[] = [
  {
    id: 'v_txk_hopkins',
    market_id: 'market_texarkana',
    city_id: 'city_txk_ar',
    isDemoData: true,
    name: 'Hopkins Icehouse',
    address: '301 E 3rd St',
    neighborhood: 'Downtown Texarkana',
    city: 'Texarkana',
    state: 'AR',
    latitude: 33.4244,
    longitude: -94.0416,
    phone: '(870) 774-3333',
    website: 'https://hopkinsicehouse.com',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    categories: ['Sports Bar', 'Gastropub', 'Historic Venue', 'Craft Beer'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Downtown Historic District',
      priceLevel: '$$',
      capacity: 180
    },
    venueTruth: {
      sports: {
        numTvs: 24,
        screenSizes: '24 high-definition displays, including 2 outdoor courtyard 85-inch 4K screens',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network', 'ESPN+', 'Big 12'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'Arkansas Razorbacks', 'Texas Longhorns']
      },
      environment: {
        energyBaseline: 88,
        noiseBaseline: 82,
        crowdBaseline: 85,
        socialOpenness: 90,
        seatingRatio: { bar: 35, tables: 45, standing: 20 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 84,
        casualRatio: 16,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '21-65, passionate local sports community'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Famous Hopkins Burgers', 'Gourmet Fries', 'Loaded Nachos'],
        drinkSpecials: ['Local Craft Beer Pints', 'Game Day Pitchers'],
        teamEvents: ['Razorbacks Game Day Headquarters', 'Cowboys Watch Group']
      }
    },
    atmosphere: ['LIVELY', 'AUTHENTIC', 'SOCIAL', 'COMMUNITY'],
    fanBases: [
      { team: 'Arkansas Razorbacks', sport: 'COLLEGE_FOOTBALL', strength: 95 },
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 92 },
      { team: 'Texas Longhorns', sport: 'COLLEGE_FOOTBALL', strength: 78 }
    ],
    features: ['Outdoor Courtyard', 'Sound On for Prime Games', 'Craft Beer', 'Family Welcomed']
  },
  {
    id: 'v_txk_fat_jacks',
    market_id: 'market_texarkana',
    city_id: 'city_txk_ar',
    isDemoData: true,
    name: "Fat Jack's Oyster and Sports Bar",
    address: '3324 N State Line Ave',
    neighborhood: 'State Line Commercial',
    city: 'Texarkana',
    state: 'AR',
    latitude: 33.4542,
    longitude: -94.0435,
    phone: '(870) 774-5225',
    website: 'https://fatjacksoysterbar.com',
    imageUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80',
    categories: ['Sports Bar', 'Oyster Bar', 'Live Music', 'Seafood'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'State Line Ave',
      priceLevel: '$$',
      capacity: 220
    },
    venueTruth: {
      sports: {
        numTvs: 28,
        screenSizes: '28 HDTVs surrounding the entire perimeter bar and main floor',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network', 'MLB Extra Innings'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'Arkansas Razorbacks', 'New Orleans Saints']
      },
      environment: {
        energyBaseline: 92,
        noiseBaseline: 86,
        crowdBaseline: 90,
        socialOpenness: 94,
        seatingRatio: { bar: 45, tables: 40, standing: 15 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 89,
        casualRatio: 11,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '21-60, high energy game watchers'
      },
      experience: {
        watchParties: true,
        liveDj: true,
        giveaways: true,
        foodSpecials: ['Gulf Coast Oysters', 'Crawfish Boil', 'Hot Wings'],
        drinkSpecials: ['Bucket Specials', 'Game Time Drafts'],
        teamEvents: ['Ark-La-Tex Football Headquarters']
      }
    },
    atmosphere: ['HIGH_ENERGY', 'ELECTRIC', 'ROWDY', 'SPORTS_HEAVY'],
    fanBases: [
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 95 },
      { team: 'Arkansas Razorbacks', sport: 'COLLEGE_FOOTBALL', strength: 92 },
      { team: 'Texas Rangers', sport: 'MLB', strength: 75 }
    ],
    features: ['Sound On', 'Full Bar', 'Late Night Kitchen', 'Patio']
  },
  {
    id: 'v_txk_bww',
    market_id: 'market_texarkana',
    city_id: 'city_txk_tx',
    isDemoData: true,
    name: 'Buffalo Wild Wings Texarkana',
    address: '4810 Texas Blvd',
    neighborhood: 'North Texas Blvd Corridor',
    city: 'Texarkana',
    state: 'TX',
    latitude: 33.4682,
    longitude: -94.0628,
    phone: '(903) 794-9464',
    website: 'https://buffalowildwings.com',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    categories: ['Sports Bar', 'Wings', 'Beer Hall', 'Family Friendly'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Texas Blvd',
      priceLevel: '$$',
      capacity: 310
    },
    venueTruth: {
      sports: {
        numTvs: 56,
        screenSizes: '56 screens including wall-to-wall 85-inch 4K commercial monitors & 3 projection walls',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'NBA League Pass', 'SEC Network', 'Big 12', 'ESPN+'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'Texas Longhorns', 'Arkansas Razorbacks', 'Texas A&M Aggies']
      },
      environment: {
        energyBaseline: 86,
        noiseBaseline: 80,
        crowdBaseline: 88,
        socialOpenness: 82,
        seatingRatio: { bar: 30, tables: 60, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 82,
        casualRatio: 18,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'All ages, families, fantasy leagues'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Traditional & Boneless Wings', 'Loaded Tots'],
        drinkSpecials: ['Draft Towers', 'All-Day Drink Specials'],
        teamEvents: ['NFL Sunday Headquarters', 'College Saturday Central']
      }
    },
    atmosphere: ['SPORTS_CENTRIC', 'FAMILY_FRIENDLY', 'LARGE_GROUPS'],
    fanBases: [
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 96 },
      { team: 'Texas Longhorns', sport: 'COLLEGE_FOOTBALL', strength: 88 },
      { team: 'Arkansas Razorbacks', sport: 'COLLEGE_FOOTBALL', strength: 85 }
    ],
    features: ['56 Screens', 'Audio Control', 'Full Menu', 'Draft Towers']
  },
  {
    id: 'v_txk_walk_ons',
    market_id: 'market_texarkana',
    city_id: 'city_txk_tx',
    isDemoData: true,
    name: "Walk-On's Sports Bistreaux",
    address: '5209 Texas Blvd',
    neighborhood: 'North Texas Blvd',
    city: 'Texarkana',
    state: 'TX',
    latitude: 33.4735,
    longitude: -94.0641,
    phone: '(903) 223-0100',
    website: 'https://walk-ons.com',
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80',
    categories: ['Sports Bistreaux', 'Louisiana Cuisine', 'Beer Bar'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'North Texas Blvd',
      priceLevel: '$$',
      capacity: 280
    },
    venueTruth: {
      sports: {
        numTvs: 64,
        screenSizes: '64 Ultra-HD displays positioned for 360-degree viewing from any seat',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network', 'ACC Network', 'Big 12'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'New Orleans Saints', 'LSU Tigers', 'Arkansas Razorbacks']
      },
      environment: {
        energyBaseline: 89,
        noiseBaseline: 84,
        crowdBaseline: 87,
        socialOpenness: 86,
        seatingRatio: { bar: 35, tables: 55, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 86,
        casualRatio: 14,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '21-55, foodies & passionate sports fans'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Bistreaux Sliders', 'Cajun Ribeye', 'Voodoo Shrimp'],
        drinkSpecials: ['Signature Cocktails', 'Local Draft Flight'],
        teamEvents: ['SEC Game Day Experience']
      }
    },
    atmosphere: ['UPSCALE_SPORTS', 'VIBRANT', 'GOURMET_BAR_FOOD'],
    fanBases: [
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 90 },
      { team: 'Arkansas Razorbacks', sport: 'COLLEGE_FOOTBALL', strength: 86 },
      { team: 'LSU Tigers', sport: 'COLLEGE_FOOTBALL', strength: 82 }
    ],
    features: ['64 4K TVs', 'Scratch Kitchen', 'Cocktails', 'Patio']
  },
  {
    id: 'v_txk_gusanos',
    market_id: 'market_texarkana',
    city_id: 'city_txk_tx',
    isDemoData: true,
    name: "Gusano's Chicago-Style Pizzeria",
    address: '2820 Richmond Rd',
    neighborhood: 'Richmond Road Retail',
    city: 'Texarkana',
    state: 'TX',
    latitude: 33.4476,
    longitude: -94.0782,
    phone: '(903) 792-8646',
    website: 'https://gusanospizza.com',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    categories: ['Pizzeria', 'Sports Bar', 'Craft Beer'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Richmond Rd',
      priceLevel: '$$',
      capacity: 190
    },
    venueTruth: {
      sports: {
        numTvs: 32,
        screenSizes: '32 HDTV screens along the bar and dining areas',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network', 'MLB Extra Innings'],
        blackoutRestrictions: [],
        teamAffiliations: ['Arkansas Razorbacks', 'Dallas Cowboys', 'Chicago Cubs']
      },
      environment: {
        energyBaseline: 84,
        noiseBaseline: 78,
        crowdBaseline: 82,
        socialOpenness: 88,
        seatingRatio: { bar: 30, tables: 60, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 80,
        casualRatio: 20,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'Families, alumni groups, sports fans'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Chicago Deep Dish Special', 'Garlic Breadsticks'],
        drinkSpecials: ['Craft Beer Pints', 'Game Day Pitchers'],
        teamEvents: ['Arkansas Razorbacks Watch Parties']
      }
    },
    atmosphere: ['COMFORTABLE', 'CASUAL', 'GREAT_FOOD'],
    fanBases: [
      { team: 'Arkansas Razorbacks', sport: 'COLLEGE_FOOTBALL', strength: 94 },
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 85 }
    ],
    features: ['Deep Dish Pizza', 'Full Bar', 'Family Friendly', 'Projection Wall']
  },
  {
    id: 'v_txk_silver_star',
    market_id: 'market_texarkana',
    city_id: 'city_txk_tx',
    isDemoData: true,
    name: 'Silver Star Smokehouse & Sports Bar',
    address: '5205 Texas Blvd',
    neighborhood: 'North Texas Blvd',
    city: 'Texarkana',
    state: 'TX',
    latitude: 33.4731,
    longitude: -94.0638,
    phone: '(903) 306-0778',
    website: 'https://silverstarsmokehouse.com',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    categories: ['Texas Barbecue', 'Sports Lounge', 'Patio Pavilion'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Texas Blvd',
      priceLevel: '$$',
      capacity: 250
    },
    venueTruth: {
      sports: {
        numTvs: 36,
        screenSizes: '36 screens including covered pavilion giant screen',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network', 'Big 12'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'Texas Longhorns', 'Texas A&M Aggies']
      },
      environment: {
        energyBaseline: 85,
        noiseBaseline: 76,
        crowdBaseline: 86,
        socialOpenness: 89,
        seatingRatio: { bar: 25, tables: 65, standing: 10 },
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
        typicalCrowdAge: 'Texas BBQ lovers, Cowboys fans, alumni'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: true,
        foodSpecials: ['Prime Smoked Brisket', 'Rib Combos', 'Loaded Queso'],
        drinkSpecials: ['Texas Bourbons', 'Shiner Bock Pitchers'],
        teamEvents: ['Dallas Cowboys Tailgate On The Patio']
      }
    },
    atmosphere: ['TEXAS_AUTHENTIC', 'WARM', 'PATIO_HEAVY'],
    fanBases: [
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 96 },
      { team: 'Texas Longhorns', sport: 'COLLEGE_FOOTBALL', strength: 90 }
    ],
    features: ['Award-Winning BBQ', 'Covered Sports Pavilion', 'Giant Screen']
  },
  {
    id: 'v_txk_twisted_fork',
    market_id: 'market_texarkana',
    city_id: 'city_txk_tx',
    isDemoData: true,
    name: 'Twisted Fork Grill & Sports Lounge',
    address: '5522 Cowhorn Creek Rd',
    neighborhood: 'Cowhorn Creek Business Park',
    city: 'Texarkana',
    state: 'TX',
    latitude: 33.4567,
    longitude: -94.0921,
    phone: '(903) 255-7809',
    website: 'https://twistedforktxk.com',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    categories: ['Sports Lounge', 'American Grill', 'Craft Cocktails'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Cowhorn Creek',
      priceLevel: '$$$',
      capacity: 160
    },
    venueTruth: {
      sports: {
        numTvs: 18,
        screenSizes: '18 high-end 75-inch 4K panels in dedicated sports lounge',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network', 'NBA League Pass'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys', 'Texas Longhorns', 'Dallas Mavericks']
      },
      environment: {
        energyBaseline: 78,
        noiseBaseline: 72,
        crowdBaseline: 79,
        socialOpenness: 84,
        seatingRatio: { bar: 35, tables: 55, standing: 10 },
        hasPatio: true,
        patioTvs: false,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 74,
        casualRatio: 26,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '28-60, young professionals, business crowd'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Ahi Tuna Bites', 'Gourmet Sliders', 'Artisan Flatbreads'],
        drinkSpecials: ['Smoked Old Fashioneds', 'Wine Specials'],
        teamEvents: ['Prime Thursday Night Football Lounge']
      }
    },
    atmosphere: ['UPSCALE', 'REFINED_SPORTS', 'GREAT_COCKTAILS'],
    fanBases: [
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 88 },
      { team: 'Texas Longhorns', sport: 'COLLEGE_FOOTBALL', strength: 82 }
    ],
    features: ['Upscale Atmosphere', 'Premium Sound', 'Craft Cocktails']
  },
  {
    id: 'v_txk_pops_place',
    market_id: 'market_texarkana',
    city_id: 'city_txk_ar',
    isDemoData: true,
    name: "Pop's Place",
    address: '6701 E 9th St',
    neighborhood: 'East Texarkana',
    city: 'Texarkana',
    state: 'AR',
    latitude: 33.4312,
    longitude: -93.9782,
    phone: '(870) 773-1002',
    website: 'https://popsplacetxk.com',
    imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80',
    categories: ['Southern Steakhouse', 'Casual Sports Bar', 'Local Legend'],
    claimed: false,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'East Side',
      priceLevel: '$$',
      capacity: 140
    },
    venueTruth: {
      sports: {
        numTvs: 14,
        screenSizes: '14 flat screens over main bar and back dining room',
        hasProjector: false,
        gameAudio: false,
        multipleGamesSimultaneous: true,
        sportsPackages: ['SEC Network', 'Local Feeds'],
        blackoutRestrictions: [],
        teamAffiliations: ['Arkansas Razorbacks']
      },
      environment: {
        energyBaseline: 75,
        noiseBaseline: 70,
        crowdBaseline: 76,
        socialOpenness: 86,
        seatingRatio: { bar: 20, tables: 75, standing: 5 },
        hasPatio: false,
        patioTvs: false,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 80,
        casualRatio: 20,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'Local regulars, families, old-school Arkansans'
      },
      experience: {
        watchParties: false,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Catfish Platters', 'Hand-Cut Ribeye'],
        drinkSpecials: ['Domestic Cold Cans'],
        teamEvents: []
      }
    },
    atmosphere: ['HOMESTYLE', 'RUSTIC', 'FRIENDLY'],
    fanBases: [
      { team: 'Arkansas Razorbacks', sport: 'COLLEGE_FOOTBALL', strength: 95 }
    ],
    features: ['Legendary Steaks', 'Fried Catfish', 'Neighborhood Charm']
  },
  {
    id: 'v_txk_arrow_bar',
    market_id: 'market_texarkana',
    city_id: 'city_txk_ar',
    isDemoData: true,
    name: 'The Arrow Bar',
    address: '109 E 3rd St',
    neighborhood: 'Downtown Historic District',
    city: 'Texarkana',
    state: 'AR',
    latitude: 33.4241,
    longitude: -94.0431,
    phone: '(870) 216-1188',
    website: 'https://thearrowbar.com',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    categories: ['Cocktail & Sports Bar', 'Historic Downtown', 'Nightlife'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Downtown',
      priceLevel: '$$',
      capacity: 120
    },
    venueTruth: {
      sports: {
        numTvs: 12,
        screenSizes: '12 high-definition flat screens tuned to live games',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network'],
        blackoutRestrictions: [],
        teamAffiliations: ['Arkansas Razorbacks', 'Dallas Cowboys']
      },
      environment: {
        energyBaseline: 86,
        noiseBaseline: 80,
        crowdBaseline: 84,
        socialOpenness: 92,
        seatingRatio: { bar: 50, tables: 35, standing: 15 },
        hasPatio: false,
        patioTvs: false,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 82,
        casualRatio: 18,
        familyFriendly: false,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: '21-45, downtown locals and alumni'
      },
      experience: {
        watchParties: true,
        liveDj: true,
        giveaways: false,
        foodSpecials: ['Artisan Bar Bites', 'Loaded Sliders'],
        drinkSpecials: ['Classic Drafts', 'Late Night Game Cocktails'],
        teamEvents: ['Saturday Razorbacks Watch Session']
      }
    },
    atmosphere: ['HISTORIC', 'COOL', 'LIVELY'],
    fanBases: [
      { team: 'Arkansas Razorbacks', sport: 'COLLEGE_FOOTBALL', strength: 90 },
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 84 }
    ],
    features: ['Historic Ambience', 'Craft Cocktails', 'Game Sound On']
  },
  {
    id: 'v_txk_pecan_point',
    market_id: 'market_texarkana',
    city_id: 'city_txk_tx',
    isDemoData: true,
    name: 'Pecan Point Brewing',
    address: '214 Main St',
    neighborhood: 'Downtown Texarkana',
    city: 'Texarkana',
    state: 'TX',
    latitude: 33.4232,
    longitude: -94.0458,
    phone: '(903) 306-0661',
    website: 'https://pecanpointbrewing.com',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    categories: ['Brewery', 'Craft Beer', 'Sports Viewing', 'Bistro'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Downtown TX',
      priceLevel: '$$',
      capacity: 170
    },
    venueTruth: {
      sports: {
        numTvs: 16,
        screenSizes: '16 screens positioned across brewhouse taproom',
        hasProjector: true,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['ESPN+', 'SEC Network', 'Big 12'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas Longhorns', 'Arkansas Razorbacks']
      },
      environment: {
        energyBaseline: 82,
        noiseBaseline: 74,
        crowdBaseline: 80,
        socialOpenness: 90,
        seatingRatio: { bar: 30, tables: 60, standing: 10 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: true
      },
      audience: {
        hardcoreFanRatio: 78,
        casualRatio: 22,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'Craft beer enthusiasts, alumni, families'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Beer-Braised Bratwurst', 'Spent Grain Pizzas'],
        drinkSpecials: ['Freshly Brewed House Pints', 'Game Flight Specials'],
        teamEvents: ['Local Game Day Craft Sessions']
      }
    },
    atmosphere: ['ARTISAN', 'RELAXED', 'COMMUNITY'],
    fanBases: [
      { team: 'Texas Longhorns', sport: 'COLLEGE_FOOTBALL', strength: 88 },
      { team: 'Arkansas Razorbacks', sport: 'COLLEGE_FOOTBALL', strength: 84 }
    ],
    features: ['House Brewed Beer', 'Outdoor Deck', 'Pet Friendly']
  },
  {
    id: 'v_txk_applebees',
    market_id: 'market_texarkana',
    city_id: 'city_txk_tx',
    isDemoData: true,
    name: "Applebee's Grill + Bar Texarkana",
    address: '2800 Richmond Rd',
    neighborhood: 'Richmond Road Retail',
    city: 'Texarkana',
    state: 'TX',
    latitude: 33.4471,
    longitude: -94.0778,
    phone: '(903) 838-8900',
    website: 'https://applebees.com',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    categories: ['Casual Dining', 'Bar & Grill', 'Late Night Sports'],
    claimed: false,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Richmond Rd',
      priceLevel: '$$',
      capacity: 200
    },
    venueTruth: {
      sports: {
        numTvs: 22,
        screenSizes: '22 flat panels mounted in center bar island',
        hasProjector: false,
        gameAudio: false,
        multipleGamesSimultaneous: true,
        sportsPackages: ['NFL Sunday Ticket', 'SEC Network'],
        blackoutRestrictions: [],
        teamAffiliations: ['Dallas Cowboys']
      },
      environment: {
        energyBaseline: 76,
        noiseBaseline: 72,
        crowdBaseline: 78,
        socialOpenness: 80,
        seatingRatio: { bar: 25, tables: 70, standing: 5 },
        hasPatio: false,
        patioTvs: false,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 72,
        casualRatio: 28,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'Families, late night crowd'
      },
      experience: {
        watchParties: false,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Half-Price Late Night Appetizers'],
        drinkSpecials: ['Dollaritas', 'Draft Specials'],
        teamEvents: []
      }
    },
    atmosphere: ['CASUAL', 'FAMILIAR', 'CONVENIENT'],
    fanBases: [
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 80 }
    ],
    features: ['Late Night Hours', 'Bar Seating', 'Appetizer Specials']
  },
  {
    id: 'v_txk_30_burger',
    market_id: 'market_texarkana',
    city_id: 'city_txk_tx',
    isDemoData: true,
    name: '30 Burger & Sports Bar',
    address: '4116 Gibson Ln',
    neighborhood: 'Gibson Lane Business Park',
    city: 'Texarkana',
    state: 'TX',
    latitude: 33.4503,
    longitude: -94.0845,
    phone: '(903) 791-0300',
    website: 'https://30burger.com',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    categories: ['Gourmet Burgers', 'Sports Bar', 'Family Dining'],
    claimed: true,
    baseline: {
      category: 'Sports Bar',
      neighborhood: 'Gibson Ln',
      priceLevel: '$$',
      capacity: 150
    },
    venueTruth: {
      sports: {
        numTvs: 18,
        screenSizes: '18 high-resolution displays surrounding dining area and bar',
        hasProjector: false,
        gameAudio: true,
        multipleGamesSimultaneous: true,
        sportsPackages: ['SEC Network', 'NFL Sunday Ticket'],
        blackoutRestrictions: [],
        teamAffiliations: ['Texas A&M Aggies', 'Dallas Cowboys', 'Texas Rangers']
      },
      environment: {
        energyBaseline: 80,
        noiseBaseline: 74,
        crowdBaseline: 82,
        socialOpenness: 86,
        seatingRatio: { bar: 25, tables: 70, standing: 5 },
        hasPatio: true,
        patioTvs: true,
        dogFriendly: false
      },
      audience: {
        hardcoreFanRatio: 79,
        casualRatio: 21,
        familyFriendly: true,
        groupFriendly: true,
        soloFriendly: true,
        typicalCrowdAge: 'Burgers & sports enthusiasts of all ages'
      },
      experience: {
        watchParties: true,
        liveDj: false,
        giveaways: false,
        foodSpecials: ['Signature Angus Burgers', 'Truffle Fries'],
        drinkSpecials: ['Local Drafts', 'Milkshakes & Floats'],
        teamEvents: ['Aggies Game Day Hub']
      }
    },
    atmosphere: ['CASUAL', 'FAMILY_FRIENDLY', 'BURGER_CENTRIC'],
    fanBases: [
      { team: 'Texas A&M Aggies', sport: 'COLLEGE_FOOTBALL', strength: 86 },
      { team: 'Dallas Cowboys', sport: 'NFL', strength: 85 }
    ],
    features: ['Gourmet Burgers', 'Outdoor Patio', 'Kid Friendly']
  }
];
