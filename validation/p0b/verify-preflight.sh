#!/usr/bin/env bash
set -euo pipefail

WORKDIR="validation/p0b"
MIGRATIONS="$WORKDIR/supabase/migrations"
LOG="/tmp/rallyon-p0b-preflight.log"
CONFLICT="$MIGRATIONS/20261113000050_p0b_preexisting_relation_fixture.sql"

expect_failure() {
  local fixture="$1"
  local expected="$2"
  cp "$fixture" "$CONFLICT"
  if supabase --workdir "$WORKDIR" db reset >"$LOG" 2>&1; then
    echo "FAIL: migration unexpectedly accepted pre-existing schema fixture: $fixture"
    cat "$LOG"
    rm -f "$CONFLICT"
    exit 1
  fi
  if ! grep -Fq "$expected" "$LOG"; then
    echo "FAIL: migration rejected fixture for an unexpected reason: $fixture"
    cat "$LOG"
    rm -f "$CONFLICT"
    exit 1
  fi
  echo "PASS: P0-B migration failed closed for $fixture"
  rm -f "$CONFLICT"
}

expect_failure "validation/p0b/fixtures/preexisting-sports.sql" \
  "refusing to adopt pre-existing canonical/provider relations"
expect_failure "validation/p0b/fixtures/incompatible-games-reference.sql" \
  "incompatible pre-existing game reference columns"
expect_failure "validation/p0b/fixtures/partial-game-references.sql" \
  "only part of the canonical game-reference column set exists"
expect_failure "validation/p0b/fixtures/populated-game-references.sql" \
  "pre-existing canonical game-reference columns contain data"

# Leave the local project in a clean, successfully migrated state.
supabase --workdir "$WORKDIR" db reset
bash validation/p0b/run-local-sql.sh validation/p0b/verify.sql
