const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (value) => String(value).padStart(2, "0");

export function formatUtc(date) {
  const month = MONTH_ABBREVIATIONS[date.getUTCMonth()];
  const time = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()} ${time} UTC`;
}

export function toIsoUtc(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}
