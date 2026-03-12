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

import { GET, POST } from "@/app/api/admin/inbox/route";

function createServiceSupabase() {
  const uploads: Array<Record<string, unknown>> = [];

  return {
    storage: {
      from(bucket: string) {
        expect(bucket).toBe("admin-inbox");
        return {
          upload(path: string) {
            return Promise.resolve({ data: { path }, error: null });
          },
        };
      },
    },
    from(table: string) {
      if (table !== "admin_market_research_uploads") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select() {
          return {
            order() {
              return {
                limit() {
                  return Promise.resolve({
                    data: [...uploads].reverse(),
                    error: null,
                  });
                },
              };
            },
          };
        },
        insert(payload: Record<string, unknown>) {
          const storedUpload = {
            id: `upload-${uploads.length + 1}`,
            ...payload,
            created_at: "2026-03-12T22:00:00.000Z",
            updated_at: "2026-03-12T22:00:00.000Z",
          };
          uploads.push(storedUpload);
          return {
            select() {
              return {
                single() {
                  return Promise.resolve({
                    data: storedUpload,
                    error: null,
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

describe("admin inbox route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("stores an admin inbox upload and returns it with uploaded status", async () => {
    createServiceClientMock.mockReturnValue(createServiceSupabase());
    const formData = new FormData();
    formData.set(
      "file",
      new File(["role,amount\nSWE,100"], "market-observations.csv", {
        type: "text/csv",
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/admin/inbox", {
        method: "POST",
        body: formData,
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.file_name).toBe("market-observations.csv");
    expect(payload.file_kind).toBe("csv");
    expect(payload.ingest_queue).toBe("Structured import");
    expect(payload.ingestion_status).toBe("uploaded");
  });

  it("lists uploaded admin inbox assets with their ingestion status", async () => {
    const supabase = createServiceSupabase();
    createServiceClientMock.mockReturnValue(supabase);

    const formData = new FormData();
    formData.set(
      "file",
      new File(["fake pdf"], "guide.pdf", {
        type: "application/pdf",
      }),
    );
    await POST(
      new Request("http://localhost/api/admin/inbox", {
        method: "POST",
        body: formData,
      }) as never,
    );

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toEqual(
      expect.objectContaining({
        file_name: "guide.pdf",
        file_kind: "pdf",
        ingest_queue: "Document review",
        ingestion_status: "uploaded",
      }),
    );
  });
});
