import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Employee } from "@/lib/employees";

const { usePeopleMock, replaceMock, searchParamsState } = vi.hoisted(() => ({
  usePeopleMock: vi.fn(),
  replaceMock: vi.fn(),
  searchParamsState: {
    employeeId: null as string | null,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => ({
    get: (key: string) => (key === "employeeId" ? searchParamsState.employeeId : null),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a"> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/people/use-people", () => ({
  usePeople: usePeopleMock,
}));

vi.mock("@/components/dashboard/people/people-stats-bar", () => ({
  PeopleStatsBar: () => React.createElement("div", { "data-testid": "people-stats-bar" }, "stats"),
}));

vi.mock("@/components/dashboard/people/people-toolbar", () => ({
  PeopleToolbar: () => React.createElement("div", { "data-testid": "people-toolbar" }, "toolbar"),
}));

vi.mock("@/components/dashboard/people/people-table", () => ({
  PeopleTable: () => React.createElement("div", { "data-testid": "people-table" }, "table"),
}));

vi.mock("@/components/dashboard/people/people-card-grid", () => ({
  PeopleCardGrid: () => React.createElement("div", { "data-testid": "people-card-grid" }, "grid"),
}));

vi.mock("@/components/dashboard/people/employee-drawer", () => ({
  EmployeeDrawer: ({ open }: { open: boolean }) =>
    React.createElement("div", { "data-testid": "employee-drawer", "data-open": String(open) }, "drawer"),
}));

vi.mock("@/components/dashboard/people/add-employee-modal", () => ({
  AddEmployeeModal: ({ open }: { open: boolean }) =>
    React.createElement("div", { "data-testid": "add-employee-modal", "data-open": String(open) }, "modal"),
}));

import { PeoplePageClient } from "@/app/(dashboard)/dashboard/people/client";

function createEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: overrides.id ?? "emp-1",
    firstName: overrides.firstName ?? "Ada",
    lastName: overrides.lastName ?? "Lovelace",
    displayName: overrides.displayName ?? "Ada Lovelace",
    email: overrides.email ?? "ada@example.com",
    avatar: overrides.avatar,
    visaExpiryDate: overrides.visaExpiryDate,
    visaStatus: overrides.visaStatus,
    department: overrides.department ?? "Engineering",
    role: overrides.role ?? {
      id: "swe",
      title: "Software Engineer",
      family: "Engineering",
      icon: "SWE",
    },
    level: overrides.level ?? {
      id: "ic3",
      name: "Senior (IC3)",
      category: "IC",
    },
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
    baseSalary: overrides.baseSalary ?? 120_000,
    bonus: overrides.bonus,
    equity: overrides.equity,
    totalComp: overrides.totalComp ?? 135_000,
    bandPosition: overrides.bandPosition ?? "in-band",
    bandPercentile: overrides.bandPercentile ?? 50,
    marketComparison: overrides.marketComparison ?? 4,
    hasBenchmark: overrides.hasBenchmark ?? true,
    benchmarkContext: overrides.benchmarkContext,
    hireDate: overrides.hireDate ?? new Date("2024-01-01T00:00:00.000Z"),
    lastReviewDate: overrides.lastReviewDate,
    performanceRating: overrides.performanceRating ?? "meets",
  };
}

function buildHookState(overrides: Record<string, unknown> = {}) {
  return {
    employees: [],
    allEmployees: [],
    filters: {
      search: "",
      department: "all",
      locationId: "all",
      band: "all",
      performance: "all",
    },
    setFilters: vi.fn(),
    viewMode: "table",
    setViewMode: vi.fn(),
    sortBy: "name",
    setSortBy: vi.fn(),
    loading: false,
    mutating: false,
    warnings: [],
    clearWarnings: vi.fn(),
    pendingDeletes: [],
    refresh: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    queueDeleteEmployee: vi.fn(),
    undoDeleteEmployee: vi.fn(),
    bulkArchiveEmployees: vi.fn(),
    exportFilteredCsv: vi.fn(),
    ...overrides,
  };
}

describe("PeoplePageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsState.employeeId = null;
  });

  it("shows a loading state before the people directory is ready", () => {
    usePeopleMock.mockReturnValue(buildHookState({ loading: true }));

    const html = renderToStaticMarkup(React.createElement(PeoplePageClient));

    expect(html).toContain("Loading your people directory");
  });

  it("shows the onboarding empty state when there are no employees yet", () => {
    usePeopleMock.mockReturnValue(buildHookState());

    const html = renderToStaticMarkup(React.createElement(PeoplePageClient));

    expect(html).toContain("Bring your people data into Qeemly");
    expect(html).toContain("Upload Data");
    expect(html).not.toContain('data-testid="people-table"');
  });

  it("renders the stats, toolbar, and list when employees are available", () => {
    usePeopleMock.mockReturnValue(
      buildHookState({
        employees: [createEmployee()],
        allEmployees: [createEmployee()],
      })
    );

    const html = renderToStaticMarkup(React.createElement(PeoplePageClient));

    expect(html).toContain('data-testid="people-page"');
    expect(html).toContain('data-testid="people-stats-bar"');
    expect(html).toContain('data-testid="people-toolbar"');
    expect(html).toContain('data-testid="people-table"');
    expect(html).toContain("Employee profiles and pay context");
  });
});
