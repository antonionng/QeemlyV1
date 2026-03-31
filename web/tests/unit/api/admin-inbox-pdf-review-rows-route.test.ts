import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireSuperAdminMock, createServiceClientMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

function createReviewRowsSupabase() {
  const rows = [
    {
      id: "row-1",
      upload_id: "upload-1",
      row_index: 1,
      source_family: "robert_walters",
      raw_text: "raw row",
      role_title: "Senior Software Engineer",
      function_name: "Technology",
      employment_type: "Permanent",
      pay_period: "monthly",
      currency: "AED",
      location_hint: "Dubai",
      level_hint: "Senior Software Engineer",
      salary_2025_min: 30000,
      salary_2025_max: 40000,
      salary_2026_min: 35000,
      salary_2026_max: 45000,
      parse_confidence: "high",
      review_status: "pending",
      review_notes: null,
      created_at: "2026-03-24T12:00:00.000Z",
      updated_at: "2026-03-24T12:00:00.000Z",
    },
    {
      id: "row-2",
      upload_id: "upload-1",
      row_index: 2,
      source_family: "robert_walters",
      raw_text: "raw row 2",
      role_title: "Product Manager",
      function_name: "Technology",
      employment_type: "Permanent",
      pay_period: "monthly",
      currency: "AED",
      location_hint: "Dubai",
      level_hint: "Manager",
      salary_2025_min: 25000,
      salary_2025_max: 50000,
      salary_2026_min: 30000,
      salary_2026_max: 45000,
      parse_confidence: "high",
      review_status: "pending",
      review_notes: null,
      created_at: "2026-03-24T12:00:00.000Z",
      updated_at: "2026-03-24T12:00:00.000Z",
    },
  ];

  return {
    state: { rows },
    client: {
      from(table: string) {
        expect(table).toBe("admin_market_research_pdf_rows");
        return {
          select() {
            return {
              eq(_: string, value: string) {
                expect(value).toBe("upload-1");
                return {
                  order: async () => ({
                    data: rows,
                    error: null,
                  }),
                };
              },
            };
          },
          update(payload: Record<string, unknown>) {
            return {
              eq(_: string, value: string) {
                const row = rows.find((entry) => entry.id === value);
                expect(row).toBeDefined();
                if (row) {
                  Object.assign(row, payload, { updated_at: "2026-03-24T12:15:00.000Z" });
                }
                return {
                  select() {
                    return {
                      single: async () => ({
                        data: row,
                        error: null,
                      }),
                    };
                  },
                };
              },
              in(_: string, values: string[]) {
                const updatedRows = rows
                  .filter((entry) => values.includes(entry.id))
                  .map((entry) => Object.assign(entry, payload, { updated_at: "2026-03-24T12:15:00.000Z" }));

                return {
                  select() {
                    return {
                      order: async () => ({
                        data: updatedRows.sort((left, right) => left.row_index - right.row_index),
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        };
      },
    },
  };
}

describe("admin inbox PDF review rows route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("lists extracted review rows for a PDF upload", async () => {
    const supabase = createReviewRowsSupabase();
    createServiceClientMock.mockReturnValue(supabase.client);
    const { GET } = await import("@/app/api/admin/inbox/[id]/rows/route");

    const response = await GET(new Request("http://localhost") as never, {
      params: Promise.resolve({ id: "upload-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual(
      expect.arrayContaining([
      expect.objectContaining({
        id: "row-1",
        role_title: "Senior Software Engineer",
        review_status: "pending",
      }),
      ]),
    );
  });

  it("updates review fields and approval status for one extracted row", async () => {
    const supabase = createReviewRowsSupabase();
    createServiceClientMock.mockReturnValue(supabase.client);
    const { PATCH } = await import("@/app/api/admin/inbox/[id]/rows/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowId: "row-1",
          changes: {
            level_hint: "Senior Engineer",
            review_status: "approved",
            review_notes: "Confirmed against source PDF",
          },
        }),
      }) as never,
      { params: Promise.resolve({ id: "upload-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual(
      expect.objectContaining({
        id: "row-1",
        level_hint: "Senior Engineer",
        review_status: "approved",
        review_notes: "Confirmed against source PDF",
      }),
    );
  });

  it("updates multiple extracted rows in one bulk request", async () => {
    const supabase = createReviewRowsSupabase();
    createServiceClientMock.mockReturnValue(supabase.client);
    const { PATCH } = await import("@/app/api/admin/inbox/[id]/rows/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIds: ["row-1", "row-2"],
          changes: {
            review_status: "approved",
            review_notes: "Bulk approved",
          },
        }),
      }) as never,
      { params: Promise.resolve({ id: "upload-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([
      expect.objectContaining({
        id: "row-1",
        review_status: "approved",
        review_notes: "Bulk approved",
      }),
      expect.objectContaining({
        id: "row-2",
        review_status: "approved",
        review_notes: "Bulk approved",
      }),
    ]);
  });
});
