import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getWorkspaceContextMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getWorkspaceContextMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/workspace-context", () => ({
  getWorkspaceContext: getWorkspaceContextMock,
}));

import { GET, POST } from "@/app/api/salary-review/proposals/route";

describe("POST /api/salary-review/proposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards workspace authorization failures", async () => {
    createClientMock.mockResolvedValue({});
    getWorkspaceContextMock.mockResolvedValue({ error: "Unauthorized", status: 401 });

    const response = await POST(
      new Request("http://localhost/api/salary-review/proposals", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  it("creates a persisted proposal draft with items, steps, and audit events", async () => {
    const cycleRecord = {
      id: "cycle-1",
      status: "draft",
      workspace_id: "ws-1",
      budget_type: "absolute",
      budget_absolute: 10_000,
      budget_percentage: 0,
      cycle: "annual",
      effective_date: "2026-04-01",
      source: "ai",
      summary: {
        selectedEmployees: 1,
        proposedEmployees: 1,
        totalCurrentPayroll: 100_000,
        totalIncrease: 6_000,
        totalProposedPayroll: 106_000,
        maxIncreasePercentage: 6,
      },
    };

    const proposalItems = [
      {
        id: "item-1",
        cycle_id: "cycle-1",
        employee_id: "emp-1",
        selected: true,
        current_salary: 100_000,
        proposed_increase: 6_000,
        proposed_salary: 106_000,
        proposed_percentage: 6,
        reason_summary: "Market adjustment",
      },
    ];

    const approvalSteps = [
      {
        id: "step-1",
        cycle_id: "cycle-1",
        step_key: "manager",
        status: "pending",
      },
      {
        id: "step-2",
        cycle_id: "cycle-1",
        step_key: "hr",
        status: "pending",
      },
    ];

    const insertSingleMock = vi.fn().mockResolvedValue({ data: cycleRecord, error: null });
    const insertManyMock = vi
      .fn()
      .mockResolvedValueOnce({ data: proposalItems, error: null })
      .mockResolvedValueOnce({ data: approvalSteps, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const fromMock = vi.fn((table: string) => {
      if (table === "salary_review_cycles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string) => {
              if (field === "id") {
                return {
                  single: vi.fn().mockResolvedValue({ data: cycleRecord, error: null }),
                };
              }
              if (field === "parent_cycle_id") {
                return {
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              throw new Error(`Unexpected eq field on cycles: ${field}`);
            }),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: insertSingleMock,
            })),
          })),
        };
      }
      if (
        table === "salary_review_proposal_items" ||
        table === "salary_review_approval_steps"
      ) {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: table === "salary_review_proposal_items" ? proposalItems : approvalSteps,
                error: null,
              }),
            })),
          })),
          insert: vi.fn(() => ({
            select: insertManyMock,
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
      if (table === "salary_review_department_allocations") {
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
          insert: insertManyMock,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    createClientMock.mockResolvedValue({
      from: fromMock,
    });
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "ws-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/salary-review/proposals", {
        method: "POST",
        body: JSON.stringify({
          source: "ai",
          cycle: "annual",
          budgetType: "absolute",
          budgetAbsolute: 10_000,
          budgetPercentage: 0,
          effectiveDate: "2026-04-01",
          items: [
            {
              employeeId: "emp-1",
              employeeName: "Ava Stone",
              currentSalary: 100_000,
              proposedIncrease: 6_000,
              proposedSalary: 106_000,
              proposedPercentage: 6,
              selected: true,
              reasonSummary: "Market adjustment",
              changeReason: "market_adjustment",
              recommendedLevelId: null,
              recommendedLevelName: null,
              benchmarkSnapshot: {
                source: "market",
                matchQuality: "exact",
              },
            },
          ],
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.proposal.status).toBe("draft");
    expect(payload.items).toHaveLength(1);
    expect(payload.approvalSteps.map((step: { step_key: string }) => step.step_key)).toEqual([
      "manager",
      "hr",
    ]);
  });

  it("returns a safe error when draft creation fails", async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "salary_review_cycles") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "duplicate key value violates unique constraint" },
                }),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "ws-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/salary-review/proposals", {
        method: "POST",
        body: JSON.stringify({
          source: "ai",
          cycle: "annual",
          budgetType: "absolute",
          budgetAbsolute: 10_000,
          budgetPercentage: 0,
          effectiveDate: "2026-04-01",
          items: [
            {
              employeeId: "emp-1",
              employeeName: "Ava Stone",
              currentSalary: 100_000,
              proposedIncrease: 6_000,
              proposedSalary: 106_000,
              proposedPercentage: 6,
              selected: true,
              reasonSummary: "Market adjustment",
              changeReason: "market_adjustment",
              recommendedLevelId: null,
              recommendedLevelName: null,
              benchmarkSnapshot: {
                source: "market",
                matchQuality: "exact",
              },
            },
          ],
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("We could not create this proposal right now.");
    expect(payload.message).toBe("We could not create this proposal right now.");
    expect(payload.code).toBe("unknown_error");
  });

  it("creates a department-split master cycle with allocation rows and child cycles", async () => {
    const cycleRecord = {
      id: "master-1",
      status: "draft",
      workspace_id: "ws-1",
      budget_type: "absolute",
      budget_absolute: 30_000,
      budget_percentage: 0,
      cycle: "annual",
      effective_date: "2026-04-01",
      source: "manual",
      review_mode: "department_split",
      review_scope: "master",
      allocation_method: "direct",
      allocation_status: "approved",
      parent_cycle_id: null,
      department: null,
      summary: {
        selectedEmployees: 1,
        proposedEmployees: 1,
        totalCurrentPayroll: 100_000,
        totalIncrease: 6_000,
        totalProposedPayroll: 106_000,
        maxIncreasePercentage: 6,
      },
    };

    const departmentAllocations = [
      {
        id: "alloc-1",
        master_cycle_id: "master-1",
        department: "Engineering",
        allocated_budget: 20_000,
        allocation_method: "direct",
        allocation_status: "approved",
        child_cycle_id: "child-1",
      },
      {
        id: "alloc-2",
        master_cycle_id: "master-1",
        department: "Design",
        allocated_budget: 10_000,
        allocation_method: "direct",
        allocation_status: "approved",
        child_cycle_id: "child-2",
      },
    ];

    const childCycles = [
      {
        id: "child-1",
        parent_cycle_id: "master-1",
        review_mode: "department_split",
        review_scope: "department",
        department: "Engineering",
        status: "draft",
        workspace_id: "ws-1",
      },
      {
        id: "child-2",
        parent_cycle_id: "master-1",
        review_mode: "department_split",
        review_scope: "department",
        department: "Design",
        status: "draft",
        workspace_id: "ws-1",
      },
    ];

    const insertSingleMock = vi.fn().mockResolvedValue({ data: cycleRecord, error: null });
    const insertManyMock = vi
      .fn()
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: departmentAllocations, error: null })
      .mockResolvedValueOnce({ data: childCycles, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    const fromMock = vi.fn((table: string) => {
      if (table === "salary_review_cycles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string, value: string) => {
              if (field === "id") {
                return {
                  single: vi.fn().mockResolvedValue({ data: cycleRecord, error: null }),
                };
              }
              if (field === "parent_cycle_id") {
                return {
                  order: vi.fn().mockResolvedValue({ data: childCycles, error: null }),
                };
              }
              throw new Error(`Unexpected eq field on cycles: ${field}=${value}`);
            }),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: insertSingleMock,
              order: insertManyMock,
            })),
          })),
        };
      }
      if (table === "salary_review_proposal_items" || table === "salary_review_approval_steps") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
          insert: vi.fn(() => ({
            select: insertManyMock,
          })),
        };
      }
      if (table === "salary_review_department_allocations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: departmentAllocations, error: null }),
            })),
          })),
          insert: vi.fn(() => ({
            select: insertManyMock,
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
          insert: insertManyMock,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    createClientMock.mockResolvedValue({
      from: fromMock,
    });
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "ws-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/salary-review/proposals", {
        method: "POST",
        body: JSON.stringify({
          source: "manual",
          reviewMode: "department_split",
          allocationMethod: "direct",
          cycle: "annual",
          budgetType: "absolute",
          budgetAbsolute: 30_000,
          budgetPercentage: 0,
          effectiveDate: "2026-04-01",
          departmentAllocations: [
            {
              department: "Engineering",
              allocatedBudget: 20_000,
              selectedEmployeeIds: ["emp-1"],
              items: [
                {
                  employeeId: "emp-1",
                  employeeName: "Ava Stone",
                  currentSalary: 100_000,
                  proposedIncrease: 6_000,
                  proposedSalary: 106_000,
                  proposedPercentage: 6,
                  selected: true,
                  reasonSummary: "Market adjustment",
                  changeReason: "market_adjustment",
                  recommendedLevelId: null,
                  recommendedLevelName: null,
                  benchmarkSnapshot: {
                    source: "market",
                    matchQuality: "exact",
                  },
                  bandPosition: "below",
                },
              ],
            },
            {
              department: "Design",
              allocatedBudget: 10_000,
              selectedEmployeeIds: ["emp-2"],
              items: [],
            },
          ],
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.proposal.review_mode).toBe("department_split");
    expect(payload.proposal.review_scope).toBe("master");
    expect(payload.departmentAllocations).toHaveLength(2);
    expect(payload.childCycles.map((cycle: { department: string }) => cycle.department)).toEqual([
      "Engineering",
      "Design",
    ]);
  });

  it("creates finance-routed split reviews in a pending allocation state", async () => {
    const cycleRecord = {
      id: "master-2",
      status: "submitted",
      workspace_id: "ws-1",
      budget_type: "absolute",
      budget_absolute: 30_000,
      budget_percentage: 0,
      cycle: "annual",
      effective_date: "2026-04-01",
      source: "manual",
      review_mode: "department_split",
      review_scope: "master",
      allocation_method: "finance_approval",
      allocation_status: "pending",
      parent_cycle_id: null,
      department: null,
      summary: {
        selectedEmployees: 1,
        proposedEmployees: 1,
        totalCurrentPayroll: 100_000,
        totalIncrease: 6_000,
        totalProposedPayroll: 106_000,
        maxIncreasePercentage: 6,
      },
    };

    const childCycles = [
      {
        id: "child-3",
        parent_cycle_id: "master-2",
        review_mode: "department_split",
        review_scope: "department",
        department: "Engineering",
        status: "draft",
        allocation_method: "finance_approval",
        allocation_status: "pending",
        workspace_id: "ws-1",
      },
    ];

    const fromMock = vi.fn((table: string) => {
      if (table === "salary_review_cycles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((field: string) => {
              if (field === "id") {
                return {
                  single: vi.fn().mockResolvedValue({ data: cycleRecord, error: null }),
                };
              }
              if (field === "parent_cycle_id") {
                return {
                  order: vi.fn().mockResolvedValue({ data: childCycles, error: null }),
                };
              }
              throw new Error(`Unexpected eq field on cycles: ${field}`);
            }),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: cycleRecord, error: null }),
              order: vi.fn().mockResolvedValue({ data: childCycles, error: null }),
            })),
          })),
        };
      }
      if (table === "salary_review_department_allocations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "alloc-3",
                    master_cycle_id: "master-2",
                    department: "Engineering",
                    allocated_budget: 30_000,
                    allocation_method: "finance_approval",
                    allocation_status: "pending",
                    child_cycle_id: "child-3",
                  },
                ],
                error: null,
              }),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      }
      if (
        table === "salary_review_proposal_items" ||
        table === "salary_review_approval_steps" ||
        table === "salary_review_notes"
      ) {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
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
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    createClientMock.mockResolvedValue({ from: fromMock });
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "ws-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/salary-review/proposals", {
        method: "POST",
        body: JSON.stringify({
          source: "manual",
          reviewMode: "department_split",
          allocationMethod: "finance_approval",
          cycle: "annual",
          budgetType: "absolute",
          budgetAbsolute: 30_000,
          budgetPercentage: 0,
          effectiveDate: "2026-04-01",
          departmentAllocations: [
            {
              department: "Engineering",
              allocatedBudget: 30_000,
              selectedEmployeeIds: ["emp-1"],
              items: [],
            },
          ],
        }),
      }) as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.proposal.status).toBe("submitted");
    expect(payload.proposal.allocation_status).toBe("pending");
    expect(payload.childCycles[0].allocation_status).toBe("pending");
  });
});

describe("GET /api/salary-review/proposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters draft proposals out of the approval queue", async () => {
    const submittedProposal = {
      id: "cycle-2",
      status: "submitted",
      workspace_id: "ws-1",
      updated_at: "2026-03-11T10:00:00.000Z",
    };

    const neqMock = vi.fn().mockReturnValue({
      order: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({ data: [submittedProposal], error: null }),
      })),
    });

    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: neqMock,
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [submittedProposal], error: null }),
          })),
        })),
      })),
    }));

    createClientMock.mockResolvedValue({ from: fromMock });
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "ws-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });

    const response = await GET({
      nextUrl: new URL("http://localhost/api/salary-review/proposals?approvalQueue=1"),
    } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(neqMock).toHaveBeenCalledWith("status", "draft");
    expect(payload.proposals).toEqual([submittedProposal]);
  });

  it("returns the cycle list view including drafts for the overview workspace", async () => {
    const proposals = [
      {
        id: "cycle-draft",
        status: "draft",
        workspace_id: "ws-1",
        updated_at: "2026-03-12T12:00:00.000Z",
      },
      {
        id: "cycle-approved",
        status: "approved",
        workspace_id: "ws-1",
        updated_at: "2026-03-11T09:00:00.000Z",
      },
    ];

    const neqMock = vi.fn();
    const fromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: neqMock,
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: proposals, error: null }),
          })),
        })),
      })),
    }));

    createClientMock.mockResolvedValue({ from: fromMock });
    getWorkspaceContextMock.mockResolvedValue({
      context: {
        workspace_id: "ws-1",
        is_override: false,
        override_workspace_id: null,
        profile_workspace_id: "ws-1",
        is_super_admin: false,
        user_id: "user-1",
        user_email: "user@example.com",
      },
    });

    const response = await GET({
      nextUrl: new URL("http://localhost/api/salary-review/proposals?view=cycles"),
    } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(neqMock).not.toHaveBeenCalled();
    expect(payload.proposals).toEqual(proposals);
  });
});
