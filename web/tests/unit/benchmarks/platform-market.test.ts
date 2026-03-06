import { describe, expect, it } from "vitest";
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

describe("fetchMarketBenchmarks", () => {
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
});
