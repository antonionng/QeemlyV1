import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

type DepartmentStats = {
  department: string;
  count: number;
  avg_salary: number;
  min_salary: number;
  max_salary: number;
};

type LevelStats = {
  level: string;
  count: number;
};

type UploadRecord = {
  id: string;
  upload_type: string;
  file_name: string;
  row_count: number | null;
  created_at: string;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id: workspaceId } = await params;

  const supabase = createServiceClient();

  // Verify workspace exists
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_at")
    .eq("id", workspaceId)
    .single();

  if (wsError || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Get all employees for this workspace
  const { data: employees } = await supabase
    .from("employees")
    .select("department, level_id, base_salary, status")
    .eq("workspace_id", workspaceId);

  // Get recent uploads
  const { data: uploads } = await supabase
    .from("data_uploads")
    .select("id, upload_type, file_name, row_count, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Aggregate by department
  const departmentMap = new Map<string, { count: number; salaries: number[] }>();
  const levelMap = new Map<string, number>();
  let totalEmployees = 0;
  let activeEmployees = 0;
  let totalSalary = 0;

  for (const emp of employees ?? []) {
    totalEmployees++;
    if (emp.status === "active") activeEmployees++;
    
    const salary = Number(emp.base_salary) || 0;
    totalSalary += salary;

    // Department stats
    const dept = emp.department || "Unknown";
    if (!departmentMap.has(dept)) {
      departmentMap.set(dept, { count: 0, salaries: [] });
    }
    const deptStats = departmentMap.get(dept)!;
    deptStats.count++;
    deptStats.salaries.push(salary);

    // Level stats
    const level = emp.level_id || "Unknown";
    levelMap.set(level, (levelMap.get(level) ?? 0) + 1);
  }

  // Build department breakdown
  const by_department: DepartmentStats[] = Array.from(departmentMap.entries())
    .map(([department, stats]) => ({
      department,
      count: stats.count,
      avg_salary: Math.round(stats.salaries.reduce((a, b) => a + b, 0) / stats.count),
      min_salary: Math.min(...stats.salaries),
      max_salary: Math.max(...stats.salaries),
    }))
    .sort((a, b) => b.count - a.count);

  // Build level breakdown
  const by_level: LevelStats[] = Array.from(levelMap.entries())
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => b.count - a.count);

  // Build uploads list
  const recent_uploads: UploadRecord[] = (uploads ?? []).map((u) => ({
    id: u.id,
    upload_type: u.upload_type,
    file_name: u.file_name,
    row_count: u.row_count,
    created_at: u.created_at,
  }));

  return NextResponse.json({
    workspace,
    summary: {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      avg_salary: totalEmployees > 0 ? Math.round(totalSalary / totalEmployees) : null,
      department_count: departmentMap.size,
      level_count: levelMap.size,
    },
    by_department,
    by_level,
    recent_uploads,
  });
}
