import type { IngestionAdapter } from "./types";

function isBenchmarkRow(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.role === "string" &&
    typeof row.level === "string" &&
    typeof row.location === "string" &&
    typeof row.currency === "string"
  );
}

async function loadConfiguredRows(config: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  if (Array.isArray(config.rows)) {
    return config.rows.filter(isBenchmarkRow);
  }

  const url = typeof config.url === "string" ? config.url.trim() : "";
  if (!url) return [];

  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) return [];

  const payload = (await response.json()) as unknown;
  if (Array.isArray(payload)) {
    return payload.filter(isBenchmarkRow);
  }
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { rows?: unknown[] }).rows)
  ) {
    return ((payload as { rows: unknown[] }).rows).filter(isBenchmarkRow);
  }
  return [];
}

export const configurableBenchmarkFeedAdapter: IngestionAdapter = {
  slug: "configurable_benchmark_feed",
  async fetch(_sourceId: string, context): Promise<Record<string, unknown>[]> {
    return loadConfiguredRows(context?.source?.config ?? {});
  },
};
