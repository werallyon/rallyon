#!/usr/bin/env bash
set -euo pipefail

WORKDIR="${1:-validation/cron}"
MIGRATION="${2:-supabase/migrations/20261114170000_rallyon_sync_games_schedule_timeout_v4.sql}"

if [[ ! -f "$WORKDIR/config.toml" ]]; then
  echo "Missing isolated Supabase config: $WORKDIR/config.toml" >&2
  exit 1
fi

if [[ ! -f "$MIGRATION" ]]; then
  echo "Missing Cron migration: $MIGRATION" >&2
  exit 1
fi

PROJECT_ID="$(basename "$WORKDIR")"
DB_CONTAINER="$(docker ps --filter "label=com.supabase.cli.project=$PROJECT_ID" --format '{{.Names}}' | grep -E '(^|_)db_' | head -n 1)"
if [[ -z "$DB_CONTAINER" ]]; then
  echo "Could not find the isolated Cron validation database container for project label $PROJECT_ID" >&2
  exit 1
fi

# Supabase's local Postgres image includes pg_cron. This setup is disposable;
# no hosted project, production Vault value, or production HTTP request is used.
docker exec "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "create extension if not exists pg_cron;"

# Run the actual migration inside an uncommitted transaction. pg_cron cannot
# see these job rows until commit, and the rollback guarantees no job survives.
# The command strings are inspected but never executed; this prevents any
# production-bound URL from being called during validation.
{
  printf 'BEGIN;\n'
  cat "$MIGRATION"
  cat <<'SQL'
DO $$
DECLARE
  v_hourly cron.job%rowtype;
  v_daily cron.job%rowtype;
  v_count integer;
BEGIN
  select count(*) into v_count
  from cron.job
  where jobname in ('rallyon-sync-games-hourly', 'rallyon-sync-games-upcoming-daily');
  if v_count <> 2 then
    raise exception 'expected exactly two scheduled jobs, found %', v_count;
  end if;

  select * into v_hourly from cron.job where jobname = 'rallyon-sync-games-hourly';
  select * into v_daily from cron.job where jobname = 'rallyon-sync-games-upcoming-daily';

  if v_hourly.schedule <> '0 * * * *' then
    raise exception 'hourly schedule changed unexpectedly: %', v_hourly.schedule;
  end if;
  if v_daily.schedule <> '15 * * * *' then
    raise exception 'daily guard schedule changed unexpectedly: %', v_daily.schedule;
  end if;
  if position('timeout_milliseconds := 120000' in v_hourly.command) = 0
     or position('timeout_milliseconds := 120000' in v_daily.command) = 0 then
    raise exception 'both Cron commands must use a 120-second HTTP timeout';
  end if;
  if position('America/Chicago' in v_daily.command) = 0
     or position('extract(hour' in lower(v_daily.command)) = 0
     or position('= 0' in v_daily.command) = 0 then
    raise exception 'daily command must preserve the Chicago-local hour-zero guard';
  end if;
  if position('x-rallyon-sync-window' in v_hourly.command) = 0
     or position('today' in v_hourly.command) = 0
     or position('x-rallyon-sync-window' in v_daily.command) = 0
     or position('upcoming' in v_daily.command) = 0 then
    raise exception 'Cron jobs must retain their today/upcoming request windows';
  end if;
END
$$;
ROLLBACK;
SQL
} | docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d postgres

REMAINING="$(docker exec "$DB_CONTAINER" psql -U postgres -d postgres -Atqc \
  "select count(*) from cron.job where jobname in ('rallyon-sync-games-hourly', 'rallyon-sync-games-upcoming-daily')")"
if [[ "$REMAINING" != "0" ]]; then
  echo "Cron migration rehearsal left $REMAINING job rows after rollback" >&2
  exit 1
fi

echo "PASS: actual Cron migration SQL executed transactionally; schedules/timeouts/Chicago guard verified; all job rows rolled back"
