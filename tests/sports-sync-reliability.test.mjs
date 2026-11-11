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
