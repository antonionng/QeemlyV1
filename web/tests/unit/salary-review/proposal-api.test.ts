import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSalaryReviewProposal,
  fetchSalaryReviewCycles,
  fetchApprovalQueueSalaryReviewProposals,
  fetchLatestSalaryReviewProposal,
  fetchSalaryReviewProposalDetail,
} from "@/lib/salary-review/proposal-api";

describe("salary review proposal api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches the latest salary review proposal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposal: null,
          items: [],
          approvalSteps: [],
          notes: [],
          auditEvents: [],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchLatestSalaryReviewProposal();

    expect(fetchMock).toHaveBeenCalledWith("/api/salary-review/proposals?latest=1", { cache: "no-store" });
  });

  it("fetches submitted approval-queue proposals only", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposals: [],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchApprovalQueueSalaryReviewProposals();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/salary-review/proposals?approvalQueue=1",
      { cache: "no-store" }
    );
  });

  it("fetches the salary review cycle list for the overview workspace", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposals: [],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchSalaryReviewCycles();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/salary-review/proposals?view=cycles",
      { cache: "no-store" }
    );
  });

  it("fetches salary review proposal detail by id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposal: null,
          items: [],
          approvalSteps: [],
          notes: [],
          auditEvents: [],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchSalaryReviewProposalDetail("proposal-123");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/salary-review/proposals/proposal-123",
      { cache: "no-store" }
    );
  });

  it("preserves split-review allocations when creating a proposal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          proposal: {
            id: "master-1",
            review_mode: "department_split",
            review_scope: "master",
          },
          items: [],
          approvalSteps: [],
          notes: [],
          auditEvents: [],
          departmentAllocations: [
            {
              id: "alloc-1",
              master_cycle_id: "master-1",
              department: "Engineering",
              allocated_budget: 20_000,
              allocation_method: "direct",
              allocation_status: "approved",
              child_cycle_id: "child-1",
            },
          ],
          childCycles: [
            {
              id: "child-1",
              parent_cycle_id: "master-1",
              review_mode: "department_split",
              review_scope: "department",
              department: "Engineering",
            },
          ],
        }),
        { status: 201 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSalaryReviewProposal({
      reviewMode: "department_split",
      allocationMethod: "direct",
      cycle: "annual",
      budgetType: "absolute",
      budgetAbsolute: 20_000,
      budgetPercentage: 0,
      effectiveDate: "2026-04-01",
      departmentAllocations: [
        {
          department: "Engineering",
          allocatedBudget: 20_000,
          selectedEmployeeIds: ["emp-1"],
          items: [],
        },
      ],
    });

    expect(result.departmentAllocations).toHaveLength(1);
    expect(result.childCycles).toHaveLength(1);
  });
});
