# Development

```sh
npm install
npm test              # unit tests for lib/
npm run serve         # dev server at http://localhost:8080
npm run build         # output in _site/
npm run format:check  # prettier
```

In `src/_data/site.json`, set `url` to the public site URL. It is used for ICS event IDs, canonical links and `og:url`. `discordUrl` is the invite linked in the footer. `themeColor` sets the `theme-color` meta tag, which Discord uses for the stripe on link previews.

To post events to Discord, see [Discord sync](discord.md).
