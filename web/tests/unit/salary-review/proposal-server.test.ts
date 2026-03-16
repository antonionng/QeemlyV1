import { describe, expect, it, vi } from "vitest";
import { loadSalaryReviewProposalDetail } from "@/lib/salary-review/proposal-server";

describe("loadSalaryReviewProposalDetail", () => {
  it("treats a missing department allocations table as an empty result", async () => {
    const proposal = {
      id: "cycle-1",
      review_mode: "company_wide",
      review_scope: "company_wide",
      status: "draft",
    };

    const fromMock = vi.fn((table: string) => {
      if (table === "salary_review_cycles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string) => {
              if (field === "id") {
                return {
                  single: vi.fn().mockResolvedValue({ data: proposal, error: null }),
                };
              }
              if (field === "parent_cycle_id") {
                return {
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              throw new Error(`Unexpected cycles eq field: ${field}`);
            }),
          })),
        };
      }

      if (table === "salary_review_proposal_items") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "salary_review_approval_steps") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "salary_review_notes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "salary_review_audit_events") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "salary_review_department_allocations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: "PGRST205",
                  message:
                    "Could not find the table 'public.salary_review_department_allocations' in the schema cache",
                },
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const detail = await loadSalaryReviewProposalDetail(
      { from: fromMock } as never,
      "cycle-1",
    );

    expect(detail.proposal).toEqual(proposal);
    expect(detail.departmentAllocations).toEqual([]);
    expect(detail.childCycles).toEqual([]);
  });

  it("treats a missing parent_cycle_id column as an empty child cycle result", async () => {
    const proposal = {
      id: "cycle-1",
      review_mode: "company_wide",
      review_scope: "company_wide",
      status: "draft",
    };

    const fromMock = vi.fn((table: string) => {
      if (table === "salary_review_cycles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string) => {
              if (field === "id") {
                return {
                  single: vi.fn().mockResolvedValue({ data: proposal, error: null }),
                };
              }
              if (field === "parent_cycle_id") {
                return {
                  order: vi.fn().mockResolvedValue({
                    data: null,
                    error: {
                      code: "42703",
                      message: "column salary_review_cycles.parent_cycle_id does not exist",
                    },
                  }),
                };
              }
              throw new Error(`Unexpected cycles eq field: ${field}`);
            }),
          })),
        };
      }

      if (table === "salary_review_proposal_items") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "salary_review_approval_steps") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "salary_review_notes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "salary_review_audit_events") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      if (table === "salary_review_department_allocations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(
      loadSalaryReviewProposalDetail({ from: fromMock } as never, "cycle-1"),
    ).resolves.toMatchObject({
      proposal,
      departmentAllocations: [],
      childCycles: [],
    });
  });
});
