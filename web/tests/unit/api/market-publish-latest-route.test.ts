import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { GET } from "@/app/api/market-publish/latest/route";

function createSessionSupabase(event: Record<string, unknown> | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from(table: string) {
      if (table !== "market_publish_events") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return {
                    limit() {
                      return Promise.resolve({
                        data: event ? [event] : [],
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
    },
  };
}

describe("GET /api/market-publish/latest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the latest tenant-visible market publish event", async () => {
    createClientMock.mockResolvedValue(
      createSessionSupabase({
        id: "publish-1",
        title: "Qeemly Market Data Updated",
        summary: "Fresh GCC benchmark coverage is now live across the platform.",
        row_count: 212,
        published_at: "2026-03-17T10:00:00.000Z",
      }),
    );

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      event: {
        id: "publish-1",
        title: "Qeemly Market Data Updated",
        summary: "Fresh GCC benchmark coverage is now live across the platform.",
        rowCount: 212,
        publishedAt: "2026-03-17T10:00:00.000Z",
      },
    });
  });

  it("returns null when no publish event is available", async () => {
    createClientMock.mockResolvedValue(createSessionSupabase(null));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ event: null });
  });
});
