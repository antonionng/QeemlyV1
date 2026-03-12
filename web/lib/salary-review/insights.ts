import { summarizeBenchmarkTrust } from "@/lib/benchmarks/trust";
import type { ReviewEmployee } from "./state";

export type SalaryReviewWatchout = {
  tone: "warning" | "neutral";
  title: string;
  body: string;
};

export type SalaryReviewInsightModel = {
  summary: {
    selectedEmployees: number;
    coveredEmployees: number;
    belowBandEmployees: number;
    overBudget: boolean;
    proposedEmployees: number;
    benchmarkTrustLabel: string;
  };
  watchouts: SalaryReviewWatchout[];
};

export function buildSalaryReviewInsightModel(args: {
  employees: ReviewEmployee[];
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
}): SalaryReviewInsightModel {
  const { employees, budgetRemaining, budgetUsed } = args;
  const selectedEmployees = employees.filter((employee) => employee.isSelected).length;
  const coveredEmployees = employees.filter((employee) => employee.hasBenchmark).length;
  const belowBandEmployees = employees.filter((employee) => employee.bandPosition === "below").length;
  const proposedEmployees = employees.filter((employee) => employee.proposedIncrease > 0).length;
  const benchmarkTrust = summarizeBenchmarkTrust(employees);
  const fallbackShare =
    benchmarkTrust.benchmarkedEmployees > 0
      ? benchmarkTrust.fallbackMatches / benchmarkTrust.benchmarkedEmployees
      : 0;

  const watchouts: SalaryReviewWatchout[] = [];
  if (budgetRemaining < 0) {
    watchouts.push({
      tone: "warning",
      title: "Over budget",
      body: `Current proposals exceed the available budget by ${Math.abs(Math.round(budgetRemaining)).toLocaleString()} AED.`,
    });
  }
  if (selectedEmployees === 0) {
    watchouts.push({
      tone: "warning",
      title: "No employees selected",
      body: "Select at least one employee before generating or submitting a review proposal.",
    });
  }
  if (coveredEmployees < employees.length) {
    watchouts.push({
      tone: "warning",
      title: "Benchmark coverage gaps",
      body: `${employees.length - coveredEmployees} employees do not currently have a market-backed match.`,
    });
  }
  if (fallbackShare >= 0.3) {
    watchouts.push({
      tone: "warning",
      title: "Fallback-heavy matches",
      body: `${benchmarkTrust.fallbackMatches} employees rely on role and level fallback matches instead of exact cohort matches.`,
    });
  }
  if (budgetUsed === 0 && selectedEmployees > 0) {
    watchouts.push({
      tone: "neutral",
      title: "No proposal applied yet",
      body: "Use AI or manual edits to turn the selected review population into a proposal draft.",
    });
  }

  return {
    summary: {
      selectedEmployees,
      coveredEmployees,
      belowBandEmployees,
      overBudget: budgetRemaining < 0,
      proposedEmployees,
      benchmarkTrustLabel: benchmarkTrust.primarySourceLabel,
    },
    watchouts,
  };
}
