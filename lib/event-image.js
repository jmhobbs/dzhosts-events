import { join } from "node:path";
import Image, { generateHTML } from "@11ty/eleventy-img";

const IMAGE_WIDTHS = [400, 800, 1200];
const IMAGE_FORMATS = ["webp", "jpeg"];
// The content column is 60rem with a 1rem gutter on each side.
const IMAGE_SIZES = "(min-width: 60rem) 58rem, 100vw";

export function createImageProcessor(outputDir) {
  return (source) =>
    Image(source, {
      widths: IMAGE_WIDTHS,
      formats: IMAGE_FORMATS,
      outputDir: join(outputDir, "img"),
      urlPath: "/img/",
    });
}

// Link previews need JPEG or PNG. Widths larger than the source are skipped, so take the largest made.
export function pickOgImage(metadata) {
  const largest = metadata.jpeg.reduce((widest, candidate) =>
    candidate.width > widest.width ? candidate : widest,
  );
  return { url: largest.url, width: largest.width, height: largest.height };
}

export async function processEventImage(
  imagePath,
  alt,
  { imageProcessor, htmlGenerator = generateHTML },
) {
  const metadata = await imageProcessor(imagePath);
  return {
    html: htmlGenerator(metadata, {
      alt,
      sizes: IMAGE_SIZES,
      decoding: "async",
    }),
    og: pickOgImage(metadata),
    alt,
  };
}
