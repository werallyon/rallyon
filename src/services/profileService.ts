import { User } from '../types';
import { supabase } from '../lib/supabaseClient';

/**
 * public.profiles is the canonical store for mutable RallyOn profile data.
 * Supabase Auth is authoritative only for identity/authentication fields
 * (user id, email, verification state, provider and account creation time).
 */
type ProfileRow = {
  id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  onboarding_completed?: boolean | null;
  onboarding_step?: User['onboardingStep'] | null;
  home_city?: string | null;
  home_state?: string | null;
  home_zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  favorite_sports?: string[] | null;
  favorite_leagues?: string[] | null;
  preferred_experience?: User['preferredExperience'] | null;
  current_intent?: User['currentIntent'] | null;
  preferences?: User['preferences'] | null;
  privacy_settings?: User['privacySettings'] | null;
  notification_preferences?: User['notificationPreferences'] | null;
  saved_venue_ids?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

const DEFAULT_PREFERENCES: User['preferences'] = { energy: 80, crowd: 70, social: 80, sportsIntensity: 85, viewingPreference: 90 };
const DEFAULT_PRIVACY: User['privacySettings'] = { profileVisibility: 'PUBLIC', friendVisibility: 'ALL_FRIENDS', checkInVisibility: 'FRIENDS_ONLY', locationSharing: 'NEIGHBORHOOD_ONLY', presenceVisibility: 'SHOW_VENUE' };
const DEFAULT_NOTIFICATIONS: User['notificationPreferences'] = { favoriteTeamGames: true, gameStartingSoon: true, gameNearYou: true, venueTrending: true, friendsCheckingIn: true, recommendations: true };

function resolveAuthProvider(authUser: any): User['authProvider'] {
  const provider = authUser?.app_metadata?.provider;
  if (provider === 'google') return 'GOOGLE';
  if (provider === 'apple') return 'APPLE';
  return 'EMAIL';
}

/**
 * Auth metadata is deliberately not used as a profile fallback. It may contain
 * legacy/duplicated values and is not kept in sync by profile edits.
 */
export function mergeAuthUserWithProfile(authUser: any, profile: ProfileRow): User {
  if (!authUser?.id || !profile || profile.id !== authUser.id) {
    throw new Error('A matching canonical profile row is required to map an authenticated user.');
  }
  const now = new Date().toISOString();
  const p: ProfileRow = profile;
  const firstName = p.first_name ?? '';
  const lastName = p.last_name ?? '';
  const displayName = p.display_name ?? [firstName, lastName].filter(Boolean).join(' ');
  const homeCity = p.home_city ?? '';
  const homeState = p.home_state ?? '';
  const avatarUrl = p.avatar_url ?? '';

  return {
    id: authUser.id,
    email: authUser.email || '',
    firstName,
    lastName,
    name: displayName,
    username: p.username ?? '',
    profilePhotoUrl: avatarUrl,
    avatar: avatarUrl,
    authProvider: resolveAuthProvider(authUser),
    emailVerified: Boolean(authUser.email_confirmed_at),
    onboardingCompleted: Boolean(p.onboarding_completed),
    onboardingStep: p.onboarding_step ?? 'welcome',
    createdAt: p.created_at ?? authUser.created_at ?? now,
    updatedAt: p.updated_at ?? now,
    lastActiveAt: now,
    // Permission prompts are session/device state, not Auth user metadata.
    locationPermissionStatus: 'PROMPT',
    notificationPermissionStatus: 'PROMPT',
    homeCity,
    homeState,
    homeZip: p.home_zip ?? undefined,
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    city: [homeCity, homeState].filter(Boolean).join(', '),
    favoriteSports: p.favorite_sports ?? [],
    favoriteLeagues: p.favorite_leagues ?? [],
    // Relational favorites are loaded by AuthService after canonical profile hydration.
    // Never expose the retained legacy JSON column as application state.
    favoriteTeams: [],
    preferredExperience: p.preferred_experience ?? ['HIGH_ENERGY'],
    currentIntent: p.current_intent ?? 'HIGH_ENERGY',
    preferences: p.preferences ?? DEFAULT_PREFERENCES,
    privacySettings: p.privacy_settings ?? DEFAULT_PRIVACY,
    privacy: 'FRIENDS_ONLY',
    notificationPreferences: p.notification_preferences ?? DEFAULT_NOTIFICATIONS,
    savedVenueIds: p.saved_venue_ids ?? []
  };
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('id,username,first_name,last_name,display_name,avatar_url,onboarding_completed,onboarding_step,home_city,home_state,home_zip,latitude,longitude,favorite_sports,favorite_leagues,preferred_experience,current_intent,preferences,privacy_settings,notification_preferences,saved_venue_ids,created_at,updated_at').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function getUserWithProfile(authUser: any): Promise<User> {
  if (!authUser?.id) throw new Error('Cannot load a profile without an authenticated user id.');
  const profile = await getProfile(authUser.id);
  if (!profile) {
    throw new Error('The authenticated user has no public.profiles row. Verify the signup bootstrap trigger or repair the profile before continuing.');
  }
  return mergeAuthUserWithProfile(authUser, profile);
}
