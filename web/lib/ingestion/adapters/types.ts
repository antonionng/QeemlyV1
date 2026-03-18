export type IngestionAdapterContext = {
  source?: {
    slug: string;
    config: Record<string, unknown>;
  };
};

export type IngestionAdapter = {
  slug: string;
  fetch: (sourceId: string, context?: IngestionAdapterContext) => Promise<Record<string, unknown>[]>;
};
