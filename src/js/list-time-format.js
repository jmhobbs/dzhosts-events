// Shared by the build (UTC fallback text) and the browser (viewer's local time).
// Always English, since the ordinal and "at" are English.

export function ordinalSuffix(day) {
  const lastTwoDigits = day % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th";
}

// timeZone undefined means the runtime's local timezone.
export function formatListTime(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const day = Number(parts.day);
  const time = `${parts.hour}:${parts.minute} ${parts.dayPeriod.toLowerCase()}`;
  return `${parts.month} ${day}${ordinalSuffix(day)} at ${time} ${parts.timeZoneName}`;
}
