import { SportsGame } from '../types';
import { supabase } from '../lib/supabaseClient';

function mapGame(row: any): SportsGame {
  return {
    id: row.id,
    league: row.league,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
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


export async function syncGames(): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase.functions.invoke('sync-games', { body: {} });
  if (error) throw error;
  return Number(data?.synced ?? 0);
}
