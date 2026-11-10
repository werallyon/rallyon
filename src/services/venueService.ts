import { Venue, VenueGame, VenueGameProgramming } from '../types';
import { supabase } from '../lib/supabaseClient';

function mapVenue(row: any): Venue {
  return {
    id: row.id,
    market_id: row.market_id ?? undefined,
    city_id: row.city_id ?? undefined,
    isDemoData: Boolean(row.is_demo_data),
    name: row.name,
    address: row.address,
    neighborhood: row.neighborhood ?? '',
    city: row.city,
    state: row.state,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    imageUrl: row.image_url ?? '',
    categories: row.categories ?? [],
    atmosphere: row.atmosphere ?? [],
    fanBases: row.fan_bases ?? [],
    features: row.features ?? [],
    baseline: row.baseline ?? { category: 'Sports Bar', neighborhood: row.neighborhood ?? '', priceLevel: '$$', capacity: 0 },
    venueTruth: row.venue_truth ?? { sports: {}, environment: {}, audience: {}, experience: {} },
    claimed: Boolean(row.claimed),
    googlePlaceId: row.google_place_id ?? undefined,
    googlePlaceData: row.google_place_data ?? undefined,
    reliabilityScore: row.reliability_score == null ? undefined : Number(row.reliability_score),
    claimedByUserId: row.claimed_by_user_id ?? undefined
  };
}

export async function getVenues(): Promise<Venue[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('venues').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(mapVenue);
}

export async function getVenueGameProgramming(): Promise<VenueGameProgramming[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('venue_game_programming').select('*').order('start_time');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    venue_id: row.venue_id,
    game_id: row.game_id,
    network: row.network ?? undefined,
    status: row.status,
    is_confirmed: row.is_confirmed,
    audio_on: row.audio_on,
    screen: row.screen ?? undefined,
    featured: row.featured,
    notes: row.notes ?? undefined,
    confidence: Number(row.confidence ?? 0),
    verified_at: row.verified_at ?? undefined,
    created_by: row.created_by ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at,
    start_time: row.start_time ?? undefined,
    end_time: row.end_time ?? undefined
  }));
}

export async function toggleVenueFavorite(userId: string, venueId: string, saved: boolean): Promise<void> {
  if (!supabase) return;
  if (saved) {
    const { error } = await supabase.from('venue_favorites').delete().eq('user_id', userId).eq('venue_id', venueId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('venue_favorites').insert({ user_id: userId, venue_id: venueId });
    if (error) throw error;
  }
}

export async function getFavoriteVenueIds(userId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('venue_favorites').select('venue_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.venue_id);
}
