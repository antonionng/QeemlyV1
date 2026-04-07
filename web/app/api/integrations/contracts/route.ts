import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const workspaceContext = await getAdminWorkspaceContextOrError();
  if (workspaceContext.error) return workspaceContext.error;
  const workspaceId = workspaceContext.context.workspace_id;

  const integrationId = request.nextUrl.searchParams.get("integration_id");
  if (!integrationId) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { integration_id: "Choose an integration and try again." },
    });
  }

  const [mappings, syncState] = await Promise.all([
    supabase
      .from("integration_field_mappings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("integration_id", integrationId)
      .order("domain", { ascending: true })
      .order("precedence_rank", { ascending: true }),
    supabase
      .from("integration_sync_state")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("integration_id", integrationId)
      .maybeSingle(),
  ]);

  if (mappings.error) {
    return jsonServerError(mappings.error, {
      defaultMessage: "We could not load integration field mappings right now.",
      logLabel: "Integration contracts mappings load failed",
    });
  }
  if (syncState.error) {
    return jsonServerError(syncState.error, {
      defaultMessage: "We could not load integration sync settings right now.",
      logLabel: "Integration contracts sync state load failed",
    });
  }

  return NextResponse.json({
    mappings: mappings.data || [],
    sync_state: syncState.data || null,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const workspaceContext = await getAdminWorkspaceContextOrError();
  if (workspaceContext.error) return workspaceContext.error;
  const workspaceId = workspaceContext.context.workspace_id;

  const body = (await request.json()) as {
    integration_id?: string;
    mappings?: Record<string, unknown>[];
    source_of_truth?: Record<string, string>;
  };

  if (!body.integration_id) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { integration_id: "Choose an integration and try again." },
    });
  }

  if (Array.isArray(body.mappings)) {
    await supabase
      .from("integration_field_mappings")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("integration_id", body.integration_id);

    if (body.mappings.length > 0) {
      const payload = body.mappings.map((mapping) => ({
        ...mapping,
        workspace_id: workspaceId,
        integration_id: body.integration_id,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("integration_field_mappings").insert(payload);
      if (error) {
        return jsonServerError(error, {
          defaultMessage: "We could not save field mappings right now.",
          logLabel: "Integration contracts mappings save failed",
        });
      }
    }
  }

  if (body.source_of_truth) {
    const { error } = await supabase.from("integration_sync_state").upsert(
      {
        workspace_id: workspaceId,
        integration_id: body.integration_id,
        source_of_truth: body.source_of_truth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "integration_id" }
    );
    if (error) {
      return jsonServerError(error, {
        defaultMessage: "We could not save sync source settings right now.",
        logLabel: "Integration contracts sync state save failed",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
