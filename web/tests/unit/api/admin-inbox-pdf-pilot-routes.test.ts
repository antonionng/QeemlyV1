import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireSuperAdminMock,
  createServiceClientMock,
  extractTextFromPdfBufferMock,
  refreshPlatformMarketPoolBestEffortMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  createServiceClientMock: vi.fn(),
  extractTextFromPdfBufferMock: vi.fn(),
  refreshPlatformMarketPoolBestEffortMock: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/admin/research/pdf-text", () => ({
  extractTextFromPdfBuffer: extractTextFromPdfBufferMock,
}));

vi.mock("@/lib/benchmarks/platform-market-sync", () => ({
  refreshPlatformMarketPoolBestEffort: refreshPlatformMarketPoolBestEffortMock,
}));

type UploadRow = {
  id: string;
  file_name: string;
  file_path: string;
  file_kind: "pdf";
  ingestion_status: "uploaded" | "reviewing" | "ingested";
};

type ReviewRow = Record<string, unknown> & {
  id: string;
  upload_id: string;
  review_status: "pending" | "approved" | "rejected" | "ingested";
};

function createPilotSupabase() {
  const uploads = new Map<string, UploadRow>([
    [
      "upload-1",
      {
        id: "upload-1",
        file_name: "Robert Walters Tech Guide.pdf",
        file_path: "uploads/2026-03-24/robert-walters-tech.pdf",
        file_kind: "pdf",
        ingestion_status: "uploaded",
      },
    ],
  ]);
  const reviewRows: ReviewRow[] = [];
  const salaryBenchmarks: Array<Record<string, unknown>> = [];

  return {
    state: { uploads, reviewRows, salaryBenchmarks },
    client: {
      storage: {
        from(bucket: string) {
          expect(bucket).toBe("admin-inbox");
          return {
            async download(path: string) {
              expect(path).toBe("uploads/2026-03-24/robert-walters-tech.pdf");
              return {
                data: new Blob(["fake pdf bytes"], { type: "application/pdf" }),
                error: null,
              };
            },
          };
        },
      },
      from(table: string) {
        if (table === "admin_market_research_uploads") {
          return {
            select() {
              return {
                eq(_: string, value: string) {
                  return {
                    single: async () => ({
                      data: uploads.get(value) ?? null,
                      error: null,
                    }),
                  };
                },
              };
            },
            update(payload: Partial<UploadRow> & Record<string, unknown>) {
              return {
                eq(_: string, value: string) {
                  const current = uploads.get(value);
                  if (current) {
                    uploads.set(value, { ...current, ...payload });
                  }
                  return Promise.resolve({ data: null, error: null });
                },
              };
            },
          };
        }

        if (table === "admin_market_research_pdf_rows") {
          return {
            delete() {
              return {
                eq(_: string, value: string) {
                  for (let index = reviewRows.length - 1; index >= 0; index -= 1) {
                    if (reviewRows[index]?.upload_id === value) {
                      reviewRows.splice(index, 1);
                    }
                  }
                  return Promise.resolve({ data: null, error: null });
                },
              };
            },
            insert(payload: Array<Record<string, unknown>>) {
              payload.forEach((row, index) => {
                reviewRows.push({
                  id: `row-${index + 1}`,
                  upload_id: String(row.upload_id),
                  review_status: "pending",
                  ...row,
                });
              });
              return Promise.resolve({ data: reviewRows, error: null });
            },
            select() {
              return {
                eq(_: string, value: string) {
                  return {
                    order: async () => ({
                      data: reviewRows.filter((row) => row.upload_id === value),
                      error: null,
                    }),
                  };
                },
              };
            },
            update(payload: Partial<ReviewRow> & Record<string, unknown>) {
              return {
                eq(_: string, value: string) {
                  reviewRows.forEach((row, index) => {
                    if (row.id === value) {
                      reviewRows[index] = { ...row, ...payload };
                    }
                  });
                  return Promise.resolve({ data: null, error: null });
                },
              };
            },
          };
        }

        if (table === "salary_benchmarks") {
          return {
            upsert(payload: Record<string, unknown>) {
              salaryBenchmarks.push(payload);
              return Promise.resolve({ data: null, error: null });
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    },
  };
}

const EXTRACTED_TEXT = `
Group Chief Information Officer
(Group CIO) Technology Permanent Per
Month AED100k - 150k AED150k - 200k
`;

describe("admin inbox PDF pilot routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    extractTextFromPdfBufferMock.mockResolvedValue(EXTRACTED_TEXT);
    refreshPlatformMarketPoolBestEffortMock.mockResolvedValue(undefined);
    vi.stubEnv("PLATFORM_WORKSPACE_ID", "platform-workspace");
  });

  it("extracts Robert Walters review rows from a PDF upload", async () => {
    const supabase = createPilotSupabase();
    createServiceClientMock.mockReturnValue(supabase.client);
    const { POST } = await import("@/app/api/admin/inbox/[id]/extract/route");

    const response = await POST(
      new Request("http://localhost/api/admin/inbox/upload-1/extract", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "upload-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      extractedCount: 1,
      sourceFamily: "robert_walters",
    });
    expect(supabase.state.reviewRows).toEqual([
      expect.objectContaining({
        upload_id: "upload-1",
        role_title: "Group Chief Information Officer (Group CIO)",
        function_name: "Technology",
        pay_period: "monthly",
        currency: "AED",
        location_hint: "Dubai",
        level_hint: "VP",
        salary_2026_min: 150_000,
        salary_2026_max: 200_000,
        review_status: "pending",
      }),
    ]);
    expect(supabase.state.uploads.get("upload-1")?.ingestion_status).toBe("reviewing");
  });

  it("ingests approved review rows into manual-admin market benchmarks", async () => {
    const supabase = createPilotSupabase();
    createServiceClientMock.mockReturnValue(supabase.client);
    supabase.state.reviewRows.push({
      id: "row-1",
      upload_id: "upload-1",
      row_index: 1,
      raw_text: "raw row",
      role_title: "Senior Software Engineer",
      function_name: "Technology",
      employment_type: "Permanent",
      pay_period: "monthly",
      currency: "AED",
      location_hint: "Dubai",
      level_hint: "Senior Software Engineer",
      salary_2025_min: 30_000,
      salary_2025_max: 40_000,
      salary_2026_min: 35_000,
      salary_2026_max: 45_000,
      parse_confidence: "high",
      review_status: "approved",
      review_notes: null,
    });
    supabase.state.uploads.set("upload-1", {
      ...supabase.state.uploads.get("upload-1")!,
      ingestion_status: "reviewing",
    });

    const { POST } = await import("@/app/api/admin/inbox/[id]/ingest/route");
    const response = await POST(
      new Request("http://localhost/api/admin/inbox/upload-1/ingest", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "upload-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      ingestedCount: 1,
      failedCount: 0,
    });
    expect(supabase.state.salaryBenchmarks).toEqual([
      expect.objectContaining({
        workspace_id: "platform-workspace",
        role_id: "swe",
        location_id: "dubai",
        level_id: "ic3",
        source: "market",
        market_source_slug: "robert-walters-pdf",
        market_source_tier: "proxy",
        market_origin: "manual_admin",
        pay_period: "monthly",
        p25: 35_000,
        p50: 40_000,
        p75: 45_000,
      }),
    ]);
    expect(supabase.state.reviewRows[0]?.review_status).toBe("ingested");
    expect(supabase.state.uploads.get("upload-1")?.ingestion_status).toBe("ingested");
    expect(refreshPlatformMarketPoolBestEffortMock).toHaveBeenCalledTimes(1);
  });
});
