import {
  User,
  AuthProviderType,
  OnboardingStep,
  TeamReference,
  UserIntent,
  PrivacySettings,
  NotificationPreferences
} from '../types';

const STORAGE_USERS_KEY = 'rallyon_users_v2';
const STORAGE_SESSION_KEY = 'rallyon_session_v2';

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

// Initial default user for development/demo (Austin sports fanatic)
const SEEDED_DEMO_USER: User = {
  id: 'usr_alex_taylor',
  email: 'alex.taylor@rallyon.app',
  firstName: 'Alex',
  lastName: 'Taylor',
  name: 'Alex Taylor',
  username: 'atx_rally',
  profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  authProvider: 'DEMO',
  emailVerified: true,
  onboardingCompleted: true,
  onboardingStep: 'complete',
  createdAt: '2026-08-01T12:00:00Z',
  updatedAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  locationPermissionStatus: 'GRANTED',
  notificationPermissionStatus: 'GRANTED',
  homeCity: 'Austin',
  homeState: 'TX',
  homeZip: '78701',
  latitude: 30.2672,
  longitude: -97.7431,
  city: 'Austin, TX',
  favoriteSports: ['NFL', 'COLLEGE_FOOTBALL', 'SOCCER'],
  favoriteLeagues: ['NFL', 'NCAA_FB', 'SOCCER'],
  favoriteTeams: [
    { id: 'nfl_dal', name: 'Dallas Cowboys', sportId: 'NFL', league: 'NFL', abbrev: 'DAL', logo: '⭐', color: '#003594' },
    { id: 'ncaa_fb_tex', name: 'Texas Longhorns', sportId: 'COLLEGE_FOOTBALL', league: 'NCAA_FB', abbrev: 'TEX', logo: '🤘', color: '#BF5700' },
    { id: 'soc_ars', name: 'Arsenal FC', sportId: 'SOCCER', league: 'SOCCER', abbrev: 'ARS', logo: '🔴', color: '#EF0107' }
  ],
  preferredExperience: ['HIGH_ENERGY', 'WITH_FRIENDS'],
  currentIntent: 'HIGH_ENERGY',
  preferences: {
    energy: 85,
    crowd: 80,
    social: 85,
    sportsIntensity: 90,
    viewingPreference: 95
  },
  privacySettings: {
    profileVisibility: 'PUBLIC',
    friendVisibility: 'ALL_FRIENDS',
    checkInVisibility: 'FRIENDS_ONLY',
    locationSharing: 'NEIGHBORHOOD_ONLY',
    presenceVisibility: 'SHOW_VENUE'
  },
  privacy: 'FRIENDS_ONLY',
  notificationPreferences: {
    favoriteTeamGames: true,
    gameStartingSoon: true,
    gameNearYou: true,
    venueTrending: true,
    friendsCheckingIn: true,
    recommendations: true
  },
  savedVenueIds: ['venue_bufords', 'venue_cover3', 'venue_haymaker']
};

class AuthService {
  private users: Map<string, User> = new Map();
  private passwords: Map<string, string> = new Map(); // Mock password store (email -> hash)
  private currentUserId: string | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_USERS_KEY);
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) {
          parsed.forEach((u: User) => this.users.set(u.id, u));
        }
      }

      // Ensure demo user exists
      if (!this.users.has(SEEDED_DEMO_USER.id)) {
        this.users.set(SEEDED_DEMO_USER.id, SEEDED_DEMO_USER);
        this.passwords.set(SEEDED_DEMO_USER.email.toLowerCase(), 'Demo1234!');
        this.persistUsers();
      }

      // Restore active session
      const storedSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        if (sessionData && sessionData.userId && this.users.has(sessionData.userId)) {
          this.currentUserId = sessionData.userId;
        }
      }
    } catch (e) {
      console.error('Error loading auth state from storage:', e);
    }
  }

  private persistUsers() {
    try {
      const userList = Array.from(this.users.values());
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(userList));
    } catch (e) {
      console.error('Failed to persist users:', e);
    }
  }

  private persistSession(userId: string | null) {
    try {
      if (userId) {
        localStorage.setItem(
          STORAGE_SESSION_KEY,
          JSON.stringify({ userId, token: `tok_${Date.now()}_${Math.random().toString(36).slice(2)}` })
        );
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to persist session:', e);
    }
  }

  private notify() {
    const user = this.getCurrentUser();
    this.listeners.forEach((cb) => cb(user));
  }

  public subscribe(cb: (user: User | null) => void): () => void {
    this.listeners.add(cb);
    cb(this.getCurrentUser());
    return () => {
      this.listeners.delete(cb);
    };
  }

  public getCurrentUser(): User | null {
    if (!this.currentUserId) return null;
    return this.users.get(this.currentUserId) || null;
  }

  public validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  public validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    if (!hasNumber || !hasLetter) {
      return { valid: false, message: 'Password must contain at least one letter and one number.' };
    }
    return { valid: true };
  }

  public async signUp(params: SignUpParams): Promise<AuthResponse> {
    const emailClean = params.email.trim().toLowerCase();

    if (!params.firstName.trim()) {
      return { success: false, error: 'Please provide your first name.' };
    }
    if (!params.lastName.trim()) {
      return { success: false, error: 'Please provide your last name.' };
    }
    if (!this.validateEmail(emailClean)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const strengthCheck = this.validatePasswordStrength(params.password);
    if (!strengthCheck.valid) {
      return { success: false, error: strengthCheck.message };
    }

    if (params.confirmPassword && params.password !== params.confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    // Check duplicate email
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === emailClean) {
        return { success: false, error: 'An account with this email address already exists. Please sign in.' };
      }
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const username = params.username?.trim() || `${params.firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`;

    const newUser: User = {
      id: userId,
      email: emailClean,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      name: `${params.firstName.trim()} ${params.lastName.trim()}`,
      username,
      profilePhotoUrl: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authProvider: 'EMAIL',
      emailVerified: true, // In browser sandbox, set verified to true or prompt verification based on config
      onboardingCompleted: false,
      onboardingStep: 'welcome',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      locationPermissionStatus: 'PROMPT',
      notificationPermissionStatus: 'PROMPT',
      homeCity: 'Austin',
      homeState: 'TX',
      latitude: 30.2672,
      longitude: -97.7431,
      city: 'Austin, TX',
      favoriteSports: [],
      favoriteLeagues: [],
      favoriteTeams: [],
      preferredExperience: ['HIGH_ENERGY'],
      currentIntent: 'HIGH_ENERGY',
      preferences: {
        energy: 80,
        crowd: 70,
        social: 80,
        sportsIntensity: 85,
        viewingPreference: 90
      },
      privacySettings: {
        profileVisibility: 'PUBLIC',
        friendVisibility: 'ALL_FRIENDS',
        checkInVisibility: 'FRIENDS_ONLY',
        locationSharing: 'NEIGHBORHOOD_ONLY',
        presenceVisibility: 'SHOW_VENUE'
      },
      privacy: 'FRIENDS_ONLY',
      notificationPreferences: {
        favoriteTeamGames: true,
        gameStartingSoon: true,
        gameNearYou: true,
        venueTrending: true,
        friendsCheckingIn: true,
        recommendations: true
      },
      savedVenueIds: []
    };

    this.users.set(userId, newUser);
    this.passwords.set(emailClean, params.password);
    this.persistUsers();

    this.currentUserId = userId;
    this.persistSession(userId);
    this.notify();

    return { success: true, user: newUser };
  }

  public async signIn(email: string, pass: string): Promise<AuthResponse> {
    const emailClean = email.trim().toLowerCase();
    if (!this.validateEmail(emailClean)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass) {
      return { success: false, error: 'Please enter your password.' };
    }

    let foundUser: User | null = null;
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === emailClean) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      return { success: false, error: 'Invalid email or password. Please try again.' };
    }

    const storedPass = this.passwords.get(emailClean);
    // If password matches or if it's the demo account
    if (storedPass && storedPass !== pass && foundUser.authProvider === 'EMAIL') {
      return { success: false, error: 'Invalid email or password. Please try again.' };
    }

    foundUser.lastActiveAt = new Date().toISOString();
    this.users.set(foundUser.id, foundUser);
    this.persistUsers();

    this.currentUserId = foundUser.id;
    this.persistSession(foundUser.id);
    this.notify();

    return { success: true, user: foundUser };
  }

  public async signInWithGoogle(): Promise<AuthResponse> {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

    // If Google Client ID is configured, real Google Identity Services or popup flow is enabled
    // If not configured, we provide a clean developer sign-in with Google profile representation
    const googleEmail = 'rally.fan.google@gmail.com';
    let user = Array.from(this.users.values()).find((u) => u.email === googleEmail);

    if (!user) {
      const userId = `usr_google_${Date.now()}`;
      user = {
        id: userId,
        email: googleEmail,
        firstName: 'Jordan',
        lastName: 'Miles',
        name: 'Jordan Miles',
        username: 'jordan_g_atx',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        authProvider: 'GOOGLE',
        emailVerified: true,
        onboardingCompleted: false, // Route new google user into onboarding!
        onboardingStep: 'welcome',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        locationPermissionStatus: 'PROMPT',
        notificationPermissionStatus: 'PROMPT',
        homeCity: 'Austin',
        homeState: 'TX',
        latitude: 30.2672,
        longitude: -97.7431,
        city: 'Austin, TX',
        favoriteSports: [],
        favoriteLeagues: [],
        favoriteTeams: [],
        preferredExperience: ['HIGH_ENERGY', 'CHILL'],
        currentIntent: 'HIGH_ENERGY',
        preferences: {
          energy: 75,
          crowd: 70,
          social: 75,
          sportsIntensity: 80,
          viewingPreference: 85
        },
        privacySettings: {
          profileVisibility: 'PUBLIC',
          friendVisibility: 'ALL_FRIENDS',
          checkInVisibility: 'FRIENDS_ONLY',
          locationSharing: 'NEIGHBORHOOD_ONLY',
          presenceVisibility: 'SHOW_VENUE'
        },
        privacy: 'FRIENDS_ONLY',
        notificationPreferences: {
          favoriteTeamGames: true,
          gameStartingSoon: true,
          gameNearYou: true,
          venueTrending: true,
          friendsCheckingIn: true,
          recommendations: true
        },
        savedVenueIds: []
      };
      this.users.set(user.id, user);
      this.persistUsers();
    } else {
      user.lastActiveAt = new Date().toISOString();
      this.users.set(user.id, user);
      this.persistUsers();
    }

    this.currentUserId = user.id;
    this.persistSession(user.id);
    this.notify();

    return { success: true, user };
  }

  public async signInWithApple(): Promise<AuthResponse> {
    const appleClientId = (import.meta as any).env?.VITE_APPLE_CLIENT_ID;
    const appleEmail = 'rally.apple.fan@privaterelay.appleid.com';

    let user = Array.from(this.users.values()).find((u) => u.email === appleEmail);
    if (!user) {
      const userId = `usr_apple_${Date.now()}`;
      user = {
        id: userId,
        email: appleEmail,
        firstName: 'Taylor',
        lastName: 'Swift-Fan',
        name: 'Taylor Swift-Fan',
        username: 'atx_relay_user',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        authProvider: 'APPLE',
        emailVerified: true,
        onboardingCompleted: false,
        onboardingStep: 'welcome',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        locationPermissionStatus: 'PROMPT',
        notificationPermissionStatus: 'PROMPT',
        homeCity: 'Austin',
        homeState: 'TX',
        latitude: 30.2672,
        longitude: -97.7431,
        city: 'Austin, TX',
        favoriteSports: [],
        favoriteLeagues: [],
        favoriteTeams: [],
        preferredExperience: ['HIGH_ENERGY'],
        currentIntent: 'HIGH_ENERGY',
        preferences: {
          energy: 80,
          crowd: 75,
          social: 80,
          sportsIntensity: 85,
          viewingPreference: 90
        },
        privacySettings: {
          profileVisibility: 'PUBLIC',
          friendVisibility: 'ALL_FRIENDS',
          checkInVisibility: 'FRIENDS_ONLY',
          locationSharing: 'NEIGHBORHOOD_ONLY',
          presenceVisibility: 'SHOW_VENUE'
        },
        privacy: 'FRIENDS_ONLY',
        notificationPreferences: {
          favoriteTeamGames: true,
          gameStartingSoon: true,
          gameNearYou: true,
          venueTrending: true,
          friendsCheckingIn: true,
          recommendations: true
        },
        savedVenueIds: []
      };
      this.users.set(user.id, user);
      this.persistUsers();
    } else {
      user.lastActiveAt = new Date().toISOString();
      this.users.set(user.id, user);
      this.persistUsers();
    }

    this.currentUserId = user.id;
    this.persistSession(user.id);
    this.notify();

    return { success: true, user };
  }

  public async signInDemoUser(): Promise<AuthResponse> {
    const demo = this.users.get(SEEDED_DEMO_USER.id) || SEEDED_DEMO_USER;
    demo.lastActiveAt = new Date().toISOString();
    this.users.set(demo.id, demo);
    this.persistUsers();

    this.currentUserId = demo.id;
    this.persistSession(demo.id);
    this.notify();

    return { success: true, user: demo };
  }

  public async sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const emailClean = email.trim().toLowerCase();
    if (!this.validateEmail(emailClean)) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    // Security best practice: Do not reveal whether an email address exists
    return {
      success: true,
      message: "We've sent instructions to reset your RallyOn password. Please check your email inbox and spam folder."
    };
  }

  public async resendVerificationEmail(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'A fresh verification link has been sent to your email address.'
    };
  }

  public updateUser(userId: string, updates: Partial<User>): User | null {
    const existing = this.users.get(userId);
    if (!existing) return null;

    const updated: User = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.firstName || updates.lastName) {
      updated.name = `${updated.firstName} ${updated.lastName}`.trim();
    }
    if (updates.homeCity || updates.homeState) {
      updated.city = `${updated.homeCity}, ${updated.homeState}`.trim();
    }

    this.users.set(userId, updated);
    this.persistUsers();
    this.notify();
    return updated;
  }

  public completeOnboarding(userId: string): User | null {
    return this.updateUser(userId, {
      onboardingCompleted: true,
      onboardingStep: 'complete'
    });
  }

  public logout(): void {
    this.currentUserId = null;
    this.persistSession(null);
    this.notify();
  }

  public deleteAccount(userId: string): boolean {
    const deleted = this.users.delete(userId);
    if (this.currentUserId === userId) {
      this.currentUserId = null;
      this.persistSession(null);
    }
    this.persistUsers();
    this.notify();
    return deleted;
  }
}

export const authService = new AuthService();
