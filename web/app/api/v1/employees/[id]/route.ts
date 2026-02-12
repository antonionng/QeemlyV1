import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "../../middleware";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

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
  const supabase = getServiceClient();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
