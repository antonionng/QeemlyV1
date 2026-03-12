import { buildBenchmarkTrustLabels } from "@/lib/benchmarks/trust";
import type { ReviewEmployee } from "./state";

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

export function buildSalaryReviewCsv(employees: ReviewEmployee[]): string {
  const header = [
    "employee_id",
    "employee_name",
    "department",
    "role",
    "location",
    "current_salary",
    "proposed_increase",
    "proposed_salary",
    "proposed_percentage",
    "band_position",
    "performance",
    "benchmark_source",
    "benchmark_match",
    "selected",
  ];

  const rows = employees
    .filter((employee) => employee.isSelected)
    .map((employee) => {
      const trust = buildBenchmarkTrustLabels(employee.benchmarkContext);
      return [
        employee.id,
        `${employee.firstName} ${employee.lastName}`.trim(),
        employee.department,
        employee.role.title,
        employee.location.city,
        employee.baseSalary,
        employee.proposedIncrease,
        employee.newSalary,
        Number(employee.proposedPercentage.toFixed(1)).toString(),
        employee.bandPosition,
        employee.performanceRating ?? "",
        trust?.sourceLabel ?? "No benchmark coverage",
        trust?.matchLabel ?? "",
        "yes",
      ]
        .map(csvEscape)
        .join(",");
    });

  return [header.join(","), ...rows].join("\n");
}
