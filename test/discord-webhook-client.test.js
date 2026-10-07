import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWebhookClient,
  DiscordNotFoundError,
} from "../lib/discord/webhook-client.js";

const WEBHOOK_URL = "https://discord.com/api/webhooks/123/secret";

function jsonResponse(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fakeFetch(responses) {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    return responses.shift();
  };
  return { requests, fetchImpl };
}

test("createWebhookClient reads the webhook id from the URL", () => {
  const client = createWebhookClient({
    webhookUrl: WEBHOOK_URL,
    fetchImpl: async () => jsonResponse(204),
  });
  assert.equal(client.webhookId, "123");
});

test("createMessage waits for the message and returns its id", async () => {
  const { requests, fetchImpl } = fakeFetch([jsonResponse(200, { id: "55" })]);
  const client = createWebhookClient({ webhookUrl: WEBHOOK_URL, fetchImpl });
  const messageId = await client.createMessage({ content: "hi" });
  assert.equal(messageId, "55");
  assert.equal(requests[0].url, `${WEBHOOK_URL}?wait=true`);
  assert.equal(requests[0].init.method, "POST");
});

test("a rate limited request waits retry_after and tries again", async () => {
  const waits = [];
  const { requests, fetchImpl } = fakeFetch([
    jsonResponse(429, { retry_after: 1.5 }),
    jsonResponse(200, {}),
  ]);
  const client = createWebhookClient({
    webhookUrl: WEBHOOK_URL,
    fetchImpl,
    sleep: async (milliseconds) => waits.push(milliseconds),
  });
  await client.editMessage("55", { content: "hi" });
  assert.deepEqual(waits, [1500]);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, `${WEBHOOK_URL}/messages/55`);
  assert.equal(requests[1].init.method, "PATCH");
});

test("a missing message raises DiscordNotFoundError", async () => {
  const { fetchImpl } = fakeFetch([jsonResponse(404, { code: 10008 })]);
  const client = createWebhookClient({ webhookUrl: WEBHOOK_URL, fetchImpl });
  await assert.rejects(client.deleteMessage("55"), DiscordNotFoundError);
});

test("other errors include the status and do not leak the token", async () => {
  const { fetchImpl } = fakeFetch([jsonResponse(400, { message: "bad" })]);
  const client = createWebhookClient({ webhookUrl: WEBHOOK_URL, fetchImpl });
  await assert.rejects(client.createMessage({}), (error) => {
    assert.match(error.message, /400/);
    assert.doesNotMatch(error.message, /secret/);
    return true;
  });
});
