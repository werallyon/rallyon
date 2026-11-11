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
import { getStoredGames } from './services/gameService';
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
      const storedGames = await getStoredGames().catch(() => []);
      const data = storedGames.length ? storedGames : await sportsService.getGames();
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
