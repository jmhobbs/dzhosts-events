import { formatAllDayRange } from "./format-all-day.js";
import { formatUtc, toIsoUtc } from "./format-utc.js";
import { formatListTime } from "../src/js/list-time-format.js";

export function localTimeHtml(date) {
  return `<local-time datetime="${toIsoUtc(date)}">${formatUtc(date)}</local-time>`;
}

export function eventWhenHtml(event) {
  if (event.allDay) return formatAllDayRange(event.start, event.end);
  if (event.end === null) return localTimeHtml(event.start);
  return `${localTimeHtml(event.start)} to ${localTimeHtml(event.end)}`;
}

// The list keeps timed events short. All-day events have no time, so they keep their dates.
export function eventListWhenHtml(event) {
  if (event.allDay) return formatAllDayRange(event.start, event.end);
  const start = event.start;
  return `<local-time datetime="${toIsoUtc(start)}" format="list">${formatListTime(start, "UTC")}</local-time>`;
}
