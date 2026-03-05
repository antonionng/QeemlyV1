import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "../middleware";
import { createServiceClient } from "@/lib/supabase/service";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";

/**
 * POST /api/v1/compensation-history
 * 
 * Push compensation change records for employees.
 * Employees are matched by email within the workspace.
 * Requires scope: compensation:write
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request, "compensation:write");
  if (auth.error) return auth.error;

  const body = await request.json();
  const { entries } = body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: "Request body must contain a non-empty 'entries' array" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  let created = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!entry.employee_email || !entry.effective_date || entry.base_salary === undefined) {
      errors.push({ index: i, error: "Missing required fields (employee_email, effective_date, base_salary)" });
      continue;
    }

    // Look up employee by email within the workspace
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("workspace_id", auth.workspaceId)
      .eq("email", entry.employee_email)
      .single();

    if (!employee) {
      errors.push({ index: i, error: `Employee not found: ${entry.employee_email}` });
      continue;
    }

    // Insert compensation history record
    const { error } = await supabase.from("compensation_history").insert({
      employee_id: employee.id,
      effective_date: entry.effective_date,
      base_salary: entry.base_salary,
      bonus: entry.bonus || null,
      equity: entry.equity || null,
      currency: entry.currency || "AED",
      change_reason: entry.change_reason || null,
      change_percentage: entry.change_percentage || null,
    });

    if (error) {
      errors.push({ index: i, error: error.message });
    } else {
      created++;
    }
  }

  if (created > 0) {
    try {
      await refreshComplianceSnapshot(auth.workspaceId);
    } catch {
      // Do not fail compensation history ingestion for refresh failures.
    }
  }

  return NextResponse.json({ created, errors });
}
