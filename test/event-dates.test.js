import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseEventDate,
  validateEvent,
  isUpcoming,
  sortByStart,
} from "../lib/event-dates.js";

test("parseEventDate converts an offset time to the correct instant", () => {
  const parsed = parseEventDate("2026-10-12T19:00:00-05:00", "a.md");
  assert.equal(parsed.toISOString(), "2026-10-13T00:00:00.000Z");
});

test("parseEventDate rejects a time without an offset and names the file", () => {
  assert.throws(
    () => parseEventDate("2026-10-12T19:00:00", "src/events/raid.md"),
    /src\/events\/raid\.md.*offset/,
  );
});

test("parseEventDate rejects an unquoted YAML date", () => {
  assert.throws(
    () => parseEventDate(new Date("2026-10-12T19:00:00Z"), "a.md"),
    /quote/,
  );
});

test("validateEvent requires title and start", () => {
  assert.throws(
    () => validateEvent({ start: "2026-10-12T19:00:00Z" }, "a.md"),
    /title/,
  );
  assert.throws(() => validateEvent({ title: "Raid" }, "a.md"), /start/);
});

test("validateEvent rejects end before start", () => {
  assert.throws(
    () =>
      validateEvent(
        {
          title: "Raid",
          start: "2026-10-12T19:00:00Z",
          end: "2026-10-12T18:00:00Z",
        },
        "a.md",
      ),
    /end.*before.*start/,
  );
});

test("validateEvent returns parsed dates and optional fields", () => {
  const validated = validateEvent(
    {
      title: "Raid",
      start: "2026-10-12T19:00:00Z",
      host: "Namalsk Nights",
      description: "Four hours of open raiding.",
    },
    "a.md",
  );
  assert.equal(validated.title, "Raid");
  assert.equal(validated.host, "Namalsk Nights");
  assert.equal(validated.description, "Four hours of open raiding.");
  assert.equal(validated.start.toISOString(), "2026-10-12T19:00:00.000Z");
  assert.equal(validated.end, null);
});

test("validateEvent defaults optional fields to null", () => {
  const validated = validateEvent(
    { title: "Raid", start: "2026-10-12T19:00:00Z" },
    "a.md",
  );
  assert.equal(validated.host, null);
  assert.equal(validated.description, null);
});

test("validateEvent rejects a description that is not text", () => {
  assert.throws(
    () =>
      validateEvent(
        {
          title: "Raid",
          start: "2026-10-12T19:00:00Z",
          description: ["a", "list"],
        },
        "src/events/raid.md",
      ),
    /src\/events\/raid\.md.*description/,
  );
});

test("isUpcoming treats an in-progress event as upcoming", () => {
  const event = {
    start: new Date("2026-10-12T19:00:00Z"),
    end: new Date("2026-10-12T22:00:00Z"),
  };
  assert.equal(isUpcoming(event, new Date("2026-10-12T20:00:00Z")), true);
});

test("isUpcoming is inclusive of the end instant", () => {
  const end = new Date("2026-10-12T22:00:00Z");
  const event = { start: new Date("2026-10-12T19:00:00Z"), end };
  assert.equal(isUpcoming(event, end), true);
  assert.equal(isUpcoming(event, new Date(end.getTime() + 1)), false);
});

test("isUpcoming falls back to start when there is no end", () => {
  const start = new Date("2026-10-12T19:00:00Z");
  const event = { start, end: null };
  assert.equal(isUpcoming(event, start), true);
  assert.equal(isUpcoming(event, new Date(start.getTime() + 1)), false);
});

test("sortByStart orders soonest first without mutating input", () => {
  const later = { start: new Date("2026-11-01T00:00:00Z") };
  const sooner = { start: new Date("2026-10-01T00:00:00Z") };
  const input = [later, sooner];
  assert.deepEqual(sortByStart(input), [sooner, later]);
  assert.deepEqual(input, [later, sooner]);
});

test("validateEvent returns tags as a list, empty by default", () => {
  const base = { title: "Raid", start: "2026-10-12T19:00:00Z" };
  assert.deepEqual(validateEvent(base, "a.md").tags, []);
  assert.deepEqual(validateEvent({ ...base, tags: "XBOX" }, "a.md").tags, [
    "XBOX",
  ]);
  assert.deepEqual(
    validateEvent({ ...base, tags: ["XBOX", "PvP"] }, "a.md").tags,
    ["XBOX", "PvP"],
  );
});

test("validateEvent rejects non-text tags and the reserved events tag", () => {
  const base = { title: "Raid", start: "2026-10-12T19:00:00Z" };
  assert.throws(
    () => validateEvent({ ...base, tags: [42] }, "src/events/raid.md"),
    /src\/events\/raid\.md.*tags/,
  );
  assert.throws(
    () => validateEvent({ ...base, tags: ["events"] }, "src/events/raid.md"),
    /src\/events\/raid\.md.*events.*reserved/,
  );
});

test("validateEvent accepts a year/month folder matching the written start", () => {
  // 19:00 at -05:00 on Oct 31 is Nov 1 in UTC, but the author filed it under October.
  const event = { title: "Raid", start: "2026-10-31T19:00:00-05:00" };
  assert.doesNotThrow(() =>
    validateEvent(event, "./src/events/2026/10/raid.md"),
  );
});

test("validateEvent rejects a year/month folder that does not match start", () => {
  const event = { title: "Raid", start: "2026-10-12T19:00:00Z" };
  assert.throws(
    () => validateEvent(event, "./src/events/2026/11/raid.md"),
    /src\/events\/2026\/11\/raid\.md.*2026\/10/,
  );
});

test("validateEvent allows event files outside a year/month folder", () => {
  const event = { title: "Raid", start: "2026-10-12T19:00:00Z" };
  assert.doesNotThrow(() => validateEvent(event, "./src/events/raid.md"));
});

const allDayBase = { title: "Novikostok Playtest" };

test("validateEvent reads date-only start and end as an all-day range", () => {
  const event = validateEvent(
    { ...allDayBase, start: "2026-10-05", end: "2026-10-09" },
    "./src/events/2026/10/novikostok.md",
  );
  assert.equal(event.allDay, true);
  assert.equal(event.start.toISOString(), "2026-10-05T00:00:00.000Z");
  assert.equal(event.end.toISOString(), "2026-10-09T00:00:00.000Z");
});

test("validateEvent treats a date-only start with no end as one day", () => {
  const event = validateEvent({ ...allDayBase, start: "2026-10-05" }, "a.md");
  assert.equal(event.allDay, true);
  assert.equal(event.end.toISOString(), "2026-10-05T00:00:00.000Z");
});

test("validateEvent marks timed events as not all-day", () => {
  const event = validateEvent(
    { ...allDayBase, start: "2026-10-05T18:00:00Z" },
    "a.md",
  );
  assert.equal(event.allDay, false);
});

test("validateEvent rejects mixing date-only and timed values", () => {
  assert.throws(
    () =>
      validateEvent(
        { ...allDayBase, start: "2026-10-05", end: "2026-10-09T18:00:00Z" },
        "a.md",
      ),
    /a\.md.*both/,
  );
  assert.throws(
    () =>
      validateEvent(
        { ...allDayBase, start: "2026-10-05T18:00:00Z", end: "2026-10-09" },
        "a.md",
      ),
    /a\.md.*both/,
  );
});

test("validateEvent rejects a date that does not exist", () => {
  assert.throws(
    () => validateEvent({ ...allDayBase, start: "2026-02-30" }, "a.md"),
    /a\.md.*2026-02-30/,
  );
});

const novikostok = {
  allDay: true,
  start: new Date("2026-10-05T00:00:00Z"),
  end: new Date("2026-10-09T00:00:00Z"),
};
const millisecondAfter = (iso) => new Date(new Date(iso).getTime() + 1);

test("all-day events stay upcoming until the last day ends in UTC-12", () => {
  const endEverywhere = "2026-10-10T12:00:00Z";
  assert.equal(isUpcoming(novikostok, new Date(endEverywhere)), true);
  assert.equal(isUpcoming(novikostok, millisecondAfter(endEverywhere)), false);
});

const hostBase = {
  title: "Raid",
  start: "2026-10-12T19:00:00Z",
  host: "Natural Selection",
};

test("validateEvent returns hostLink when it is an http(s) URL", () => {
  const event = validateEvent(
    { ...hostBase, hostLink: "https://discord.com/invite/example" },
    "a.md",
  );
  assert.equal(event.hostLink, "https://discord.com/invite/example");
  assert.equal(validateEvent(hostBase, "a.md").hostLink, null);
});

test("validateEvent rejects a hostLink that is not an http(s) URL", () => {
  for (const hostLink of ["javascript:alert(1)", "not a url", 42]) {
    assert.throws(
      () => validateEvent({ ...hostBase, hostLink }, "src/events/raid.md"),
      /src\/events\/raid\.md.*hostLink/,
    );
  }
});

test("validateEvent rejects a hostLink without a host", () => {
  const { host, ...withoutHost } = hostBase;
  assert.throws(
    () =>
      validateEvent(
        { ...withoutHost, hostLink: "https://example.com" },
        "src/events/raid.md",
      ),
    /src\/events\/raid\.md.*hostLink.*host/,
  );
});

const imageBase = {
  title: "Raid",
  start: "2026-10-12T19:00:00Z",
  image: "raid.png",
  imageAlt: "Raid poster",
};
const imageSourcePath = "./src/events/2026/10/raid.md";
const existingFiles = (...paths) => ({
  fileExists: (path) => paths.includes(path),
});

test("validateEvent resolves the image next to the event file", () => {
  const event = validateEvent(
    imageBase,
    imageSourcePath,
    existingFiles("src/events/2026/10/raid.png"),
  );
  assert.equal(event.imagePath, "src/events/2026/10/raid.png");
  assert.equal(event.imageAlt, "Raid poster");
});

test("validateEvent leaves image fields null without an image", () => {
  const { image, imageAlt, ...withoutImage } = imageBase;
  const event = validateEvent(withoutImage, imageSourcePath, existingFiles());
  assert.equal(event.imagePath, null);
  assert.equal(event.imageAlt, null);
});

test("validateEvent requires imageAlt with an image", () => {
  assert.throws(
    () =>
      validateEvent(
        { ...imageBase, imageAlt: "" },
        imageSourcePath,
        existingFiles("src/events/2026/10/raid.png"),
      ),
    /raid\.md.*imageAlt/,
  );
});

test("validateEvent rejects a missing image file", () => {
  assert.throws(
    () => validateEvent(imageBase, imageSourcePath, existingFiles()),
    /raid\.md.*src\/events\/2026\/10\/raid\.png/,
  );
});

test("validateEvent rejects unsupported image types and remote URLs", () => {
  for (const image of ["raid.gif", "https://cdn.discordapp.com/raid.png"]) {
    assert.throws(
      () =>
        validateEvent(
          { ...imageBase, image },
          imageSourcePath,
          existingFiles(`src/events/2026/10/${image}`),
        ),
      /raid\.md.*image/,
    );
  }
});
