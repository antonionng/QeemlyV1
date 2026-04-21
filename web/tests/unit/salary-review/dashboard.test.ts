import { describe, expect, it } from "vitest";
import {
  buildSalaryReviewDashboardModel,
  getBuildReviewFlowModel,
  getApprovalViewLevel,
  getPostSubmitReviewOutcome,
  getSalaryReviewWorkspaceVisibility,
  shouldRedirectSalaryReviewTab,
  shouldShowEmployeeApprovalContext,
} from "@/lib/salary-review/dashboard";
import type { SalaryReviewProposalRecord } from "@/lib/salary-review/proposal-types";

function makeProposal(
  overrides: Partial<SalaryReviewProposalRecord> = {}
): SalaryReviewProposalRecord {
  return {
    id: overrides.id ?? "proposal-1",
    workspace_id: overrides.workspace_id ?? "workspace-1",
    created_by: overrides.created_by ?? "user-1",
    source: overrides.source ?? "manual",
    review_mode: overrides.review_mode ?? "company_wide",
    review_scope: overrides.review_scope ?? "company_wide",
    parent_cycle_id: overrides.parent_cycle_id ?? null,
    department: overrides.department ?? null,
    allocation_method: overrides.allocation_method ?? null,
    allocation_status: overrides.allocation_status ?? null,
    cycle: overrides.cycle ?? "annual",
    budget_type: overrides.budget_type ?? "percentage",
    budget_percentage: overrides.budget_percentage ?? 5,
    budget_absolute: overrides.budget_absolute ?? 0,
    effective_date: overrides.effective_date ?? "2026-04-01",
    status: overrides.status ?? "draft",
    summary: overrides.summary ?? {
      selectedEmployees: 95,
      proposedEmployees: 12,
      totalCurrentPayroll: 3_300_000,
      totalIncrease: 163_000,
      totalProposedPayroll: 3_463_000,
      maxIncreasePercentage: 10,
    },
    created_at: overrides.created_at ?? "2026-03-12T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-03-12T00:00:00.000Z",
  };
}

describe("salary review dashboard model", () => {
  it("splits actionable approvals from historical cycles", () => {
    const dashboard = buildSalaryReviewDashboardModel({
      activeProposal: makeProposal({ id: "draft-1", status: "draft" }),
      cycles: [
        makeProposal({ id: "draft-1", status: "draft" }),
        makeProposal({ id: "submitted-1", status: "submitted" }),
      ],
      approvalQueue: [
        makeProposal({ id: "submitted-1", status: "submitted" }),
        makeProposal({ id: "review-1", status: "in_review" }),
        makeProposal({ id: "approved-1", status: "approved" }),
        makeProposal({ id: "rejected-1", status: "rejected" }),
      ],
    });

    expect(dashboard.awaitingReview).toHaveLength(2);
    expect(dashboard.history).toHaveLength(2);
    expect(dashboard.drafts).toHaveLength(1);
    expect(dashboard.tabs.drafts.badge).toBe(1);
    expect(dashboard.tabs.approvals.badge).toBe(2);
    expect(dashboard.tabs.history.badge).toBe(2);
    expect(dashboard.tabs.overview.label).toBe("Overview");
    expect(dashboard.tabs.drafts.label).toBe("Drafts");
    expect(dashboard.totalCycles).toBe(2);
    expect(dashboard.primaryAction).toBe("continue-draft");
  });

  it("promotes a new cycle action when there is no active draft", () => {
    const dashboard = buildSalaryReviewDashboardModel({
      activeProposal: null,
      cycles: [makeProposal({ id: "approved-1", status: "approved" })],
      approvalQueue: [makeProposal({ id: "approved-1", status: "approved" })],
    });

    expect(dashboard.primaryAction).toBe("start-cycle");
    expect(dashboard.hasDraft).toBe(false);
    expect(dashboard.tabs.drafts.badge).toBe(0);
    expect(dashboard.tabs.overview.label).toBe("Overview");
  });

  it("separates split-review masters from their department child cycles", () => {
    const dashboard = buildSalaryReviewDashboardModel({
      activeProposal: null,
      cycles: [
        makeProposal({
          id: "master-1",
          review_mode: "department_split",
          review_scope: "master",
          status: "approved",
        }),
        makeProposal({
          id: "child-1",
          review_mode: "department_split",
          review_scope: "department",
          parent_cycle_id: "master-1",
          department: "Engineering",
          status: "draft",
        }),
      ],
      approvalQueue: [],
    });

    expect(dashboard.masterCycles.map((proposal) => proposal.id)).toEqual(["master-1"]);
    expect(dashboard.departmentCyclesByMaster["master-1"]?.map((proposal) => proposal.id)).toEqual([
      "child-1",
    ]);
  });
});

describe("salary review route compatibility", () => {
  it("redirects only the explicit review-builder tab into the wizard route", () => {
    expect(shouldRedirectSalaryReviewTab("review")).toBe(true);
    expect(shouldRedirectSalaryReviewTab("overview")).toBe(false);
  });
});

describe("salary review workspace visibility", () => {
  it("shows the setup-first workspace before draft diagnostics when no proposal values exist", () => {
    const visibility = getSalaryReviewWorkspaceVisibility({
      employeesCount: 95,
      proposedEmployees: 0,
      hasActiveProposal: false,
    });

    expect(visibility.showSettings).toBe(true);
    expect(visibility.showWorkspaceSummary).toBe(false);
    expect(visibility.showDiagnostics).toBe(false);
    expect(visibility.showTable).toBe(true);
  });

  it("reveals summary and diagnostics once the draft is materially populated", () => {
    const visibility = getSalaryReviewWorkspaceVisibility({
      employeesCount: 95,
      proposedEmployees: 8,
      hasActiveProposal: true,
    });

    expect(visibility.showWorkspaceSummary).toBe(true);
    expect(visibility.showDiagnostics).toBe(true);
  });
});

describe("salary review build flow", () => {
  it("starts in setup when there is no draft progress yet", () => {
    const flow = getBuildReviewFlowModel({
      requestedStep: null,
      employeesCount: 95,
      proposedEmployees: 0,
    });

    expect(flow.activeStep).toBe("setup");
    expect(flow.canContinueToReview).toBe(false);
  });

  it("keeps users in draft work until proposal values exist", () => {
    const flow = getBuildReviewFlowModel({
      requestedStep: "review",
      employeesCount: 95,
      proposedEmployees: 0,
      hasBudget: true,
    });

    expect(flow.activeStep).toBe("draft");
    expect(flow.steps.find((step) => step.id === "review")?.enabled).toBe(false);
  });

  it("unlocks final review once proposal values exist", () => {
    const flow = getBuildReviewFlowModel({
      requestedStep: "review",
      employeesCount: 95,
      proposedEmployees: 12,
      hasBudget: true,
    });

    expect(flow.activeStep).toBe("review");
    expect(flow.canContinueToReview).toBe(true);
    expect(flow.steps.find((step) => step.id === "review")?.enabled).toBe(true);
  });

  it("routes through the master budget step when no budget is set", () => {
    const flow = getBuildReviewFlowModel({
      requestedStep: "draft",
      employeesCount: 95,
      proposedEmployees: 0,
      hasBudget: false,
    });

    expect(flow.activeStep).toBe("budget");
    expect(flow.steps.find((step) => step.id === "budget")?.enabled).toBe(true);
    expect(flow.steps.find((step) => step.id === "draft")?.enabled).toBe(false);
  });

  it("unlocks the draft step once a master budget is set", () => {
    const flow = getBuildReviewFlowModel({
      requestedStep: "draft",
      employeesCount: 95,
      proposedEmployees: 0,
      hasBudget: true,
    });

    expect(flow.activeStep).toBe("draft");
    expect(flow.steps.find((step) => step.id === "draft")?.enabled).toBe(true);
  });
});

describe("salary review employee detail visibility", () => {
  it("hides approval context until a saved proposal exists", () => {
    expect(shouldShowEmployeeApprovalContext(false)).toBe(false);
    expect(shouldShowEmployeeApprovalContext(true)).toBe(true);
  });
});

describe("salary review submit outcome", () => {
  it("routes a successful submit into approvals with a clear confirmation message", () => {
    expect(getPostSubmitReviewOutcome("proposal-123")).toEqual({
      nextTab: "approvals",
      proposalId: "proposal-123",
      feedbackMessage: "Review submitted for approval. You are now viewing its approval status.",
    });
  });
});

describe("salary review approval drill-down", () => {
  it("uses the queue view until a proposal is explicitly opened", () => {
    expect(getApprovalViewLevel(null)).toBe("queue");
    expect(getApprovalViewLevel("proposal-123")).toBe("detail");
  });
});
