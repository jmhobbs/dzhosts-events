import { test } from "node:test";
import assert from "node:assert/strict";
import { formatListTime, ordinalSuffix } from "../src/js/list-time-format.js";

test("formats in the given timezone with an ordinal day and lowercase am/pm", () => {
  const date = new Date("2026-10-10T20:00:00Z");
  assert.equal(
    formatListTime(date, "America/Chicago"),
    "October 10th at 3:00 pm CDT",
  );
  assert.equal(formatListTime(date, "UTC"), "October 10th at 8:00 pm UTC");
});

test("midnight and noon read as 12 am and 12 pm", () => {
  assert.equal(
    formatListTime(new Date("2026-10-11T00:00:00Z"), "UTC"),
    "October 11th at 12:00 am UTC",
  );
  assert.equal(
    formatListTime(new Date("2026-10-11T12:05:00Z"), "UTC"),
    "October 11th at 12:05 pm UTC",
  );
});

test("the day comes from the viewer's timezone, not UTC", () => {
  assert.equal(
    formatListTime(new Date("2026-11-01T02:00:00Z"), "America/Chicago"),
    "October 31st at 9:00 pm CDT",
  );
});

test("ordinal suffixes, including the teens", () => {
  const expected = {
    1: "st",
    2: "nd",
    3: "rd",
    4: "th",
    11: "th",
    12: "th",
    13: "th",
    21: "st",
    22: "nd",
    23: "rd",
    30: "th",
    31: "st",
  };
  for (const [day, suffix] of Object.entries(expected)) {
    assert.equal(ordinalSuffix(Number(day)), suffix, `day ${day}`);
  }
});
