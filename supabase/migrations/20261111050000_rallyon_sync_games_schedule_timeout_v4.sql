-- RallyOn sports sync scheduling v4
-- Increase pg_net's request timeout for the two existing jobs. The Edge
-- Function fetches seven leagues (and, for the daily run, seven dates).
-- This migration replaces the same named jobs; it does not create duplicates.
-- It reuses the existing Vault token and does not rotate or expose it.

do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname in ('rallyon-sync-games-hourly', 'rallyon-sync-games-upcoming-daily');

  perform cron.schedule(
    'rallyon-sync-games-hourly',
    '0 * * * *',
    $hourly$
    select net.http_post(
      url := 'https://nqdrfwvxomecduxmmzrc.supabase.co/functions/v1/sync-games',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-rallyon-sync-token',
          (select decrypted_secret from vault.decrypted_secrets where name = 'rallyon_sync_games_token'),
        'x-rallyon-sync-window', 'today'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
    $hourly$
  );

  perform cron.schedule(
    'rallyon-sync-games-upcoming-daily',
    '15 0 * * *',
    $daily$
    select net.http_post(
      url := 'https://nqdrfwvxomecduxmmzrc.supabase.co/functions/v1/sync-games',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-rallyon-sync-token',
          (select decrypted_secret from vault.decrypted_secrets where name = 'rallyon_sync_games_token'),
        'x-rallyon-sync-window', 'upcoming'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
    $daily$
  );
end
$$;
