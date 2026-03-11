import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  refreshPlatformMarketPoolMock,
  invalidateMarketBenchmarkCacheMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  refreshPlatformMarketPoolMock: vi.fn(),
  invalidateMarketBenchmarkCacheMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/benchmarks/platform-market-pool", () => ({
  refreshPlatformMarketPool: refreshPlatformMarketPoolMock,
}));

vi.mock("@/lib/benchmarks/platform-market", () => ({
  invalidateMarketBenchmarkCache: invalidateMarketBenchmarkCacheMock,
}));

import { POST } from "@/app/api/benchmarks/market-pool/refresh/route";

describe("POST /api/benchmarks/market-pool/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated rebuild requests", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  it("rebuilds the market dataset and clears the market cache", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });
    refreshPlatformMarketPoolMock.mockResolvedValue({ rowCount: 144 });

    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(refreshPlatformMarketPoolMock).toHaveBeenCalledTimes(1);
    expect(invalidateMarketBenchmarkCacheMock).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({ ok: true, rows: 144 });
  });
});
