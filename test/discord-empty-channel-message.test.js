import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyChannelMessage } from "../lib/discord/empty-channel-message.js";

const SUBMISSIONS_URL = "https://discord.com/channels/1/2";

test("emptyChannelMessage links to the submissions channel", () => {
  const message = emptyChannelMessage({
    submissionsUrl: SUBMISSIONS_URL,
    themeColor: "#ff4444",
  });
  const [embed] = message.embeds;
  assert.equal(embed.title, "No Upcoming Events");
  assert.ok(embed.description.includes(`[Submit Yours](${SUBMISSIONS_URL})`));
  assert.equal(embed.color, 0xff4444);
});

test("emptyChannelMessage cannot ping anyone", () => {
  const message = emptyChannelMessage({
    submissionsUrl: SUBMISSIONS_URL,
    themeColor: "#ff4444",
  });
  assert.deepEqual(message.allowed_mentions, { parse: [] });
});
