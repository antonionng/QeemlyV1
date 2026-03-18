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

function createSupabaseForWorker() {
  return {
    from(table: string) {
      if (table === "ingestion_sources") {
        return {
          select() {
            return {
              eq() {
                return {
                  single() {
                    return Promise.resolve({
                      data: {
                        id: "source-1",
                        slug: "uae_fcsc_workforce_comp",
                        enabled: true,
                        approved_for_commercial: true,
                        needs_review: false,
                        tier: "official",
                      },
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
          upsert() {
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
  };
}

describe("runIngestionForJob funnel diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    benchmarkRowToIndustrySignalsMock.mockReturnValue([]);
    upsertBenchmarksFreshnessMock.mockResolvedValue(undefined);
    refreshPlatformMarketPoolBestEffortMock.mockResolvedValue(undefined);
  });

  it("reports fetch-empty sources explicitly", async () => {
    createServiceClientMock.mockReturnValue(createSupabaseForWorker());
    getIngestorForSourceMock.mockReturnValue({
      fetch: vi.fn().mockResolvedValue([]),
    });

    const result = await runIngestionForJob("job-1", "source-1", "platform-workspace");

    expect(result.funnel).toEqual({
      outcome: "fetch_empty",
      fetchedRows: 0,
      normalizedRows: 0,
      normalizeFailedRows: 0,
      dqPassedRows: 0,
      dqFailedRows: 0,
      upsertedRows: 0,
      upsertFailedRows: 0,
    });
  });

  it("counts normalization loss, dq loss, and upserts separately", async () => {
    createServiceClientMock.mockReturnValue(createSupabaseForWorker());
    getIngestorForSourceMock.mockReturnValue({
      fetch: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
    });
    normalizeBenchmarkRowMock
      .mockReturnValueOnce({ error: "Unmapped role" })
      .mockReturnValueOnce({
        ok: {
          roleId: "swe",
          levelId: "ic3",
          locationId: "dubai",
          currency: "AED",
          p10: 90_000,
          p25: 100_000,
          p50: 110_000,
          p75: 120_000,
          p90: 130_000,
          sampleSize: 12,
          mappingConfidence: "high",
        },
      })
      .mockReturnValueOnce({
        ok: {
          roleId: "pm",
          levelId: "ic3",
          locationId: "doha",
          currency: "QAR",
          p10: 80_000,
          p25: 90_000,
          p50: 100_000,
          p75: 110_000,
          p90: 120_000,
          sampleSize: 10,
          mappingConfidence: "high",
        },
      });
    validateBenchmarkRowMock
      .mockReturnValueOnce({ error: "Missing p50" })
      .mockReturnValueOnce({ ok: true });
    buildDQReportMock.mockReturnValue({
      totalRows: 3,
      passed: 1,
      failed: 2,
      skipped: 0,
      reasons: { "Unmapped role": 1, "Missing p50": 1 },
      sampleErrors: [],
      timestamp: "2026-03-17T00:00:00.000Z",
    });

    const result = await runIngestionForJob("job-2", "source-1", "platform-workspace");

    expect(result.funnel).toEqual({
      outcome: "partial_success",
      fetchedRows: 3,
      normalizedRows: 2,
      normalizeFailedRows: 1,
      dqPassedRows: 1,
      dqFailedRows: 1,
      upsertedRows: 1,
      upsertFailedRows: 0,
    });
  });
});
