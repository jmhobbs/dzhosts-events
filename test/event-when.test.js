import { test } from "node:test";
import assert from "node:assert/strict";
import { eventWhenHtml, eventListWhenHtml } from "../lib/event-when.js";

test("all-day events render plain text with no local-time conversion", () => {
  const html = eventWhenHtml({
    allDay: true,
    start: new Date("2026-10-05T00:00:00Z"),
    end: new Date("2026-10-09T00:00:00Z"),
  });
  assert.equal(html, "October 5th – 9th");
});

test("timed events with an end render two local-time elements", () => {
  const html = eventWhenHtml({
    allDay: false,
    start: new Date("2026-10-13T00:00:00Z"),
    end: new Date("2026-10-13T03:00:00Z"),
  });
  assert.equal(
    html,
    '<local-time datetime="2026-10-13T00:00:00Z">Oct 13, 2026 00:00 UTC</local-time>' +
      " to " +
      '<local-time datetime="2026-10-13T03:00:00Z">Oct 13, 2026 03:00 UTC</local-time>',
  );
});

test("timed events without an end render one local-time element", () => {
  const html = eventWhenHtml({
    allDay: false,
    start: new Date("2026-10-13T00:00:00Z"),
    end: null,
  });
  assert.equal(
    html,
    '<local-time datetime="2026-10-13T00:00:00Z">Oct 13, 2026 00:00 UTC</local-time>',
  );
});

test("the list shows only the start of a timed event, in list format", () => {
  const html = eventListWhenHtml({
    allDay: false,
    start: new Date("2026-10-13T00:00:00Z"),
    end: new Date("2026-10-13T03:00:00Z"),
  });
  assert.equal(
    html,
    '<local-time datetime="2026-10-13T00:00:00Z" format="list">October 13th at 12:00 am UTC</local-time>',
  );
});

test("the list shows the full date range of an all-day event", () => {
  const html = eventListWhenHtml({
    allDay: true,
    start: new Date("2026-10-05T00:00:00Z"),
    end: new Date("2026-10-09T00:00:00Z"),
  });
  assert.equal(html, "October 5th – 9th");
});
