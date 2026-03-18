import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_VISIBLE_COLUMNS,
  SALARY_REVIEW_VISIBLE_COLUMNS_STORAGE_KEY,
  useSalaryReview,
  type ReviewEmployee,
} from "@/lib/salary-review";
import { parseSalaryReviewSearchParams } from "@/lib/salary-review/url-state";

function makeEmployee(overrides: Partial<ReviewEmployee> = {}): ReviewEmployee {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    firstName: overrides.firstName ?? "Test",
    lastName: overrides.lastName ?? "User",
    email: overrides.email ?? "test@example.com",
    department: overrides.department ?? "Engineering",
    role: overrides.role ?? {
      id: "r1",
      title: "Software Engineer",
      family: "Engineering",
      icon: "SWE",
    },
    level: overrides.level ?? { id: "l1", name: "L3", category: "IC" },
    location: overrides.location ?? {
      id: "dubai",
      city: "Dubai",
      country: "UAE",
      countryCode: "AE",
      currency: "AED",
      flag: "AE",
    },
    status: overrides.status ?? "active",
    employmentType: overrides.employmentType ?? "national",
    baseSalary: overrides.baseSalary ?? 100_000,
    bonus: overrides.bonus,
    equity: overrides.equity,
    totalComp: overrides.totalComp ?? overrides.baseSalary ?? 100_000,
    bandPosition: overrides.bandPosition ?? "in-band",
    bandPercentile: overrides.bandPercentile ?? 50,
    marketComparison: overrides.marketComparison ?? 0,
    hasBenchmark: overrides.hasBenchmark ?? true,
    benchmarkContext: overrides.benchmarkContext,
    hireDate: overrides.hireDate ?? new Date("2020-01-01"),
    lastReviewDate: overrides.lastReviewDate,
    performanceRating: overrides.performanceRating ?? "meets",
    proposedIncrease: overrides.proposedIncrease ?? 0,
    proposedPercentage: overrides.proposedPercentage ?? 0,
    newSalary: overrides.newSalary ?? ((overrides.baseSalary ?? 100_000) + (overrides.proposedIncrease ?? 0)),
    isSelected: overrides.isSelected ?? true,
    guidance: overrides.guidance,
    avatar: overrides.avatar,
    visaExpiryDate: overrides.visaExpiryDate,
    visaStatus: overrides.visaStatus,
  };
}

describe("salary review core state", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    useSalaryReview.setState({
      settings: {
        cycle: "annual",
        budgetType: "absolute",
        budgetPercentage: 0,
        budgetAbsolute: 10_000,
        effectiveDate: "2026-04-01",
        includeBonus: false,
      },
      employees: [],
      workflowByEmployee: {},
      totalCurrentPayroll: 0,
      totalProposedPayroll: 0,
      totalIncrease: 0,
      budgetUsed: 0,
      budgetRemaining: 10_000,
      visibleColumns: useSalaryReview.getState().visibleColumns,
      isLoading: false,
      isUsingMockData: false,
      cycles: [],
      filters: {
        department: "all",
        location: "all",
        pool: "all",
        benchmarkStatus: "all",
        workflowStatus: "all",
        bandFilter: "all",
        performance: "all",
        search: "",
      },
      draftChanges: {},
    });
  });

  it("recomputes totals when an employee is deselected", () => {
    const employees = [
      makeEmployee({
        id: "emp-1",
        baseSalary: 100_000,
        proposedIncrease: 4_000,
        proposedPercentage: 4,
        newSalary: 104_000,
      }),
      makeEmployee({
        id: "emp-2",
        baseSalary: 120_000,
        proposedIncrease: 6_000,
        proposedPercentage: 5,
        newSalary: 126_000,
      }),
    ];

    useSalaryReview.setState({
      employees,
      totalCurrentPayroll: 220_000,
      totalProposedPayroll: 230_000,
      totalIncrease: 10_000,
      budgetUsed: 10_000,
      budgetRemaining: 0,
    });

    useSalaryReview.getState().toggleEmployeeSelection("emp-2");

    const state = useSalaryReview.getState();
    expect(state.employees.find((employee) => employee.id === "emp-2")?.isSelected).toBe(false);
    expect(state.totalIncrease).toBe(4_000);
    expect(state.budgetUsed).toBe(4_000);
    expect(state.budgetRemaining).toBe(6_000);
    expect(state.totalProposedPayroll).toBe(224_000);
  });

  it("resetReview preserves loaded employees while clearing proposals", () => {
    const employees = [
      makeEmployee({
        id: "emp-1",
        baseSalary: 100_000,
        proposedIncrease: 4_000,
        proposedPercentage: 4,
        newSalary: 104_000,
      }),
      makeEmployee({
        id: "emp-2",
        baseSalary: 120_000,
        proposedIncrease: 6_000,
        proposedPercentage: 5,
        newSalary: 126_000,
        isSelected: false,
      }),
    ];

    useSalaryReview.setState({
      employees,
      totalCurrentPayroll: 220_000,
      totalProposedPayroll: 230_000,
      totalIncrease: 10_000,
      budgetUsed: 10_000,
      budgetRemaining: 0,
    });

    useSalaryReview.getState().resetReview();

    const state = useSalaryReview.getState();
    expect(state.employees).toHaveLength(2);
    expect(state.employees.every((employee) => employee.proposedIncrease === 0)).toBe(true);
    expect(state.employees.every((employee) => employee.newSalary === employee.baseSalary)).toBe(true);
    expect(state.employees.every((employee) => employee.isSelected)).toBe(true);
    expect(state.totalIncrease).toBe(0);
    expect(state.budgetUsed).toBe(0);
    expect(state.totalProposedPayroll).toBe(220_000);
    expect(state.budgetRemaining).toBe(11_000);
  });

  it("applies default increases using the configured budget without under-allocating", () => {
    const employees = [
      makeEmployee({
        id: "emp-1",
        baseSalary: 100_000,
        bandPosition: "below",
        performanceRating: "exceptional",
      }),
      makeEmployee({
        id: "emp-2",
        baseSalary: 100_000,
        bandPosition: "in-band",
        performanceRating: "meets",
      }),
    ];

    useSalaryReview.setState({
      employees,
      totalCurrentPayroll: 200_000,
      totalProposedPayroll: 200_000,
      totalIncrease: 0,
      budgetUsed: 0,
      budgetRemaining: 10_000,
    });

    useSalaryReview.getState().applyDefaultIncreases();

    const state = useSalaryReview.getState();
    expect(state.totalIncrease).toBe(10_000);
    expect(state.budgetUsed).toBe(10_000);
    expect(state.budgetRemaining).toBe(0);
    expect(state.employees[0].proposedIncrease).toBeGreaterThan(state.employees[1].proposedIncrease);
  });

  it("does not rewrite stored proposal amounts when switching display cadence", () => {
    const employees = [
      makeEmployee({
        id: "emp-1",
        baseSalary: 120_000,
        proposedIncrease: 12_000,
        proposedPercentage: 10,
        newSalary: 132_000,
      }),
    ];

    useSalaryReview.setState({
      settings: {
        cycle: "annual",
        budgetType: "absolute",
        budgetPercentage: 0,
        budgetAbsolute: 20_000,
        effectiveDate: "2026-04-01",
        includeBonus: false,
      },
      employees,
      totalCurrentPayroll: 120_000,
      totalProposedPayroll: 132_000,
      totalIncrease: 12_000,
      budgetUsed: 12_000,
      budgetRemaining: 8_000,
    });

    useSalaryReview.getState().updateSettings({ cycle: "monthly" });

    const state = useSalaryReview.getState();
    expect(state.employees[0].proposedIncrease).toBe(12_000);
    expect(state.employees[0].newSalary).toBe(132_000);
    expect(state.totalIncrease).toBe(12_000);
  });

  it("stores visible columns under the dedicated localStorage key", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
    });

    useSalaryReview.getState().toggleColumnVisibility("basic");

    expect(storage.get(SALARY_REVIEW_VISIBLE_COLUMNS_STORAGE_KEY)).toBeTruthy();
    expect(JSON.parse(storage.get(SALARY_REVIEW_VISIBLE_COLUMNS_STORAGE_KEY) || "[]")).toContain("basic");
  });
});

describe("salary review URL state", () => {
  it("maps semantic cohort URLs into overview filters", () => {
    const params = new URLSearchParams("cohort=in-band");

    expect(parseSalaryReviewSearchParams(params)).toEqual({
      tab: "overview",
      proposalId: null,
      department: "all",
      location: "all",
      pool: "all",
      benchmarkStatus: "all",
      workflowStatus: "all",
      bandFilter: "in-band",
      performance: "all",
      search: "",
    });
  });

  it("parses department and outside-band shortcut filters", () => {
    const params = new URLSearchParams("department=Engineering&filter=outside-band");

    expect(parseSalaryReviewSearchParams(params)).toEqual({
      tab: "overview",
      proposalId: null,
      department: "Engineering",
      location: "all",
      pool: "all",
      benchmarkStatus: "all",
      workflowStatus: "all",
      bandFilter: "outside-band",
      performance: "all",
      search: "",
    });
  });

  it("parses above-band shortcut filters", () => {
    const params = new URLSearchParams("filter=above-band");

    expect(parseSalaryReviewSearchParams(params).bandFilter).toBe("above");
  });

  it("keeps legacy review drill-down links on the overview workspace", () => {
    const params = new URLSearchParams("tab=review&filter=outside-band");

    expect(parseSalaryReviewSearchParams(params).tab).toBe("overview");
    expect(parseSalaryReviewSearchParams(params).bandFilter).toBe("outside-band");
  });

  it("parses the approvals tab from search params", () => {
    const params = new URLSearchParams("tab=approvals");

    expect(parseSalaryReviewSearchParams(params).tab).toBe("approvals");
  });

  it("defaults to the overview tab when no tab is provided", () => {
    const params = new URLSearchParams("");

    expect(parseSalaryReviewSearchParams(params).tab).toBe("overview");
  });

  it("parses the history tab from search params", () => {
    const params = new URLSearchParams("tab=history");

    expect(parseSalaryReviewSearchParams(params).tab).toBe("history");
  });

  it("parses the selected approval proposal id from search params", () => {
    const params = new URLSearchParams("tab=approvals&proposalId=proposal-123");

    expect(parseSalaryReviewSearchParams(params).proposalId).toBe("proposal-123");
  });

  it("starts the workspace with a leaner default column set", () => {
    expect(DEFAULT_VISIBLE_COLUMNS).toEqual([
      "name",
      "role",
      "department",
      "location",
      "current",
      "proposed",
      "increase",
      "band",
      "performance",
    ]);
  });
});
