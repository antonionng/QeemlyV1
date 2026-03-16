import { describe, expect, it } from "vitest";
import {
  advanceApprovalChain,
  buildApprovalChain,
  summarizeProposalDraft,
  type SalaryReviewDraftItemInput,
} from "@/lib/salary-review/proposal-workflow";
import { buildProposalDraftRecords } from "@/lib/salary-review/proposals";

const baseItems: SalaryReviewDraftItemInput[] = [
  {
    employeeId: "emp-1",
    employeeName: "Ava Stone",
    currentSalary: 100_000,
    proposedIncrease: 6_000,
    proposedSalary: 106_000,
    proposedPercentage: 6,
    selected: true,
    reasonSummary: "Market adjustment",
    benchmarkSnapshot: {
      source: "market",
      matchQuality: "exact",
    },
  },
  {
    employeeId: "emp-2",
    employeeName: "Ben Hart",
    currentSalary: 120_000,
    proposedIncrease: 0,
    proposedSalary: 120_000,
    proposedPercentage: 0,
    selected: false,
    reasonSummary: "Not in this cycle",
    benchmarkSnapshot: null,
  },
];

describe("salary review proposal workflow", () => {
  it("summarizes only selected proposal items", () => {
    const summary = summarizeProposalDraft(baseItems);

    expect(summary.selectedEmployees).toBe(1);
    expect(summary.proposedEmployees).toBe(1);
    expect(summary.totalCurrentPayroll).toBe(100_000);
    expect(summary.totalIncrease).toBe(6_000);
    expect(summary.totalProposedPayroll).toBe(106_000);
    expect(summary.maxIncreasePercentage).toBe(6);
  });

  it("builds a multi-level approval chain in sequence when thresholds are crossed", () => {
    const chain = buildApprovalChain({
      totalIncrease: 40_000,
      maxIncreasePercentage: 16,
      hasAboveBandIncreases: true,
    });

    expect(chain.map((step) => step.stepKey)).toEqual([
      "manager",
      "director",
      "hr",
      "exec",
    ]);
    expect(chain[1].triggerReason).toContain("10%");
    expect(chain[3].triggerReason).toContain("15%");
  });

  it("advances the chain one step at a time on approval", () => {
    const initialChain = buildApprovalChain({
      totalIncrease: 18_000,
      maxIncreasePercentage: 12,
      hasAboveBandIncreases: false,
    });

    const firstPass = advanceApprovalChain(initialChain, {
      action: "approve",
      actorUserId: "user-1",
      note: "Manager approved",
    });
    const secondPass = advanceApprovalChain(firstPass.steps, {
      action: "approve",
      actorUserId: "user-2",
      note: "Director approved",
    });
    const finalPass = advanceApprovalChain(secondPass.steps, {
      action: "approve",
      actorUserId: "user-3",
      note: "HR approved",
    });

    expect(firstPass.proposalStatus).toBe("in_review");
    expect(secondPass.steps[1].status).toBe("approved");
    expect(finalPass.proposalStatus).toBe("approved");
    expect(finalPass.steps.every((step) => step.status === "approved")).toBe(true);
  });

  it("returns a proposal to draft when a reviewer requests revisions", () => {
    const initialChain = buildApprovalChain({
      totalIncrease: 12_000,
      maxIncreasePercentage: 8,
      hasAboveBandIncreases: false,
    });

    const submitted = advanceApprovalChain(initialChain, {
      action: "approve",
      actorUserId: "user-1",
      note: "Manager approved",
    });
    const returned = advanceApprovalChain(submitted.steps, {
      action: "return",
      actorUserId: "user-2",
      note: "Needs more context",
    });

    expect(returned.proposalStatus).toBe("draft");
    expect(returned.steps[1].status).toBe("returned");
    expect(returned.steps[0].status).toBe("approved");
  });

  it("adds director review when an above-band increase is saved into a draft", () => {
    const records = buildProposalDraftRecords({
      workspaceId: "ws-1",
      userId: "user-1",
      body: {
        source: "manual",
        cycle: "annual",
        budgetType: "absolute",
        budgetAbsolute: 10_000,
        budgetPercentage: 0,
        effectiveDate: "2026-04-01",
        items: [
          {
            ...baseItems[0],
            bandPosition: "above",
          },
        ],
      },
    });

    expect(records.approvalSteps.map((step) => step.stepKey)).toEqual([
      "manager",
      "director",
      "hr",
    ]);
  });

  it("builds a master cycle with department allocations for split reviews", () => {
    const records = buildProposalDraftRecords({
      workspaceId: "ws-1",
      userId: "user-1",
      body: {
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
                ...baseItems[0],
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
      },
    });

    expect(records.cycleInsert.review_mode).toBe("department_split");
    expect(records.cycleInsert.review_scope).toBe("master");
    expect(records.cycleInsert.allocation_method).toBe("direct");
    expect(records.cycleInsert.allocation_status).toBe("approved");
    expect(records.itemInserts("master-1")).toEqual([]);
    expect(records.departmentAllocationInserts("master-1")).toEqual([
      expect.objectContaining({
        master_cycle_id: "master-1",
        department: "Engineering",
        allocated_budget: 20_000,
        allocation_method: "direct",
        allocation_status: "approved",
      }),
      expect.objectContaining({
        master_cycle_id: "master-1",
        department: "Design",
        allocated_budget: 10_000,
        allocation_method: "direct",
        allocation_status: "approved",
      }),
    ]);
    expect(records.childCycleInserts("master-1")).toEqual([
      expect.objectContaining({
        parent_cycle_id: "master-1",
        review_mode: "department_split",
        review_scope: "department",
        department: "Engineering",
        budget_absolute: 20_000,
      }),
      expect.objectContaining({
        parent_cycle_id: "master-1",
        review_mode: "department_split",
        review_scope: "department",
        department: "Design",
        budget_absolute: 10_000,
      }),
    ]);
  });

  it("marks finance-routed split reviews as pending until Finance approves them", () => {
    const records = buildProposalDraftRecords({
      workspaceId: "ws-1",
      userId: "user-1",
      body: {
        source: "manual",
        reviewMode: "department_split",
        allocationMethod: "finance_approval",
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
      },
    });

    expect(records.cycleInsert.status).toBe("submitted");
    expect(records.cycleInsert.allocation_status).toBe("pending");
    expect(records.childCycleInserts("master-1")[0]).toEqual(
      expect.objectContaining({
        allocation_status: "pending",
      })
    );
  });
});
