import { isUpcoming, sortByStart } from "./event-dates.js";

const absoluteUrl = (siteUrl, path) => new URL(path, siteUrl).href;

// All-day dates are UTC midnight of the date as written, so the ISO date part reads it back.
function feedDate(date, allDay) {
  if (date === null) return null;
  const iso = date.toISOString();
  return allDay ? iso.slice(0, 10) : iso;
}

function feedImage(image, siteUrl) {
  if (image === null) return null;
  return { url: absoluteUrl(siteUrl, image.url), alt: image.alt };
}

// imageFor returns the site-relative URL and alt text of an event's image, or null.
export function buildEventsFeed({ events, siteUrl, now, imageFor }) {
  const upcoming = sortByStart(events).filter((event) =>
    isUpcoming(event, now),
  );
  return {
    generatedAt: now.toISOString(),
    events: upcoming.map((event) => ({
      id: event.url,
      title: event.title,
      host: event.host,
      hostLink: event.hostLink,
      description: event.description,
      tags: event.tags,
      platform: {
        tag: event.platform.tag,
        label: event.platform.label,
        color: event.platform.color,
      },
      allDay: event.allDay,
      start: feedDate(event.start, event.allDay),
      end: feedDate(event.end, event.allDay),
      url: absoluteUrl(siteUrl, event.url),
      image: feedImage(imageFor(event), siteUrl),
    })),
  };
}
