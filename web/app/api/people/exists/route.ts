import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";

export async function GET() {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();

  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const queryClient = wsContext.context.is_override ? createServiceClient() : supabase;
  const { data, error } = await queryClient
    .from("employees")
    .select("id")
    .eq("workspace_id", wsContext.context.workspace_id)
    .neq("status", "inactive")
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    hasEmployees: (data || []).length > 0,
  });
}
