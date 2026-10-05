# Adding an event

Add a Markdown file to `src/events/<year>/<month>/`, using the year and month from the event start date.

The file name becomes the URL slug, so `src/events/2026/10/fall-raid-night.md` is published at `/events/2026/10/fall-raid-night/`. 

```markdown
---
title: Spooky Ohio Community Run
host: WILDLANDZ
description: 2 Spooky 4 U
start: "2026-10-17T19:00:00-05:00"
end: "2026-10-17T23:00:00-05:00"
---

Join the WILDLANDZ community for a run on Halloween Green county!

### Links

- [Discord](https://discord.gg/example)
```

## Event Metadata

The markdown file has event metadata, this is known as the "front matter", in between the `---` lines.

The following fields are supported:


| Field         | Required     | Notes                                                                                            |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `title`       | yes          | Event name.                                                                                      |
| `start`       | yes          | Quoted ISO 8601 time with a UTC offset, or a quoted date for an all-day event.                   |
| `end`         | no           | Same kind as `start`. Must not be before `start`. For all-day events, the last day.              |
| `host`        | no           | Community or server running the event.                                                           |
| `hostLink`    | no           | http or https URL. Links the host name on the event page. Requires `host`.                       |
| `image`       | no           | Image file name in the same folder as the event. `.jpg`, `.jpeg`, `.png` or `.webp`.             |
| `imageAlt`    | with `image` | Text describing the image, including any text on a poster.                                       |
| `tags`        | no           | List of tags. All tags show on the event page. If an XBOX event, ensure to include the XBOX tag. |
| `description` | no           | One or two sentences shown on the upcoming list.                                                 |

Put server details, rules and links in the body.

### Dates & Times

For an event that runs over several days, like a week-long playtest, set `start` and `end` days apart. It stays on the upcoming list until `end`. For separate sessions on different days, add one file per session.

```yaml
start: "2026-10-05"
end: "2026-10-09"
```

This shows as "October 5th – 9th" in every timezone, and calendar apps show it as all-day. `end` is the last day and can be left out for a one-day event. `start` and `end` must both be dates or both be times. The event stays on the upcoming list until the last day has ended everywhere (UTC-12). If the event has a real opening time, use times instead, so players far from UTC do not show up early.

For an all-day event that is the same dates for everyone, like a playtest with no set hours, use dates with no time:

Dates must be quoted and must include an offset (`-05:00`, `+02:00` or `Z`). The build fails if they are not. Unquoted YAML dates and times without an offset are read as UTC, which puts the event at the wrong time.

## Event images

Put the image in the same folder as the event and name it in the front matter:

```
src/events/2026/10/an-industrious-affair.md
src/events/2026/10/an-industrious-affair.png
```

```yaml
image: an-industrious-affair.png
imageAlt: Poster for An Industrious Affair, with the target building and date
```

Download images and commit them. Do not link to Discord attachments, since those links expire.

