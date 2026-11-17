-- RallyOn sports sync scheduling v4
-- Increase pg_net's request timeout for the two existing jobs. The Edge
-- Function fetches seven leagues (and, for the daily run, seven dates).
-- Preserve the deployed America/Chicago midnight behavior for the upcoming
-- sync: pg_cron runs this lightweight guard hourly, but only sends the HTTP
-- request when the Chicago calendar hour is 00. A fixed '15 0 * * *' UTC
-- schedule shifts the run to early evening Chicago time and is not equivalent.
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
    '15 * * * *',
    $daily$
    select case
      when extract(hour from (now() at time zone 'America/Chicago')) = 0
      then net.http_post(
        url := 'https://nqdrfwvxomecduxmmzrc.supabase.co/functions/v1/sync-games',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-rallyon-sync-token',
            (select decrypted_secret from vault.decrypted_secrets where name = 'rallyon_sync_games_token'),
          'x-rallyon-sync-window', 'upcoming'
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      )
      else null
    end;
    $daily$
  );
end
$$;
