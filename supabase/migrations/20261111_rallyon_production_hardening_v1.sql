-- RallyOn production hardening v1
-- Applied to Supabase project nqdrfwvxomecduxmmzrc on 2026-11-11.
-- This migration is intentionally client-deny for system_sync_tokens; the
-- Edge Function/service role remains able to use the table.

drop policy if exists programming_owner_insert on public.venue_game_programming;
drop policy if exists programming_owner_update on public.venue_game_programming;
drop policy if exists programming_owner_delete on public.venue_game_programming;
drop policy if exists venue_game_programming_insert_claimed_owner on public.venue_game_programming;
drop policy if exists venue_game_programming_update_claimed_owner on public.venue_game_programming;
drop policy if exists venue_game_programming_delete_claimed_owner on public.venue_game_programming;

create policy system_sync_tokens_client_select_deny
  on public.system_sync_tokens for select to anon, authenticated
  using (false);

create policy system_sync_tokens_client_insert_deny
  on public.system_sync_tokens for insert to anon, authenticated
  with check (false);

create policy system_sync_tokens_client_update_deny
  on public.system_sync_tokens for update to anon, authenticated
  using (false) with check (false);

create policy system_sync_tokens_client_delete_deny
  on public.system_sync_tokens for delete to anon, authenticated
  using (false);

create index if not exists cities_market_id_idx
  on public.cities(market_id);

create index if not exists venues_claimed_by_user_id_idx
  on public.venues(claimed_by_user_id);

create index if not exists venue_favorites_venue_id_idx
  on public.venue_favorites(venue_id);

create index if not exists venue_checkins_user_id_idx
  on public.venue_checkins(user_id);

create index if not exists venue_game_programming_created_by_idx
  on public.venue_game_programming(created_by);

create index if not exists venue_presence_user_id_idx
  on public.venue_presence(user_id);

create index if not exists venue_signals_created_by_idx
  on public.venue_signals(created_by);
