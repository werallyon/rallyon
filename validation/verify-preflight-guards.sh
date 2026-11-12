#!/usr/bin/env bash
set -euo pipefail

WORKDIR="validation"
INJECTION="$WORKDIR/supabase/migrations/20261112000250_validation_preflight_negative_case.sql"
OUTPUT="/tmp/rallyon-p0-migration-preflight.log"

cleanup() {
  rm -f "$INJECTION"
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
  echo "PASS: preflight rejected $name"
  rm -f "$INJECTION"
}

expect_preflight_failure \
  "permissive OR policy" \
  "exact owner predicate allowlist" \
  "create policy profiles_broad_select on public.profiles for select to authenticated using (true or auth.uid() = id);"

expect_preflight_failure \
  "disabled Auth bootstrap trigger" \
  "expected enabled AFTER INSERT row trigger" \
  "alter table auth.users disable trigger on_auth_user_created;"

expect_preflight_failure \
  "missing RPC profile column" \
  "profile schema is incompatible" \
  "alter table public.profiles drop column current_intent;"

expect_preflight_failure \
  "PUBLIC profile table grant" \
  "PUBLIC has" \
  "grant select on table public.profiles to public;"

# Finish with a clean positive reset and verify the exact migrations still apply.
supabase --workdir "$WORKDIR" db reset
supabase --workdir "$WORKDIR" db query --local --file supabase/verify.sql
