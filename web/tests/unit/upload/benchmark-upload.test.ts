import { afterEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

describe("uploadBenchmarks", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("touches benchmark freshness after a successful benchmark upload", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const benchmarkQuery = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: "bm-1" }], error: null }),
    };

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "salary_benchmarks") return benchmarkQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { uploadBenchmarks } = await import("@/lib/upload/api");

    const result = await uploadBenchmarks([
      {
        roleId: "swe",
        locationId: "dubai",
        levelId: "ic3",
        currency: "AED",
        p10: 8000,
        p25: 10000,
        p50: 12000,
        p75: 14000,
        p90: 16000,
        sampleSize: 24,
      },
    ]);

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/benchmarks/freshness",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
