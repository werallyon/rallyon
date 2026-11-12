#!/usr/bin/env bash
set -euo pipefail

WORKDIR="validation"
INJECTION="$WORKDIR/supabase/migrations/20261112000250_validation_preflight_negative_case.sql"
BASE="$WORKDIR/supabase/migrations/20261112000100_validation_profiles_base.sql"
BASE_BACKUP="/tmp/rallyon-validation-profiles-base.sql"
OUTPUT="/tmp/rallyon-p0-migration-preflight.log"

cleanup() {
  rm -f "$INJECTION"
  if [[ -f "$BASE_BACKUP" ]]; then cp "$BASE_BACKUP" "$BASE"; rm -f "$BASE_BACKUP"; fi
}
trap cleanup EXIT

expect_preflight_failure() {
  local name="$1"
  local expected="$2"
  local sql="$3"

  printf '%s\n' "$sql" > "$INJECTION"
  if supabase --workdir "$WORKDIR" db reset >"$OUTPUT" 2>&1; then
    echo "FAIL: preflight unexpectedly accepted negative case: $name"
    cat "$OUTPUT"
    exit 1
  fi
  if ! grep -Fq "$expected" "$OUTPUT"; then
    echo "FAIL: negative case '$name' failed for an unexpected reason"
    cat "$OUTPUT"
    exit 1
  fi
  local db_container
  db_container="$(docker ps --filter "label=com.supabase.cli.project=rallyon-pr22-migration-validation" --format '{{.Names}}' | grep -E '(^|_)db_' | head -n 1)"
  local relation_absent
  relation_absent="$(docker exec "$db_container" psql -U postgres -d postgres -Atqc "select (to_regclass('public.user_favorite_teams') is null)::text")"
  if [[ "$relation_absent" != "true" ]]; then
    echo "FAIL: failed migration left public.user_favorite_teams behind for case: $name"
    exit 1
  fi
  echo "PASS: preflight rejected $name and transaction left no partial relation"
  rm -f "$INJECTION"
}

expect_preflight_failure \
  "permissive OR policy" \
  "exact owner predicate allowlist" \
  "create policy profiles_broad_select on public.profiles for select to authenticated using (true or auth.uid() = id);"

# auth.users is owned by Supabase's auth-admin role in the local stack, so a
# migration-role fixture cannot disable its trigger. Instead, remove trigger
# creation from the synthetic baseline and prove the exact preflight rejects
# the missing/incorrect bootstrap arrangement.
cp "$BASE" "$BASE_BACKUP"
python3 - "$BASE" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
content = path.read_text()
trigger = """create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
"""
if trigger not in content:
    raise SystemExit("expected trigger fixture not found")
path.write_text(content.replace(trigger, ""))
PY
if supabase --workdir "$WORKDIR" db reset >"$OUTPUT" 2>&1; then
  echo "FAIL: preflight unexpectedly accepted a missing Auth bootstrap trigger"
  cat "$OUTPUT"
  exit 1
fi
if ! grep -Fq "expected enabled AFTER INSERT row trigger" "$OUTPUT"; then
  echo "FAIL: missing-trigger case failed for an unexpected reason"
  cat "$OUTPUT"
  exit 1
fi
echo "PASS: preflight rejected missing Auth bootstrap trigger"
cp "$BASE_BACKUP" "$BASE"
rm -f "$BASE_BACKUP"

expect_preflight_failure \
  "missing RPC profile column" \
  "profile schema is incompatible" \
  "alter table public.profiles drop column current_intent;"

expect_preflight_failure \
  "malformed legacy favorite entry" \
  "legacy favorite entries lack a valid string id/name" \
  "update public.profiles set favorite_teams = '[{\"id\":\"bad-id\",\"name\":\"\"}]'::jsonb where id = 'a1000000-0000-4000-8000-000000000001';"

expect_preflight_failure \
  "non-array legacy favorite root" \
  "NULL or non-array favorite_teams" \
  "update public.profiles set favorite_teams = '{}'::jsonb where id = 'a1000000-0000-4000-8000-000000000001';"

expect_preflight_failure \
  "PUBLIC profile table grant" \
  "PUBLIC has" \
  "grant select on table public.profiles to public;"

expect_preflight_failure \
  "anon profile column grant" \
  "anon has" \
  "grant select (display_name) on table public.profiles to anon;"

expect_preflight_failure \
  "PUBLIC profile column grant" \
  "PUBLIC has" \
  "grant update (display_name) on table public.profiles to public;"

# Finish with a clean positive reset and verify the exact migrations still apply.
supabase --workdir "$WORKDIR" db reset
bash validation/run-local-sql.sh validation/supabase/verify.sql
