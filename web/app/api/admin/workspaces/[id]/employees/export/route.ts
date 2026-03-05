import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

function csvEscape(value: unknown) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id: workspaceId } = await params;
  const supabase = createServiceClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: employees, error } = await supabase
    .from("employees")
    .select(
      "id, first_name, last_name, email, department, role_id, level_id, location_id, base_salary, bonus, equity, currency, status, employment_type, hire_date, performance_rating, created_at"
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "id",
    "first_name",
    "last_name",
    "email",
    "department",
    "role_id",
    "level_id",
    "location_id",
    "base_salary",
    "bonus",
    "equity",
    "currency",
    "status",
    "employment_type",
    "hire_date",
    "performance_rating",
    "created_at",
  ];

  const rows = (employees ?? []).map((employee) =>
    headers.map((header) => csvEscape(employee[header as keyof typeof employee])).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `${workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-employees.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
