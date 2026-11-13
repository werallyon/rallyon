#!/usr/bin/env bash
set -euo pipefail

migration_dir="supabase/migrations"
if [[ ! -d "$migration_dir" ]]; then
  echo "Migration directory not found: $migration_dir" >&2
  exit 1
fi

declare -A seen_versions=()
count=0
shopt -s nullglob
for migration in "$migration_dir"/*.sql; do
  filename="${migration##*/}"
  if [[ ! "$filename" =~ ^([0-9]{14})_.+\.sql$ ]]; then
    echo "Invalid Supabase migration filename: $filename (expected <14-digit-version>_<name>.sql)" >&2
    exit 1
  fi

  version="${BASH_REMATCH[1]}"
  if [[ -n "${seen_versions[$version]:-}" ]]; then
    echo "Duplicate Supabase migration version $version:" >&2
    echo "  ${seen_versions[$version]}" >&2
    echo "  $filename" >&2
    exit 1
  fi

  seen_versions["$version"]="$filename"
  count=$((count + 1))
done

if [[ "$count" -eq 0 ]]; then
  echo "No root Supabase migrations found; refusing to treat the check as a pass." >&2
  exit 1
fi

echo "PASS: $count root Supabase migration filenames have valid, unique 14-digit versions."
