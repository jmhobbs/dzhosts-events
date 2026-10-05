import { validateEvent } from "../../lib/event-dates.js";
import {
  createImageProcessor,
  processEventImage,
} from "../../lib/event-image.js";

export default {
  layout: "layouts/event.njk",
  // Keeps the year/month folders in the URL: src/events/2026/10/a.md is /events/2026/10/a/.
  permalink: "{{ page.filePathStem }}/",
  eleventyComputed: {
    event: (data) => validateEvent(data, data.page.inputPath),
    eventImage: async (data) => {
      if (!data.event.imagePath) return null;
      return processEventImage(data.event.imagePath, data.event.imageAlt, {
        imageProcessor: createImageProcessor(data.eleventy.directories.output),
      });
    },
  },
};
