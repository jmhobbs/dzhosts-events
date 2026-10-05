import { test } from "node:test";
import assert from "node:assert/strict";
import { pageMeta } from "../lib/page-meta.js";

const site = {
  title: "DayZ Community Events",
  description: "Upcoming events from DayZ servers and communities.",
  url: "https://events.example.com/",
};

const timedEvent = {
  title: "An Industrious Affair",
  host: "Natural Selection",
  description: null,
  allDay: false,
  start: new Date("2026-10-10T20:00:00Z"),
  end: new Date("2026-10-11T00:00:00Z"),
};

test("the home page uses the site title and description", () => {
  assert.deepEqual(pageMeta({ site, pageUrl: "/" }), {
    title: "DayZ Community Events",
    documentTitle: "DayZ Community Events",
    description: "Upcoming events from DayZ servers and communities.",
    url: "https://events.example.com/",
    type: "website",
    image: null,
    twitterCard: "summary",
  });
});

test("a page with its own title and description uses them", () => {
  const meta = pageMeta({
    site,
    pageUrl: "/why/",
    title: "Why",
    description: "Why this calendar exists.",
  });
  assert.equal(meta.title, "Why");
  assert.equal(meta.documentTitle, "Why | DayZ Community Events");
  assert.equal(meta.description, "Why this calendar exists.");
  assert.equal(meta.url, "https://events.example.com/why/");
  assert.equal(meta.type, "website");
});

test("an event page uses the event description when it has one", () => {
  const meta = pageMeta({
    site,
    pageUrl: "/events/an-industrious-affair/",
    title: "An Industrious Affair",
    description: "Capture the Objective event.",
    event: { ...timedEvent, description: "Capture the Objective event." },
  });
  assert.equal(meta.description, "Capture the Objective event.");
  assert.equal(meta.type, "article");
  assert.equal(
    meta.documentTitle,
    "An Industrious Affair | DayZ Community Events",
  );
});

test("an event page without a description gets a UTC time and host", () => {
  const meta = pageMeta({
    site,
    pageUrl: "/events/an-industrious-affair/",
    title: "An Industrious Affair",
    event: timedEvent,
  });
  assert.equal(
    meta.description,
    "October 10th at 8:00 pm UTC. Hosted by Natural Selection.",
  );
});

test("an all-day event without a description or host gets its dates", () => {
  const meta = pageMeta({
    site,
    pageUrl: "/events/novikostok/",
    title: "Novikostok Playtest",
    event: {
      title: "Novikostok Playtest",
      host: null,
      description: null,
      allDay: true,
      start: new Date("2026-10-05T00:00:00Z"),
      end: new Date("2026-10-09T00:00:00Z"),
    },
  });
  assert.equal(meta.description, "October 5th – 9th.");
});

test("an event image becomes an absolute og image with a large card", () => {
  const meta = pageMeta({
    site,
    pageUrl: "/events/an-industrious-affair/",
    title: "An Industrious Affair",
    event: timedEvent,
    image: {
      alt: "Poster",
      og: { url: "/img/a-800.jpeg", width: 800, height: 1120 },
    },
  });
  assert.deepEqual(meta.image, {
    url: "https://events.example.com/img/a-800.jpeg",
    width: 800,
    height: 1120,
    alt: "Poster",
  });
  assert.equal(meta.twitterCard, "summary_large_image");
});

test("pages without an image have no og image and a summary card", () => {
  const meta = pageMeta({ site, pageUrl: "/" });
  assert.equal(meta.image, null);
  assert.equal(meta.twitterCard, "summary");
});
