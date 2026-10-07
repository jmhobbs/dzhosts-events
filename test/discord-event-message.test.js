import { test } from "node:test";
import assert from "node:assert/strict";
import { eventMessage } from "../lib/discord/event-message.js";

function feedEvent(overrides = {}) {
  return {
    id: "/events/2026/10/raid/",
    title: "Raid",
    host: null,
    hostLink: null,
    description: "Bring friends.",
    tags: ["PC"],
    platform: { label: "PC", color: "#ff201e" },
    allDay: false,
    start: "2026-10-11T19:00:00.000Z",
    end: null,
    url: "https://events.example.com/events/2026/10/raid/",
    image: null,
    ...overrides,
  };
}

function field(message, name) {
  return message.embeds[0].fields.find((candidate) => candidate.name === name);
}

test("eventMessage uses Discord timestamps for a timed event", () => {
  const message = eventMessage(feedEvent({ end: "2026-10-11T21:00:00.000Z" }));
  const unixStart = Date.parse("2026-10-11T19:00:00.000Z") / 1000;
  const unixEnd = Date.parse("2026-10-11T21:00:00.000Z") / 1000;
  assert.equal(
    field(message, "When").value,
    `<t:${unixStart}:F> to <t:${unixEnd}:F> (<t:${unixStart}:R>)`,
  );
  assert.equal(message.embeds[0].color, 0xff201e);
  assert.equal(message.embeds[0].url, feedEvent().url);
});

test("eventMessage shows all-day dates as written", () => {
  const message = eventMessage(
    feedEvent({ allDay: true, start: "2026-10-11", end: "2026-10-12" }),
  );
  assert.equal(field(message, "When").value, "October 11th – 12th");
});

test("eventMessage links the host only when there is a link", () => {
  const plain = eventMessage(feedEvent({ host: "Natural Selection" }));
  assert.equal(field(plain, "Host").value, "Natural Selection");
  const linked = eventMessage(
    feedEvent({ host: "Natural Selection", hostLink: "https://example.com" }),
  );
  assert.equal(
    field(linked, "Host").value,
    "[Natural Selection](https://example.com)",
  );
  assert.equal(field(eventMessage(feedEvent()), "Host"), undefined);
});

test("eventMessage cuts long text to Discord limits", () => {
  const message = eventMessage(
    feedEvent({ title: "T".repeat(300), description: "D".repeat(5000) }),
  );
  assert.equal(message.embeds[0].title.length, 256);
  assert.equal(message.embeds[0].description.length, 4096);
  assert.ok(message.embeds[0].description.endsWith("…"));
});

test("eventMessage cannot ping anyone", () => {
  const message = eventMessage(feedEvent({ description: "@everyone come" }));
  assert.deepEqual(message.allowed_mentions, { parse: [] });
});

test("eventMessage adds the image when there is one", () => {
  const message = eventMessage(
    feedEvent({ image: { url: "https://x/img.jpeg", alt: "A cabin" } }),
  );
  assert.deepEqual(message.embeds[0].image, { url: "https://x/img.jpeg" });
});
