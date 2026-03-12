import type { ReviewEmployee } from "./state";
import type { SalaryReviewQueryState } from "./url-state";

const LEADERSHIP_LEVELS = ["Director", "VP", "C-Level", "Head of"];

function isLeadership(employee: ReviewEmployee): boolean {
  return LEADERSHIP_LEVELS.some(
    (label) =>
      employee.level.name.includes(label) ||
      employee.role.title.includes(label) ||
      employee.level.category === "Executive"
  );
}

export function applySalaryReviewFilters(
  employees: ReviewEmployee[],
  query: SalaryReviewQueryState
): ReviewEmployee[] {
  const search = query.search.trim().toLowerCase();

  return employees.filter((employee) => {
    const matchesSearch =
      !search ||
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(search) ||
      employee.role.title.toLowerCase().includes(search);

    const matchesDepartment =
      query.department === "all" || employee.department === query.department;
    const matchesLocation = query.location === "all" || employee.location.city === query.location;
    const matchesPool =
      query.pool === "all" ||
      (query.pool === "leadership" && isLeadership(employee)) ||
      (query.pool === "general" && !isLeadership(employee));

    const matchesBenchmark =
      query.benchmarkStatus === "all" ||
      (query.benchmarkStatus === "missing" && !employee.hasBenchmark) ||
      (query.benchmarkStatus === "exact" && employee.benchmarkContext?.matchQuality === "exact") ||
      (query.benchmarkStatus === "fallback" &&
        employee.benchmarkContext?.matchQuality === "role_level_fallback");

    const matchesBand =
      query.bandFilter === "all" ||
      (query.bandFilter === "below" && employee.bandPosition === "below") ||
      (query.bandFilter === "above" && employee.bandPosition === "above") ||
      (query.bandFilter === "outside-band" && employee.bandPosition !== "in-band");

    const matchesPerformance =
      query.performance === "all" || employee.performanceRating === query.performance;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesLocation &&
      matchesPool &&
      matchesBenchmark &&
      matchesBand &&
      matchesPerformance
    );
  });
}
