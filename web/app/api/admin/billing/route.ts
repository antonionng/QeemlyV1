import { NextResponse } from "next/server";
import { adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

type PlanName = "Starter" | "Growth" | "Enterprise";

function getPlanForEmployeeCount(employeeCount: number): { name: PlanName; monthly: number } {
  if (employeeCount <= 25) return { name: "Starter", monthly: 49 };
  if (employeeCount <= 100) return { name: "Growth", monthly: 149 };
  return { name: "Enterprise", monthly: 499 };
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();

    const { data: workspaces, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, name")
      .limit(200);
    throwIfAdminQueryError(workspaceError, "Failed to load billing workspaces");

    const workspaceIds = (workspaces ?? []).map((workspace) => workspace.id);
    if (workspaceIds.length === 0) {
      return NextResponse.json({
        mrr: 0,
        arr: 0,
        paid_tenants: 0,
        avg_revenue_per_tenant: 0,
        plan_breakdown: [],
        recent_activity: [],
      });
    }

    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("workspace_id")
      .in("workspace_id", workspaceIds);
    throwIfAdminQueryError(employeesError, "Failed to load billing employee counts");

    const employeeCountByWorkspace = new Map<string, number>();
    for (const employee of employees ?? []) {
      employeeCountByWorkspace.set(
        employee.workspace_id,
        (employeeCountByWorkspace.get(employee.workspace_id) ?? 0) + 1
      );
    }

    let mrr = 0;
    let paidTenants = 0;
    const planMap = new Map<PlanName, { name: PlanName; count: number; monthly_revenue: number }>();
    for (const workspace of workspaces ?? []) {
      const employeeCount = employeeCountByWorkspace.get(workspace.id) ?? 0;
      if (employeeCount === 0) continue;
      const plan = getPlanForEmployeeCount(employeeCount);
      paidTenants++;
      mrr += plan.monthly;
      const current = planMap.get(plan.name) ?? { name: plan.name, count: 0, monthly_revenue: 0 };
      current.count += 1;
      current.monthly_revenue += plan.monthly;
      planMap.set(plan.name, current);
    }

    const { data: recentUploads, error: uploadsError } = await supabase
      .from("data_uploads")
      .select("id, workspace_id, created_at, file_name, upload_type")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: false })
      .limit(20);
    throwIfAdminQueryError(uploadsError, "Failed to load billing activity");

    const workspaceById = new Map((workspaces ?? []).map((workspace) => [workspace.id, workspace.name]));
    const recentActivity = (recentUploads ?? []).map((upload) => ({
      id: upload.id,
      type: "upload",
      occurred_at: upload.created_at,
      workspace_name: workspaceById.get(upload.workspace_id) ?? "Unknown",
      description: `${upload.upload_type || "data"} upload: ${upload.file_name || "file"}`,
    }));

    return NextResponse.json({
      mrr,
      arr: mrr * 12,
      paid_tenants: paidTenants,
      avg_revenue_per_tenant: paidTenants > 0 ? Math.round(mrr / paidTenants) : 0,
      plan_breakdown: Array.from(planMap.values()).sort(
        (left, right) => right.monthly_revenue - left.monthly_revenue
      ),
      recent_activity: recentActivity,
    });
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
