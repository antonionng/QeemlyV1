import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmployeeDrawer } from "@/components/dashboard/people/employee-drawer";
import type { Employee } from "@/lib/employees";

function createEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: overrides.id ?? "emp-1",
    firstName: overrides.firstName ?? "Ahmed",
    lastName: overrides.lastName ?? "Al-Qasimi",
    displayName: overrides.displayName ?? "Ahmed Al-Qasimi (Dubai)",
    email: overrides.email ?? "ahmed@example.com",
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
    bandPercentile: overrides.bandPercentile ?? 52,
    marketComparison: overrides.marketComparison ?? 4,
    hasBenchmark: overrides.hasBenchmark ?? true,
    benchmarkContext: overrides.benchmarkContext ?? {
      source: "market",
      provenance: "blended",
      matchQuality: "exact",
      freshnessAt: "2026-03-10T00:00:00.000Z",
    },
    hireDate: overrides.hireDate ?? new Date("2024-01-01T00:00:00.000Z"),
    lastReviewDate: overrides.lastReviewDate,
    performanceRating: overrides.performanceRating ?? "meets",
  };
}

describe("EmployeeDrawer", () => {
  it("shows a premium identity summary and an embedded advisory section", () => {
    const html = renderToStaticMarkup(
      React.createElement(EmployeeDrawer, {
        employee: createEmployee(),
        open: true,
        mutating: false,
        onClose: () => undefined,
        onSave: async () => undefined,
        onDelete: async () => undefined,
      }),
    );

    expect(html).toContain("Employee profile");
    expect(html).toContain("Ahmed Al-Qasimi (Dubai)");
    expect(html).toContain("Qeemly Advisory");
    expect(html).toContain("Ask about compensation, fairness, or retention risks for this employee.");
  });
});
