import { test } from "node:test";
import assert from "node:assert/strict";
import {
  escapeIcsText,
  foldIcsLine,
  formatIcsUtc,
  buildIcsCalendar,
} from "../lib/ics.js";

test("escapeIcsText escapes special characters", () => {
  assert.equal(escapeIcsText("a\\b;c,d\ne"), "a\\\\b\;c\\,d\\ne");
});

test("foldIcsLine leaves short lines alone", () => {
  assert.equal(foldIcsLine("SUMMARY:Raid"), "SUMMARY:Raid");
});

test("foldIcsLine folds at 75 octets with CRLF and a space", () => {
  const line = "X".repeat(160);
  const physicalLines = foldIcsLine(line).split("\r\n");
  assert.equal(physicalLines[0].length, 75);
  for (const continuation of physicalLines.slice(1)) {
    assert.ok(continuation.startsWith(" "));
    assert.ok(Buffer.byteLength(continuation) <= 75);
  }
  assert.equal(
    physicalLines.map((part, index) => (index ? part.slice(1) : part)).join(""),
    line,
  );
});

test("foldIcsLine does not split a multi-byte character", () => {
  // 74 ASCII bytes then a 3-byte character crosses the 75 octet limit.
  const line = "X".repeat(74) + "€" + "Y";
  const physicalLines = foldIcsLine(line).split("\r\n");
  assert.equal(physicalLines[0], "X".repeat(74));
  assert.equal(physicalLines[1], " €Y");
});

test("formatIcsUtc uses basic UTC form", () => {
  assert.equal(
    formatIcsUtc(new Date("2026-10-13T00:05:09Z")),
    "20261013T000509Z",
  );
});

test("buildIcsCalendar renders one VEVENT per event with CRLF", () => {
  const output = buildIcsCalendar({
    calendarName: "DayZ Events",
    siteUrl: "https://events.example.com",
    now: new Date("2026-10-04T00:00:00Z"),
    events: [
      {
        url: "/events/raid-night/",
        title: "Raid, Night",
        host: "Namalsk Nights",
        start: new Date("2026-10-13T00:00:00Z"),
        end: new Date("2026-10-13T03:00:00Z"),
      },
      {
        url: "/events/meetup/",
        title: "Meetup",
        host: null,
        start: new Date("2026-11-01T18:00:00Z"),
        end: null,
      },
    ],
  });
  assert.ok(output.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(output.endsWith("END:VCALENDAR\r\n"));
  assert.equal(output.replaceAll("\r\n", "").includes("\n"), false);
  assert.equal(output.match(/BEGIN:VEVENT/g).length, 2);
  assert.match(output, /UID:raid-night@events\.example\.com\r\n/);
  assert.match(output, /DTSTART:20261013T000000Z\r\n/);
  assert.match(output, /DTEND:20261013T030000Z\r\n/);
  assert.match(output, /SUMMARY:Raid\\, Night\r\n/);
  assert.match(
    output,
    /URL:https:\/\/events\.example\.com\/events\/raid-night\/\r\n/,
  );
  assert.match(output, /DTSTAMP:20261004T000000Z\r\n/);
  const meetupBlock = output.split("BEGIN:VEVENT")[2];
  assert.equal(meetupBlock.includes("DTEND"), false);
});

test("all-day events use DATE values with an exclusive end", () => {
  const output = buildIcsCalendar({
    calendarName: "DayZ Events",
    siteUrl: "https://events.example.com",
    now: new Date("2026-10-04T00:00:00Z"),
    events: [
      {
        url: "/events/novikostok/",
        title: "Novikostok Playtest",
        host: null,
        allDay: true,
        start: new Date("2026-10-27T00:00:00Z"),
        end: new Date("2026-10-31T00:00:00Z"),
      },
    ],
  });
  assert.match(output, /DTSTART;VALUE=DATE:20261027\r\n/);
  assert.match(output, /DTEND;VALUE=DATE:20261101\r\n/);
});

test("UIDs come from the event path, so same-named events in different months differ", () => {
  const eventAt = (url) => ({
    url,
    title: "Fall Raid Night",
    host: null,
    allDay: false,
    start: new Date("2026-10-17T19:00:00Z"),
    end: null,
  });
  const output = buildIcsCalendar({
    calendarName: "DayZ Events",
    siteUrl: "https://events.example.com",
    now: new Date("2026-10-04T00:00:00Z"),
    events: [
      eventAt("/events/2026/10/fall-raid-night/"),
      eventAt("/events/2027/10/fall-raid-night/"),
    ],
  });
  assert.match(output, /UID:2026-10-fall-raid-night@events\.example\.com\r\n/);
  assert.match(output, /UID:2027-10-fall-raid-night@events\.example\.com\r\n/);
  assert.match(
    output,
    /URL:https:\/\/events\.example\.com\/events\/2026\/10\/fall-raid-night\/\r\n/,
  );
});
