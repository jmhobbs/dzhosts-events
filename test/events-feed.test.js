import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEventsFeed } from "../lib/events-feed.js";

const SITE_URL = "https://events.example.com";
const NOW = new Date("2026-10-10T12:00:00Z");
const PLATFORM = { tag: "PC", label: "PC", color: "#ff201e" };

function timedEvent(overrides = {}) {
  return {
    title: "Raid",
    host: null,
    hostLink: null,
    description: null,
    tags: ["PC"],
    platform: PLATFORM,
    imagePath: null,
    imageAlt: null,
    allDay: false,
    start: new Date("2026-10-11T19:00:00Z"),
    end: null,
    url: "/events/2026/10/raid/",
    ...overrides,
  };
}

const noImages = () => null;

test("buildEventsFeed drops ended events and keeps start order", () => {
  const feed = buildEventsFeed({
    events: [
      timedEvent({ url: "/b/", start: new Date("2026-10-12T00:00:00Z") }),
      timedEvent({ url: "/ended/", start: new Date("2026-10-09T00:00:00Z") }),
      timedEvent({ url: "/a/", start: new Date("2026-10-11T00:00:00Z") }),
    ],
    siteUrl: SITE_URL,
    now: NOW,
    imageFor: noImages,
  });
  assert.deepEqual(
    feed.events.map((event) => event.id),
    ["/a/", "/b/"],
  );
});

test("buildEventsFeed keeps an all-day event on its last day as a plain date", () => {
  const day = new Date(Date.UTC(2026, 9, 10));
  const feed = buildEventsFeed({
    events: [timedEvent({ allDay: true, start: day, end: day })],
    siteUrl: SITE_URL,
    now: NOW,
    imageFor: noImages,
  });
  assert.equal(feed.events.length, 1);
  assert.equal(feed.events[0].start, "2026-10-10");
  assert.equal(feed.events[0].end, "2026-10-10");
});

test("buildEventsFeed makes page and image URLs absolute", () => {
  const feed = buildEventsFeed({
    events: [timedEvent({ end: new Date("2026-10-11T21:00:00Z") })],
    siteUrl: `${SITE_URL}/`,
    now: NOW,
    imageFor: () => ({ url: "/img/abc-1200.jpeg", alt: "A cabin" }),
  });
  const [event] = feed.events;
  assert.equal(event.url, `${SITE_URL}/events/2026/10/raid/`);
  assert.deepEqual(event.image, {
    url: `${SITE_URL}/img/abc-1200.jpeg`,
    alt: "A cabin",
  });
  assert.equal(event.start, "2026-10-11T19:00:00.000Z");
  assert.equal(event.end, "2026-10-11T21:00:00.000Z");
  assert.deepEqual(event.platform, {
    tag: "PC",
    label: "PC",
    color: "#ff201e",
  });
});

test("buildEventsFeed gives an event without an image a null image", () => {
  const feed = buildEventsFeed({
    events: [timedEvent()],
    siteUrl: SITE_URL,
    now: NOW,
    imageFor: noImages,
  });
  assert.equal(feed.events[0].image, null);
  assert.equal(feed.events[0].end, null);
});
