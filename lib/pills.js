function definitionMatchesTag(definition, tag) {
  return definition.tag.toLowerCase() === tag.toLowerCase();
}

export function pillsForTags(tags, pillDefinitions) {
  return pillDefinitions
    .filter((definition) =>
      tags.some((tag) => definitionMatchesTag(definition, tag)),
    )
    .map((definition) => ({
      label: definition.label,
      color: definition.color ?? null,
    }));
}

export function tagBadges(tags, pillDefinitions) {
  const highlighted = pillsForTags(tags, pillDefinitions).map((pill) => ({
    ...pill,
    highlighted: true,
  }));
  const plain = tags
    .filter(
      (tag) =>
        !pillDefinitions.some((definition) =>
          definitionMatchesTag(definition, tag),
        ),
    )
    .map((tag) => ({ label: tag, color: null, highlighted: false }));
  return [...highlighted, ...plain];
}
