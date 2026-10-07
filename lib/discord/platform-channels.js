const ENV_PREFIX = "DISCORD_WEBHOOK_URL_";

export function webhookEnvName(tag) {
  return ENV_PREFIX + tag.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

// Each platform posts to its own channel through its own webhook.
export function platformChannels(platformDefinitions, env) {
  return platformDefinitions.map((definition) => ({
    tag: definition.tag,
    label: definition.label,
    webhookUrl: env[webhookEnvName(definition.tag)] || null,
  }));
}
