import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMarketBenchmarks,
  findMarketBenchmark,
  invalidateMarketBenchmarkCache,
  type MarketBenchmark,
} from "@/lib/benchmarks/platform-market";

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
  market_source_tier?: "official" | "proxy" | "blended" | null;
};

function makePooledRows(count: number): PooledRow[] {
  return Array.from({ length: count }, (_, index) => ({
    role_id: `role-${index}`,
    location_id: "dubai",
    level_id: "ic3",
    currency: "AED",
    p10: 8000 + index,
    p25: 10000 + index,
    p50: 12000 + index,
    p75: 14000 + index,
    p90: 16000 + index,
    sample_size: 12,
    provenance: "blended",
  }));
}

function createCanonicalPoolOnlyClient(rows: PooledRow[]) {
  return {
    from(table: string) {
      if (table !== "platform_market_benchmarks") {
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

function createPlatformFallbackClient(
  snapshotRows: Array<Record<string, unknown>>,
  platformRows: PlatformRow[],
) {
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
                      range() {
                        return Promise.resolve({ data: [] });
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

function createCanonicalPoolClient(pooledRows: PooledRow[], snapshotRows: Array<Record<string, unknown>>) {
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

function createErroredCanonicalClient(message: string) {
  return {
    from(table: string) {
      if (table !== "platform_market_benchmarks") {
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
    const client = createCanonicalPoolOnlyClient(makePooledRows(2));

    const result = await fetchMarketBenchmarks(client);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "role-0",
      location_id: "dubai",
      level_id: "ic3",
      source: "market",
    });
  });

  it("retains canonical segmentation columns so segmented matching still works", async () => {
    invalidateMarketBenchmarkCache();
    const client = createCanonicalPoolOnlyClient([
      {
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        industry: "Fintech",
        company_size: "201-500",
        p10: 13_000,
        p25: 15_000,
        p50: 17_000,
        p75: 19_000,
        p90: 21_000,
        sample_size: 8,
        provenance: "blended",
      },
    ]);

    const result = await fetchMarketBenchmarks(client, { includeSegmented: true });

    expect(result[0]).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "swe",
      industry: "Fintech",
      company_size: "201-500",
      p50: 17_000,
    });
  });

  it("exposes market_source_tier from the canonical pool", async () => {
    invalidateMarketBenchmarkCache();
    const client = createCanonicalPoolOnlyClient([
      {
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        currency: "AED",
        p10: 13_000,
        p25: 15_000,
        p50: 17_000,
        p75: 19_000,
        p90: 21_000,
        sample_size: 8,
        provenance: "admin",
        market_source_tier: "official",
      },
    ]);

    const result = await fetchMarketBenchmarks(client, { includeSegmented: true });

    expect(result[0]).toMatchObject<Partial<MarketBenchmark>>({
      role_id: "swe",
      market_source_tier: "official",
    });
  });

  it("does not use public snapshot rows for product benchmark reads", async () => {
    invalidateMarketBenchmarkCache();
    const client = {
      from(table: string) {
        if (table !== "platform_market_benchmarks") {
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
                        return Promise.resolve({ data: [] });
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
    const snapshotOnlyClient = {
      from(table: string) {
        if (table === "platform_market_benchmarks") {
          return client.from(table);
        }
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
                          data: [
                            {
                              role_id: "swe",
                              location_id: "dubai",
                              level_id: "ic3",
                              currency: "AED",
                              industry: "Fintech",
                              company_size: "201-500",
                              p25: 15_000,
                              p50: 17_000,
                              p75: 19_000,
                            },
                          ],
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

    const result = await fetchMarketBenchmarks(snapshotOnlyClient, { includeSegmented: true });

    expect(result).toEqual([]);
  });

  it("does not depend on platform workspace salary benchmark fallbacks for tenant reads", async () => {
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

    expect(result).toEqual([]);
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
      [],
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

  it("loads all canonical pooled rows across pages instead of truncating at 1000", async () => {
    invalidateMarketBenchmarkCache();
    const client = createCanonicalPoolOnlyClient(makePooledRows(1200));

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

  it("throws canonical pool query errors so API diagnostics can surface them", async () => {
    invalidateMarketBenchmarkCache();

    await expect(fetchMarketBenchmarks(createErroredCanonicalClient("RLS denied"))).rejects.toThrow(
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
