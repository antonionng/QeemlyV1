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
  
  return {
    totalEmployees: employees.length,
    activeEmployees: activeEmployees.length,
    totalPayroll,
    inBandPercentage: activeEmployees.length > 0 
      ? Math.round((inBandCount / activeEmployees.length) * 100)
      : 0,
    outOfBandPercentage: activeEmployees.length > 0
      ? Math.round((outOfBandCount / activeEmployees.length) * 100)
      : 0,
    avgMarketPosition: Math.round(avgMarketPosition * 10) / 10,
    rolesOutsideBand,
    departmentsOverBenchmark,
    payrollRiskFlags,
  };
}
