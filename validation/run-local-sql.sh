#!/usr/bin/env bash
set -euo pipefail

SQL_FILE="${1:?Usage: run-local-sql.sh <sql-file>}"
PROJECT_ID="rallyon-pr22-migration-validation"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "SQL file not found: $SQL_FILE" >&2
  exit 2
fi

DB_CONTAINER="$(docker ps --filter "label=com.supabase.cli.project=$PROJECT_ID" --format '{{.Names}}' | grep -E '(^|_)db_' | head -n 1 || true)"
if [[ -z "$DB_CONTAINER" ]]; then
  echo "Could not locate the isolated local Supabase database container for $PROJECT_ID" >&2
  docker ps --format 'table {{.Names}}\t{{.Labels}}'
  exit 3
fi

# psql executes the complete multi-statement file and stops at the first error.
# This is intentionally local Docker-only; no hosted connection string is read.
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$SQL_FILE"
