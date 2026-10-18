// Event ids are page paths that start with "/", so this id never matches an event.
export const EMPTY_CHANNEL_MESSAGE_ID = "no-upcoming-events";

const colorNumber = (hexColor) =>
  Number.parseInt(hexColor.replace("#", ""), 16);

// Posted in place of events so an empty channel does not look broken.
export function emptyChannelMessage({ submissionsUrl, themeColor }) {
  return {
    embeds: [
      {
        title: "No Upcoming Events",
        description: `Running an event? [Submit Yours](${submissionsUrl})`,
        color: colorNumber(themeColor),
      },
    ],
    allowed_mentions: { parse: [] },
  };
}
