import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminWorkspaceContextOrError, getWorkspaceContextOrError } from "@/lib/workspace-access";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

export async function GET() {
  const supabase = await createClient();
  const workspaceContext = await getWorkspaceContextOrError();
  if (workspaceContext.error) return workspaceContext.error;

  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("workspace_id", workspaceContext.context.workspace_id)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load integrations right now.",
      logLabel: "Integrations list failed",
    });
  }
  return NextResponse.json({ integrations: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const workspaceContext = await getAdminWorkspaceContextOrError();
  if (workspaceContext.error) return workspaceContext.error;
  const workspaceId = workspaceContext.context.workspace_id;

  const body = await request.json();
  const { provider, category, config } = body;
  if (!provider || !category) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: {
        ...(provider ? {} : { provider: "Choose an integration provider and try again." }),
        ...(category ? {} : { category: "Choose an integration category and try again." }),
      },
    });
  }

  const { data: existing } = await supabase
    .from("integrations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .maybeSingle();

  const payload = {
    workspace_id: workspaceId,
    provider,
    category,
    status: "connected",
    config: config || {},
    updated_at: new Date().toISOString(),
  };

  const query = existing?.id
    ? supabase.from("integrations").update(payload).eq("id", existing.id)
    : supabase.from("integrations").insert(payload);

  const { data, error } = await query.select().single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not save this integration right now.",
      logLabel: "Integration save failed",
    });
  }
  return NextResponse.json({ integration: data }, { status: 201 });
}
