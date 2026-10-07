import { buildEventsFeed } from "../lib/events-feed.js";
import { createImageProcessor, processEventImage } from "../lib/event-image.js";

export function data() {
  return { permalink: "/events.json", eleventyExcludeFromCollections: true };
}

// eleventy-img caches by source, so this reuses the images the event pages made.
async function imagesByEventUrl(events, outputDir) {
  const imageProcessor = createImageProcessor(outputDir);
  const entries = await Promise.all(
    events
      .filter((event) => event.imagePath)
      .map(async (event) => {
        const image = await processEventImage(event.imagePath, event.imageAlt, {
          imageProcessor,
        });
        return [event.url, { url: image.og.url, alt: image.alt }];
      }),
  );
  return new Map(entries);
}

export async function render({ collections, site, build, eleventy }) {
  const images = await imagesByEventUrl(
    collections.events,
    eleventy.directories.output,
  );
  const feed = buildEventsFeed({
    events: collections.events,
    siteUrl: site.url,
    now: build.now,
    imageFor: (event) => images.get(event.url) ?? null,
  });
  return JSON.stringify(feed, null, 2);
}
