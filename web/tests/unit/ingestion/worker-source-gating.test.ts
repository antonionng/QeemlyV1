import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createServiceClientMock,
  getIngestorForSourceMock,
  normalizeBenchmarkRowMock,
  validateBenchmarkRowMock,
  buildDQReportMock,
  upsertBenchmarksFreshnessMock,
  refreshPlatformMarketPoolBestEffortMock,
  benchmarkRowToIndustrySignalsMock,
} = vi.hoisted(() => ({
  createServiceClientMock: vi.fn(),
  getIngestorForSourceMock: vi.fn(),
  normalizeBenchmarkRowMock: vi.fn(),
  validateBenchmarkRowMock: vi.fn(),
  buildDQReportMock: vi.fn(),
  upsertBenchmarksFreshnessMock: vi.fn(),
  refreshPlatformMarketPoolBestEffortMock: vi.fn(),
  benchmarkRowToIndustrySignalsMock: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/ingestion/adapters", () => ({
  getIngestorForSource: getIngestorForSourceMock,
}));

vi.mock("@/lib/ingestion/normalizer", () => ({
  normalizeBenchmarkRow: normalizeBenchmarkRowMock,
}));

vi.mock("@/lib/ingestion/data-quality", () => ({
  validateBenchmarkRow: validateBenchmarkRowMock,
  buildDQReport: buildDQReportMock,
}));

vi.mock("@/lib/ingestion/freshness", () => ({
  upsertBenchmarksFreshness: upsertBenchmarksFreshnessMock,
}));

vi.mock("@/lib/benchmarks/platform-market-sync", () => ({
  refreshPlatformMarketPoolBestEffort: refreshPlatformMarketPoolBestEffortMock,
}));

vi.mock("@/lib/ingestion/industry-normalization", () => ({
  benchmarkRowToIndustrySignals: benchmarkRowToIndustrySignalsMock,
}));

import { runIngestionForJob } from "@/lib/ingestion/worker";

type SourceRecord = {
  id: string;
  slug: string;
  enabled: boolean;
  approved_for_commercial: boolean;
  needs_review: boolean;
  tier?: "official" | "proxy";
};

function createSupabaseForWorker(source: SourceRecord) {
  const salaryBenchmarkUpserts: Array<Record<string, unknown>> = [];

  return {
    client: {
      from(table: string) {
        if (table === "ingestion_sources") {
          return {
            select() {
              return {
                eq() {
                  return {
                    single() {
                      return Promise.resolve({
                        data: source,
                        error: null,
                      });
                    },
                  };
                },
              };
            },
          };
        }

        if (table === "raw_source_snapshots") {
          return {
            insert() {
              return Promise.resolve({ error: null });
            },
          };
        }

        if (table === "salary_benchmarks") {
          return {
            upsert(payload: Record<string, unknown>) {
              salaryBenchmarkUpserts.push(payload);
              return Promise.resolve({ error: null });
            },
          };
        }

        if (table === "industry_market_signals") {
          return {
            upsert() {
              return Promise.resolve({ error: null });
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    },
    salaryBenchmarkUpserts,
  };
}

describe("runIngestionForJob source gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildDQReportMock.mockReturnValue({
      totalRows: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      reasons: {},
      sampleErrors: [],
      timestamp: "2026-03-16T00:00:00.000Z",
    });
    benchmarkRowToIndustrySignalsMock.mockReturnValue([]);
    upsertBenchmarksFreshnessMock.mockResolvedValue(undefined);
    refreshPlatformMarketPoolBestEffortMock.mockResolvedValue(undefined);
  });

  it.each([
    {
      label: "disabled sources",
      source: {
        id: "source-1",
        slug: "uae_fcsc_workforce_comp",
        enabled: false,
        approved_for_commercial: true,
        needs_review: false,
        tier: "official" as const,
      },
    },
    {
      label: "review-blocked sources",
      source: {
        id: "source-2",
        slug: "uae_fcsc_workforce_comp",
        enabled: true,
        approved_for_commercial: true,
        needs_review: true,
        tier: "official" as const,
      },
    },
    {
      label: "commercially unapproved sources",
      source: {
        id: "source-3",
        slug: "uae_fcsc_workforce_comp",
        enabled: true,
        approved_for_commercial: false,
        needs_review: false,
        tier: "official" as const,
      },
    },
  ])("rejects $label even when the worker is called directly", async ({ source }) => {
    const { client, salaryBenchmarkUpserts } = createSupabaseForWorker(source);
    createServiceClientMock.mockReturnValue(client);
    getIngestorForSourceMock.mockReturnValue({
      fetch: vi.fn(),
    });

    const result = await runIngestionForJob("job-1", source.id, "platform-workspace");

    expect(result.status).toBe("failed");
    expect(result.records_created).toBe(0);
    expect(result.error_message).toContain("not approved for ingestion");
    expect(getIngestorForSourceMock).not.toHaveBeenCalled();
    expect(salaryBenchmarkUpserts).toEqual([]);
  });

  it("persists market_source_tier for approved sources", async () => {
    const source = {
      id: "source-4",
      slug: "uae_fcsc_workforce_comp",
      enabled: true,
      approved_for_commercial: true,
      needs_review: false,
      tier: "official" as const,
    };
    const { client, salaryBenchmarkUpserts } = createSupabaseForWorker(source);
    createServiceClientMock.mockReturnValue(client);
    getIngestorForSourceMock.mockReturnValue({
      fetch: vi.fn().mockResolvedValue([{ role: "Software Engineer" }]),
    });
    normalizeBenchmarkRowMock.mockReturnValue({
      ok: {
        roleId: "swe",
        levelId: "ic3",
        locationId: "dubai",
        industry: null,
        companySize: null,
        currency: "AED",
        p10: 90_000,
        p25: 100_000,
        p50: 110_000,
        p75: 120_000,
        p90: 130_000,
        sampleSize: 12,
        mappingConfidence: "high",
      },
    });
    validateBenchmarkRowMock.mockReturnValue({
      ok: true,
    });

    const result = await runIngestionForJob("job-2", source.id, "platform-workspace");

    expect(result.status).toBe("success");
    expect(result.records_created).toBe(1);
    expect(salaryBenchmarkUpserts).toHaveLength(1);
    expect(salaryBenchmarkUpserts[0]).toMatchObject({
      source: "market",
      market_source_slug: "uae_fcsc_workforce_comp",
      market_source_tier: "official",
    });
  });
});
