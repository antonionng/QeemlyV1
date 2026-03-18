import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServiceClientMock } = vi.hoisted(() => ({
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

import { refreshPlatformMarketPool } from "@/lib/benchmarks/platform-market-pool";

type QueryResult = {
  data?: unknown[] | null;
  error?: { message: string } | null;
};

function createRefreshClient(args?: {
  platformStageDeleteError?: string;
  platformStageInsertError?: string;
  snapshotStageDeleteError?: string;
  snapshotStageInsertError?: string;
  swapError?: string;
}) {
  const employees = [
    {
      workspace_id: "w1",
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      base_salary: 100_000,
      bonus: 0,
      equity: 0,
      currency: "AED",
      status: "active",
    },
    {
      workspace_id: "w2",
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      base_salary: 110_000,
      bonus: 0,
      equity: 0,
      currency: "AED",
      status: "active",
    },
    {
      workspace_id: "w3",
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      base_salary: 120_000,
      bonus: 0,
      equity: 0,
      currency: "AED",
      status: "active",
    },
  ];

  const noError = { error: null } as const;

  return {
    rpc() {
      return Promise.resolve(
        args?.swapError
          ? { error: { message: args.swapError } }
          : { error: null },
      );
    },
    from(table: string) {
      if (table === "employees") {
        return {
          select() {
            return Promise.resolve({ data: employees, error: null } satisfies QueryResult);
          },
        };
      }

      if (table === "salary_benchmarks") {
        return {
          select() {
            return Promise.resolve({ data: [], error: null } satisfies QueryResult);
          },
        };
      }

      if (table === "workspace_settings" || table === "ingestion_sources") {
        return {
          select() {
            return Promise.resolve({ data: [], error: null } satisfies QueryResult);
          },
        };
      }

      if (table === "platform_market_benchmarks_staging") {
        return {
          delete() {
            return {
              gte() {
                return Promise.resolve(
                  args?.platformStageDeleteError
                    ? { error: { message: args.platformStageDeleteError } }
                    : noError,
                );
              },
            };
          },
          insert() {
            return Promise.resolve(
              args?.platformStageInsertError
                ? { error: { message: args.platformStageInsertError } }
                : noError,
            );
          },
        };
      }

      if (table === "public_benchmark_snapshots_staging") {
        return {
          delete() {
            return {
              gte() {
                return Promise.resolve(
                  args?.snapshotStageDeleteError
                    ? { error: { message: args.snapshotStageDeleteError } }
                    : noError,
                );
              },
            };
          },
          insert() {
            return Promise.resolve(
              args?.snapshotStageInsertError
                ? { error: { message: args.snapshotStageInsertError } }
                : noError,
            );
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

function createStagingSwapClient(args?: {
  platformStagingInsertError?: string;
  snapshotStagingInsertError?: string;
}) {
  let liveDeleteCalls = 0;
  const rpcMock = vi.fn().mockResolvedValue({ error: null });
  const employees = [
    {
      workspace_id: "w1",
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      base_salary: 100_000,
      bonus: 0,
      equity: 0,
      currency: "AED",
      status: "active",
    },
    {
      workspace_id: "w2",
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      base_salary: 110_000,
      bonus: 0,
      equity: 0,
      currency: "AED",
      status: "active",
    },
    {
      workspace_id: "w3",
      role_id: "swe",
      location_id: "dubai",
      level_id: "ic3",
      base_salary: 120_000,
      bonus: 0,
      equity: 0,
      currency: "AED",
      status: "active",
    },
  ];

  const client = {
    rpc: rpcMock,
    from(table: string) {
      if (table === "employees") {
        return {
          select() {
            return Promise.resolve({ data: employees, error: null } satisfies QueryResult);
          },
        };
      }

      if (table === "salary_benchmarks" || table === "workspace_settings" || table === "ingestion_sources") {
        return {
          select() {
            return Promise.resolve({ data: [], error: null } satisfies QueryResult);
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
          insert() {
            return Promise.resolve(
              args?.platformStagingInsertError
                ? { error: { message: args.platformStagingInsertError } }
                : { error: null },
            );
          },
        };
      }

      if (table === "public_benchmark_snapshots_staging") {
        return {
          delete() {
            return {
              eq() {
                return Promise.resolve({ error: null });
              },
            };
          },
          insert() {
            return Promise.resolve(
              args?.snapshotStagingInsertError
                ? { error: { message: args.snapshotStagingInsertError } }
                : { error: null },
            );
          },
        };
      }

      if (table === "platform_market_benchmarks" || table === "public_benchmark_snapshots") {
        return {
          delete() {
            return {
              gte() {
                liveDeleteCalls += 1;
                return Promise.resolve({ error: { message: "live delete should not run before staging succeeds" } });
              },
              eq() {
                liveDeleteCalls += 1;
                return Promise.resolve({ error: { message: "live delete should not run before staging succeeds" } });
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return {
    client,
    rpcMock,
    getLiveDeleteCalls: () => liveDeleteCalls,
  };
}

describe("refreshPlatformMarketPool write failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when clearing staged platform market rows fails", async () => {
    createServiceClientMock.mockReturnValue(
      createRefreshClient({ platformStageDeleteError: "platform staging delete failed" }),
    );

    await expect(refreshPlatformMarketPool()).rejects.toThrow("platform staging delete failed");
  });

  it("throws when writing staged platform market rows fails", async () => {
    createServiceClientMock.mockReturnValue(
      createRefreshClient({ platformStageInsertError: "platform staging insert failed" }),
    );

    await expect(refreshPlatformMarketPool()).rejects.toThrow("platform staging insert failed");
  });

  it("throws when clearing staged public benchmark snapshots fails", async () => {
    createServiceClientMock.mockReturnValue(
      createRefreshClient({ snapshotStageDeleteError: "snapshot staging delete failed" }),
    );

    await expect(refreshPlatformMarketPool()).rejects.toThrow("snapshot staging delete failed");
  });

  it("throws when writing staged public benchmark snapshots fails", async () => {
    createServiceClientMock.mockReturnValue(
      createRefreshClient({ snapshotStageInsertError: "snapshot staging insert failed" }),
    );

    await expect(refreshPlatformMarketPool()).rejects.toThrow("snapshot staging insert failed");
  });

  it("throws when swapping staged refresh rows into the live tables fails", async () => {
    createServiceClientMock.mockReturnValue(
      createRefreshClient({ swapError: "staging swap failed" }),
    );

    await expect(refreshPlatformMarketPool()).rejects.toThrow("staging swap failed");
  });

  it("fails before touching live tables when staging platform rows cannot be written", async () => {
    const { client, rpcMock, getLiveDeleteCalls } = createStagingSwapClient({
      platformStagingInsertError: "staging insert failed",
    });
    createServiceClientMock.mockReturnValue(client);

    await expect(refreshPlatformMarketPool()).rejects.toThrow("staging insert failed");
    expect(rpcMock).not.toHaveBeenCalled();
    expect(getLiveDeleteCalls()).toBe(0);
  });
});
