import { User } from '../types';
import { supabase } from '../lib/supabaseClient';
import { getUserWithProfile, mergeAuthUserWithProfile, updateProfile } from './profileService';

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

function mapUser(u: any): User {
  const m = u.user_metadata || {};
  const now = new Date().toISOString();
  return {
    id: u.id, email: u.email || '', firstName: m.firstName || '', lastName: m.lastName || '',
    name: m.name || u.email?.split('@')[0] || '', username: m.username || u.email?.split('@')[0] || '',
    profilePhotoUrl: m.profilePhotoUrl || '', avatar: m.avatar || '',
    authProvider: m.authProvider || 'EMAIL', emailVerified: Boolean(u.email_confirmed_at),
    onboardingCompleted: Boolean(m.onboardingCompleted), onboardingStep: m.onboardingStep || 'welcome',
    createdAt: m.createdAt || u.created_at || now, updatedAt: now, lastActiveAt: now,
    locationPermissionStatus: m.locationPermissionStatus || 'PROMPT',
    notificationPermissionStatus: m.notificationPermissionStatus || 'PROMPT',
    homeCity: m.homeCity || 'Austin', homeState: m.homeState || 'TX', homeZip: m.homeZip,
    latitude: m.latitude ?? 30.2672, longitude: m.longitude ?? -97.7431, city: m.city || 'Austin, TX',
    favoriteSports: m.favoriteSports || [], favoriteLeagues: m.favoriteLeagues || [], favoriteTeams: m.favoriteTeams || [],
    preferredExperience: m.preferredExperience || ['HIGH_ENERGY'], currentIntent: m.currentIntent || 'HIGH_ENERGY',
    preferences: m.preferences || { energy: 80, crowd: 70, social: 80, sportsIntensity: 85, viewingPreference: 90 },
    privacySettings: m.privacySettings || { profileVisibility: 'PUBLIC', friendVisibility: 'ALL_FRIENDS', checkInVisibility: 'FRIENDS_ONLY', locationSharing: 'NEIGHBORHOOD_ONLY', presenceVisibility: 'SHOW_VENUE' },
    privacy: m.privacy || 'FRIENDS_ONLY',
    notificationPreferences: m.notificationPreferences || { favoriteTeamGames: true, gameStartingSoon: true, gameNearYou: true, venueTrending: true, friendsCheckingIn: true, recommendations: true },
    savedVenueIds: m.savedVenueIds || []
  } as User;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners = new Set<(user: User | null) => void>();
  private initialized = false;

  constructor() {
    supabase?.auth.onAuthStateChange((_event, session) => {
      this.currentUser = session?.user ? mapUser(session.user) : null;
      if (session?.user) void this.hydrateUser(session.user);
      this.notify();
    });
  }

  async initialize(): Promise<User | null> {
    if (!supabase) { this.initialized = true; this.notify(); return null; }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    this.currentUser = data.session?.user ? await this.hydrateUser(data.session.user) : null;
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
    try { return await getUserWithProfile(authUser); }
    catch { return mergeAuthUserWithProfile(authUser); }
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
    const { data, error } = await supabase.auth.signUp({
      email, password: p.password, options: { data: metadata, emailRedirectTo: window.location.origin }
    });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: 'Account creation did not return a user.' };
    if (!data.session) return { success: true, requiresEmailVerification: true, error: 'Account created. Check your email to verify your RallyOn account, then sign in.' };
    this.currentUser = await this.hydrateUser(data.user); this.notify();
    return { success: true, user: this.currentUser };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!this.validateEmail(email)) return { success: false, error: 'Please enter a valid email address.' };
    if (!password) return { success: false, error: 'Please enter your password.' };
    if (!supabase) return { success: false, error: 'Supabase is not configured.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { success: false, error: error.message };
    this.currentUser = data.user ? await this.hydrateUser(data.user) : null; this.notify();
    return { success: Boolean(this.currentUser), user: this.currentUser || undefined };
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

  async signInDemoUser(): Promise<AuthResponse> { this.currentUser = demoUser; this.notify(); return { success: true, user: demoUser }; }

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
    const updated = { ...this.currentUser, ...updates, id, updatedAt: new Date().toISOString() } as User;
    this.currentUser = updated; this.notify();
    void updateProfile(id, updates).then((profile) => {
      if (profile && this.currentUser?.id === id) {
        this.currentUser = mergeAuthUserWithProfile({ id, email: this.currentUser.email, user_metadata: {}, email_confirmed_at: this.currentUser.emailVerified ? new Date().toISOString() : null, created_at: this.currentUser.createdAt }, profile);
        this.notify();
      }
    }).catch(() => undefined);
    return updated;
  }
  completeOnboarding(id: string) { return this.updateUser(id, { onboardingCompleted: true, onboardingStep: 'complete' }); }
  logout() { if (supabase) void supabase.auth.signOut(); this.currentUser = null; this.notify(); }
  deleteAccount(_id: string) { return false; }
}

export const authService = new AuthService();
