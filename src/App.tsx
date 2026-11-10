import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { HomeScreen } from './components/HomeScreen';
import { LiveScreen } from './components/LiveScreen';
import { MapScreen } from './components/MapScreen';
import { SearchScreen } from './components/SearchScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { VenueDetailModal } from './components/VenueDetailModal';
import { VenueDashboard } from './components/business/VenueDashboard';
import { AdminModerationPanel } from './components/business/AdminModerationPanel';

// Auth & Onboarding Components
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { SignUpScreen } from './components/auth/SignUpScreen';
import { SignInScreen } from './components/auth/SignInScreen';
import { PasswordResetScreen } from './components/auth/PasswordResetScreen';
import { EmailVerificationScreen } from './components/auth/EmailVerificationScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';

import {
  Venue,
  VenueLiveState,
  UserIntent,
  SportsGame,
  VenueSignal,
  Presence,
  RallyMatchResult,
  Market
} from './types';
import { SEEDED_VENUES, SEEDED_VENUE_GAMES } from './data/seedData';
import { rankVenues, computeRallyMatch } from './services/rallyMatchEngine';
import { signalEngine } from './services/signalEngine';
import { sportsProvider, sportsService } from './services/sportsProvider';
import { marketService } from './services/marketService';
import { getVenues, getVenueGameProgramming, getFavoriteVenueIds, toggleVenueFavorite } from './services/venueService';
import { sortGamesByFavorites, isFavoriteTeamGame } from './services/teamPreferenceService';

type AuthView = 'WELCOME' | 'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD';

function RallyOnMain() {
  const { currentUser, authState, updateUser } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('WELCOME');

  const [currentTab, setCurrentTab] = useState<NavTab>('HOME');
  const [activeMarket, setActiveMarket] = useState<Market>(() =>
    marketService.getActiveMarket()
  );
  const [currentCity, setCurrentCity] = useState(
    marketService.getActiveMarket().name
  );

  // Intent defaults to user preference or HIGH_ENERGY
  const [currentIntent, setCurrentIntent] = useState<UserIntent>(() => {
    if (currentUser?.preferredExperience && currentUser.preferredExperience.length > 0) {
      return currentUser.preferredExperience[0];
    }
    return 'HIGH_ENERGY';
  });

  const [selectedGame, setSelectedGame] = useState<SportsGame | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [activeVenueDashboardId, setActiveVenueDashboardId] = useState<string | null>(null);
  const [showAdminModeration, setShowAdminModeration] = useState<boolean>(false);
  const [savedVenueIds, setSavedVenueIds] = useState<string[]>([
    'venue_bufords',
    'venue_cover3',
    'venue_haymaker'
  ]);

  // Real-time signal engine states
  const [liveStates, setLiveStates] = useState<Record<string, VenueLiveState>>(() =>
    signalEngine.getLiveStates()
  );
  const [signals, setSignals] = useState<VenueSignal[]>(() => signalEngine.getSignals());
  const [presences, setPresences] = useState<Presence[]>(() => signalEngine.getPresences());
  const [isSimulating, setIsSimulating] = useState<boolean>(signalEngine.isSimulating);

  // Sports provider games
  const [games, setGames] = useState<SportsGame[]>([]);
  const [dbVenues, setDbVenues] = useState<Venue[] | null>(null);
  const [dbVenueGames, setDbVenueGames] = useState<VenueGame[]>([]);

  // Load Supabase venue data; keep seeded data as a safe fallback while the database is empty.
  useEffect(() => {
    let mounted = true;
    Promise.all([getVenues(), getVenueGameProgramming()])
      .then(([venues, programming]) => {
        if (!mounted) return;
        setDbVenues(venues.length ? venues : null);
        setDbVenueGames(programming.map((p) => ({
          venueId: p.venue_id,
          gameId: p.game_id,
          confidence: p.confidence,
          verificationStatus: p.status === 'GAME_ON' ? 'GAME_ON' : p.status === 'CONFIRMED' ? 'LIKELY' : 'NOT_CONFIRMED',
          audioConfirmed: p.audio_on,
          screenAllocations: p.screen,
          lastVerifiedAt: p.verified_at || p.updated_at
        })));
      })
      .catch((error) => console.warn('Supabase venue data unavailable; using seeded data.', error));
    return () => { mounted = false; };
  }, []);

  // Load saved venues from Supabase when authenticated.
  useEffect(() => {
    if (!currentUser?.id || currentUser.id.startsWith('usr_')) return;
    getFavoriteVenueIds(currentUser.id)
      .then((ids) => { if (ids.length) setSavedVenueIds(ids); })
      .catch((error) => console.warn('Supabase favorites unavailable; using profile favorites.', error));
  }, [currentUser?.id]);

  // Subscribe to marketService for active market changes
  useEffect(() => {
    const unsub = marketService.subscribe(() => {
      const current = marketService.getActiveMarket();
      setActiveMarket(current);
      setCurrentCity(current.name);
    });
    return unsub;
  }, []);

  // Filter venues for active market ecosystem (Market -> City -> Venue)
  const marketVenues = useMemo(() => {
    const sourceVenues = dbVenues || SEEDED_VENUES;
    const filtered = marketService.filterVenuesByMarket(
      sourceVenues,
      activeMarket.id
    );
    return filtered.length > 0 ? filtered : SEEDED_VENUES;
  }, [activeMarket.id]);

  // User coordinate (from user model or default to active market center)
  const userLocation = useMemo(() => {
    if (currentUser?.latitude && currentUser?.longitude) {
      return { lat: currentUser.latitude, lon: currentUser.longitude };
    }
    return { lat: activeMarket.latitude, lon: activeMarket.longitude };
  }, [currentUser?.latitude, currentUser?.longitude, activeMarket]);

  // Load sports games on mount & subscribe to provider updates
  useEffect(() => {
    let mounted = true;
    const fetchGames = async () => {
      const data = await sportsService.getGames();
      if (mounted) {
        setGames(data);
        setSelectedGame((currentSelected) => {
          if (!currentSelected) {
            // Prioritize favorite team's live/upcoming game when logged in!
            if (currentUser?.favoriteTeams && currentUser.favoriteTeams.length > 0) {
              const favLive = data.find(
                (g) =>
                  (g.status === 'LIVE' || g.status === 'HALFTIME') &&
                  isFavoriteTeamGame(g, currentUser.favoriteTeams).isFavorite
              );
              if (favLive) return favLive;

              const favAny = data.find(
                (g) => isFavoriteTeamGame(g, currentUser.favoriteTeams).isFavorite
              );
              if (favAny) return favAny;
            }
            return data.find((g) => g.status === 'LIVE') || data[0] || null;
          }
          return data.find((g) => g.id === currentSelected.id) || currentSelected;
        });
      }
    };

    fetchGames();
    const unsubscribe = sportsService.subscribe(fetchGames);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [currentUser?.favoriteTeams]);

  // If user logs in with favorite teams or updates them, auto-focus their team's game if not already focused on one
  useEffect(() => {
    if (currentUser?.favoriteTeams && currentUser.favoriteTeams.length > 0 && games.length > 0) {
      const favGame = games.find(
        (g) => isFavoriteTeamGame(g, currentUser.favoriteTeams).isFavorite
      );
      if (favGame && (!selectedGame || !isFavoriteTeamGame(selectedGame, currentUser.favoriteTeams).isFavorite)) {
        setSelectedGame(favGame);
      }
    }
  }, [currentUser?.favoriteTeams, games]);

  // Subscribe to real-time signal engine updates
  useEffect(() => {
    const unsubscribe = signalEngine.subscribe(() => {
      setLiveStates(signalEngine.getLiveStates());
      setSignals(signalEngine.getSignals());
      setPresences(signalEngine.getPresences());
      setIsSimulating(signalEngine.isSimulating);
    });
    return unsubscribe;
  }, []);

  // Sync current city if user has homeCity
  useEffect(() => {
    if (currentUser?.homeCity && currentUser?.homeState) {
      setCurrentCity(`${currentUser.homeCity}, ${currentUser.homeState}`);
    }
  }, [currentUser?.homeCity, currentUser?.homeState]);

  // Toggle saving venue
  const handleToggleSave = (venueId: string) => {
    const wasSaved = savedVenueIds.includes(venueId);
    setSavedVenueIds((prev) => wasSaved ? prev.filter((id) => id !== venueId) : [...prev, venueId]);
    if (currentUser?.id && !currentUser.id.startsWith('usr_')) {
      void toggleVenueFavorite(currentUser.id, venueId, wasSaved).catch((error) => {
        console.warn('Unable to persist venue favorite.', error);
      });
    }
  };

  // Convert user's favorite teams to string names for match scoring
  const favoriteTeamNames = useMemo(() => {
    return (currentUser?.favoriteTeams || []).map((t) => t.name);
  }, [currentUser?.favoriteTeams]);

  // Sort games putting user's favorite teams first!
  const sortedGames = useMemo(() => {
    return sortGamesByFavorites(games, currentUser?.favoriteTeams);
  }, [games, currentUser?.favoriteTeams]);

  // Dynamically ranked venues based on current intent, active game, live signals, and user team preferences!
  const rankedVenues: RallyMatchResult[] = useMemo(() => {
    return rankVenues(marketVenues, liveStates, {
      intent: currentIntent,
      selectedGame,
      venueGames: dbVenueGames.length ? dbVenueGames : SEEDED_VENUE_GAMES,
      presenceList: presences,
      userLocation: { latitude: userLocation.lat, longitude: userLocation.lon },
      userFavoriteTeams: favoriteTeamNames,
      userFavoriteSports: currentUser?.favoriteSports
    });
  }, [marketVenues, currentIntent, liveStates, selectedGame, presences, userLocation, favoriteTeamNames, currentUser?.favoriteSports]);

  // When a venue is open in modal, compute its specific match result
  const selectedVenueMatch = useMemo(() => {
    if (!selectedVenue) return null;
    const live = liveStates[selectedVenue.id] || {
      venueId: selectedVenue.id,
      crowd: 70,
      energy: 70,
      noise: 70,
      social: 70,
      seatingAvailability: 30,
      currentStatus: 'LIVE',
      trendingVelocity: 10,
      lastUpdated: new Date().toISOString()
    };
    return computeRallyMatch(selectedVenue, live, {
      intent: currentIntent,
      selectedGame,
      venueGames: dbVenueGames.length ? dbVenueGames : SEEDED_VENUE_GAMES,
      presenceList: presences,
      userLocation: { latitude: userLocation.lat, longitude: userLocation.lon },
      userFavoriteTeams: favoriteTeamNames,
      userFavoriteSports: currentUser?.favoriteSports
    });
  }, [selectedVenue, currentIntent, liveStates, selectedGame, presences, userLocation, favoriteTeamNames, currentUser?.favoriteSports]);

  const selectedVenueGame = useMemo(() => {
    if (!selectedVenue || !selectedGame) return undefined;
    return SEEDED_VENUE_GAMES.find(
      (vg) => vg.venueId === selectedVenue.id && vg.gameId === selectedGame.id
    );
  }, [selectedVenue, selectedGame]);

  const selectedVenueFriends = useMemo(() => {
    if (!selectedVenue) return [];
    return presences.filter((p) => p.venueId === selectedVenue.id);
  }, [selectedVenue, presences]);

  // ==========================================
  // PROTECTED ROUTING RULES (Section 3)
  // ==========================================

  // 1. Logged Out State: Render Welcome / Auth Screens
  if (authState === 'LOGGED_OUT' || !currentUser) {
    if (authView === 'SIGN_UP') {
      return (
        <SignUpScreen
          onBack={() => setAuthView('WELCOME')}
          onGoToSignIn={() => setAuthView('SIGN_IN')}
        />
      );
    }
    if (authView === 'SIGN_IN') {
      return (
        <SignInScreen
          onBack={() => setAuthView('WELCOME')}
          onGoToSignUp={() => setAuthView('SIGN_UP')}
          onGoToForgotPassword={() => setAuthView('FORGOT_PASSWORD')}
        />
      );
    }
    if (authView === 'FORGOT_PASSWORD') {
      return <PasswordResetScreen onBackToSignIn={() => setAuthView('SIGN_IN')} />;
    }
    return (
      <WelcomeScreen
        onGoToSignUp={() => setAuthView('SIGN_UP')}
        onGoToSignIn={() => setAuthView('SIGN_IN')}
      />
    );
  }

  // 2. Email Verification Required
  if (authState === 'EMAIL_VERIFICATION_REQUIRED') {
    return <EmailVerificationScreen />;
  }

  // 3. Authenticated but Onboarding Incomplete: Route directly to Onboarding
  if (authState === 'AUTHENTICATED_ONBOARDING_INCOMPLETE' || !currentUser.onboardingCompleted) {
    return <OnboardingFlow />;
  }

  // 4. Venue Business Dashboard Mode
  if (activeVenueDashboardId) {
    return (
      <VenueDashboard
        venueId={activeVenueDashboardId}
        onBack={() => setActiveVenueDashboardId(null)}
      />
    );
  }

  // 5. Admin Moderation & Integrity Panel
  if (showAdminModeration) {
    return (
      <AdminModerationPanel
        onBack={() => setShowAdminModeration(false)}
      />
    );
  }

  // 6. Authenticated & Onboarded: Render Main RallyOn Experience
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <Header
        currentCity={currentCity}
        onCityChange={setCurrentCity}
        isSimulating={isSimulating}
        onToggleSimulation={() => signalEngine.toggleSimulation()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-3 pb-20">
        {currentTab === 'HOME' && (
          <HomeScreen
            games={sortedGames}
            selectedGame={selectedGame}
            onSelectGame={setSelectedGame}
            currentIntent={currentIntent}
            onSelectIntent={setCurrentIntent}
            rankedVenues={rankedVenues}
            savedVenueIds={savedVenueIds}
            onToggleSave={handleToggleSave}
            onSelectVenue={setSelectedVenue}
            onOpenLiveFeed={() => setCurrentTab('LIVE')}
            currentUser={currentUser}
            favoriteTeams={currentUser?.favoriteTeams || []}
            onUpdateFavoriteTeams={(newTeams) => updateUser({ favoriteTeams: newTeams })}
          />
        )}

        {currentTab === 'LIVE' && (
          <LiveScreen
            games={sortedGames}
            signals={signals}
            venues={marketVenues}
            liveStates={liveStates}
            venueGames={SEEDED_VENUE_GAMES}
            onSelectGame={(game) => {
              setSelectedGame(game);
              setCurrentTab('HOME');
            }}
            onSelectVenue={setSelectedVenue}
            favoriteTeams={currentUser?.favoriteTeams || []}
          />
        )}

        {currentTab === 'MAP' && (
          <MapScreen
            venues={marketVenues}
            liveStates={liveStates}
            matchResults={rankedVenues}
            games={sortedGames}
            selectedGame={selectedGame}
            onSelectGame={setSelectedGame}
            currentIntent={currentIntent}
            onSelectIntent={setCurrentIntent}
            venueGames={SEEDED_VENUE_GAMES}
            presences={presences}
            savedVenueIds={savedVenueIds}
            onToggleSave={handleToggleSave}
            onSelectVenue={setSelectedVenue}
          />
        )}

        {currentTab === 'SEARCH' && (
          <SearchScreen
            venues={marketVenues}
            games={sortedGames}
            liveStates={liveStates}
            onSelectVenue={setSelectedVenue}
            onSelectGame={(game) => {
              setSelectedGame(game);
              setCurrentTab('HOME');
            }}
            favoriteTeams={currentUser?.favoriteTeams || []}
          />
        )}

        {currentTab === 'PROFILE' && (
          <ProfileScreen
            venues={marketVenues}
            savedVenueIds={savedVenueIds}
            presences={presences}
            onSelectVenue={setSelectedVenue}
            isSimulating={isSimulating}
            onToggleSimulation={() => signalEngine.toggleSimulation()}
            onOpenVenueDashboard={(venueId) => setActiveVenueDashboardId(venueId)}
            onOpenAdminModeration={() => setShowAdminModeration(true)}
          />
        )}
      </main>

      {/* Full-bleed Venue Detail Modal */}
      {selectedVenue && selectedVenueMatch && (
        <VenueDetailModal
          venue={selectedVenue}
          liveState={
            liveStates[selectedVenue.id] || {
              venueId: selectedVenue.id,
              crowd: 70,
              energy: 70,
              noise: 70,
              social: 70,
              seatingAvailability: 30,
              currentStatus: 'LIVE',
              trendingVelocity: 10,
              lastUpdated: new Date().toISOString()
            }
          }
          matchResult={selectedVenueMatch}
          currentIntent={currentIntent}
          activeGame={selectedGame}
          venueGame={selectedVenueGame}
          friendsInside={selectedVenueFriends}
          isSaved={savedVenueIds.includes(selectedVenue.id)}
          onToggleSave={handleToggleSave}
          onClose={() => setSelectedVenue(null)}
          onOpenDashboard={(venueId) => {
            setSelectedVenue(null);
            setActiveVenueDashboardId(venueId);
          }}
          onCheckInSuccess={() => {
            // refresh
          }}
        />
      )}

      {/* Bottom Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        liveBadgeCount={games.filter((g) => g.status === 'LIVE').length}
        friendActivityCount={presences.length}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RallyOnMain />
    </AuthProvider>
  );
}
