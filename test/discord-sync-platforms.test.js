import { test } from "node:test";
import assert from "node:assert/strict";
import { syncPlatforms } from "../lib/discord/sync-platforms.js";
import { emptyState } from "../lib/discord/apply-sync.js";

function feedEvent(id, tag) {
  return {
    id,
    title: id,
    host: null,
    hostLink: null,
    description: null,
    tags: [tag],
    platform: { tag, label: tag, color: null },
    allDay: false,
    start: "2026-10-11T19:00:00.000Z",
    end: null,
    url: `https://events.example.com${id}`,
    image: null,
  };
}

function fakeClient(webhookId, { fail = false } = {}) {
  const calls = [];
  let nextId = 1;
  return {
    webhookId,
    calls,
    async createMessage() {
      if (fail) throw new Error("Discord is down");
      calls.push("create");
      return `${webhookId}-${nextId++}`;
    },
    async editMessage() {
      calls.push("edit");
    },
    async deleteMessage(messageId) {
      calls.push(`delete ${messageId}`);
    },
  };
}

function harness({ channels, states = {}, clientOptions = {} }) {
  const clients = {};
  const written = {};
  const logs = [];
  const options = {
    channels,
    readState: async (tag, webhookId) => states[tag] ?? emptyState(webhookId),
    writeState: async (tag, state) => {
      written[tag] = structuredClone(state);
    },
    createClient: (webhookUrl) => {
      clients[webhookUrl] = fakeClient(webhookUrl, clientOptions[webhookUrl]);
      return clients[webhookUrl];
    },
    dryRun: false,
    log: (line) => logs.push(line),
  };
  return { clients, written, logs, options };
}

const PC = { tag: "PC", label: "PC", webhookUrl: "pc" };
const XBOX = { tag: "XBOX", label: "XBOX", webhookUrl: "xbox" };

test("syncPlatforms posts each event only to its platform's channel", async () => {
  const { clients, written, options } = harness({ channels: [PC, XBOX] });
  const errors = await syncPlatforms({
    ...options,
    feedEvents: [
      feedEvent("/a/", "PC"),
      feedEvent("/b/", "XBOX"),
      feedEvent("/c/", "PC"),
    ],
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(clients.pc.calls, ["create", "create"]);
  assert.deepEqual(clients.xbox.calls, ["create"]);
  assert.deepEqual(Object.keys(written.PC.messages), ["/a/", "/c/"]);
  assert.deepEqual(Object.keys(written.XBOX.messages), ["/b/"]);
});

test("syncPlatforms skips a platform without a webhook and leaves its messages", async () => {
  const { clients, written, logs, options } = harness({
    channels: [PC, { ...XBOX, webhookUrl: null }],
  });
  await syncPlatforms({
    ...options,
    feedEvents: [feedEvent("/a/", "PC")],
  });
  assert.equal(clients.xbox, undefined);
  assert.equal(written.XBOX, undefined);
  assert.ok(logs.some((line) => /DISCORD_WEBHOOK_URL_XBOX/.test(line)));
});

test("syncPlatforms moves an event that changed platform", async () => {
  const { clients, written, options } = harness({
    channels: [PC, XBOX],
    states: {
      PC: {
        webhookId: "pc",
        messages: { "/a/": { messageId: "9", hash: "h" } },
      },
    },
  });
  await syncPlatforms({ ...options, feedEvents: [feedEvent("/a/", "XBOX")] });
  assert.deepEqual(clients.pc.calls, ["delete 9"]);
  assert.deepEqual(clients.xbox.calls, ["create"]);
  assert.deepEqual(written.PC.messages, {});
});

test("syncPlatforms keeps going after one platform fails", async () => {
  const { clients, options } = harness({
    channels: [PC, XBOX],
    clientOptions: { pc: { fail: true } },
  });
  const errors = await syncPlatforms({
    ...options,
    feedEvents: [feedEvent("/a/", "PC"), feedEvent("/b/", "XBOX")],
  });
  assert.deepEqual(clients.xbox.calls, ["create"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /PC.*Discord is down/);
});

test("syncPlatforms makes no calls and writes no state on a dry run", async () => {
  const { clients, written, logs, options } = harness({ channels: [PC] });
  await syncPlatforms({
    ...options,
    dryRun: true,
    feedEvents: [feedEvent("/a/", "PC")],
  });
  assert.deepEqual(clients.pc.calls, []);
  assert.deepEqual(written, {});
  assert.ok(logs.some((line) => /create\s+\/a\//.test(line)));
});
