import { afterEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: createClientMock,
}));

describe("uploadCompensationUpdates", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("preserves existing bonus and equity values when those columns are omitted", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" } }),
    };

    const updateEqWorkspace = vi.fn().mockResolvedValue({ error: null });
    const employeeUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(() => ({
        eq: updateEqWorkspace,
      })),
    };

    const historyInsert = vi.fn().mockResolvedValue({ error: null });
    let employeesTableCall = 0;

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileQuery;
        if (table === "employees") {
          employeesTableCall += 1;
          if (employeesTableCall === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "emp-1",
                    email: "ada@example.com",
                    currency: "AED",
                    base_salary: 100000,
                    bonus: 15000,
                    equity: 20000,
                  },
                ],
                error: null,
              }),
            };
          }
          return employeeUpdateQuery;
        }
        if (table === "compensation_history") {
          return { insert: historyInsert };
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

    const { uploadCompensationUpdates } = await import("@/lib/upload/api");

    const result = await uploadCompensationUpdates([
      {
        email: "ada@example.com",
        baseSalary: 120000,
        bonus: null,
        equity: null,
        effectiveDate: "2026-03-11",
        changeReason: null,
      },
    ]);

    expect(result.success).toBe(true);
    expect(employeeUpdateQuery.update).toHaveBeenCalledWith(
      expect.not.objectContaining({
        bonus: null,
        equity: null,
      }),
    );
    expect(historyInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          bonus: 15000,
          equity: 20000,
        }),
      ]),
    );
  });
});
