import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { employeeId } = await params;
  const { workspace_id, is_override } = wsContext.context;
  const client = is_override ? createServiceClient() : await createClient();

  const { data: employee } = await client
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const { data: historyRows, error } = await client
    .from("compensation_history")
    .select("id, effective_date, base_salary, change_reason, change_percentage")
    .eq("employee_id", employeeId)
    .order("effective_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    employeeId,
    history: (historyRows ?? []).map((row) => ({
      id: row.id,
      effectiveDate: row.effective_date,
      baseSalary: Number(row.base_salary) || 0,
      changeReason: row.change_reason,
      changePercentage: row.change_percentage != null ? Number(row.change_percentage) : null,
    })),
  });
}
