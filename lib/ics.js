const MAX_LINE_OCTETS = 75;
const CRLF = "\r\n";

export function escapeIcsText(text) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\;")
    .replaceAll(",", "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function foldIcsLine(line) {
  const physicalLines = [];
  let current = "";
  let currentOctets = 0;
  for (const character of line) {
    const characterOctets = Buffer.byteLength(character);
    if (currentOctets + characterOctets > MAX_LINE_OCTETS) {
      physicalLines.push(current);
      current = " ";
      currentOctets = 1;
    }
    current += character;
    currentOctets += characterOctets;
  }
  physicalLines.push(current);
  return physicalLines.join(CRLF);
}

export function formatIcsUtc(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatIcsDate(date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

// DATE values have no timezone, so calendar apps show the same days everywhere.
// DTEND is exclusive, so it is the day after the last day.
function dateLines(event) {
  if (event.allDay) {
    const dayAfterEnd = new Date(event.end.getTime() + DAY_MS);
    return [
      `DTSTART;VALUE=DATE:${formatIcsDate(event.start)}`,
      `DTEND;VALUE=DATE:${formatIcsDate(dayAfterEnd)}`,
    ];
  }
  const lines = [`DTSTART:${formatIcsUtc(event.start)}`];
  if (event.end) lines.push(`DTEND:${formatIcsUtc(event.end)}`);
  return lines;
}

// "/events/2026/10/fall-raid-night/" becomes "2026-10-fall-raid-night", so events
// with the same file name in different months get different UIDs.
function uidFromUrl(url) {
  return url
    .replace(/^\/events\//, "")
    .replace(/\/$/, "")
    .replaceAll("/", "-");
}

function eventLines(event, siteUrl, siteHost, dtstamp) {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${uidFromUrl(event.url)}@${siteHost}`,
    `DTSTAMP:${dtstamp}`,
    ...dateLines(event),
  ];
  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  if (event.host) {
    lines.push(`DESCRIPTION:${escapeIcsText(`Hosted by ${event.host}`)}`);
  }
  lines.push(`URL:${new URL(event.url, siteUrl).href}`, "END:VEVENT");
  return lines;
}

export function buildIcsCalendar({ calendarName, siteUrl, now, events }) {
  const siteHost = new URL(siteUrl).host;
  const dtstamp = formatIcsUtc(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${siteHost}//${escapeIcsText(calendarName)}//EN`,
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    ...events.flatMap((event) => eventLines(event, siteUrl, siteHost, dtstamp)),
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}
