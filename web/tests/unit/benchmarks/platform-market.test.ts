import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMarketBenchmarks,
  invalidateMarketBenchmarkCache,
  type MarketBenchmark,
} from "@/lib/benchmarks/platform-market";

type SnapshotRow = {
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  p25: number;
  p50: number;
  p75: number;
};

type PlatformRow = {
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size: number | null;
};

function makeSnapshotRows(count: number): SnapshotRow[] {
  return Array.from({ length: count }, (_, index) => ({
    role_id: `role-${index}`,
    location_id: "dubai",
    level_id: "ic3",
    currency: "AED",
    p25: 10000 + index,
    p50: 12000 + index,
    p75: 14000 + index,
  }));
}

function createPublicSnapshotClient(rows: SnapshotRow[]) {
  return {
    from(table: string) {
      if (table !== "public_benchmark_snapshots") {
        throw new Error(`Unexpected table: ${table}`);
      }

      const state = {
        start: 0,
        end: rows.length - 1,
      };

      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order() {
          return this;
        },
        limit(limit: number) {
          return Promise.resolve({
            data: rows.slice(0, Math.min(limit, 1000)),
          });
        },
        range(start: number, end: number) {
          state.start = start;
          state.end = end;
          return Promise.resolve({
            data: rows.slice(start, end + 1),
          });
        },
      };
    },
  };
}

function createRealisticPublicSnapshotClient(rows: SnapshotRow[]) {
  return {
    from(table: string) {
      if (table !== "public_benchmark_snapshots") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return {
                    range(start: number, end: number) {
                      return Promise.resolve({
                        data: rows.slice(start, end + 1),
                      });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

function createPlatformFallbackClient(snapshotRows: SnapshotRow[], platformRows: PlatformRow[]) {
  return {
    from(table: string) {
      if (table === "public_benchmark_snapshots") {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      range(start: number, end: number) {
                        return Promise.resolve({
                          data: snapshotRows.slice(start, end + 1),
                        });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "salary_benchmarks") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      order() {
                        return {
                          range(start: number, end: number) {
                            return Promise.resolve({
                              data: platformRows.slice(start, end + 1),
                            });
                          },
                        };
                      },
                    };
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

function createErroredSnapshotClient(message: string) {
  return {
    from(table: string) {
      if (table !== "public_benchmark_snapshots") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return {
                    range() {
                      return Promise.resolve({
                        data: null,
                        error: { message },
                      });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  invalidateMarketBenchmarkCache();
});

describe("fetchMarketBenchmarks", () => {
  it("accepts a Supabase-style builder where filter methods are available after select", async () => {
    invalidateMarketBenchmarkCache();
    const client = createRealisticPublicSnapshotClient(makeSnapshotRows(2));

    const result = await fetchMarketBenchmarks(client);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "role-0",
      location_id: "dubai",
      level_id: "ic3",
      source: "market",
    });
  });

  it("falls back to platform workspace rows with the same builder contract", async () => {
    vi.stubEnv("PLATFORM_WORKSPACE_ID", "platform-workspace");
    const client = createPlatformFallbackClient([], [
      {
        role_id: "role-platform",
        location_id: "riyadh",
        level_id: "ic4",
        currency: "SAR",
        p10: 20000,
        p25: 23000,
        p50: 26000,
        p75: 29000,
        p90: 32000,
        sample_size: 20,
      },
    ]);

    const result = await fetchMarketBenchmarks(client);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "role-platform",
      location_id: "riyadh",
      level_id: "ic4",
      currency: "SAR",
      source: "market",
    });
  });

  it("loads all public snapshot rows across pages instead of truncating at 1000", async () => {
    invalidateMarketBenchmarkCache();
    const client = createPublicSnapshotClient(makeSnapshotRows(1200));

    const result = await fetchMarketBenchmarks(client);

    expect(result).toHaveLength(1200);
    expect(result[0]).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "role-0",
      location_id: "dubai",
      level_id: "ic3",
      source: "market",
    });
    expect(result.at(-1)).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "role-1199",
    });
  });

  it("throws query errors so API diagnostics can surface them", async () => {
    invalidateMarketBenchmarkCache();

    await expect(fetchMarketBenchmarks(createErroredSnapshotClient("RLS denied"))).rejects.toThrow(
      "RLS denied",
    );
  });
});
