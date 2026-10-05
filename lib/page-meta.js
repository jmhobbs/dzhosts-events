import { formatAllDayRange } from "./format-all-day.js";
import { formatListTime } from "../src/js/list-time-format.js";

// Link previews (Discord, social sites) cannot run local-time.js, so times are UTC.
function eventSummary(event) {
  const when = event.allDay
    ? formatAllDayRange(event.start, event.end)
    : formatListTime(event.start, "UTC");
  return event.host ? `${when}. Hosted by ${event.host}.` : `${when}.`;
}

function absoluteImage(image, siteUrl) {
  if (!image) return null;
  return {
    url: new URL(image.og.url, siteUrl).href,
    width: image.og.width,
    height: image.og.height,
    alt: image.alt,
  };
}

export function pageMeta({ site, pageUrl, title, description, event, image }) {
  return {
    title: title ?? site.title,
    documentTitle: title ? `${title} | ${site.title}` : site.title,
    description:
      description ?? (event ? eventSummary(event) : site.description),
    url: new URL(pageUrl, site.url).href,
    type: event ? "article" : "website",
    image: absoluteImage(image, site.url),
    twitterCard: image ? "summary_large_image" : "summary",
  };
}
