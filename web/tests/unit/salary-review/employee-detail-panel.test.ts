/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useSalaryReviewMock } = vi.hoisted(() => ({
  useSalaryReviewMock: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  X: () => React.createElement("svg"),
  MapPin: () => React.createElement("svg"),
  Briefcase: () => React.createElement("svg"),
  Calendar: () => React.createElement("svg"),
  TrendingUp: () => React.createElement("svg"),
  Clock: () => React.createElement("svg"),
  AlertTriangle: () => React.createElement("svg"),
  ShieldCheck: () => React.createElement("svg"),
  ShieldAlert: () => React.createElement("svg"),
  Shield: () => React.createElement("svg"),
  ArrowUpRight: () => React.createElement("svg"),
  ArrowUpCircle: () => React.createElement("svg"),
  Star: () => React.createElement("svg"),
  ChevronDown: () => React.createElement("svg"),
  CheckCircle2: () => React.createElement("svg"),
  Circle: () => React.createElement("svg"),
  Sparkles: () => React.createElement("svg"),
  Send: () => React.createElement("svg"),
}));

vi.mock("@/lib/salary-review", async () => {
  const actual = await vi.importActual<typeof import("@/lib/salary-review")>("@/lib/salary-review");
  return {
    ...actual,
    useSalaryReview: useSalaryReviewMock,
  };
});

vi.mock("@/lib/advisory/generator", () => ({
  generateAdvisory: () => ({
    recommendation_summary: "Fallback local advisory.",
    confidence_score: 72,
    rationale: [{ point: "Fallback rationale." }],
  }),
}));

vi.mock("@/lib/benchmarks/trust", () => ({
  buildBenchmarkTrustLabels: () => null,
}));

vi.mock("@/lib/salary-view-store", () => ({
  useSalaryView: () => ({ salaryView: "annual" }),
  applyViewMode: (value: number) => value,
}));

vi.mock("@/components/dashboard/salary-review/approval-chain-view", () => ({
  ApprovalChainView: () => React.createElement("div", null, "ApprovalChainView"),
}));

import { EmployeeDetailPanel } from "@/components/dashboard/salary-review/employee-detail-panel";

const employee = {
  id: "emp-1",
  firstName: "Ava",
  lastName: "Stone",
  email: "ava@example.com",
  department: "Engineering",
  role: { id: "role-1", title: "Software Engineer", family: "Engineering", icon: "SWE" },
  level: { id: "level-1", name: "Senior (IC3)", category: "IC" },
  location: {
    id: "dubai",
    city: "Dubai",
    country: "UAE",
    countryCode: "AE",
    currency: "AED",
    flag: "AE",
  },
  status: "active",
  employmentType: "national",
  baseSalary: 200_000,
  totalComp: 200_000,
  bandPosition: "below",
  bandPercentile: 32,
  marketComparison: -12,
  hasBenchmark: true,
  benchmarkContext: null,
  hireDate: new Date("2021-01-10"),
  lastReviewDate: new Date("2025-04-01"),
  performanceRating: "exceeds",
  proposedIncrease: 0,
  proposedPercentage: 0,
  newSalary: 200_000,
  isSelected: true,
  changeReason: null,
  recommendedLevelId: null,
  recommendedLevelName: null,
} as const;

describe("EmployeeDetailPanel", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    useSalaryReviewMock.mockReturnValue({
      workflowByEmployee: {},
      updateEmployeeWorkflow: vi.fn(),
      applySuggestedIncrease: vi.fn(),
      activeProposal: null,
      proposalItemsByEmployee: {},
      approvalSteps: [],
      proposalNotes: [],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/salary-review/history/")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ history: [] }),
          });
        }
        if (url.includes("/api/salary-review/employee-advisory")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              summary:
                "Ava is below market for her scope and is performing strongly, so a targeted adjustment is justified even before a full AI draft is created.",
            }),
          });
        }
        throw new Error(`Unexpected fetch URL: ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    document.body.innerHTML = "";
    container.remove();
  });

  it("loads live AI advisory when there is no saved draft rationale", async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(EmployeeDetailPanel, { employee, onClose: vi.fn() }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain(
      "Ava is below market for her scope and is performing strongly",
    );

    await act(async () => {
      root.unmount();
    });
  });

  it("skips the live AI call when a saved draft rationale already exists", async () => {
    useSalaryReviewMock.mockReturnValue({
      workflowByEmployee: {},
      updateEmployeeWorkflow: vi.fn(),
      applySuggestedIncrease: vi.fn(),
      activeProposal: { id: "proposal-1" },
      proposalItemsByEmployee: {
        "emp-1": {
          reason_summary:
            "Saved AI draft rationale for Ava that should be used instead of making another model call.",
        },
      },
      approvalSteps: [],
      proposalNotes: [],
    });

    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(EmployeeDetailPanel, { employee, onClose: vi.fn() }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Saved AI draft rationale for Ava");
    const fetchMock = vi.mocked(global.fetch);
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/api/salary-review/employee-advisory"))).toBe(false);

    await act(async () => {
      root.unmount();
    });
  });
});
