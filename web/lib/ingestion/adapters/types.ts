export type IngestionAdapter = {
  slug: string;
  fetch: (sourceId: string) => Promise<Record<string, unknown>[]>;
};
