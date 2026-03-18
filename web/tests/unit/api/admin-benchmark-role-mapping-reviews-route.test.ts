import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireSuperAdminMock,
  createServiceClientMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  createServiceClientMock: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

import { GET, POST } from "@/app/api/admin/benchmarks/role-mapping-reviews/route";

describe("admin role mapping reviews route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSuperAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("lists pending role mapping reviews", async () => {
    const reviews = [
      {
        id: "review-1",
        workspace_id: "ws-1",
        subject_type: "employee",
        subject_id: "emp-1",
        original_role_text: "Founder's Associate",
        proposed_canonical_role_id: null,
        status: "pending",
      },
    ];

    createServiceClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "role_mapping_reviews") {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: reviews,
              error: null,
            }),
          })),
        };
      }),
    });

    const response = await GET(
      new Request("http://localhost/api/admin/benchmarks/role-mapping-reviews?status=pending") as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.reviews).toEqual(reviews);
  });

  it("approves a review, creates an alias, and backfills the employee mapping", async () => {
    const updateReviewEq = vi.fn().mockResolvedValue({ error: null });
    const updateEmployeeEq = vi.fn().mockResolvedValue({ error: null });

    createServiceClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "role_mapping_reviews") {
          return {
            update: vi.fn(() => ({
              eq: updateReviewEq,
            })),
          };
        }
        if (table === "canonical_role_aliases") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "employees") {
          return {
            update: vi.fn(() => ({
              eq: updateEmployeeEq,
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/admin/benchmarks/role-mapping-reviews", {
        method: "POST",
        body: JSON.stringify({
          reviewId: "review-1",
          action: "approve",
          canonicalRoleId: "pm",
          aliasText: "Founder's Associate",
          workspaceId: "ws-1",
          subjectType: "employee",
          subjectId: "emp-1",
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(updateReviewEq).toHaveBeenCalledWith("id", "review-1");
    expect(updateEmployeeEq).toHaveBeenCalledWith("id", "emp-1");
  });
});
