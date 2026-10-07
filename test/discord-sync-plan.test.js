import { test } from "node:test";
import assert from "node:assert/strict";
import { planSync, messageHash } from "../lib/discord/sync-plan.js";

const body = (title) => ({ embeds: [{ title }] });

test("planSync sorts events into create, update, unchanged and remove", () => {
  const desired = [
    { id: "/new/", message: body("New") },
    { id: "/same/", message: body("Same") },
    { id: "/changed/", message: body("Changed now") },
  ];
  const state = {
    webhookId: "1",
    messages: {
      "/same/": { messageId: "10", hash: messageHash(body("Same")) },
      "/changed/": { messageId: "11", hash: messageHash(body("Changed")) },
      "/gone/": { messageId: "12", hash: "x" },
    },
  };
  const plan = planSync(desired, state);
  assert.deepEqual(
    plan.create.map((item) => item.id),
    ["/new/"],
  );
  assert.deepEqual(
    plan.unchanged.map((item) => item.id),
    ["/same/"],
  );
  assert.deepEqual(
    plan.update.map((item) => [item.id, item.messageId]),
    [["/changed/", "11"]],
  );
  assert.deepEqual(plan.remove, [{ id: "/gone/", messageId: "12" }]);
  assert.equal(plan.update[0].hash, messageHash(body("Changed now")));
});

test("messageHash ignores key order", () => {
  assert.equal(
    messageHash({ a: 1, b: { c: 2, d: 3 } }),
    messageHash({ b: { d: 3, c: 2 }, a: 1 }),
  );
});
