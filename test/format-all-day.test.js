import { test } from "node:test";
import assert from "node:assert/strict";
import { formatAllDayRange } from "../lib/format-all-day.js";

const day = (iso) => new Date(`${iso}T00:00:00Z`);

// npm test runs with a non-UTC TZ, so these also guard against local date leaks.
test("one day shows a single date", () => {
  assert.equal(
    formatAllDayRange(day("2026-10-05"), day("2026-10-05")),
    "October 5th",
  );
});

test("days in one month share the month", () => {
  assert.equal(
    formatAllDayRange(day("2026-10-05"), day("2026-10-09")),
    "October 5th – 9th",
  );
});

test("days across months show both months", () => {
  assert.equal(
    formatAllDayRange(day("2026-10-30"), day("2026-11-02")),
    "October 30th – November 2nd",
  );
});

test("days across years show no year", () => {
  assert.equal(
    formatAllDayRange(day("2026-12-30"), day("2027-01-02")),
    "December 30th – January 2nd",
  );
});
