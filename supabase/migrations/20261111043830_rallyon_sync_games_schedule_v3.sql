-- RallyOn sports sync scheduling v3
-- Applied to Supabase project nqdrfwvxomecduxmmzrc on 2026-11-11.
-- Hourly job refreshes today's games; daily job refreshes the next 7 days.
-- Both calls authenticate with the Vault-backed x-rallyon-sync-token.

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
      body := '{}'::jsonb
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
      body := '{}'::jsonb
    );
    $daily$
  );
end
$$;
