export type SharedMarketSource = {
  slug: string;
};

export function normalizeRequestedSourceSlugs(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const slugs = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return slugs.length > 0 ? [...new Set(slugs)] : null;
}

export function getDefaultSharedMarketSourceSlugs(
  sources: ReadonlyArray<SharedMarketSource>,
): string[] {
  return [...new Set(sources.map((source) => source.slug.trim()).filter(Boolean))];
}
