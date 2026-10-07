#!/usr/bin/env node
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { emptyState } from "../lib/discord/apply-sync.js";
import { loadFeed, upcomingFeedEvents } from "../lib/discord/feed-source.js";
import { platformChannels } from "../lib/discord/platform-channels.js";
import { syncPlatforms } from "../lib/discord/sync-platforms.js";
import { createWebhookClient } from "../lib/discord/webhook-client.js";
import platformDefinitions from "../src/_data/platforms.json" with { type: "json" };
import site from "../src/_data/site.json" with { type: "json" };

const { values: options } = parseArgs({
  options: {
    feed: { type: "string", default: new URL("events.json", site.url).href },
    "state-dir": { type: "string", default: ".discord-sync-state" },
    "dry-run": { type: "boolean", default: false },
  },
});

const statePath = (tag) =>
  join(options["state-dir"], `${tag.toLowerCase()}.json`);

async function readState(tag, webhookId) {
  try {
    return JSON.parse(await readFile(statePath(tag), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return emptyState(webhookId);
  }
}

// Write then rename, so an interrupted write never leaves half a state file.
async function writeState(tag, state) {
  await mkdir(options["state-dir"], { recursive: true });
  const temporaryPath = `${statePath(tag)}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(state, null, 2) + "\n");
  await rename(temporaryPath, statePath(tag));
}

async function main() {
  const feed = await loadFeed(options.feed, { fetchImpl: fetch, readFile });
  const errors = await syncPlatforms({
    channels: platformChannels(platformDefinitions, process.env),
    feedEvents: upcomingFeedEvents(feed.events, new Date()),
    readState,
    writeState,
    createClient: (webhookUrl) => createWebhookClient({ webhookUrl }),
    dryRun: options["dry-run"],
    log: (line) => console.log(line),
  });
  for (const error of errors) console.error(`discord-sync: ${error.message}`);
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`discord-sync: ${error.message}`);
  process.exitCode = 1;
});
