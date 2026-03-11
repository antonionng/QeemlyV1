import { describe, expect, it } from "vitest";
import { buildPayrollTrendViewModel } from "@/lib/dashboard/payroll-trend";
import type { OverviewMetrics } from "@/lib/dashboard/company-overview";

const metrics: OverviewMetrics = {
  totalEmployees: 85,
  activeEmployees: 85,
  benchmarkedEmployees: 85,
  totalPayroll: 3_000_000,
  inBandPercentage: 0,
  outOfBandPercentage: 100,
  avgMarketPosition: 91,
  rolesOutsideBand: 85,
  departmentsOverBenchmark: 3,
  payrollRiskFlags: 73,
  healthScore: 0,
  headcountTrend: [
    { month: "Apr", value: 68 },
    { month: "Jun", value: 70 },
    { month: "Aug", value: 74 },
    { month: "Oct", value: 76 },
    { month: "Dec", value: 79 },
    { month: "Feb", value: 85 },
  ],
  payrollTrend: [
    { month: "Apr", value: 2_400_000 },
    { month: "Jun", value: 2_450_000 },
    { month: "Aug", value: 2_500_000 },
    { month: "Oct", value: 2_520_000 },
    { month: "Dec", value: 2_700_000 },
    { month: "Feb", value: 3_000_000 },
  ],
  riskBreakdown: [],
  bandDistribution: {
    below: 14,
    inBand: 0,
    above: 86,
  },
  bandDistributionCounts: {
    inBand: 0,
    above: 73,
    below: 12,
  },
  headcountChange: 25,
  payrollChange: 24.4,
  inBandChange: 0,
  trendMode: "inferred_from_current_roster",
};

describe("buildPayrollTrendViewModel", () => {
  it("formats header values without duplicating the AED prefix", () => {
    const viewModel = buildPayrollTrendViewModel({
      metrics,
      salaryView: "annual",
      timeRange: "12m",
    });

    expect(viewModel.startDisplay).toBe("AED 2.4M");
    expect(viewModel.currentDisplay).toBe("AED 3.0M");
  });

  it("builds clearer summary labels and trust copy for the selected range", () => {
    const viewModel = buildPayrollTrendViewModel({
      metrics,
      salaryView: "annual",
      timeRange: "12m",
    });

    expect(viewModel.changeLabel).toBe("12M payroll change");
    expect(viewModel.currentLabel).toBe("Current annual payroll");
    expect(viewModel.driverSummary).toBe("Driver: growth is mostly headcount-led (+25.0% headcount vs +24.4% payroll).");
    expect(viewModel.trustLabel).toBe("Estimated from active employee records and hire dates.");
  });

  it("switches labels when the user changes the time range", () => {
    const viewModel = buildPayrollTrendViewModel({
      metrics,
      salaryView: "annual",
      timeRange: "3m",
    });

    expect(viewModel.changeLabel).toBe("3M payroll change");
  });
});
