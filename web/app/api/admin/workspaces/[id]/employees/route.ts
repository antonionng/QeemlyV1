import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id: workspaceId } = await params;
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "25", 10), 100);
  const department = searchParams.get("department");
  const role = searchParams.get("role");
  const level = searchParams.get("level");
  const search = searchParams.get("search");

  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  // Verify workspace exists
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .single();

  if (wsError || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Build query
  let query = supabase
    .from("employees")
    .select(
      "id, first_name, last_name, email, department, role_id, level_id, location_id, base_salary, bonus, equity, currency, status, employment_type, hire_date, performance_rating, created_at",
      { count: "exact" }
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (department) {
    query = query.eq("department", department);
  }
  if (role) {
    query = query.eq("role_id", role);
  }
  if (level) {
    query = query.eq("level_id", level);
  }
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: employees, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    workspace: { id: workspace.id, name: workspace.name },
    employees: employees ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}
