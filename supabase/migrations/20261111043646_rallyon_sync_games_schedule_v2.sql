-- RallyOn sports sync scheduling v2
-- Applied to Supabase project nqdrfwvxomecduxmmzrc on 2026-11-11.
-- Generates a fresh sync token, stores only its SHA-256 hash in
-- public.system_sync_tokens, stores the raw token in Supabase Vault, and
-- schedules the sync-games Edge Function hourly.
--
-- The Edge Function validates x-rallyon-sync-token against the hash.

do $$
declare
  v_token text := encode(gen_random_bytes(32), 'hex');
begin
  perform vault.create_secret(v_token, 'rallyon_sync_games_token');

  update public.system_sync_tokens
  set token_sha256 = encode(digest(v_token, 'sha256'), 'hex'),
      created_at = now()
  where name = 'sync-games';

  if not found then
    insert into public.system_sync_tokens(name, token_sha256)
    values ('sync-games', encode(digest(v_token, 'sha256'), 'hex'));
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'rallyon-sync-games-hourly';

  perform cron.schedule(
    'rallyon-sync-games-hourly',
    '0 * * * *',
    $job$
    select net.http_post(
      url := 'https://nqdrfwvxomecduxmmzrc.supabase.co/functions/v1/sync-games',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-rallyon-sync-token',
          (select decrypted_secret from vault.decrypted_secrets where name = 'rallyon_sync_games_token')
      ),
      body := '{}'::jsonb
    );
    $job$
  );
end
$$;
