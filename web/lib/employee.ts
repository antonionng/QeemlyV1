import { createClient } from "@/lib/supabase/server";

export type EmployeeProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  roleId: string;
  levelId: string;
  locationId: string;
  baseSalary: number;
  bonus: number | null;
  equity: number | null;
  currency: string;
  status: string;
  employmentType: string;
  hireDate: string | null;
  lastReviewDate: string | null;
  performanceRating: string | null;
};

export type CompensationHistoryEntry = {
  id: string;
  effectiveDate: string;
  baseSalary: number;
  bonus: number | null;
  equity: number | null;
  currency: string;
  changeReason: string | null;
  changePercentage: number | null;
};

export type BandInfo = {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  position: number; // 0-100 percentile position within band
  label: string;
};

export type EmployeeDashboardData = {
  profile: EmployeeProfile;
  totalComp: number;
  history: CompensationHistoryEntry[];
  band: BandInfo | null;
  reviewCycle: string;
  nextReviewDate: string | null;
  companyName: string;
  userName: string;
};

type CompensationHistoryRow = {
  id: string;
  effective_date: string;
  base_salary: number | string | null;
  bonus: number | string | null;
  equity: number | string | null;
  currency: string | null;
  change_reason: string | null;
  change_percentage: number | string | null;
};

/**
 * Fetches the authenticated user's profile + role.
 * Returns null if not authenticated or not an employee-role user.
 */
async function getAuthenticatedEmployee(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, employee_id, workspace_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "employee" || !profile.employee_id) return null;

  return { userId: user.id, ...profile };
}

export async function getEmployeeDashboardData(): Promise<EmployeeDashboardData | null> {
  const supabase = await createClient();
  const auth = await getAuthenticatedEmployee(supabase);
  if (!auth) return null;

  const { data: emp } = await supabase
    .from("employees")
    .select("*")
    .eq("id", auth.employee_id)
    .single();

  if (!emp) return null;

  const { data: historyRows } = await supabase
    .from("compensation_history")
    .select("*")
    .eq("employee_id", auth.employee_id)
    .order("effective_date", { ascending: true });

  // Fetch the salary benchmark for this employee's role/level/location
  const { data: benchmark } = await supabase
    .from("salary_benchmarks")
    .select("p10, p25, p50, p75, p90")
    .eq("workspace_id", auth.workspace_id)
    .eq("role_id", emp.role_id)
    .eq("level_id", emp.level_id)
    .eq("location_id", emp.location_id)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("review_cycle, company_name")
    .eq("workspace_id", auth.workspace_id)
    .maybeSingle();

  const baseSalary = Number(emp.base_salary) || 0;
  const bonus = emp.bonus != null ? Number(emp.bonus) : null;
  const equity = emp.equity != null ? Number(emp.equity) : null;
  const totalComp = baseSalary + (bonus ?? 0) + (equity ?? 0);

  const profile: EmployeeProfile = {
    id: emp.id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    email: emp.email ?? "",
    department: emp.department,
    roleId: emp.role_id,
    levelId: emp.level_id,
    locationId: emp.location_id,
    baseSalary,
    bonus,
    equity,
    currency: emp.currency ?? "GBP",
    status: emp.status ?? "active",
    employmentType: emp.employment_type ?? "national",
    hireDate: emp.hire_date,
    lastReviewDate: emp.last_review_date,
    performanceRating: emp.performance_rating,
  };

  const history: CompensationHistoryEntry[] = ((historyRows ?? []) as CompensationHistoryRow[]).map((h) => ({
    id: h.id,
    effectiveDate: h.effective_date,
    baseSalary: Number(h.base_salary) || 0,
    bonus: h.bonus != null ? Number(h.bonus) : null,
    equity: h.equity != null ? Number(h.equity) : null,
    currency: h.currency ?? "GBP",
    changeReason: h.change_reason,
    changePercentage: h.change_percentage != null ? Number(h.change_percentage) : null,
  }));

  let band: BandInfo | null = null;
  if (benchmark) {
    const p10 = Number(benchmark.p10);
    const p25 = Number(benchmark.p25);
    const p50 = Number(benchmark.p50);
    const p75 = Number(benchmark.p75);
    const p90 = Number(benchmark.p90);

    // Calculate position as a percentile within the band range
    let position: number;
    if (baseSalary <= p10) position = 5;
    else if (baseSalary >= p90) position = 95;
    else {
      const range = p90 - p10;
      position = Math.round(((baseSalary - p10) / range) * 80 + 10);
    }

    let label: string;
    if (position >= 70) label = "Above the midpoint";
    else if (position >= 40) label = "Around the midpoint";
    else label = "Growing toward midpoint";

    band = { p10, p25, p50, p75, p90, position, label };
  }

  const reviewCycle = settings?.review_cycle ?? "annual";
  let nextReviewDate: string | null = null;
  if (emp.last_review_date) {
    const last = new Date(emp.last_review_date);
    const monthsToAdd = reviewCycle === "monthly" ? 1 : reviewCycle === "quarterly" ? 3 : reviewCycle === "biannual" ? 6 : 12;
    last.setMonth(last.getMonth() + monthsToAdd);
    nextReviewDate = last.toISOString().split("T")[0];
  }

  return {
    profile,
    totalComp,
    history,
    band,
    reviewCycle,
    nextReviewDate,
    companyName: settings?.company_name ?? "Your Company",
    userName: auth.full_name ?? emp.first_name,
  };
}
