import { test } from "node:test";
import assert from "node:assert/strict";
import {
  eventPlatform,
  groupEventsByPlatform,
  platformsForTags,
  tagBadges,
} from "../lib/platforms.js";

const platformDefinitions = [
  { tag: "XBOX", label: "XBOX", color: "#107c10" },
  { tag: "PS5", label: "PlayStation" },
];

test("matching tags become platforms, case-insensitive", () => {
  assert.deepEqual(platformsForTags(["xbox"], platformDefinitions), [
    { label: "XBOX", color: "#107c10" },
  ]);
});

test("tags without a platform definition are ignored", () => {
  assert.deepEqual(
    platformsForTags(["PvP", "Namalsk"], platformDefinitions),
    [],
  );
  assert.deepEqual(platformsForTags([], platformDefinitions), []);
});

test("platforms follow definition order and default color to null", () => {
  assert.deepEqual(platformsForTags(["PS5", "XBOX"], platformDefinitions), [
    { label: "XBOX", color: "#107c10" },
    { label: "PlayStation", color: null },
  ]);
});

test("tagBadges puts highlighted platforms first, then other tags in event order", () => {
  assert.deepEqual(tagBadges(["cars", "xbox", "PvP"], platformDefinitions), [
    { label: "XBOX", color: "#107c10", highlighted: true },
    { label: "cars", color: null, highlighted: false },
    { label: "PvP", color: null, highlighted: false },
  ]);
});

test("tagBadges is empty for an event without tags", () => {
  assert.deepEqual(tagBadges([], platformDefinitions), []);
});

test("eventPlatform finds the one platform tag, case-insensitive", () => {
  assert.deepEqual(
    eventPlatform(["charity", "xbox"], platformDefinitions, "a.md"),
    { tag: "XBOX", label: "XBOX", color: "#107c10" },
  );
});

test("eventPlatform fails when there is no platform tag", () => {
  for (const tags of [[], ["Charity"]]) {
    assert.throws(
      () => eventPlatform(tags, platformDefinitions, "a.md"),
      /^Error: a\.md: .*one platform tag.*XBOX, PS5/,
    );
  }
});

test("eventPlatform fails when there are two platform tags", () => {
  assert.throws(
    () => eventPlatform(["XBOX", "PS5"], platformDefinitions, "a.md"),
    /^Error: a\.md: .*one platform tag/,
  );
});

test("groupEventsByPlatform uses definition order, skips empty platforms and keeps event order", () => {
  const xbox = platformDefinitions[0];
  const ps5 = platformDefinitions[1];
  const definitions = [...platformDefinitions, { tag: "PC", label: "PC" }];
  const events = [
    { title: "first", platform: ps5 },
    { title: "second", platform: xbox },
    { title: "third", platform: ps5 },
  ];
  assert.deepEqual(groupEventsByPlatform(events, definitions), [
    { platform: xbox, events: [events[1]] },
    { platform: ps5, events: [events[0], events[2]] },
  ]);
});
