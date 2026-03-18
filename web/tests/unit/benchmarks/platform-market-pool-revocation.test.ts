import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createServiceClientMock } = vi.hoisted(() => ({
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

import { refreshPlatformMarketPool } from "@/lib/benchmarks/platform-market-pool";

function createRevocationClient() {
  const stagedPlatformInserts: unknown[][] = [];

  return {
    client: {
      rpc() {
        return Promise.resolve({ error: null });
      },
      from(table: string) {
        if (table === "employees" || table === "workspace_settings") {
          return {
            select() {
              return Promise.resolve({ data: [], error: null });
            },
          };
        }

        if (table === "salary_benchmarks") {
          return {
            select() {
              return Promise.resolve({
                data: [
                  {
                    workspace_id: "platform",
                    role_id: "tpm",
                    location_id: "riyadh",
                    level_id: "ic5",
                    industry: null,
                    company_size: null,
                    p50: 140_000,
                    currency: "SAR",
                    source: "market",
                    market_source_slug: "wb_gcc_wage_workers",
                    market_source_tier: "proxy",
                  },
                  {
                    workspace_id: "platform",
                    role_id: "tpm",
                    location_id: "riyadh",
                    level_id: "ic5",
                    industry: null,
                    company_size: null,
                    p50: 150_000,
                    currency: "SAR",
                    source: "market",
                    market_source_slug: "wb_gcc_wage_workers",
                    market_source_tier: "proxy",
                  },
                  {
                    workspace_id: "platform",
                    role_id: "tpm",
                    location_id: "riyadh",
                    level_id: "ic5",
                    industry: null,
                    company_size: null,
                    p50: 160_000,
                    currency: "SAR",
                    source: "market",
                    market_source_slug: "wb_gcc_wage_workers",
                    market_source_tier: "proxy",
                  },
                ],
                error: null,
              });
            },
          };
        }

        if (table === "ingestion_sources") {
          return {
            select() {
              return Promise.resolve({
                data: [
                  {
                    slug: "wb_gcc_wage_workers",
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

        if (table === "platform_market_benchmarks_staging") {
          return {
            delete() {
              return {
                gte() {
                  return Promise.resolve({ error: null });
                },
              };
            },
            insert(rows: unknown[]) {
              stagedPlatformInserts.push(rows);
              return Promise.resolve({ error: null });
            },
          };
        }

        if (table === "public_benchmark_snapshots_staging") {
          return {
            delete() {
              return {
                gte() {
                  return Promise.resolve({ error: null });
                },
              };
            },
            insert() {
              return Promise.resolve({ error: null });
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    },
    stagedPlatformInserts,
  };
}

describe("refreshPlatformMarketPool source revocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("QEEMLY_ENABLE_DEMO_MARKET_BOOTSTRAP", "true");
  });

  it("excludes blocked market sources from newly published pooled rows", async () => {
    const { client, stagedPlatformInserts } = createRevocationClient();
    createServiceClientMock.mockReturnValue(client);

    const result = await refreshPlatformMarketPool();

    expect(result.rowCount).toBe(0);
    expect(stagedPlatformInserts).toEqual([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
});
