/**
 * Shared ingestion helpers used by the Edge Function and manual recovery script.
 * Calendar dates are computed in RallyOn's default market timezone, not UTC.
 */
export function getSyncDates(now = new Date(), options = {}) {
  const { days = 1, startOffset = 0, timeZone = "America/Chicago" } = options;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const firstDay = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) + startOffset,
  ));

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(firstDay);
    date.setUTCDate(firstDay.getUTCDate() + index);
    return date.toISOString().slice(0, 10).replaceAll("-", "");
  });
}

export function getSyncOutcome(synced, diagnostics = []) {
  const providerFailures = diagnostics.length;
  return {
    synced,
    complete: providerFailures === 0,
    partial: providerFailures > 0 && synced > 0,
    failed: providerFailures > 0,
    statusCode: providerFailures > 0 ? 502 : 200,
  };
}

export function constantTimeEqual(left, right) {
  const a = new TextEncoder().encode(String(left));
  const b = new TextEncoder().encode(String(right));
  if (a.length !== b.length) return false;

  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}
