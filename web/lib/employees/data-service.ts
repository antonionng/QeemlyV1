// Data service layer for employees
// Provides database-backed data with fallback to mock data

import { createClient } from "@/lib/supabase/client";
import type { Employee, CompanyMetrics, DepartmentSummary, Department } from "./mock-data";
import { 
  MOCK_EMPLOYEES, 
  getCompanyMetrics as getMockCompanyMetrics,
  getDepartmentSummaries as getMockDepartmentSummaries,
  getEmployeesByDepartment as getMockEmployeesByDepartment,
} from "./mock-data";
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      hasDbEmployeesCache = false;
      cacheTimestamp = Date.now();
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      hasDbEmployeesCache = false;
      cacheTimestamp = Date.now();
      return false;
    }

    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", profile.workspace_id);

    hasDbEmployeesCache = (count || 0) > 0;
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) return [];

    const { data: dbEmployees } = await supabase
      .from("employees")
      .select("*")
      .eq("workspace_id", profile.workspace_id);

    if (!dbEmployees || dbEmployees.length === 0) return [];

    // Transform database records to Employee type
    return dbEmployees.map((emp, index) => {
      const location = LOCATIONS.find(l => l.id === emp.location_id) || LOCATIONS[0];
      const level = LEVELS.find(l => l.id === emp.level_id) || LEVELS[2];
      const role = ROLES.find(r => r.id === emp.role_id) || ROLES[0];

      const baseSalary = Number(emp.base_salary) || 0;
      const bonus = Number(emp.bonus) || 0;
      const equity = Number(emp.equity) || 0;
      const totalComp = baseSalary + bonus + equity;

      // Calculate band position (simplified - would need benchmark data for accurate calc)
      const bandPosition = "in-band" as const;
      const bandPercentile = 50;
      const marketComparison = 0;

      return {
        id: emp.id,
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email || "",
        department: (emp.department || "Engineering") as Department,
        role,
        level,
        location,
        status: emp.status as "active" | "inactive",
        employmentType: emp.employment_type as "local" | "expat",
        baseSalary,
        bonus: bonus > 0 ? bonus : undefined,
        equity: equity > 0 ? equity : undefined,
        totalComp,
        bandPosition,
        bandPercentile,
        marketComparison,
        hireDate: emp.hire_date ? new Date(emp.hire_date) : new Date(),
        lastReviewDate: emp.last_review_date ? new Date(emp.last_review_date) : undefined,
        performanceRating: emp.performance_rating as any,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get all employees (database or mock)
 */
export async function getEmployees(): Promise<Employee[]> {
  const hasDb = await hasDbEmployees();
  if (hasDb) {
    return fetchDbEmployees();
  }
  return MOCK_EMPLOYEES;
}

// Note: getCompanyMetrics, getDepartmentSummaries, getEmployeesByDepartment
// are exported from mock-data.ts - use those for sync access
// Use async versions below when database access is needed

// Helper to generate trend data for async metrics
function generateAsyncTrendData(baseValue: number, volatility: number, trend: number): { month: string; value: number }[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  
  const data: { month: string; value: number }[] = [];
  let value = baseValue * (1 - trend * 0.12);
  
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth - 11 + i + 12) % 12;
    const monthVariation = (Math.random() - 0.5) * volatility * baseValue;
    value = value * (1 + trend / 12) + monthVariation;
    data.push({
      month: months[monthIndex],
      value: Math.round(value),
    });
  }
  
  return data;
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
 * Async version of getCompanyMetrics that uses database when available
 */
export async function getCompanyMetricsAsync(): Promise<CompanyMetrics> {
  const employees = await getEmployees();
  
  if (employees === MOCK_EMPLOYEES) {
    return getMockCompanyMetrics();
  }

  const activeEmployees = employees.filter(e => e.status === "active");
  const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.totalComp, 0);
  
  const inBandCount = activeEmployees.filter(e => e.bandPosition === "in-band").length;
  const belowBandCount = activeEmployees.filter(e => e.bandPosition === "below").length;
  const aboveBandCount = activeEmployees.filter(e => e.bandPosition === "above").length;
  const outOfBandCount = activeEmployees.length - inBandCount;
  
  const avgMarketPosition = activeEmployees.length > 0
    ? activeEmployees.reduce((sum, e) => sum + e.marketComparison, 0) / activeEmployees.length
    : 0;
  
  const rolesOutsideBand = outOfBandCount;
  
  // Calculate department metrics
  const departments = [...new Set(activeEmployees.map(e => e.department))];
  const deptMetrics = departments.map(dept => {
    const deptEmployees = activeEmployees.filter(e => e.department === dept);
    const avgVsMarket = deptEmployees.length > 0
      ? deptEmployees.reduce((sum, e) => sum + e.marketComparison, 0) / deptEmployees.length
      : 0;
    return { dept, avgVsMarket };
  });
  
  const departmentsOverBenchmark = deptMetrics.filter(d => d.avgVsMarket > 5).length;
  const payrollRiskFlags = activeEmployees.filter(e => e.marketComparison > 15).length;
  
  const inBandPercentage = activeEmployees.length > 0 
    ? Math.round((inBandCount / activeEmployees.length) * 100)
    : 0;
  
  // Generate extended metrics
  const headcountTrend = generateAsyncTrendData(activeEmployees.length, 0.03, 0.08);
  const payrollTrend = generateAsyncTrendData(totalPayroll, 0.02, 0.12);
  const riskBreakdown = calculateAsyncRiskBreakdown(activeEmployees);
  const healthScore = calculateAsyncHealthScore(
    inBandPercentage,
    avgMarketPosition,
    payrollRiskFlags,
    activeEmployees.length
  );
  
  const bandDistribution = {
    below: activeEmployees.length > 0 ? Math.round((belowBandCount / activeEmployees.length) * 100) : 0,
    inBand: inBandPercentage,
    above: activeEmployees.length > 0 ? Math.round((aboveBandCount / activeEmployees.length) * 100) : 0,
  };
  
  return {
    totalEmployees: employees.length,
    activeEmployees: activeEmployees.length,
    totalPayroll,
    inBandPercentage,
    outOfBandPercentage: activeEmployees.length > 0
      ? Math.round((outOfBandCount / activeEmployees.length) * 100)
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
    headcountChange: 8.2,
    payrollChange: 12.4,
    inBandChange: 3.5,
  };
}
