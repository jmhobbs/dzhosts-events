function definitionMatchesTag(definition, tag) {
  return definition.tag.toLowerCase() === tag.toLowerCase();
}

function matchingDefinitions(tags, platformDefinitions) {
  return platformDefinitions.filter((definition) =>
    tags.some((tag) => definitionMatchesTag(definition, tag)),
  );
}

export function platformsForTags(tags, platformDefinitions) {
  return matchingDefinitions(tags, platformDefinitions).map((definition) => ({
    label: definition.label,
    color: definition.color ?? null,
  }));
}

// The home page lists each event under one platform, so it must have exactly one.
export function eventPlatform(tags, platformDefinitions, sourcePath) {
  const matches = matchingDefinitions(tags, platformDefinitions);
  if (matches.length !== 1) {
    const platformTags = platformDefinitions
      .map((definition) => definition.tag)
      .join(", ");
    throw new Error(
      `${sourcePath}: tags must include exactly one platform tag (${platformTags}), found ${matches.length}`,
    );
  }
  const [definition] = matches;
  return {
    tag: definition.tag,
    label: definition.label,
    color: definition.color ?? null,
  };
}

export function groupEventsByPlatform(events, platformDefinitions) {
  return platformDefinitions
    .map((definition) => ({
      platform: definition,
      events: events.filter((event) => event.platform.tag === definition.tag),
    }))
    .filter((group) => group.events.length > 0);
}

export function tagBadges(tags, platformDefinitions) {
  const highlighted = platformsForTags(tags, platformDefinitions).map(
    (platform) => ({
      ...platform,
      highlighted: true,
    }),
  );
  const plain = tags
    .filter(
      (tag) =>
        !platformDefinitions.some((definition) =>
          definitionMatchesTag(definition, tag),
        ),
    )
    .map((tag) => ({ label: tag, color: null, highlighted: false }));
  return [...highlighted, ...plain];
}
