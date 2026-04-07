import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "../../middleware";
import { createServiceClient } from "@/lib/supabase/service";
import { refreshComplianceSnapshot } from "@/lib/compliance/snapshot-service";
import { jsonServerError } from "@/lib/errors/http";

/**
 * PATCH /api/v1/employees/:id
 * 
 * Update a single employee. Only provided fields will be changed.
 * Requires scope: employees:write
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request, "employees:write");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  // Verify employee belongs to workspace
  const { data: existing } = await supabase
    .from("employees")
    .select("id")
    .eq("id", id)
    .eq("workspace_id", auth.workspaceId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Remove fields that shouldn't be updated via API
  const { id: _, workspace_id: __, created_at: ___, ...updates } = body;

  const { data, error } = await supabase
    .from("employees")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not update this employee right now.",
      logLabel: "V1 employee update failed",
    });
  }

  try {
    await refreshComplianceSnapshot(auth.workspaceId);
  } catch {
    // Keep employee patch success even if snapshot refresh fails.
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/v1/employees/:id
 *
 * Soft-deletes an employee by marking status as inactive.
 * Requires scope: employees:write
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request, "employees:write");
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("employees")
    .select("id")
    .eq("id", id)
    .eq("workspace_id", auth.workspaceId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("employees")
    .update({
      status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not delete this employee right now.",
      logLabel: "V1 employee delete failed",
    });
  }

  try {
    await refreshComplianceSnapshot(auth.workspaceId);
  } catch {
    // Keep delete success even if snapshot refresh fails.
  }

  return NextResponse.json({ ok: true, id });
}
