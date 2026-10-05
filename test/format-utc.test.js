import { test } from "node:test";
import assert from "node:assert/strict";
import { formatUtc, toIsoUtc } from "../lib/format-utc.js";

// npm test runs with a non-UTC TZ so these also guard against local time leaks.
test("formatUtc renders a readable UTC string", () => {
  assert.equal(
    formatUtc(new Date("2026-10-13T00:00:00Z")),
    "Oct 13, 2026 00:00 UTC",
  );
  assert.equal(
    formatUtc(new Date("2026-01-05T23:07:00Z")),
    "Jan 5, 2026 23:07 UTC",
  );
});

test("toIsoUtc drops milliseconds", () => {
  assert.equal(
    toIsoUtc(new Date("2026-10-13T00:00:00.000Z")),
    "2026-10-13T00:00:00Z",
  );
});
