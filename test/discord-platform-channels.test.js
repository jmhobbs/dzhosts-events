import { test } from "node:test";
import assert from "node:assert/strict";
import {
  webhookEnvName,
  platformChannels,
} from "../lib/discord/platform-channels.js";

test("webhookEnvName uppercases the tag and replaces other characters", () => {
  assert.equal(webhookEnvName("PC"), "DISCORD_WEBHOOK_URL_PC");
  assert.equal(webhookEnvName("Switch"), "DISCORD_WEBHOOK_URL_SWITCH");
  assert.equal(webhookEnvName("Steam Deck"), "DISCORD_WEBHOOK_URL_STEAM_DECK");
});

test("platformChannels keeps definition order and marks unset webhooks null", () => {
  const channels = platformChannels(
    [
      { tag: "PC", label: "PC" },
      { tag: "XBOX", label: "Xbox" },
    ],
    { DISCORD_WEBHOOK_URL_XBOX: "https://x", DISCORD_WEBHOOK_URL_PC: "" },
  );
  assert.deepEqual(channels, [
    { tag: "PC", label: "PC", webhookUrl: null },
    { tag: "XBOX", label: "Xbox", webhookUrl: "https://x" },
  ]);
});
