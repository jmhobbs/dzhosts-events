import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFeed, upcomingFeedEvents } from "../lib/discord/feed-source.js";

const FEED_URL = "https://events.example.com/events.json";
const FEED = { generatedAt: "2026-10-06T00:00:00.000Z", events: [] };

function fakeFetch(response) {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    return response;
  };
  return { requests, fetchImpl };
}

const unusedReadFile = async () => {
  throw new Error("readFile should not be called");
};

test("loadFeed fetches a URL without a cached copy", async () => {
  const { requests, fetchImpl } = fakeFetch(
    new Response(JSON.stringify(FEED), { status: 200 }),
  );
  const feed = await loadFeed(FEED_URL, {
    fetchImpl,
    readFile: unusedReadFile,
  });
  assert.deepEqual(feed, FEED);
  assert.equal(requests[0].url, FEED_URL);
  assert.equal(requests[0].init.headers["cache-control"], "no-cache");
});

test("loadFeed stops when the URL does not return 2xx", async () => {
  const { fetchImpl } = fakeFetch(new Response("missing", { status: 404 }));
  await assert.rejects(
    loadFeed(FEED_URL, { fetchImpl, readFile: unusedReadFile }),
    /events\.json returned 404/,
  );
});

test("loadFeed stops when the feed has no events list", async () => {
  const { fetchImpl } = fakeFetch(
    new Response(JSON.stringify({ generatedAt: "x" }), { status: 200 }),
  );
  await assert.rejects(
    loadFeed(FEED_URL, { fetchImpl, readFile: unusedReadFile }),
    /has no events list/,
  );
});

test("loadFeed reads a path from disk without fetching", async () => {
  const readPaths = [];
  const feed = await loadFeed("_site/events.json", {
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    },
    readFile: async (path) => {
      readPaths.push(path);
      return JSON.stringify(FEED);
    },
  });
  assert.deepEqual(feed, FEED);
  assert.deepEqual(readPaths, ["_site/events.json"]);
});

test("upcomingFeedEvents drops events that ended since the feed was built", () => {
  const now = new Date("2026-10-11T20:00:00Z");
  const events = [
    {
      id: "/ended/",
      allDay: false,
      start: "2026-10-11T17:00:00.000Z",
      end: "2026-10-11T19:00:00.000Z",
    },
    {
      id: "/later/",
      allDay: false,
      start: "2026-10-12T19:00:00.000Z",
      end: null,
    },
    { id: "/last-day/", allDay: true, start: "2026-10-10", end: "2026-10-11" },
  ];
  assert.deepEqual(
    upcomingFeedEvents(events, now).map((event) => event.id),
    ["/later/", "/last-day/"],
  );
});
