import { test } from "node:test";
import assert from "node:assert/strict";
import { pickOgImage, processEventImage } from "../lib/event-image.js";

const metadata = {
  webp: [
    { url: "/img/a-400.webp", width: 400, height: 560 },
    { url: "/img/a-800.webp", width: 800, height: 1120 },
  ],
  jpeg: [
    { url: "/img/a-400.jpeg", width: 400, height: 560 },
    { url: "/img/a-800.jpeg", width: 800, height: 1120 },
  ],
};

test("pickOgImage uses the largest JPEG", () => {
  assert.deepEqual(pickOgImage(metadata), {
    url: "/img/a-800.jpeg",
    width: 800,
    height: 1120,
  });
});

test("processEventImage returns picture HTML, the og image and alt text", async () => {
  const processedSources = [];
  const fakeImageProcessor = async (source) => {
    processedSources.push(source);
    return metadata;
  };
  const fakeHtmlGenerator = (imageMetadata, attributes) =>
    `<picture alt="${attributes.alt}" count="${imageMetadata.jpeg.length}">`;

  const image = await processEventImage("src/events/2026/10/a.png", "Poster", {
    imageProcessor: fakeImageProcessor,
    htmlGenerator: fakeHtmlGenerator,
  });

  assert.deepEqual(processedSources, ["src/events/2026/10/a.png"]);
  assert.equal(image.html, '<picture alt="Poster" count="2">');
  assert.equal(image.alt, "Poster");
  assert.equal(image.og.url, "/img/a-800.jpeg");
});
