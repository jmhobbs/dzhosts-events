# Discord sync

`npm run discord:sync` keeps one message per upcoming event in Discord, with one channel per platform. It edits a message when its event changes and deletes it when the event ends or is removed. It never posts the same event twice while the state file exists.

## Setup

1. Make one channel per platform in `src/_data/platforms.json`.
2. In each channel's settings, open Integrations, then Webhooks, and create a webhook.
3. Copy each URL into an env var named after the platform tag: `DISCORD_WEBHOOK_URL_PC`, `DISCORD_WEBHOOK_URL_XBOX`. The tag is uppercased and any character other than a letter or digit becomes `_`.
4. Set `url` in `src/_data/site.json` to the public site URL. The sync reads the feed from it, and embeds link to it and load images from it.

## Running

```sh
npm run build
# deploy _site/, the sync reads the published feed
export DISCORD_WEBHOOK_URL_PC="https://discord.com/api/webhooks/..."
export DISCORD_WEBHOOK_URL_XBOX="https://discord.com/api/webhooks/..."
npm run discord:sync -- --dry-run   # print what would change
npm run discord:sync
```

Run it again any time. Events that have not changed are left alone. Run it at least daily so ended events are removed.

## How it works

- The build writes `_site/events.json` with every upcoming event. By default the sync fetches the published copy, `https://events.dzhosts.com/events.json`, so Discord matches the live site and never links to a page that is not deployed.
- Events that ended after the feed was built are dropped at sync time. A daily sync removes ended events even when the site was not deployed that day.
- Each event is keyed by its page path, for example `/events/2026/10/cabin-fever/`. Moving an event file to another month folder deletes the old message and posts a new one.
- Each event goes to the channel for its platform tag. Retagging an event deletes it from the old channel and posts it in the new one.
- A platform whose env var is not set is skipped with a warning. Its channel and state file are left alone, so nothing is deleted.
- If one platform fails, the others still sync and the command exits with an error.
- `.discord-sync-state/<tag>.json` maps each event in that channel to its Discord message id and a hash of the message. The folder is not committed.
- Times use Discord timestamps, so each reader sees their own local time. All-day events show the dates as written.
- Messages cannot ping `@everyone`, roles or users.

## Options

- `--feed <url or path>`: feed to read. A value starting with `http://` or `https://` is fetched, anything else is read from disk. Default `events.json` under `url` in `src/_data/site.json`. Use `--feed _site/events.json --dry-run` to check a local build before deploying it.
- `--state-dir <path>`: state folder. Default `.discord-sync-state`. Each state file records its webhook, and the tool refuses a file written for a different webhook.
- `--dry-run`: print the plan and make no Discord calls.

## Limits

- If a state file is lost, the next run posts that platform's events again and the old messages stay. A webhook cannot list messages, so delete them by hand. Keep a copy of the state folder.
- Messages stay in the order they were posted. An event added later appears below events that start after it.
- If the feed is missing or broken, the sync stops without changes. This covers a non-2xx response, a network error, no response in 30 seconds, and a body with no `events` list.
