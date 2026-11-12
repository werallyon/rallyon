import { SportsGame } from '../types';
import { supabase } from '../lib/supabaseClient';

function mapGame(row: any): SportsGame {
  const fallbackTeam = (participant: any, label: string) => ({
    name: participant?.name ?? label,
    abbrev: participant?.abbrev ?? '',
    logo: participant?.logo ?? '',
  });
  const participants = Array.isArray(row.participants) ? row.participants : [];
  return {
    id: row.id,
    league: row.league,
    sport: row.sport ?? undefined,
    eventType: row.event_type ?? undefined,
    participants: participants.length ? participants : undefined,
    homeTeam: row.home_team ?? fallbackTeam(participants[0], 'Event'),
    awayTeam: row.away_team ?? fallbackTeam(participants[1], 'Participants'),
    startTime: row.start_time,
    status: row.status,
    liveDetails: row.live_details ?? undefined,
    broadcastNetwork: row.broadcast_network ?? undefined,
    broadcast: row.broadcast ?? undefined,
    venueName: row.venue_name ?? undefined,
    season: row.season ?? undefined,
    externalGameId: row.external_game_id ?? undefined,
    lastUpdated: row.last_updated ?? undefined
  };
}

export async function getStoredGames(): Promise<SportsGame[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('games').select('*').order('start_time');
  if (error) throw error;
  return (data ?? []).map(mapGame);
}

