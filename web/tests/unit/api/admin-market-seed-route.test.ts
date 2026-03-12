import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireSuperAdminMock,
  createServiceClientMock,
  runIngestionForJobMock,
  completeJobMock,
  failJobForRetryMock,
  refreshPlatformMarketPoolMock,
  invalidateMarketBenchmarkCacheMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  runIngestionForJobMock: vi.fn(),
  completeJobMock: vi.fn(),
  failJobForRetryMock: vi.fn(),
  refreshPlatformMarketPoolMock: vi.fn(),
  invalidateMarketBenchmarkCacheMock: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/ingestion/worker", () => ({
  runIngestionForJob: runIngestionForJobMock,
}));

vi.mock("@/lib/ingestion/job-runner", () => ({
  completeJob: completeJobMock,
  failJobForRetry: failJobForRetryMock,
}));

vi.mock("@/lib/benchmarks/platform-market-pool", () => ({
  refreshPlatformMarketPool: refreshPlatformMarketPoolMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  invalidateMarketBenchmarkCache: invalidateMarketBenchmarkCacheMock,
}));

import { POST } from "@/app/api/admin/market-seed/route";

function createServiceSupabase() {
  let jobCounter = 0;

  return {
    from(table: string) {
      if (table === "ingestion_sources") {
        return {
          select() {
            return Promise.resolve({
              data: [
                {
                  id: "source-1",
                  slug: "uae_fcsc_workforce_comp",
                  enabled: true,
                  approved_for_commercial: true,
                  needs_review: false,
                },
                {
                  id: "source-2",
                  slug: "qatar_wages",
                  enabled: true,
                  approved_for_commercial: true,
                  needs_review: false,
                },
                {
                  id: "source-3",
                  slug: "kuwait_open_labor",
                  enabled: true,
                  approved_for_commercial: true,
                  needs_review: false,
                },
                {
                  id: "source-4",
                  slug: "ilostat_gcc",
                  enabled: true,
                  approved_for_commercial: false,
                  needs_review: true,
                },
              ],
              error: null,
            });
          },
        };
      }

      if (table === "ingestion_jobs") {
        return {
          insert() {
            jobCounter += 1;
            return {
              select() {
                return {
                  single() {
                    return Promise.resolve({
                      data: { id: `job-${jobCounter}` },
                      error: null,
                    });
                  },
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe("POST /api/admin/market-seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("returns a configuration error when shared-market env is incomplete", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/market-seed", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toBe("Server misconfiguration");
    expect(payload.missing).toContain("PLATFORM_WORKSPACE_ID");
    expect(createServiceClientMock).not.toHaveBeenCalled();
  });

  it("runs approved source ingestion and refreshes the market pool", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("PLATFORM_WORKSPACE_ID", "platform-workspace");
    createServiceClientMock.mockReturnValue(createServiceSupabase());
    runIngestionForJobMock
      .mockResolvedValueOnce({
        status: "success",
        records_created: 12,
        records_updated: 0,
        records_failed: 0,
      })
      .mockResolvedValueOnce({
        status: "partial",
        records_created: 4,
        records_updated: 0,
        records_failed: 1,
      });
    refreshPlatformMarketPoolMock.mockResolvedValue({ rowCount: 144 });

    const response = await POST(
      new Request("http://localhost/api/admin/market-seed", {
        method: "POST",
        body: JSON.stringify({
          sourceSlugs: ["uae_fcsc_workforce_comp", "qatar_wages"],
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(runIngestionForJobMock).toHaveBeenCalledTimes(2);
    expect(completeJobMock).toHaveBeenCalledTimes(2);
    expect(refreshPlatformMarketPoolMock).toHaveBeenCalledTimes(1);
    expect(invalidateMarketBenchmarkCacheMock).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({
      ok: true,
      ingested: [
        {
          jobId: "job-1",
          slug: "uae_fcsc_workforce_comp",
          status: "success",
          recordsCreated: 12,
          recordsFailed: 0,
        },
        {
          jobId: "job-2",
          slug: "qatar_wages",
          status: "partial",
          recordsCreated: 4,
          recordsFailed: 1,
        },
      ],
      selectedSourceSlugs: ["uae_fcsc_workforce_comp", "qatar_wages"],
      poolRows: 144,
    });
  });

  it("uses all approved commercial sources by default when none are requested", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("PLATFORM_WORKSPACE_ID", "platform-workspace");
    createServiceClientMock.mockReturnValue(createServiceSupabase());
    runIngestionForJobMock.mockResolvedValue({
      status: "success",
      records_created: 10,
      records_updated: 0,
      records_failed: 0,
    });
    refreshPlatformMarketPoolMock.mockResolvedValue({ rowCount: 188 });

    const response = await POST(
      new Request("http://localhost/api/admin/market-seed", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(runIngestionForJobMock).toHaveBeenCalledTimes(3);
    expect(payload.selectedSourceSlugs).toEqual([
      "uae_fcsc_workforce_comp",
      "qatar_wages",
      "kuwait_open_labor",
    ]);
    expect(payload.poolRows).toBe(188);
  });
});
