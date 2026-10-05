import { validateEvent, isUpcoming, sortByStart } from "./lib/event-dates.js";
import { buildIcsCalendar } from "./lib/ics.js";
import { tagBadges } from "./lib/pills.js";
import { pageMeta } from "./lib/page-meta.js";
import {
  eventWhenHtml,
  eventListWhenHtml,
  localTimeHtml,
} from "./lib/event-when.js";

const EVENT_GLOB = "src/events/**/*.md";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  // Watch the folder, not a glob. A glob here stops Eleventy 3 from seeing the event Markdown.
  eleventyConfig.addWatchTarget("./src/events/");

  eleventyConfig.addCollection("events", (collectionApi) =>
    sortByStart(
      collectionApi.getFilteredByGlob(EVENT_GLOB).map((item) => ({
        ...validateEvent(item.data, item.inputPath),
        url: item.url,
      })),
    ),
  );

  eleventyConfig.addFilter("upcoming", (events, now) =>
    events.filter((event) => isUpcoming(event, now)),
  );
  eleventyConfig.addFilter("tagBadges", tagBadges);
  eleventyConfig.addFilter("pageMeta", pageMeta);
  eleventyConfig.addFilter("icsCalendar", (events, site, now) =>
    buildIcsCalendar({
      calendarName: site.title,
      siteUrl: site.url,
      now,
      events,
    }),
  );

  eleventyConfig.addShortcode("localTime", localTimeHtml);
  eleventyConfig.addShortcode("eventWhen", eventWhenHtml);
  eleventyConfig.addShortcode("eventListWhen", eventListWhenHtml);

  return {
    dir: { input: "src", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
