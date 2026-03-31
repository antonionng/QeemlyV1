/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  pushMock,
  searchParamsMock,
  loadEmployeesFromDbMock,
  loadCyclesMock,
  loadLatestProposalMock,
  loadApprovalProposalListMock,
  selectCycleMock,
  resetReviewMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  searchParamsMock: { value: "" },
  loadEmployeesFromDbMock: vi.fn().mockResolvedValue(undefined),
  loadCyclesMock: vi.fn().mockResolvedValue(undefined),
  loadLatestProposalMock: vi.fn().mockResolvedValue(undefined),
  loadApprovalProposalListMock: vi.fn().mockResolvedValue(undefined),
  selectCycleMock: vi.fn().mockResolvedValue(undefined),
  resetReviewMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => new URLSearchParams(searchParamsMock.value),
}));

vi.mock("lucide-react", () => ({
  Loader2: () => React.createElement("svg"),
}));

vi.mock("@/components/dashboard/upload", () => ({
  UploadModal: () => React.createElement("div", null, "UploadModal"),
}));

vi.mock("@/components/salary-review", () => ({
  SalaryReviewWizard: () => React.createElement("div", null, "SalaryReviewWizard"),
}));

vi.mock("@/lib/salary-review/export", () => ({
  buildSalaryReviewCsv: () => "employee_id\n1",
}));

vi.mock("@/lib/salary-review", async () => {
  const actual = await vi.importActual<typeof import("@/lib/salary-review")>("@/lib/salary-review");

  return {
    ...actual,
    useSalaryReview: () => ({
      employees: [],
      isLoading: false,
      loadEmployeesFromDb: loadEmployeesFromDbMock,
      loadCycles: loadCyclesMock,
      loadLatestProposal: loadLatestProposalMock,
      loadApprovalProposalList: loadApprovalProposalListMock,
      selectCycle: selectCycleMock,
      resetReview: resetReviewMock,
    }),
  };
});

import SalaryReviewWizardPage from "@/app/(dashboard)/dashboard/salary-review/new/page";

describe("SalaryReviewWizardPage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    searchParamsMock.value = "";
    pushMock.mockReset();
    loadEmployeesFromDbMock.mockClear();
    loadCyclesMock.mockClear();
    loadLatestProposalMock.mockClear();
    loadApprovalProposalListMock.mockClear();
    selectCycleMock.mockClear();
    resetReviewMock.mockClear();
  });

  afterEach(() => {
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    vi.restoreAllMocks();
    container.remove();
  });

  it("loads the selected proposal when a proposalId is present", async () => {
    searchParamsMock.value = "proposalId=proposal-42";
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(SalaryReviewWizardPage));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(loadEmployeesFromDbMock).toHaveBeenCalledTimes(1);
    expect(loadCyclesMock).toHaveBeenCalledTimes(1);
    expect(loadApprovalProposalListMock).toHaveBeenCalledTimes(1);
    expect(selectCycleMock).toHaveBeenCalledWith("proposal-42");
    expect(loadLatestProposalMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("falls back to the latest draft when no proposalId is provided", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(SalaryReviewWizardPage));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(loadEmployeesFromDbMock).toHaveBeenCalledTimes(1);
    expect(loadCyclesMock).toHaveBeenCalledTimes(1);
    expect(loadApprovalProposalListMock).toHaveBeenCalledTimes(1);
    expect(loadLatestProposalMock).toHaveBeenCalledTimes(1);
    expect(selectCycleMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });
});
