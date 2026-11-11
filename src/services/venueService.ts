import { Venue, VenueGame, VenueGameProgramming } from '../types';
import { supabase } from '../lib/supabaseClient';
import { isDemoMode } from '../config/dataMode';

function mapVenue(row: any): Venue {
  return {
    id: row.id,
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
  let query = supabase.from('venues').select('*').order('name');
  if (!isDemoMode) query = query.eq('is_demo_data', false);
  const { data, error } = await query;
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
    end_time: row.end_time ?? undefined,
    source_type: row.source_type ?? 'MANUAL',
    source_url: row.source_url ?? undefined,
    verification_notes: row.verification_notes ?? undefined
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

export async function upsertVenueGameProgramming(params: {
  id?: string;
  venue_id: string;
  game_id: string;
  network?: string;
  status: VenueGameProgramming['status'];
  is_confirmed?: boolean;
  audio_on?: boolean;
  screen?: string;
  featured?: boolean;
  notes?: string;
  confidence?: number;
  verified_at?: string;
  created_by?: string;
  start_time?: string;
  end_time?: string;
  source_type?: VenueGameProgramming['source_type'];
  source_url?: string;
  verification_notes?: string;
}): Promise<VenueGameProgramming> {
  if (!supabase) throw new Error('Supabase is not configured');
  const payload = {
    ...(params.id ? { id: params.id } : {}),
    venue_id: params.venue_id,
    game_id: params.game_id,
    network: params.network ?? null,
    status: params.status,
    is_confirmed: params.is_confirmed ?? (params.status === 'CONFIRMED' || params.status === 'GAME_ON'),
    audio_on: params.audio_on ?? true,
    screen: params.screen ?? null,
    featured: params.featured ?? false,
    notes: params.notes ?? null,
    confidence: params.confidence ?? 0,
    verified_at: params.verified_at ?? new Date().toISOString(),
    created_by: params.created_by ?? null,
    start_time: params.start_time ?? null,
    end_time: params.end_time ?? null,
    source_type: params.source_type ?? 'MANUAL',
    source_url: params.source_url ?? null,
    verification_notes: params.verification_notes ?? null
  };
  const { data, error } = await supabase
    .from('venue_game_programming')
    .upsert(payload, { onConflict: 'venue_id,game_id' })
    .select('*')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    venue_id: data.venue_id,
    game_id: data.game_id,
    network: data.network ?? undefined,
    status: data.status,
    is_confirmed: data.is_confirmed,
    audio_on: data.audio_on,
    screen: data.screen ?? undefined,
    featured: data.featured,
    notes: data.notes ?? undefined,
    confidence: Number(data.confidence ?? 0),
    verified_at: data.verified_at ?? undefined,
    created_by: data.created_by ?? '',
    created_at: data.created_at,
    updated_at: data.updated_at,
    start_time: data.start_time ?? undefined,
    end_time: data.end_time ?? undefined,
    source_type: data.source_type ?? 'MANUAL',
    source_url: data.source_url ?? undefined,
    verification_notes: data.verification_notes ?? undefined
  };
}

export async function deleteVenueGameProgramming(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('venue_game_programming').delete().eq('id', id);
  if (error) throw error;
}

export async function getFavoriteVenueIds(userId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('venue_favorites').select('venue_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.venue_id);
}
