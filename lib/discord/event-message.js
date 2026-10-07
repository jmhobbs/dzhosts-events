import { formatAllDayRange } from "../format-all-day.js";

// https://discord.com/developers/docs/resources/message#embed-object-embed-limits
const TITLE_LIMIT = 256;
const DESCRIPTION_LIMIT = 4096;
const FIELD_VALUE_LIMIT = 1024;
const ELLIPSIS = "…";

function truncate(text, limit) {
  if (text.length <= limit) return text;
  return text.slice(0, limit - ELLIPSIS.length) + ELLIPSIS;
}

const unixSeconds = (isoText) => Math.floor(Date.parse(isoText) / 1000);

// Discord renders <t:...> markup in each viewer's local time.
function discordTimestamp(isoText, style) {
  return `<t:${unixSeconds(isoText)}:${style}>`;
}

// All-day dates are YYYY-MM-DD as written, so parse them as UTC midnight like the site does.
function whenText(event) {
  if (event.allDay) {
    return formatAllDayRange(
      new Date(`${event.start}T00:00:00Z`),
      new Date(`${event.end}T00:00:00Z`),
    );
  }
  const start = discordTimestamp(event.start, "F");
  const relative = discordTimestamp(event.start, "R");
  if (event.end === null) return `${start} (${relative})`;
  return `${start} to ${discordTimestamp(event.end, "F")} (${relative})`;
}

function hostText(event) {
  if (event.hostLink) return `[${event.host}](${event.hostLink})`;
  return event.host;
}

const colorNumber = (hexColor) =>
  hexColor ? Number.parseInt(hexColor.replace("#", ""), 16) : undefined;

export function eventMessage(event) {
  const fields = [{ name: "When", value: whenText(event) }];
  if (event.host) fields.push({ name: "Host", value: hostText(event) });
  const embed = {
    title: truncate(event.title, TITLE_LIMIT),
    url: event.url,
    color: colorNumber(event.platform.color),
    fields: fields.map((field) => ({
      ...field,
      value: truncate(field.value, FIELD_VALUE_LIMIT),
    })),
  };
  if (event.description) {
    embed.description = truncate(event.description, DESCRIPTION_LIMIT);
  }
  if (event.image) embed.image = { url: event.image.url };
  // Event text comes from the community, so it must never ping @everyone or roles.
  return { embeds: [embed], allowed_mentions: { parse: [] } };
}
