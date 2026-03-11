import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMarketBenchmarks,
  findMarketBenchmark,
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

type PooledRow = PlatformRow & {
  provenance: "employee" | "uploaded" | "admin" | "blended";
  industry?: string | null;
  company_size?: string | null;
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

function createCanonicalPoolClient(pooledRows: PooledRow[], snapshotRows: SnapshotRow[]) {
  return {
    from(table: string) {
      if (table === "platform_market_benchmarks") {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      range(start: number, end: number) {
                        return Promise.resolve({
                          data: pooledRows.slice(start, end + 1),
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

  it("prefers canonical pooled market rows before public snapshots", async () => {
    const client = createCanonicalPoolClient(
      [
        {
          role_id: "pooled-role",
          location_id: "doha",
          level_id: "ic4",
          currency: "QAR",
          p10: 15000,
          p25: 18000,
          p50: 21000,
          p75: 24000,
          p90: 27000,
          sample_size: 32,
          provenance: "blended",
        },
      ],
      makeSnapshotRows(2),
    );

    const result = await fetchMarketBenchmarks(client);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "pooled-role",
      location_id: "doha",
      level_id: "ic4",
      currency: "QAR",
      p50: 21000,
      sample_size: 32,
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

describe("findMarketBenchmark", () => {
  it("prefers an exact segmented cohort over the base market row", async () => {
    const client = createCanonicalPoolClient(
      [
        {
          role_id: "swe",
          location_id: "dubai",
          level_id: "ic3",
          currency: "AED",
          p10: 12000,
          p25: 14000,
          p50: 16000,
          p75: 18000,
          p90: 20000,
          sample_size: 20,
          provenance: "blended",
          industry: null,
          company_size: null,
        },
        {
          role_id: "swe",
          location_id: "dubai",
          level_id: "ic3",
          currency: "AED",
          p10: 15000,
          p25: 17000,
          p50: 19000,
          p75: 21000,
          p90: 23000,
          sample_size: 8,
          provenance: "blended",
          industry: "Fintech",
          company_size: "201-500",
        },
      ],
      [],
    );

    const result = await findMarketBenchmark(client, "swe", "dubai", "ic3", {
      industry: "Fintech",
      companySize: "201-500",
    });

    expect(result).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      industry: "Fintech",
      company_size: "201-500",
      p50: 19000,
    });
  });

  it("falls back to the base market cohort when no segmented row exists", async () => {
    const client = createCanonicalPoolClient(
      [
        {
          role_id: "swe",
          location_id: "dubai",
          level_id: "ic3",
          currency: "AED",
          p10: 12000,
          p25: 14000,
          p50: 16000,
          p75: 18000,
          p90: 20000,
          sample_size: 20,
          provenance: "blended",
          industry: null,
          company_size: null,
        },
      ],
      [],
    );

    const result = await findMarketBenchmark(client, "swe", "dubai", "ic3", {
      industry: "Fintech",
    });

    expect(result).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      industry: null,
      company_size: null,
      p50: 16000,
    });
  });
});
