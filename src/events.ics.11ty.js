export function data() {
  return { permalink: "/events.ics", eleventyExcludeFromCollections: true };
}

export function render({ collections, site, build }) {
  return this.icsCalendar(collections.events, site, build.now);
}
