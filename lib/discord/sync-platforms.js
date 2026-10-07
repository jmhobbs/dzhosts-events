import { eventMessage } from "./event-message.js";
import { planSync } from "./sync-plan.js";
import { applySync } from "./apply-sync.js";
import { webhookEnvName } from "./platform-channels.js";

function logPlan(plan, label, log) {
  for (const [action, items] of Object.entries(plan)) {
    for (const item of items) {
      log(`${label.padEnd(8)} ${action.padEnd(9)} ${item.id}`);
    }
  }
}

async function syncChannel(channel, feedEvents, options) {
  const { readState, writeState, createClient, dryRun, log } = options;
  const client = createClient(channel.webhookUrl);
  const state = await readState(channel.tag, client.webhookId);
  const desired = feedEvents
    .filter((event) => event.platform.tag === channel.tag)
    .map((event) => ({ id: event.id, message: eventMessage(event) }));
  const plan = planSync(desired, state);
  logPlan(plan, channel.label, log);
  if (dryRun) return;
  await applySync(plan, client, state, {
    saveState: (snapshot) => writeState(channel.tag, snapshot),
  });
}

// Returns one error per failed platform, so one bad channel does not block the rest.
export async function syncPlatforms({ channels, feedEvents, ...options }) {
  const errors = [];
  for (const channel of channels) {
    // Without a webhook the channel is left alone, so a missing env var never deletes messages.
    if (!channel.webhookUrl) {
      options.log(
        `${channel.label.padEnd(8)} skipped, ${webhookEnvName(channel.tag)} is not set`,
      );
      continue;
    }
    try {
      await syncChannel(channel, feedEvents, options);
    } catch (error) {
      errors.push(new Error(`${channel.tag}: ${error.message}`));
    }
  }
  return errors;
}
