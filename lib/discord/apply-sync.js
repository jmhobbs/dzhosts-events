import { DiscordNotFoundError } from "./webhook-client.js";

export function emptyState(webhookId) {
  return { webhookId, messages: {} };
}

// Saves after every change, so a failure part way through keeps the ids already posted.
export async function applySync(plan, client, state, { saveState }) {
  if (state.webhookId !== client.webhookId) {
    throw new Error(
      `state was written for webhook ${state.webhookId}, not ${client.webhookId}. Use another --state file.`,
    );
  }
  const next = { webhookId: state.webhookId, messages: { ...state.messages } };

  async function post({ id, message, hash }) {
    const messageId = await client.createMessage(message);
    next.messages[id] = { messageId, hash };
    await saveState(next);
  }

  for (const { id, messageId } of plan.remove) {
    try {
      await client.deleteMessage(messageId);
    } catch (error) {
      if (!(error instanceof DiscordNotFoundError)) throw error;
    }
    delete next.messages[id];
    await saveState(next);
  }
  for (const item of plan.update) {
    try {
      await client.editMessage(item.messageId, item.message);
      next.messages[item.id] = { messageId: item.messageId, hash: item.hash };
      await saveState(next);
    } catch (error) {
      if (!(error instanceof DiscordNotFoundError)) throw error;
      await post(item);
    }
  }
  for (const item of plan.create) {
    await post(item);
  }
  return next;
}
