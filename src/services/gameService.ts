import { SportsGame } from '../types';
import { supabase } from '../lib/supabaseClient';

const GAME_HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;
const GAME_LOOKAHEAD_WINDOW_MS = 8 * 24 * 60 * 60 * 1000;

const GAME_STATUS_PRIORITY: Record<SportsGame['status'], number> = {
  LIVE: 0,
  HALFTIME: 0,
  DELAYED: 1,
  UPCOMING: 2,
  FINAL: 3,
  POSTPONED: 4,
  CANCELLED: 5
};

function isRelevantGame(game: SportsGame, now: number): boolean {
  const startTime = Date.parse(game.startTime);
  if (!Number.isFinite(startTime)) return false;

  // Keep live events even when their scheduled start is older than the normal window.
  if (game.status === 'LIVE' || game.status === 'HALFTIME') return true;

  // ESPN syncs today's slate plus the next seven days. Retain yesterday's
  // late finishes, but keep older historical fixtures out of fan-facing lists.
  return startTime >= now - GAME_HISTORY_WINDOW_MS &&
    startTime <= now + GAME_LOOKAHEAD_WINDOW_MS;
}

function sortGamesForFanDisplay(a: SportsGame, b: SportsGame): number {
  const priorityDifference = GAME_STATUS_PRIORITY[a.status] - GAME_STATUS_PRIORITY[b.status];
  if (priorityDifference !== 0) return priorityDifference;

  const aStart = Date.parse(a.startTime);
  const bStart = Date.parse(b.startTime);

  // Most recently completed games should appear first within the final-score group.
  if (a.status === 'FINAL' && b.status === 'FINAL') return bStart - aStart;
  return aStart - bStart;
}

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
  const now = Date.now();
  return (data ?? [])
    .map(mapGame)
    .filter((game) => isRelevantGame(game, now))
    .sort(sortGamesForFanDisplay);
}

