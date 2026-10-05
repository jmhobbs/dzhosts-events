# Timezones

Pages render times in UTC inside a `<local-time>` element. `src/js/local-time.js` rewrites them to the viewer's local time. With JavaScript off, the UTC time shows. All-day dates are plain text and are not converted.

In general, use UTC for event `start` and `end` for consistency.
