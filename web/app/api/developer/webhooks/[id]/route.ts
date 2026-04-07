import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError } from "@/lib/errors/http";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const workspaceContext = await getAdminWorkspaceContextOrError();
    if (workspaceContext.error) {
      return workspaceContext.error;
    }

    const { error } = await supabase
      .from("outgoing_webhooks")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceContext.context.workspace_id);

    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not delete this webhook right now.",
        logLabel: "Webhook delete failed",
      });
    }

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
