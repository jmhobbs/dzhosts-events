import { createHash } from "node:crypto";

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeysDeep(value[key])]),
  );
}

export function messageHash(message) {
  return createHash("sha256")
    .update(JSON.stringify(sortKeysDeep(message)))
    .digest("hex");
}

// desired is [{ id, message }] in post order. state.messages maps id to { messageId, hash }.
export function planSync(desired, state) {
  const plan = { create: [], update: [], unchanged: [], remove: [] };
  const desiredIds = new Set();
  for (const { id, message } of desired) {
    desiredIds.add(id);
    const hash = messageHash(message);
    const posted = state.messages[id];
    if (!posted) {
      plan.create.push({ id, message, hash });
    } else if (posted.hash === hash) {
      plan.unchanged.push({ id, messageId: posted.messageId });
    } else {
      plan.update.push({ id, messageId: posted.messageId, message, hash });
    }
  }
  for (const [id, posted] of Object.entries(state.messages)) {
    if (!desiredIds.has(id)) {
      plan.remove.push({ id, messageId: posted.messageId });
    }
  }
  return plan;
}
