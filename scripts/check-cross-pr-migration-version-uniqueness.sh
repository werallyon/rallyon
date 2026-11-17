#!/usr/bin/env bash
set -euo pipefail

p0b_migration="${1:?Usage: check-cross-pr-migration-version-uniqueness.sh <P0-B migration file>}"
root_dir="${2:-supabase/migrations}"

if [[ ! -f "$p0b_migration" || ! -d "$root_dir" ]]; then
  echo "P0-B migration or root migration directory is missing." >&2
  exit 2
fi

filename="${p0b_migration##*/}"
if [[ ! "$filename" =~ ^([0-9]{14})_.+\.sql$ ]]; then
  echo "Invalid P0-B migration filename: $filename" >&2
  exit 1
fi
p0b_version="${BASH_REMATCH[1]}"

shopt -s nullglob
for migration in "$root_dir"/*.sql; do
  root_filename="${migration##*/}"
  if [[ "$root_filename" =~ ^([0-9]{14})_.+\.sql$ ]] && [[ "${BASH_REMATCH[1]}" == "$p0b_version" ]]; then
    echo "Cross-PR migration version collision $p0b_version:" >&2
    echo "  $filename (PR #17)" >&2
    echo "  $root_filename (PR #22/base)" >&2
    exit 1
  fi
done

echo "PASS: PR #17 version $p0b_version is unique against the actual PR #22 root migration directory."
