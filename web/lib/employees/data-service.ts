// Data service layer for employees (database only)

import type { Employee, CompanyMetrics, DepartmentSummary, Department, PerformanceRating } from "./mock-data";
import { LOCATIONS, LEVELS, ROLES } from "@/lib/dashboard/dummy-data";

// Cache for database employee count check
let hasDbEmployeesCache: boolean | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Check if the workspace has employees in the database
 */
export async function hasDbEmployees(): Promise<boolean> {
  // Return cached value if still valid
  if (hasDbEmployeesCache !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
    return hasDbEmployeesCache;
  }

  try {
    const response = await fetch("/api/people", { method: "GET", cache: "no-store" });
    if (!response.ok) {
      hasDbEmployeesCache = false;
      cacheTimestamp = Date.now();
      return false;
    }
    const payload = (await response.json()) as { employees?: unknown[] };
    hasDbEmployeesCache = (payload.employees || []).length > 0;
    cacheTimestamp = Date.now();
    return hasDbEmployeesCache;
  } catch {
    hasDbEmployeesCache = false;
    cacheTimestamp = Date.now();
    return false;
  }
}

/**
 * Invalidate the cache (call after upload)
 */
export function invalidateEmployeeCache() {
  hasDbEmployeesCache = null;
  cacheTimestamp = 0;
}

/**
 * Fetch employees from database
 */
export async function fetchDbEmployees(): Promise<Employee[]> {
  try {
    const response = await fetch("/api/people", { method: "GET", cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as { employees?: Record<string, unknown>[]; benchmarks?: Record<string, unknown>[] };
    return mapRowsToEmployees(payload.employees || [], payload.benchmarks || []);
  } catch {
    return [];
  }
}

type BenchmarkRow = {
  role_id: string;
  location_id: string;
  level_id: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
};

function mapRowsToEmployees(dbEmployees: Record<string, unknown>[], dbBenchmarks: Record<string, unknown>[]): Employee[] {
  if (!dbEmployees.length) return [];

  const exactBenchmarkMap = new Map<string, BenchmarkRow>();
  const roleLevelFallbackMap = new Map<string, BenchmarkRow>();
  for (const row of dbBenchmarks) {
    const exactKey = `${row.role_id as string}::${row.location_id as string}::${row.level_id as string}`;
    if (!exactBenchmarkMap.has(exactKey)) {
      exactBenchmarkMap.set(exactKey, row as unknown as BenchmarkRow);
    }
    const roleLevelKey = `${row.role_id as string}::${row.level_id as string}`;
    if (!roleLevelFallbackMap.has(roleLevelKey)) {
      roleLevelFallbackMap.set(roleLevelKey, row as unknown as BenchmarkRow);
    }
  }

  const toAnnual = (value: number): number => (value < 100_000 ? value * 12 : value);
  const percentileFromComp = (comp: number, b: BenchmarkRow): number => {
    const p10 = toAnnual(Number(b.p10) || 0);
    const p25 = toAnnual(Number(b.p25) || 0);
    const p50 = toAnnual(Number(b.p50) || 0);
    const p75 = toAnnual(Number(b.p75) || 0);
    const p90 = toAnnual(Number(b.p90) || 0);
    if (comp <= p10) return 10;
    if (comp >= p90) return 90;
    if (comp <= p25) return 10 + ((comp - p10) / Math.max(1, p25 - p10)) * 15;
    if (comp <= p50) return 25 + ((comp - p25) / Math.max(1, p50 - p25)) * 25;
    if (comp <= p75) return 50 + ((comp - p50) / Math.max(1, p75 - p50)) * 25;
    return 75 + ((comp - p75) / Math.max(1, p90 - p75)) * 15;
  };

  return dbEmployees.map((emp) => {
    const location = LOCATIONS.find((l) => l.id === emp.location_id) || LOCATIONS[0];
    const level = LEVELS.find((l) => l.id === emp.level_id) || LEVELS[2];
    const role = ROLES.find((r) => r.id === emp.role_id) || ROLES[0];

    const baseSalary = Number(emp.base_salary) || 0;
    const bonus = Number(emp.bonus) || 0;
    const equity = Number(emp.equity) || 0;
    const totalComp = baseSalary + bonus + equity;

    const exactKey = `${emp.role_id as string}::${emp.location_id as string}::${emp.level_id as string}`;
    const fallbackKey = `${emp.role_id as string}::${emp.level_id as string}`;
    const benchmark = exactBenchmarkMap.get(exactKey) ?? roleLevelFallbackMap.get(fallbackKey);

    let bandPosition: "below" | "in-band" | "above" = "in-band";
    let bandPercentile = 50;
    let marketComparison = 0;
    let hasBenchmark = false;
    if (benchmark) {
      const p25Annual = toAnnual(Number(benchmark.p25) || 0);
      const p50Annual = toAnnual(Number(benchmark.p50) || 0);
      const p75Annual = toAnnual(Number(benchmark.p75) || 0);
      if (p50Annual > 0) {
        hasBenchmark = true;
        marketComparison = Math.round(((totalComp - p50Annual) / p50Annual) * 100);
        if (totalComp < p25Annual) bandPosition = "below";
        else if (totalComp > p75Annual) bandPosition = "above";
        else bandPosition = "in-band";
        bandPercentile = Math.round(percentileFromComp(totalComp, benchmark));
      }
    }

    return {
      id: String(emp.id || ""),
      firstName: String(emp.first_name || ""),
      lastName: String(emp.last_name || ""),
      email: String(emp.email || ""),
      avatar: emp.avatar_url ? String(emp.avatar_url) : undefined,
      visaExpiryDate: emp.visa_expiry_date ? new Date(String(emp.visa_expiry_date)) : undefined,
      visaStatus: emp.visa_status ? String(emp.visa_status) : undefined,
      department: (emp.department || "Engineering") as Department,
      role,
      level,
      location,
      status: (emp.status || "active") as "active" | "inactive",
      employmentType: (emp.employment_type || "national") as "national" | "expat",
      baseSalary,
      bonus: bonus > 0 ? bonus : undefined,
      equity: equity > 0 ? equity : undefined,
      totalComp,
      bandPosition,
      bandPercentile,
      marketComparison,
      hasBenchmark,
      hireDate: emp.hire_date ? new Date(String(emp.hire_date)) : new Date(),
      lastReviewDate: emp.last_review_date ? new Date(String(emp.last_review_date)) : undefined,
      performanceRating: (emp.performance_rating as PerformanceRating | null) ?? undefined,
    };
  });
}

/**
 * Get all employees from database
 */
export async function getEmployees(): Promise<Employee[]> {
  return fetchDbEmployees();
}

// Note: getCompanyMetrics, getDepartmentSummaries, getEmployeesByDepartment
// are exported from mock-data.ts - use those for sync access
// Use async versions below when database access is needed

// Helper to generate trend data for async metrics
function buildLast12MonthStarts(): Date[] {
  const now = new Date();
  const starts: Date[] = [];
  for (let i = 11; i >= 0; i--) {
    starts.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  return starts;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" });
}

function calculateHeadcountTrend(activeEmployees: Employee[]): { month: string; value: number }[] {
  const monthStarts = buildLast12MonthStarts();
  return monthStarts.map((start) => {
    const value = activeEmployees.filter((e) => {
      const hire = new Date(e.hireDate);
      return hire <= start;
    }).length;
    return { month: formatMonthLabel(start), value };
  });
}

function calculatePayrollTrend(activeEmployees: Employee[]): { month: string; value: number }[] {
  const monthStarts = buildLast12MonthStarts();
  return monthStarts.map((start) => {
    const value = activeEmployees
      .filter((e) => {
        const hire = new Date(e.hireDate);
        return hire <= start;
      })
      .reduce((sum, e) => sum + e.totalComp, 0);
    return { month: formatMonthLabel(start), value: Math.round(value) };
  });
}

function percentChangeFromTrend(trend: { value: number }[]): number {
  const first = trend[0]?.value ?? 0;
  const last = trend[trend.length - 1]?.value ?? 0;
  if (first <= 0) return 0;
  return Math.round(((last - first) / first) * 1000) / 10;
}

// Helper to calculate risk breakdown
function calculateAsyncRiskBreakdown(employees: Employee[]): { severity: "critical" | "high" | "medium" | "low"; count: number; label: string }[] {
  const critical = employees.filter(e => e.marketComparison > 25).length;
  const high = employees.filter(e => e.marketComparison > 15 && e.marketComparison <= 25).length;
  const medium = employees.filter(e => e.marketComparison > 5 && e.marketComparison <= 15).length;
  const low = employees.filter(e => e.bandPosition === "above" && e.marketComparison <= 5).length;
  
  return [
    { severity: "critical", count: critical, label: "Critical (>25% above)" },
    { severity: "high", count: high, label: "High (15-25% above)" },
    { severity: "medium", count: medium, label: "Medium (5-15% above)" },
    { severity: "low", count: low, label: "Low (slightly above)" },
  ];
}

// Helper to calculate health score
function calculateAsyncHealthScore(
  inBandPercentage: number,
  avgMarketPosition: number,
  payrollRiskFlags: number,
  totalEmployees: number
): number {
  const bandAlignmentScore = inBandPercentage;
  const marketScore = avgMarketPosition >= 0 && avgMarketPosition <= 5 
    ? 100 
    : avgMarketPosition < 0 
      ? Math.max(0, 100 + avgMarketPosition * 5)
      : Math.max(0, 100 - (avgMarketPosition - 5) * 3);
  const riskPercentage = (payrollRiskFlags / totalEmployees) * 100;
  const riskScore = Math.max(0, 100 - riskPercentage * 5);
  
  const score = (bandAlignmentScore * 0.4) + (marketScore * 0.35) + (riskScore * 0.25);
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Async version of getDepartmentSummaries that uses database when available
 */
export async function getDepartmentSummariesAsync(): Promise<DepartmentSummary[]> {
  const employees = await getEmployees();

  const activeEmployees = employees.filter(e => e.status === "active");
  const departments = [...new Set(activeEmployees.map(e => e.department))] as Department[];
  
  return departments.map(dept => {
    const deptEmployees = activeEmployees.filter(e => e.department === dept);
    const benchmarkedDeptEmployees = deptEmployees.filter((e) => e.hasBenchmark);
    const avgVsMarket = benchmarkedDeptEmployees.length > 0
      ? benchmarkedDeptEmployees.reduce((sum, e) => sum + e.marketComparison, 0) / benchmarkedDeptEmployees.length
      : 0;
    const inBandCount = benchmarkedDeptEmployees.filter(e => e.bandPosition === "in-band").length;
    const belowBandCount = benchmarkedDeptEmployees.filter(e => e.bandPosition === "below").length;
    const aboveBandCount = benchmarkedDeptEmployees.filter(e => e.bandPosition === "above").length;
    const totalPayroll = deptEmployees.reduce((sum, e) => sum + e.totalComp, 0);
    
    return {
      department: dept,
      headcount: deptEmployees.length,
      activeCount: deptEmployees.length,
      inBandCount,
      belowBandCount,
      aboveBandCount,
      totalPayroll,
      avgVsMarket: Math.round(avgVsMarket * 10) / 10,
    };
  });
}

/**
 * Async version of getCompanyMetrics that uses database when available
 */
export async function getCompanyMetricsAsync(): Promise<CompanyMetrics> {
  const employees = await getEmployees();

  const activeEmployees = employees.filter(e => e.status === "active");
  const benchmarkedEmployees = activeEmployees.filter((e) => e.hasBenchmark);
  const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.totalComp, 0);
  
  const inBandCount = benchmarkedEmployees.filter(e => e.bandPosition === "in-band").length;
  const belowBandCount = benchmarkedEmployees.filter(e => e.bandPosition === "below").length;
  const aboveBandCount = benchmarkedEmployees.filter(e => e.bandPosition === "above").length;
  const outOfBandCount = benchmarkedEmployees.length - inBandCount;
  
  const avgMarketPosition = benchmarkedEmployees.length > 0
    ? benchmarkedEmployees.reduce((sum, e) => sum + e.marketComparison, 0) / benchmarkedEmployees.length
    : 0;
  
  const rolesOutsideBand = outOfBandCount;
  
  // Calculate department metrics
  const departments = [...new Set(benchmarkedEmployees.map(e => e.department))];
  const deptMetrics = departments.map(dept => {
    const deptEmployees = benchmarkedEmployees.filter(e => e.department === dept);
    const avgVsMarket = deptEmployees.length > 0
      ? deptEmployees.reduce((sum, e) => sum + e.marketComparison, 0) / deptEmployees.length
      : 0;
    return { dept, avgVsMarket };
  });
  
  const departmentsOverBenchmark = deptMetrics.filter(d => d.avgVsMarket > 5).length;
  const payrollRiskFlags = benchmarkedEmployees.filter(e => e.marketComparison > 15).length;
  
  const inBandPercentage = benchmarkedEmployees.length > 0 
    ? Math.round((inBandCount / benchmarkedEmployees.length) * 100)
    : 0;
  
  // Real-data-only trends derived from employee records.
  const headcountTrend = calculateHeadcountTrend(activeEmployees);
  const payrollTrend = calculatePayrollTrend(activeEmployees);
  const riskBreakdown = calculateAsyncRiskBreakdown(benchmarkedEmployees);
  const healthScore = calculateAsyncHealthScore(
    inBandPercentage,
    avgMarketPosition,
    payrollRiskFlags,
    Math.max(1, benchmarkedEmployees.length)
  );
  
  const bandDistribution = {
    below: benchmarkedEmployees.length > 0 ? Math.round((belowBandCount / benchmarkedEmployees.length) * 100) : 0,
    inBand: inBandPercentage,
    above: benchmarkedEmployees.length > 0 ? Math.round((aboveBandCount / benchmarkedEmployees.length) * 100) : 0,
  };
  
  return {
    totalEmployees: employees.length,
    activeEmployees: activeEmployees.length,
    totalPayroll,
    inBandPercentage,
    outOfBandPercentage: benchmarkedEmployees.length > 0
      ? Math.round((outOfBandCount / benchmarkedEmployees.length) * 100)
      : 0,
    avgMarketPosition: Math.round(avgMarketPosition * 10) / 10,
    rolesOutsideBand,
    departmentsOverBenchmark,
    payrollRiskFlags,
    // Extended metrics
    healthScore,
    headcountTrend,
    payrollTrend,
    riskBreakdown,
    bandDistribution,
    headcountChange: percentChangeFromTrend(headcountTrend),
    payrollChange: percentChangeFromTrend(payrollTrend),
    inBandChange: 0,
  };
}
