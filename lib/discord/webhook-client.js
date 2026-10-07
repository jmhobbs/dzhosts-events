export class DiscordNotFoundError extends Error {}

const WEBHOOK_PATH = /\/webhooks\/(\d+)\/[^/]+\/?$/;
const MAX_RATE_LIMIT_RETRIES = 3;

const defaultSleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export function createWebhookClient({
  webhookUrl,
  fetchImpl = fetch,
  sleep = defaultSleep,
}) {
  const match = new URL(webhookUrl).pathname.match(WEBHOOK_PATH);
  if (!match) {
    throw new Error("DISCORD_WEBHOOK_URL is not a Discord webhook URL");
  }
  const baseUrl = webhookUrl.replace(/\/$/, "");

  // Errors name the method and path only, so the webhook token never reaches logs.
  async function request(method, path, body) {
    for (let attempt = 0; ; attempt++) {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: body ? { "content-type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        const { retry_after: retryAfterSeconds } = await response.json();
        await sleep(retryAfterSeconds * 1000);
        continue;
      }
      const label = `${method} ${path.replace(/\?.*$/, "") || "/"}`;
      if (response.status === 404) {
        throw new DiscordNotFoundError(`${label}: not found`);
      }
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `${label}: Discord returned ${response.status} ${detail}`,
        );
      }
      return response.status === 204 ? null : response.json();
    }
  }

  return {
    webhookId: match[1],
    async createMessage(message) {
      const created = await request("POST", "?wait=true", message);
      return created.id;
    },
    async editMessage(messageId, message) {
      await request("PATCH", `/messages/${messageId}`, message);
    },
    async deleteMessage(messageId) {
      await request("DELETE", `/messages/${messageId}`);
    },
  };
}
