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
    const existingBenchmarkQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    let benchmarkTableCall = 0;

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "salary_benchmarks") {
          benchmarkTableCall += 1;
          return benchmarkTableCall === 1 ? existingBenchmarkQuery : benchmarkQuery;
        }
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
    expect(result.processedBenchmarks).toEqual([
      {
        roleId: "swe",
        locationId: "dubai",
        levelId: "ic3",
        validFrom: expect.any(String),
        action: "created",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/benchmarks/freshness",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/benchmarks/coverage/refresh",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("clears the current company benchmark overlay before reimporting in replace mode", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    let benchmarkTableCall = 0;

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "salary_benchmarks") {
          benchmarkTableCall += 1;
          if (benchmarkTableCall === 1) {
            return {
              delete: vi.fn().mockReturnThis(),
              eq: deleteEq,
            };
          }
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: "bm-1" }],
                error: null,
              }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { uploadBenchmarks } = await import("@/lib/upload/api");

    await uploadBenchmarks(
      [
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
      ],
      undefined,
      { mode: "replace" },
    );

    expect(deleteEq).toHaveBeenCalledWith("workspace_id", "ws-1");
  });

  it("falls back to the legacy benchmark schema when segmented columns are missing", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const segmentedReadQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'column salary_benchmarks.industry_key does not exist' },
      }),
    };

    const legacyReadQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const upsertSelect = vi.fn().mockResolvedValue({ data: [{ id: "bm-1" }], error: null });
    const upsertQuery = {
      upsert: vi.fn().mockReturnValue({ select: upsertSelect }),
    };

    let benchmarkTableCall = 0;

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "salary_benchmarks") {
          benchmarkTableCall += 1;
          if (benchmarkTableCall === 1) return segmentedReadQuery;
          if (benchmarkTableCall === 2) return legacyReadQuery;
          return upsertQuery;
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
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
    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        onConflict: "workspace_id,role_id,location_id,level_id,valid_from",
      }),
    );
  });

  it("uses the server import route when a workspace override is active", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "/api/admin/workspace-override" && method === "GET") {
        return new Response(
          JSON.stringify({
            is_overriding: true,
            workspace: { id: "ws-override", name: "Qeemly Test", slug: "qeemly-test" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url === "/api/upload/import" && method === "POST") {
        return new Response(
          JSON.stringify({
            success: true,
            insertedCount: 1,
            createdCount: 1,
            updatedCount: 0,
            skippedCount: 0,
            failedCount: 0,
            errors: [],
            processedBenchmarks: [
              {
                roleId: "swe",
                locationId: "dubai",
                levelId: "ic3",
                validFrom: "2026-04-02",
                action: "created",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });

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
      "/api/upload/import",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
