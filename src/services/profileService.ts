import { User } from '../types';
import { supabase } from '../lib/supabaseClient';

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
  favorite_teams?: User['favoriteTeams'] | null;
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

export function mergeAuthUserWithProfile(authUser: any, profile?: ProfileRow | null): User {
  const m = authUser?.user_metadata || {};
  const now = new Date().toISOString();
  const p: ProfileRow = profile ?? { id: authUser.id };
  const firstName = p.first_name ?? m.firstName ?? '';
  const lastName = p.last_name ?? m.lastName ?? '';
  const displayName = p.display_name ?? m.name ?? `${firstName} ${lastName}`.trim() ?? authUser?.email?.split('@')[0] ?? '';
  return {
    id: authUser.id, email: authUser.email || '', firstName, lastName,
    name: displayName || authUser?.email?.split('@')[0] || '',
    username: p.username ?? m.username ?? authUser?.email?.split('@')[0] ?? '',
    profilePhotoUrl: p.avatar_url ?? m.profilePhotoUrl ?? m.avatar ?? '',
    avatar: p.avatar_url ?? m.avatar ?? m.profilePhotoUrl ?? '',
    authProvider: m.authProvider || 'EMAIL', emailVerified: Boolean(authUser.email_confirmed_at),
    onboardingCompleted: Boolean(p.onboarding_completed ?? m.onboardingCompleted),
    onboardingStep: (p.onboarding_step ?? m.onboardingStep ?? 'welcome') as User['onboardingStep'],
    createdAt: p.created_at ?? m.createdAt ?? authUser.created_at ?? now, updatedAt: p.updated_at ?? now, lastActiveAt: now,
    locationPermissionStatus: m.locationPermissionStatus || 'PROMPT', notificationPermissionStatus: m.notificationPermissionStatus || 'PROMPT',
    homeCity: p.home_city ?? m.homeCity ?? 'Austin', homeState: p.home_state ?? m.homeState ?? 'TX', homeZip: p.home_zip ?? m.homeZip,
    latitude: p.latitude ?? m.latitude, longitude: p.longitude ?? m.longitude,
    city: [p.home_city ?? m.homeCity ?? 'Austin', p.home_state ?? m.homeState ?? 'TX'].filter(Boolean).join(', '),
    favoriteSports: p.favorite_sports ?? m.favoriteSports ?? [], favoriteLeagues: p.favorite_leagues ?? m.favoriteLeagues ?? [],
    favoriteTeams: p.favorite_teams ?? m.favoriteTeams ?? [], preferredExperience: p.preferred_experience ?? m.preferredExperience ?? ['HIGH_ENERGY'],
    currentIntent: p.current_intent ?? m.currentIntent ?? 'HIGH_ENERGY', preferences: p.preferences ?? m.preferences ?? DEFAULT_PREFERENCES,
    privacySettings: p.privacy_settings ?? m.privacySettings ?? DEFAULT_PRIVACY, privacy: m.privacy || 'FRIENDS_ONLY',
    notificationPreferences: p.notification_preferences ?? m.notificationPreferences ?? DEFAULT_NOTIFICATIONS, savedVenueIds: p.saved_venue_ids ?? m.savedVenueIds ?? []
  } as User;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function getUserWithProfile(authUser: any): Promise<User> {
  return mergeAuthUserWithProfile(authUser, await getProfile(authUser.id));
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<ProfileRow | null> {
  if (!supabase) return null;
  const map: Record<string, keyof ProfileRow> = { username:'username', firstName:'first_name', lastName:'last_name', name:'display_name', profilePhotoUrl:'avatar_url', avatar:'avatar_url', onboardingCompleted:'onboarding_completed', onboardingStep:'onboarding_step', homeCity:'home_city', homeState:'home_state', homeZip:'home_zip', latitude:'latitude', longitude:'longitude', favoriteSports:'favorite_sports', favoriteLeagues:'favorite_leagues', preferredExperience:'preferred_experience', currentIntent:'current_intent', preferences:'preferences', privacySettings:'privacy_settings', notificationPreferences:'notification_preferences', savedVenueIds:'saved_venue_ids' };
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) if (map[key]) patch[map[key]] = value;
  if (!Object.keys(patch).length) return getProfile(userId);
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select('*').single();
  if (error) throw error;
  return data as ProfileRow;
}