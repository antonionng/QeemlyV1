import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "../middleware";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

/**
 * GET /api/v1/employees
 * 
 * Returns a paginated list of employees for the workspace.
 * Requires scope: employees:read
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request, "employees:read");
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "50", 10), 200);
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  const supabase = getServiceClient();

  let query = supabase
    .from("employees")
    .select("*", { count: "exact" })
    .eq("workspace_id", auth.workspaceId)
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (department) query = query.eq("department", department);
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    pagination: {
      page,
      per_page: perPage,
      total: count || 0,
    },
  });
}

/**
 * POST /api/v1/employees
 * 
 * Bulk create/update employees. Matches existing employees by email.
 * Requires scope: employees:write
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request, "employees:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const { employees } = body;

  if (!Array.isArray(employees) || employees.length === 0) {
    return NextResponse.json(
      { error: "Request body must contain a non-empty 'employees' array" },
      { status: 400 }
    );
  }

  if (employees.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 employees per request" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];

    // Validate required fields
    if (!emp.first_name || !emp.last_name || !emp.department || !emp.role_id || !emp.level_id || !emp.location_id || emp.base_salary === undefined) {
      errors.push({ index: i, error: "Missing required fields" });
      failed++;
      continue;
    }

    // Check if employee exists (by email)
    if (emp.email) {
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("workspace_id", auth.workspaceId)
        .eq("email", emp.email)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("employees")
          .update({
            ...emp,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          errors.push({ index: i, error: error.message });
          failed++;
        } else {
          updated++;
        }
        continue;
      }
    }

    // Create new
    const { error } = await supabase.from("employees").insert({
      ...emp,
      workspace_id: auth.workspaceId,
    });

    if (error) {
      errors.push({ index: i, error: error.message });
      failed++;
    } else {
      created++;
    }
  }

  return NextResponse.json({ created, updated, failed, errors });
}
