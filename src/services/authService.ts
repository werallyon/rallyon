import { User } from '../types';
import { supabase } from '../lib/supabaseClient';
import { isCurrentAuthAction as isAuthActionCurrent, isCurrentAuthHydration } from './authActionGuard.js';
import { getUserWithProfile, mergeAuthUserWithProfile } from './profileService';
import { getFavoriteTeams, normalizeFavoriteTeams } from './teamPreferenceService';
import { splitUserUpdatePayload } from './userUpdatePayload.js';

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  requiresEmailVerification?: boolean;
}

const demoUser: User = {
  id: 'usr_alex_taylor', email: 'alex.taylor@rallyon.app', firstName: 'Alex', lastName: 'Taylor',
  name: 'Alex Taylor', username: 'atx_rally',
  profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  authProvider: 'DEMO', emailVerified: true, onboardingCompleted: true, onboardingStep: 'complete',
  createdAt: '2026-08-01T12:00:00Z', updatedAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(),
  locationPermissionStatus: 'GRANTED', notificationPermissionStatus: 'GRANTED',
  homeCity: 'Austin', homeState: 'TX', homeZip: '78701', latitude: 30.2672, longitude: -97.7431, city: 'Austin, TX',
  favoriteSports: ['NFL', 'COLLEGE_FOOTBALL', 'SOCCER'], favoriteLeagues: ['NFL', 'NCAA_FB', 'SOCCER'],
  favoriteTeams: [], preferredExperience: ['HIGH_ENERGY', 'WITH_FRIENDS'], currentIntent: 'HIGH_ENERGY',
  preferences: { energy: 85, crowd: 80, social: 85, sportsIntensity: 90, viewingPreference: 95 },
  privacySettings: { profileVisibility: 'PUBLIC', friendVisibility: 'ALL_FRIENDS', checkInVisibility: 'FRIENDS_ONLY', locationSharing: 'NEIGHBORHOOD_ONLY', presenceVisibility: 'SHOW_VENUE' },
  privacy: 'FRIENDS_ONLY',
  notificationPreferences: { favoriteTeamGames: true, gameStartingSoon: true, gameNearYou: true, venueTrending: true, friendsCheckingIn: true, recommendations: true },
  savedVenueIds: ['venue_bufords', 'venue_cover3', 'venue_haymaker']
};

export class AuthService {
  private client: typeof supabase;
  private currentUser: User | null = null;
  private listeners = new Set<(user: User | null) => void>();
  private initialized = false;
  private authRevision = 0;
  private authActionRevision = 0;
  private profileWriteRevision = 0;
  // Persist profile mutations in invocation order. This prevents overlapping RPCs
  // from committing out of order and makes rollback unnecessary: persisted users
  // are published only after their canonical transaction succeeds.
  private profileWriteQueue: Promise<void> = Promise.resolve();

  constructor(client: typeof supabase = supabase) {
    this.client = client;
    this.client?.auth.onAuthStateChange((_event, session) => {
      const actionRevision = this.authActionRevision;
      const revision = ++this.authRevision;
      if (!isCurrentAuthHydration(revision, this.authRevision, actionRevision, this.authActionRevision)) return;
      if (!session?.user) {
        this.profileWriteRevision++;
        this.currentUser = null;
        this.notify();
        return;
      }
      // Never keep a previous account's profile visible while a new identity
      // is being hydrated. Auth metadata is not a profile fallback.
      if (this.currentUser?.id !== session.user.id) {
        this.profileWriteRevision++;
        this.currentUser = null;
        this.notify();
      }
      void this.hydrateUser(session.user).then((user) => {
        if (isCurrentAuthHydration(revision, this.authRevision, actionRevision, this.authActionRevision)) {
          this.currentUser = user;
          this.notify();
        }
      }).catch((error) => {
        if (revision === this.authRevision && actionRevision === this.authActionRevision) {
          this.currentUser = null;
          this.notify();
        }
        console.error('Unable to load the canonical RallyOn profile. Verify profile bootstrap and RLS.', error);
      });
    });
  }

  async initialize(): Promise<User | null> {
    if (!this.client) { this.initialized = true; this.notify(); return null; }
    const actionRevision = this.authActionRevision;
    const revision = ++this.authRevision;
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    const hydratedUser = data.session?.user ? await this.hydrateUser(data.session.user) : null;
    if (isCurrentAuthHydration(revision, this.authRevision, actionRevision, this.authActionRevision)) {
      this.currentUser = hydratedUser;
    }
    this.initialized = true;
    this.notify();
    return this.currentUser;
  }

  subscribe(cb: (user: User | null) => void): () => void {
    this.listeners.add(cb);
    if (this.initialized) cb(this.currentUser);
    return () => this.listeners.delete(cb);
  }

  getCurrentUser() { return this.currentUser; }

  private async hydrateUser(authUser: any): Promise<User> {
    // Once relational favorites are the active source, a read failure is not
    // an empty result and must never expose stale legacy JSON as current data.
    const user = await getUserWithProfile(authUser, this.client);
    const favoriteTeams = await getFavoriteTeams(authUser.id, this.client);
    return { ...user, favoriteTeams };
  }

  private async isCurrentAuthAction(actionRevision: number, userId: string): Promise<boolean> {
    if (actionRevision !== this.authActionRevision) return false;
    const { data, error } = await this.client!.auth.getSession();
    if (error) throw error;
    return isAuthActionCurrent(actionRevision, this.authActionRevision, userId, data.session?.user.id ?? null);
  }
  private notify() { this.listeners.forEach((cb) => cb(this.currentUser)); }

  validateEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
  validatePasswordStrength(password: string) {
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long.' };
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one letter and one number.' };
    return { valid: true };
  }

  async signUp(p: SignUpParams): Promise<AuthResponse> {
    const email = p.email.trim().toLowerCase();
    const strength = this.validatePasswordStrength(p.password);
    if (!p.firstName.trim() || !p.lastName.trim()) return { success: false, error: 'Please provide your first and last name.' };
    if (!this.validateEmail(email)) return { success: false, error: 'Please enter a valid email address.' };
    if (!strength.valid) return { success: false, error: strength.message };
    if (p.confirmPassword && p.password !== p.confirmPassword) return { success: false, error: 'Passwords do not match.' };
    if (!this.client) return { success: false, error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.' };

    const metadata = {
      firstName: p.firstName.trim(), lastName: p.lastName.trim(),
      name: `${p.firstName.trim()} ${p.lastName.trim()}`,
      username: p.username?.trim() || `${p.firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`,
      authProvider: 'EMAIL', onboardingCompleted: false, onboardingStep: 'welcome'
    };
    const actionRevision = ++this.authActionRevision;
    const { data, error } = await this.client.auth.signUp({
      email, password: p.password, options: { data: metadata, emailRedirectTo: window.location.origin }
    });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: 'Account creation did not return a user.' };
    if (!data.session) {
      if (actionRevision !== this.authActionRevision) return { success: false, error: 'Sign-up was superseded by a newer authentication action.' };
      return { success: true, requiresEmailVerification: true, error: 'Account created. Check your email to verify your RallyOn account, then sign in.' };
    }
    try {
      const revision = this.authRevision;
      if (!(await this.isCurrentAuthAction(actionRevision, data.user.id))) {
        return { success: false, error: 'Sign-up was superseded by a newer authentication session.' };
      }
      const user = await this.hydrateUser(data.user);
      if (revision !== this.authRevision || !(await this.isCurrentAuthAction(actionRevision, data.user.id))) {
        return { success: false, error: 'Sign-up was superseded by a newer authentication session.' };
      }
      this.currentUser = user;
      this.notify();
      return { success: true, user };
    } catch (hydrateError) {
      return { success: false, error: hydrateError instanceof Error ? hydrateError.message : 'Unable to load the new account profile.' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!this.validateEmail(email)) return { success: false, error: 'Please enter a valid email address.' };
    if (!password) return { success: false, error: 'Please enter your password.' };
    if (!this.client) return { success: false, error: 'Supabase is not configured.' };
    const actionRevision = ++this.authActionRevision;
    const { data, error } = await this.client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: 'Sign-in did not return an authenticated user.' };
    try {
      const revision = this.authRevision;
      if (!(await this.isCurrentAuthAction(actionRevision, data.user.id))) {
        return { success: false, error: 'Sign-in was superseded by a newer authentication session.' };
      }
      const user = await this.hydrateUser(data.user);
      if (revision !== this.authRevision || !(await this.isCurrentAuthAction(actionRevision, data.user.id))) {
        return { success: false, error: 'Sign-in was superseded by a newer authentication session.' };
      }
      this.currentUser = user;
      this.notify();
      return { success: true, user };
    } catch (hydrateError) {
      return { success: false, error: hydrateError instanceof Error ? hydrateError.message : 'Unable to load the account profile.' };
    }
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    if (!this.client) return { success: false, error: 'Supabase is not configured.' };
    const { error } = await this.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    return error ? { success: false, error: error.message } : { success: true };
  }

  async signInWithApple(): Promise<AuthResponse> {
    if (!this.client) return { success: false, error: 'Supabase is not configured.' };
    const { error } = await this.client.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } });
    return error ? { success: false, error: error.message } : { success: true };
  }

  async signInDemoUser(): Promise<AuthResponse> { this.authActionRevision++; this.profileWriteRevision++; this.currentUser = demoUser; this.notify(); return { success: true, user: demoUser }; }

  async sendPasswordReset(email: string) {
    if (!this.client) return { success: false, message: 'Supabase is not configured.' };
    const { error } = await this.client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: window.location.origin });
    return error ? { success: false, message: error.message } : { success: true, message: 'Password reset email sent. Check your inbox.' };
  }

  async resendVerificationEmail() {
    if (!this.client || !this.currentUser?.email) return { success: false, message: 'No account is ready for verification.' };
    const { error } = await this.client.auth.resend({ type: 'signup', email: this.currentUser.email });
    return error ? { success: false, message: error.message } : { success: true, message: 'Verification email sent.' };
  }

  updateUser(id: string, updates: Partial<User>): Promise<AuthResponse> {
    if (!this.currentUser || this.currentUser.id !== id) {
      return Promise.resolve({ success: false, error: 'The profile is no longer available for this account.' });
    }
    if (!this.client && !id.startsWith('usr_')) {
      return Promise.resolve({ success: false, error: 'Supabase is not configured. Your changes were not saved.' });
    }

    const updated = { ...this.currentUser, ...updates, id, updatedAt: new Date().toISOString() } as User;

    // Demo identities are intentionally local-only and never sent to Auth/RLS.
    if (id.startsWith('usr_')) {
      this.currentUser = updated;
      this.notify();
      return Promise.resolve({ success: true, user: updated });
    }

    const { profileUpdates, favoriteTeams, locationPermissionStatus, notificationPermissionStatus } = splitUserUpdatePayload(updates);
    const writeEpoch = this.profileWriteRevision;

    // Persist profile mutations in invocation order. A failed transaction is
    // returned to the caller; it is never converted into a successful-looking
    // User object or swallowed as a console-only warning.
    const persist = async (): Promise<AuthResponse> => {
      try {
        if (writeEpoch !== this.profileWriteRevision || this.currentUser?.id !== id) {
          return { success: false, error: 'This profile save was superseded by an authentication change. Please retry.' };
        }

        const { data: authData, error: authError } = await this.client!.auth.getUser();
        if (authError) throw authError;
        if (!authData.user || authData.user.id !== id) {
          throw new Error('Profile updates require the same currently authenticated user that initiated the change.');
        }
        if (writeEpoch !== this.profileWriteRevision || this.currentUser?.id !== id) {
          return { success: false, error: 'This profile save was superseded by an authentication change. Please retry.' };
        }

        const { data: profile, error } = await this.client!.rpc('save_profile_and_favorite_teams', {
          p_expected_user_id: id,
          p_profile_updates: profileUpdates,
          p_favorite_teams: favoriteTeams ?? [],
          p_replace_favorite_teams: favoriteTeams !== undefined
        });
        if (error) throw error;
        if (!profile) throw new Error('The transactional profile save returned no canonical profile row.');

        if (writeEpoch !== this.profileWriteRevision || this.currentUser?.id !== id) {
          return { success: false, error: 'The save completed after the account changed. Sign in again to refresh your profile.' };
        }

        const committedUser = this.currentUser;
        if (!committedUser || committedUser.id !== id) {
          return { success: false, error: 'The profile changed before the save could be published. Please retry.' };
        }
        const savedTeams = favoriteTeams === undefined
          ? committedUser.favoriteTeams
          : normalizeFavoriteTeams(favoriteTeams);
        const authUser = {
          id,
          email: committedUser.email,
          email_confirmed_at: committedUser.emailVerified ? new Date().toISOString() : null,
          created_at: committedUser.createdAt
        };
        this.currentUser = {
          ...mergeAuthUserWithProfile(authUser, profile),
          favoriteTeams: savedTeams,
          // Permission status belongs to the current device/session, not profiles.
          locationPermissionStatus: locationPermissionStatus ?? committedUser.locationPermissionStatus,
          notificationPermissionStatus: notificationPermissionStatus ?? committedUser.notificationPermissionStatus
        };
        this.notify();
        return { success: true, user: this.currentUser };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unable to save your profile. Please try again.'
        };
      }
    };

    const writeResult = this.profileWriteQueue.then(persist, persist);
    this.profileWriteQueue = writeResult.then(() => undefined);
    return writeResult;
  }
  completeOnboarding(id: string): Promise<AuthResponse> { return this.updateUser(id, { onboardingCompleted: true, onboardingStep: 'complete' }); }
  logout() { this.authActionRevision++; this.profileWriteRevision++; if (this.client) void this.client.auth.signOut(); this.currentUser = null; this.notify(); }
  deleteAccount(_id: string) { return false; }
}

export const authService = new AuthService();
