import { ordinalSuffix } from "../src/js/list-time-format.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const RANGE_SEPARATOR = " – ";

const ordinalDay = (date) =>
  `${date.getUTCDate()}${ordinalSuffix(date.getUTCDate())}`;

const monthDay = (date) =>
  `${MONTH_NAMES[date.getUTCMonth()]} ${ordinalDay(date)}`;

// Dates are UTC midnight of the calendar date, so UTC getters read it back as written.
export function formatAllDayRange(start, end) {
  if (start.getTime() === end.getTime()) return monthDay(start);
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();
  const endText = sameMonth ? ordinalDay(end) : monthDay(end);
  return `${monthDay(start)}${RANGE_SEPARATOR}${endText}`;
}
