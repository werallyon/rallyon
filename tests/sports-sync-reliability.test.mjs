import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  constantTimeEqual,
  getSyncDates,
  getSyncOutcome,
} from "../supabase/functions/_shared/sync-utils.js";

test("partial provider failure remains failed while retaining successful upsert count", () => {
  assert.deepEqual(getSyncOutcome(12, [{ league: "NBA", status: 503 }]), {
    synced: 12,
    complete: false,
    partial: true,
    failed: true,
    statusCode: 502,
  });
});

test("all-provider failure is non-success even when no games were returned", () => {
  assert.equal(getSyncOutcome(0, [{ league: "NFL", status: 503 }]).statusCode, 502);
});

test("successful empty provider responses remain a successful empty sync", () => {
  assert.deepEqual(getSyncOutcome(0, []), {
    synced: 0,
    complete: true,
    partial: false,
    failed: false,
    statusCode: 200,
  });
});

test("complete provider response returns success", () => {
  assert.equal(getSyncOutcome(26, []).statusCode, 200);
});

test("sync dates follow America/Chicago calendar across UTC midnight", () => {
  const now = new Date("2026-11-10T02:00:00.000Z");
  assert.deepEqual(getSyncDates(now), ["20261109"]);
  assert.deepEqual(getSyncDates(now, { days: 7, startOffset: 1 }), [
    "20261110", "20261111", "20261112", "20261113",
    "20261114", "20261115", "20261116",
  ]);
});

test("sync date arithmetic remains calendar-correct across DST", () => {
  const now = new Date("2026-03-08T08:30:00.000Z");
  assert.deepEqual(getSyncDates(now, { days: 3 }), [
    "20260308", "20260309", "20260310",
  ]);
});

test("custom sync token comparison accepts equal values and rejects mismatches", () => {
  assert.equal(constantTimeEqual("a".repeat(64), "a".repeat(64)), true);
  assert.equal(constantTimeEqual("a".repeat(64), "b".repeat(64)), false);
  assert.equal(constantTimeEqual("short", "longer"), false);
});

test("production Edge Function has no seeded fixture dependency and uses idempotent upsert", async () => {
  const source = await readFile(new URL("../supabase/functions/sync-games/index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /SEEDED_GAMES|seedData|demo.?fixture/i);
  assert.match(source, /on_conflict=league,external_game_id/);
  assert.match(source, /x-rallyon-sync-token/);
  assert.match(source, /outcome\.statusCode/);
});

test("production function gateway config requires the custom in-function token check", async () => {
  const config = await readFile(new URL("../supabase/config.toml", import.meta.url), "utf8");
  assert.match(config, /\[functions\.sync-games\]/);
  assert.match(config, /verify_jwt\s*=\s*false/);
});

test("manual recovery uses the production ESPN host and fails non-zero on partial provider errors", async () => {
  const source = await readFile(new URL("../scripts/sync-espn.mjs", import.meta.url), "utf8");
  assert.match(source, /getSyncOutcome/);
  assert.match(source, /process\.exitCode = 1/);
  assert.match(source, /site\.web\.api\.espn\.com/);
  assert.doesNotMatch(source, /site\.api\.espn\.com/);
});

test("GitHub sports recovery workflow is manual-only, not a competing scheduler", async () => {
  const workflow = await readFile(new URL("../.github/workflows/sports-sync.yml", import.meta.url), "utf8");
  assert.match(workflow, /workflow_dispatch/);
  assert.doesNotMatch(workflow, /^\s*schedule:/m);
  assert.match(workflow, /confirm_production_write/);
});

test("games schema keeps the composite external-event uniqueness constraint", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20261110_create_rallyon_core_data_model.sql", import.meta.url), "utf8");
  assert.match(migration, /unique\s*\(league,\s*external_game_id\)/i);
});

test("production hardening migration creates sync token table before applying deny policies", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20261111_rallyon_production_hardening_v1.sql", import.meta.url), "utf8");
  assert.match(migration, /create table if not exists public\.system_sync_tokens/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /grant select on table public\.system_sync_tokens to service_role/i);
  assert.ok(migration.indexOf("create table if not exists public.system_sync_tokens") < migration.indexOf("create policy system_sync_tokens_client_select_deny"));
});
 
test("final Cron migration replaces the two existing jobs with a longer HTTP timeout", async () => {
  const migration = await readFile(new URL("../supabase/migrations/20261114170000_rallyon_sync_games_schedule_timeout_v4.sql", import.meta.url), "utf8");
  assert.match(migration, /cron\.unschedule/);
  assert.equal((migration.match(/cron\.schedule\(/g) ?? []).length, 2);
  assert.match(migration, /timeout_milliseconds := 120000/);
  assert.match(migration, /rallyon-sync-games-hourly/);
  assert.match(migration, /rallyon-sync-games-upcoming-daily/);
  assert.match(migration, /'15 \* \* \* \*'/);
  assert.match(migration, /extract\(hour from \(now\(\) at time zone 'America\/Chicago'\)\) = 0/i);
  assert.equal(migration.includes(["cron.schedule(", "    'rallyon-sync-games-upcoming-daily',", "    '15 0 * * *'"].join("\n")), false);
});
