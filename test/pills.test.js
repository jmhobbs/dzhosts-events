import { test } from "node:test";
import assert from "node:assert/strict";
import { pillsForTags, tagBadges } from "../lib/pills.js";

const pillDefinitions = [
  { tag: "XBOX", label: "XBOX", color: "#107c10" },
  { tag: "PS5", label: "PlayStation" },
];

test("matching tags become pills, case-insensitive", () => {
  assert.deepEqual(pillsForTags(["xbox"], pillDefinitions), [
    { label: "XBOX", color: "#107c10" },
  ]);
});

test("tags without a pill definition are ignored", () => {
  assert.deepEqual(pillsForTags(["PvP", "Namalsk"], pillDefinitions), []);
  assert.deepEqual(pillsForTags([], pillDefinitions), []);
});

test("pills follow definition order and default color to null", () => {
  assert.deepEqual(pillsForTags(["PS5", "XBOX"], pillDefinitions), [
    { label: "XBOX", color: "#107c10" },
    { label: "PlayStation", color: null },
  ]);
});

test("tagBadges puts highlighted pills first, then other tags in event order", () => {
  assert.deepEqual(tagBadges(["cars", "xbox", "PvP"], pillDefinitions), [
    { label: "XBOX", color: "#107c10", highlighted: true },
    { label: "cars", color: null, highlighted: false },
    { label: "PvP", color: null, highlighted: false },
  ]);
});

test("tagBadges is empty for an event without tags", () => {
  assert.deepEqual(tagBadges([], pillDefinitions), []);
});
