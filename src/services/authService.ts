import { User } from '../types';
import { supabase } from '../lib/supabaseClient';
import { getUserWithProfile, mergeAuthUserWithProfile } from './profileService';
import { getFavoriteTeams } from './teamPreferenceService';

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

class AuthService {
  private currentUser: User | null = null;
  private listeners = new Set<(user: User | null) => void>();
  private initialized = false;
  private authRevision = 0;
  private authActionRevision = 0;
  private profileWriteRevision = 0;

  constructor() {
    supabase?.auth.onAuthStateChange((_event, session) => {
      const revision = ++this.authRevision;
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
        if (revision === this.authRevision) {
          this.currentUser = user;
          this.notify();
        }
      }).catch((error) => {
        if (revision === this.authRevision) {
          this.currentUser = null;
          this.notify();
        }
        console.error('Unable to load the canonical RallyOn profile. Verify profile bootstrap and RLS.', error);
      });
    });
  }

  async initialize(): Promise<User | null> {
    if (!supabase) { this.initialized = true; this.notify(); return null; }
    const revision = ++this.authRevision;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const hydratedUser = data.session?.user ? await this.hydrateUser(data.session.user) : null;
    if (revision === this.authRevision) this.currentUser = hydratedUser;
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
    const user = await getUserWithProfile(authUser);
    const favoriteTeams = await getFavoriteTeams(authUser.id);
    return { ...user, favoriteTeams };
  }

  private async isCurrentAuthAction(actionRevision: number, userId: string): Promise<boolean> {
    if (actionRevision !== this.authActionRevision) return false;
    const { data, error } = await supabase!.auth.getSession();
    if (error) throw error;
    return actionRevision === this.authActionRevision && data.session?.user.id === userId;
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
    if (!supabase) return { success: false, error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.' };

    const metadata = {
      firstName: p.firstName.trim(), lastName: p.lastName.trim(),
      name: `${p.firstName.trim()} ${p.lastName.trim()}`,
      username: p.username?.trim() || `${p.firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`,
      authProvider: 'EMAIL', onboardingCompleted: false, onboardingStep: 'welcome'
    };
    const actionRevision = ++this.authActionRevision;
    const { data, error } = await supabase.auth.signUp({
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
    if (!supabase) return { success: false, error: 'Supabase is not configured.' };
    const actionRevision = ++this.authActionRevision;
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
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
    if (!supabase) return { success: false, error: 'Supabase is not configured.' };
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    return error ? { success: false, error: error.message } : { success: true };
  }

  async signInWithApple(): Promise<AuthResponse> {
    if (!supabase) return { success: false, error: 'Supabase is not configured.' };
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } });
    return error ? { success: false, error: error.message } : { success: true };
  }

  async signInDemoUser(): Promise<AuthResponse> { this.authActionRevision++; this.profileWriteRevision++; this.currentUser = demoUser; this.notify(); return { success: true, user: demoUser }; }

  async sendPasswordReset(email: string) {
    if (!supabase) return { success: false, message: 'Supabase is not configured.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: window.location.origin });
    return error ? { success: false, message: error.message } : { success: true, message: 'Password reset email sent. Check your inbox.' };
  }

  async resendVerificationEmail() {
    if (!supabase || !this.currentUser?.email) return { success: false, message: 'No account is ready for verification.' };
    const { error } = await supabase.auth.resend({ type: 'signup', email: this.currentUser.email });
    return error ? { success: false, message: error.message } : { success: true, message: 'Verification email sent.' };
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    if (!this.currentUser || this.currentUser.id !== id || !supabase) return null;
    const previousUser = this.currentUser;
    const writeRevision = ++this.profileWriteRevision;
    const updated = { ...previousUser, ...updates, id, updatedAt: new Date().toISOString() } as User;
    this.currentUser = updated;
    this.notify();

    // Demo identities are intentionally local-only and never sent to Auth/RLS.
    if (id.startsWith('usr_')) return updated;

    const { favoriteTeams, ...profileUpdates } = updates;
    void (async () => {
      const { data: profile, error } = await supabase!.rpc('save_profile_and_favorite_teams', {
        p_profile_updates: profileUpdates,
        p_favorite_teams: favoriteTeams === undefined ? null : favoriteTeams
      });
      if (error) throw error;
      if (!profile) throw new Error('The transactional profile save returned no canonical profile row.');

      const savedTeams = favoriteTeams === undefined
        ? updated.favoriteTeams
        : await getFavoriteTeams(id);
      if (this.currentUser?.id !== id || writeRevision !== this.profileWriteRevision) return;

      const authUser = {
        id,
        email: this.currentUser.email,
        email_confirmed_at: this.currentUser.emailVerified ? new Date().toISOString() : null,
        created_at: this.currentUser.createdAt
      };
      this.currentUser = {
        ...mergeAuthUserWithProfile(authUser, profile),
        favoriteTeams: savedTeams
      };
      this.notify();
    })().catch((error) => {
      if (this.currentUser?.id === id && writeRevision === this.profileWriteRevision) {
        this.currentUser = previousUser;
        this.notify();
      }
      console.error('Unable to persist the transactional profile and favorite-team update.', error);
    });
    return updated;
  }
  completeOnboarding(id: string) { return this.updateUser(id, { onboardingCompleted: true, onboardingStep: 'complete' }); }
  logout() { this.authActionRevision++; this.profileWriteRevision++; if (supabase) void supabase.auth.signOut(); this.currentUser = null; this.notify(); }
  deleteAccount(_id: string) { return false; }
}

export const authService = new AuthService();
