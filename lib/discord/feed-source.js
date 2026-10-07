import { isUpcoming } from "../event-dates.js";

const FETCH_TIMEOUT_MS = 30 * 1000;

const isUrl = (source) => /^https?:\/\//.test(source);

async function fetchFeedText(feedUrl, fetchImpl) {
  const response = await fetchImpl(feedUrl, {
    headers: { "cache-control": "no-cache" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${feedUrl} returned ${response.status}`);
  }
  return response.text();
}

// A missing or broken feed must stop the run, or every posted event would be deleted.
export async function loadFeed(source, { fetchImpl, readFile }) {
  const text = isUrl(source)
    ? await fetchFeedText(source, fetchImpl)
    : await readFile(source, "utf8");
  const feed = JSON.parse(text);
  if (!Array.isArray(feed.events)) {
    throw new Error(`${source} has no events list`);
  }
  return feed;
}

// The feed is only as fresh as its build, so events that ended since then are dropped here.
export function upcomingFeedEvents(feedEvents, now) {
  return feedEvents.filter((event) =>
    isUpcoming(
      {
        allDay: event.allDay,
        start: new Date(event.start),
        end: event.end === null ? null : new Date(event.end),
      },
      now,
    ),
  );
}
