import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PeopleStatsBar } from "@/components/dashboard/people/people-stats-bar";
import { PeopleTable } from "@/components/dashboard/people/people-table";
import { PeopleToolbar } from "@/components/dashboard/people/people-toolbar";
import type { Employee } from "@/lib/employees";

function createEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: overrides.id ?? "emp-1",
    firstName: overrides.firstName ?? "Ada",
    lastName: overrides.lastName ?? "Lovelace",
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

describe("People layout surfaces", () => {
  it("renders a balanced responsive stats grid", () => {
    const html = renderToStaticMarkup(
      React.createElement(PeopleStatsBar, {
        employees: [
          createEmployee({
            id: "emp-1",
            benchmarkContext: {
              source: "market",
              provenance: "blended",
              matchQuality: "exact",
              freshnessAt: "2026-03-10T00:00:00.000Z",
            },
          }),
          createEmployee({
            id: "emp-2",
            department: "Product",
            bandPosition: "above",
            marketComparison: 11,
            benchmarkContext: {
              source: "uploaded",
              provenance: "uploaded",
              matchQuality: "role_level_fallback",
              freshnessAt: "2026-03-08T00:00:00.000Z",
            },
          }),
        ],
      })
    );

    expect(html).toContain('data-testid="people-stats-grid"');
    expect(html).toContain("lg:grid-cols-3");
    expect(html).toContain("2xl:grid-cols-5");
    expect(html).toContain("Benchmark Trust");
  });

  it("separates dense filters from view actions in the toolbar", () => {
    const html = renderToStaticMarkup(
      React.createElement(PeopleToolbar, {
        filters: {
          search: "",
          department: "all",
          locationId: "all",
          band: "all",
          performance: "all",
        },
        onFiltersChange: () => undefined,
        viewMode: "table",
        onViewModeChange: () => undefined,
        sortBy: "name",
        onSortByChange: () => undefined,
        onAddEmployee: () => undefined,
        onExportCsv: () => undefined,
      })
    );

    expect(html).toContain('data-testid="people-toolbar-filters"');
    expect(html).toContain('data-testid="people-toolbar-actions"');
    expect(html).toContain("Search employees, emails");
    expect(html).toContain("Add Employee");
  });

  it("keeps the table read-only and sends editing to the profile flow", () => {
    const html = renderToStaticMarkup(
      React.createElement(PeopleTable, {
        employees: [createEmployee()],
        selectedIds: [],
        onToggleSelect: () => undefined,
        onToggleSelectAll: () => undefined,
        onBulkArchive: () => undefined,
        onOpenDetails: () => undefined,
        onDelete: () => undefined,
        onEditEmployee: () => undefined,
        mutating: false,
      })
    );

    expect(html).not.toContain('type="number"');
    expect(html).not.toContain("<select");
    expect(html).toContain("Edit");
  });

  it("shows benchmark pending state instead of neutral market numbers when coverage is missing", () => {
    const html = renderToStaticMarkup(
      React.createElement(PeopleTable, {
        employees: [
          createEmployee({
            hasBenchmark: false,
            benchmarkContext: undefined,
            bandPosition: "in-band",
            marketComparison: 0,
          }),
        ],
        selectedIds: [],
        onToggleSelect: () => undefined,
        onToggleSelectAll: () => undefined,
        onBulkArchive: () => undefined,
        onOpenDetails: () => undefined,
        onDelete: () => undefined,
        onEditEmployee: () => undefined,
        mutating: false,
      })
    );

    expect(html).toContain("Benchmark pending");
    expect(html).toContain("Not mapped");
  });
});
