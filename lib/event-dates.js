import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const ISO_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Latest UTC offset in use, so an all-day event lasts until its last day ends everywhere.
const LATEST_OFFSET_MS = 12 * HOUR_MS;

function isDateOnly(value) {
  return typeof value === "string" && DATE_ONLY.test(value);
}

// All-day dates are stored as UTC midnight of the calendar date as written.
function parseAllDayDate(value, sourcePath) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${sourcePath}: date "${value}" does not exist`);
  }
  return date;
}

export function parseEventDate(value, sourcePath) {
  if (value instanceof Date) {
    throw new Error(
      `${sourcePath}: quote event dates so the UTC offset is kept, e.g. "2026-10-12T19:00:00-05:00"`,
    );
  }
  if (typeof value !== "string" || !ISO_WITH_OFFSET.test(value)) {
    throw new Error(
      `${sourcePath}: date "${value}" must be ISO 8601 with a UTC offset, e.g. "2026-10-12T19:00:00-05:00"`,
    );
  }
  return new Date(value);
}

// Eleventy turns every tag into a collection, so this one would clash with ours.
const RESERVED_TAG = "events";

function parseTags(rawTags, sourcePath) {
  const tags = rawTags === undefined ? [] : [rawTags].flat();
  for (const tag of tags) {
    if (typeof tag !== "string") {
      throw new Error(`${sourcePath}: tags must be text`);
    }
    if (tag === RESERVED_TAG) {
      throw new Error(`${sourcePath}: the tag "${RESERVED_TAG}" is reserved`);
    }
  }
  return tags;
}

const YEAR_MONTH_FOLDER = /\/(\d{4})\/(\d{2})\/[^/]+$/;

// Compares against the date as written, so local evening events stay in their local month.
function checkYearMonthFolder(startText, sourcePath) {
  const folderMatch = sourcePath.match(YEAR_MONTH_FOLDER);
  if (!folderMatch) return;
  const [, folderYear, folderMonth] = folderMatch;
  const [startYear, startMonth] = startText.split("-");
  if (folderYear !== startYear || folderMonth !== startMonth) {
    throw new Error(
      `${sourcePath}: start is in ${startYear}-${startMonth}, so the file belongs in ${startYear}/${startMonth}/`,
    );
  }
}

const LINK_PROTOCOLS = new Set(["http:", "https:"]);

// Only http(s) links, since event files come from the community and are rendered as hrefs.
function parseHostLink(data, sourcePath) {
  if (data.hostLink === undefined) return null;
  if (!data.host) {
    throw new Error(`${sourcePath}: hostLink needs a host to link`);
  }
  let url;
  try {
    url = new URL(data.hostLink);
  } catch {
    url = null;
  }
  if (!url || !LINK_PROTOCOLS.has(url.protocol)) {
    throw new Error(`${sourcePath}: hostLink must be an http or https URL`);
  }
  return data.hostLink;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Images are committed next to the event file. Remote links are refused because
// Discord attachment URLs expire.
function parseImage(data, sourcePath, fileExists) {
  if (data.image === undefined) return { imagePath: null, imageAlt: null };
  const image = data.image;
  if (
    typeof image !== "string" ||
    image.includes("://") ||
    image.startsWith("/")
  ) {
    throw new Error(
      `${sourcePath}: image must be a file name next to the event file, not a URL`,
    );
  }
  if (!IMAGE_EXTENSIONS.has(extname(image).toLowerCase())) {
    throw new Error(
      `${sourcePath}: image must be a .jpg, .jpeg, .png or .webp file`,
    );
  }
  if (typeof data.imageAlt !== "string" || data.imageAlt.trim() === "") {
    throw new Error(`${sourcePath}: imageAlt is required with an image`);
  }
  const imagePath = join(dirname(sourcePath), image);
  if (!fileExists(imagePath)) {
    throw new Error(`${sourcePath}: image file ${imagePath} does not exist`);
  }
  return { imagePath, imageAlt: data.imageAlt };
}

export function validateEvent(
  data,
  sourcePath,
  { fileExists = existsSync } = {},
) {
  if (!data.title) throw new Error(`${sourcePath}: missing required title`);
  if (!data.start) throw new Error(`${sourcePath}: missing required start`);
  const allDay = isDateOnly(data.start);
  if (data.end && isDateOnly(data.end) !== allDay) {
    throw new Error(
      `${sourcePath}: start and end must both be dates or both be times`,
    );
  }
  checkYearMonthFolder(data.start, sourcePath);
  const parseDate = allDay ? parseAllDayDate : parseEventDate;
  const start = parseDate(data.start, sourcePath);
  const end = data.end
    ? parseDate(data.end, sourcePath)
    : allDay
      ? start
      : null;
  if (end && end < start) {
    throw new Error(`${sourcePath}: end is before start`);
  }
  const description = data.description ?? null;
  if (description !== null && typeof description !== "string") {
    throw new Error(`${sourcePath}: description must be text`);
  }
  return {
    title: data.title,
    host: data.host ?? null,
    hostLink: parseHostLink(data, sourcePath),
    description,
    tags: parseTags(data.tags, sourcePath),
    ...parseImage(data, sourcePath, fileExists),
    allDay,
    start,
    end,
  };
}

// The instant an event is over. All-day events last until the last day ends everywhere (UTC-12).
function endsAt(event) {
  if (event.allDay) {
    return new Date(event.end.getTime() + DAY_MS + LATEST_OFFSET_MS);
  }
  return event.end ?? event.start;
}

export function isUpcoming(event, now) {
  return endsAt(event) >= now;
}

export function sortByStart(events) {
  return [...events].sort((a, b) => a.start - b.start);
}
