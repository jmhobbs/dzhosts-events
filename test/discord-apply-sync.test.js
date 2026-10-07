import { test } from "node:test";
import assert from "node:assert/strict";
import { applySync, emptyState } from "../lib/discord/apply-sync.js";
import { DiscordNotFoundError } from "../lib/discord/webhook-client.js";

function fakeClient({ webhookId = "1", editNotFound = false } = {}) {
  const calls = [];
  let nextId = 100;
  return {
    calls,
    webhookId,
    async createMessage(message) {
      calls.push(["create", message]);
      return String(nextId++);
    },
    async editMessage(messageId, message) {
      calls.push(["edit", messageId, message]);
      if (editNotFound) throw new DiscordNotFoundError("gone");
    },
    async deleteMessage(messageId) {
      calls.push(["delete", messageId]);
      throw new DiscordNotFoundError("gone");
    },
  };
}

const message = { embeds: [{ title: "Raid" }] };

test("applySync stores the id of a created message and saves after each change", async () => {
  const client = fakeClient();
  const saved = [];
  const state = await applySync(
    {
      create: [{ id: "/a/", message, hash: "h" }],
      update: [],
      remove: [],
      unchanged: [],
    },
    client,
    emptyState("1"),
    { saveState: async (snapshot) => saved.push(structuredClone(snapshot)) },
  );
  assert.deepEqual(state.messages["/a/"], { messageId: "100", hash: "h" });
  assert.equal(saved.length, 1);
});

test("applySync reposts when the message to edit is gone", async () => {
  const client = fakeClient({ editNotFound: true });
  const state = await applySync(
    {
      create: [],
      update: [{ id: "/a/", messageId: "9", message, hash: "h2" }],
      remove: [],
      unchanged: [],
    },
    client,
    { webhookId: "1", messages: { "/a/": { messageId: "9", hash: "h1" } } },
    { saveState: async () => {} },
  );
  assert.deepEqual(
    client.calls.map((call) => call[0]),
    ["edit", "create"],
  );
  assert.deepEqual(state.messages["/a/"], { messageId: "100", hash: "h2" });
});

test("applySync drops the id when the message to delete is already gone", async () => {
  const client = fakeClient();
  const state = await applySync(
    {
      create: [],
      update: [],
      remove: [{ id: "/a/", messageId: "9" }],
      unchanged: [],
    },
    client,
    { webhookId: "1", messages: { "/a/": { messageId: "9", hash: "h" } } },
    { saveState: async () => {} },
  );
  assert.deepEqual(state.messages, {});
});

test("applySync refuses state written for another webhook", async () => {
  await assert.rejects(
    applySync(
      { create: [], update: [], remove: [], unchanged: [] },
      fakeClient({ webhookId: "2" }),
      emptyState("1"),
      { saveState: async () => {} },
    ),
    /webhook/,
  );
});
