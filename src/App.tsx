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
  VenueGame,
  RallyMatchResult,
  Market
} from './types';
import { SEEDED_VENUES, SEEDED_VENUE_GAMES } from './data/seedData';
import { isDemoMode } from './config/dataMode';
import { rankVenues, computeRallyMatch } from './services/rallyMatchEngine';
import { signalEngine } from './services/signalEngine';
import { sportsProvider, sportsService } from './services/sportsProvider';
import { marketService } from './services/marketService';
import { getVenues, getVenueGameProgramming, getFavoriteVenueIds, toggleVenueFavorite } from './services/venueService';
import { getStoredGames } from './services/gameService';
import { sortGamesByFavorites, isFavoriteTeamGame } from './services/teamPreferenceService';
import { requestUserLocation } from './services/locationService';

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
  const [savedVenueIds, setSavedVenueIds] = useState<string[]>(() =>
    isDemoMode ? ['venue_bufords', 'venue_cover3', 'venue_haymaker'] : []
  );

  // Real-time signal engine states
  const [liveStates, setLiveStates] = useState<Record<string, VenueLiveState>>(() =>
    signalEngine.getLiveStates()
  );
  const [signals, setSignals] = useState<VenueSignal[]>(() => signalEngine.getSignals());
  const [presences, setPresences] = useState<Presence[]>(() => signalEngine.getPresences());
  const [isSimulating, setIsSimulating] = useState<boolean>(signalEngine.isSimulating);

  // Sports provider games
  const [games, setGames] = useState<SportsGame[]>([]);
  const [dbVenues, setDbVenues] = useState<Venue[] | null>(() => isDemoMode ? null : []);
  const [dbVenueGames, setDbVenueGames] = useState<VenueGame[]>([]);
  const [detectedLocation, setDetectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'GRANTED' | 'DENIED' | 'PROMPT'>('PROMPT');

  // Automatically request location once the authenticated app is ready. This is
  // browser permission based; RallyOn does not continuously track the user.
  useEffect(() => {
    if (isDemoMode || authState !== 'AUTHENTICATED_ONBOARDING_COMPLETE') return;

    let mounted = true;
    requestUserLocation()
      .then(({ location, permission }) => {
        if (!mounted) return;
        setDetectedLocation({ latitude: location.latitude, longitude: location.longitude });
        setLocationPermission(permission);
        const resolvedMarket = marketService.detectMarketFromCoordinates(
          location.latitude,
          location.longitude
        );
        marketService.setActiveMarket(resolvedMarket.market.id);
      })
      .catch((error: any) => {
        if (!mounted) return;
        setLocationPermission(error?.permission || 'PROMPT');
      });

    return () => { mounted = false; };
  }, [authState]);

  // Load authoritative Supabase venue data. Empty/error states stay empty in production.
  useEffect(() => {
    let mounted = true;
    Promise.all([getVenues(), getVenueGameProgramming()])
      .then(([venues, programming]) => {
        if (!mounted) return;
        setDbVenues(isDemoMode && venues.length === 0 ? null : venues);
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
      .catch((error) => { console.error('Supabase venue data unavailable.', error); if (mounted) setDbVenues([]); });
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
    const sourceVenues = dbVenues ?? (isDemoMode ? SEEDED_VENUES : []);
    const filtered = marketService.filterVenuesByMarket(
      sourceVenues,
      activeMarket.id
    );
    return filtered;
  }, [activeMarket.id, dbVenues]);

  // Prefer the freshly detected browser location, then the user's stored
  // coordinates, and finally the active market center as a non-personal fallback.
  const userLocation = useMemo(() => {
    if (detectedLocation) {
      return { lat: detectedLocation.latitude, lon: detectedLocation.longitude };
    }
    if (currentUser?.latitude != null && currentUser?.longitude != null) {
      return { lat: currentUser.latitude, lon: currentUser.longitude };
    }
    return { lat: activeMarket.latitude, lon: activeMarket.longitude };
  }, [detectedLocation, currentUser?.latitude, currentUser?.longitude, activeMarket]);

  // Supabase Cron owns production ingestion; the browser only reads stored games.
  useEffect(() => {
    let mounted = true;
    const loadGames = async () => {
      const storedGames = await getStoredGames().catch(() => []);
      const data = storedGames.length ? storedGames : await sportsService.getGames();
      if (!mounted) return;
      setGames(data);
      setSelectedGame((currentSelected) => {
        if (!currentSelected) {
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
    };
    loadGames();
    return () => { mounted = false; };
  }, [currentUser?.id]);

  // Subscribe to provider updates for UI refreshes.
  useEffect(() => {
    let mounted = true;
    const fetchGames = async () => {
      const data = await getStoredGames().catch(() => sportsService.getGames());
      if (mounted) setGames(data);
    };

    fetchGames();
    const unsubscribe = sportsService.subscribe(fetchGames);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [currentUser?.favoriteTeams]);
  
  const venueGames = useMemo(
    () => (dbVenueGames.length || !isDemoMode ? dbVenueGames : SEEDED_VENUE_GAMES),
    [dbVenueGames]
  );

  const rankedVenues = useMemo(
    () =>
      rankVenues(marketVenues, liveStates, {
        intent: currentIntent,
        selectedGame,
        venueGames,
        presenceList: presences,
        userLocation: { latitude: userLocation.lat, longitude: userLocation.lon },
        userFavoriteTeams: currentUser?.favoriteTeams?.map((t) => t.name) || [],
        userFavoriteSports: currentUser?.favoriteSports || []
      }),
    [
      marketVenues,
      liveStates,
      currentIntent,
      selectedGame,
      venueGames,
      presences,
      userLocation,
      currentUser?.favoriteTeams,
      currentUser?.favoriteSports
    ]
  );

  const selectedVenueMatch = useMemo(
    () => (selectedVenue ? rankedVenues.find((m) => m.venue.id === selectedVenue.id) || null : null),
    [selectedVenue, rankedVenues]
  );

  const handleToggleSave = async (venueId: string) => {
    const saved = savedVenueIds.includes(venueId);
    setSavedVenueIds((prev) => saved ? prev.filter((id) => id !== venueId) : [...prev, venueId]);
    if (currentUser?.id && !currentUser.id.startsWith('usr_')) {
      try {
        await toggleVenueFavorite(currentUser.id, venueId, saved);
      } catch (error) {
        console.warn('Unable to persist venue favorite.', error);
        setSavedVenueIds((prev) => saved ? [...prev, venueId] : prev.filter((id) => id !== venueId));
      }
    }
  };

  const refreshSignals = () => {
    setLiveStates(signalEngine.getLiveStates());
    setSignals(signalEngine.getSignals());
    setPresences(signalEngine.getPresences());
  };

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
  };

  const handleSelectGame = (game: SportsGame | null) => {
    setSelectedGame(game);
  };

  const handleUpdateFavoriteTeams = (teams: any[]) => {
    updateUser({ favoriteTeams: teams });
  };

  if (authState === 'AUTH_IN_PROGRESS') {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center text-sm font-bold">Loading RallyOn…</div>;
  }

  if (authState === 'LOGGED_OUT') {
    if (authView === 'SIGN_IN') {
      return <SignInScreen onBack={() => setAuthView('WELCOME')} onGoToSignUp={() => setAuthView('SIGN_UP')} onGoToForgotPassword={() => setAuthView('FORGOT_PASSWORD')} />;
    }
    if (authView === 'SIGN_UP') {
      return <SignUpScreen onBack={() => setAuthView('WELCOME')} onGoToSignIn={() => setAuthView('SIGN_IN')} />;
    }
    if (authView === 'FORGOT_PASSWORD') {
      return <PasswordResetScreen onBackToSignIn={() => setAuthView('SIGN_IN')} />;
    }
    return <WelcomeScreen onGoToSignUp={() => setAuthView('SIGN_UP')} onGoToSignIn={() => setAuthView('SIGN_IN')} />;
  }

  if (authState === 'EMAIL_VERIFICATION_REQUIRED') {
    return <EmailVerificationScreen />;
  }

  if (authState === 'AUTHENTICATED_ONBOARDING_INCOMPLETE') {
    return <OnboardingFlow />;
  }

  if (authState === 'AUTH_ERROR') {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6 text-center">Unable to initialize RallyOn authentication.</div>;
  }

  const commonScreenProps = {
    games,
    venues: marketVenues,
    liveStates,
    currentIntent,
    selectedGame,
    onSelectGame: handleSelectGame,
    onSelectIntent: setCurrentIntent,
    venueGames,
    presences,
    savedVenueIds,
    onToggleSave: handleToggleSave,
    onSelectVenue: handleSelectVenue
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Header
        currentCity={currentCity}
        onCityChange={setCurrentCity}
        isSimulating={isSimulating}
        onToggleSimulation={() => {
          signalEngine.toggleSimulation();
          refreshSignals();
          setIsSimulating(signalEngine.isSimulating);
        }}
      />

      <main className="max-w-md mx-auto px-4 pt-4 pb-24">
        {currentTab === 'HOME' && (
          <HomeScreen
            games={games}
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
            currentIntent={currentIntent}
            onSelectIntent={setCurrentIntent}
            rankedVenues={rankedVenues}
            savedVenueIds={savedVenueIds}
            onToggleSave={handleToggleSave}
            onSelectVenue={handleSelectVenue}
            onOpenLiveFeed={() => setCurrentTab('LIVE')}
            currentUser={currentUser}
            favoriteTeams={currentUser?.favoriteTeams}
            onUpdateFavoriteTeams={handleUpdateFavoriteTeams}
          />
        )}

        {currentTab === 'LIVE' && (
          <LiveScreen
            games={games}
            signals={signals}
            venues={marketVenues}
            liveStates={liveStates}
            venueGames={venueGames}
            onSelectGame={handleSelectGame}
            onSelectVenue={handleSelectVenue}
            favoriteTeams={currentUser?.favoriteTeams}
          />
        )}

        {currentTab === 'MAP' && (
          <MapScreen
            venues={marketVenues}
            liveStates={liveStates}
            matchResults={rankedVenues}
            games={games}
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
            currentIntent={currentIntent}
            onSelectIntent={setCurrentIntent}
            venueGames={venueGames}
            presences={presences}
            savedVenueIds={savedVenueIds}
            onToggleSave={handleToggleSave}
            onSelectVenue={handleSelectVenue}
          />
        )}

        {currentTab === 'SEARCH' && (
          <SearchScreen
            venues={marketVenues}
            games={games}
            liveStates={liveStates}
            onSelectVenue={handleSelectVenue}
            onSelectGame={(game) => {
              setSelectedGame(game);
              setCurrentTab('HOME');
            }}
            favoriteTeams={currentUser?.favoriteTeams}
          />
        )}

        {currentTab === 'PROFILE' && (
          <ProfileScreen
            venues={marketVenues}
            savedVenueIds={savedVenueIds}
            presences={presences}
            onSelectVenue={handleSelectVenue}
            isSimulating={isSimulating}
            onToggleSimulation={() => {
              signalEngine.toggleSimulation();
              refreshSignals();
              setIsSimulating(signalEngine.isSimulating);
            }}
            onOpenVenueDashboard={(venueId) => setActiveVenueDashboardId(venueId)}
            onOpenAdminModeration={() => setShowAdminModeration(true)}
          />
        )}
      </main>

      <Navigation
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        liveBadgeCount={games.filter((g) => g.status === 'LIVE').length}
        friendActivityCount={presences.length}
      />

      {selectedVenue && selectedVenueMatch && (
        <VenueDetailModal
          venue={selectedVenue}
          liveState={selectedVenueMatch.liveState}
          matchResult={selectedVenueMatch}
          currentIntent={currentIntent}
          activeGame={selectedGame}
          venueGame={selectedVenueMatch.activeGameStatus}
          friendsInside={selectedVenueMatch.friendsInside}
          isSaved={savedVenueIds.includes(selectedVenue.id)}
          onToggleSave={handleToggleSave}
          onClose={() => setSelectedVenue(null)}
          onCheckInSuccess={refreshSignals}
          onOpenDashboard={(venueId) => setActiveVenueDashboardId(venueId)}
        />
      )}

      {activeVenueDashboardId && (
        <VenueDashboard
          venue={marketVenues.find((v) => v.id === activeVenueDashboardId) || marketVenues[0]}
          onBackToApp={() => setActiveVenueDashboardId(null)}
        />
      )}

      {showAdminModeration && (
        <AdminModerationPanel onBack={() => setShowAdminModeration(false)} />
      )}
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
