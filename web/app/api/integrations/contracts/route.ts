import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAdminWorkspaceContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", userId)
    .single();
  if (!profile?.workspace_id) return null;
  if (profile.role !== "admin") return null;
  return profile.workspace_id as string;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getAdminWorkspaceContext(supabase, user.id);
  if (!workspaceId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const integrationId = request.nextUrl.searchParams.get("integration_id");
  if (!integrationId) {
    return NextResponse.json({ error: "integration_id is required" }, { status: 400 });
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

  if (mappings.error) return NextResponse.json({ error: mappings.error.message }, { status: 500 });
  if (syncState.error) return NextResponse.json({ error: syncState.error.message }, { status: 500 });

  return NextResponse.json({
    mappings: mappings.data || [],
    sync_state: syncState.data || null,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = await getAdminWorkspaceContext(supabase, user.id);
  if (!workspaceId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as {
    integration_id?: string;
    mappings?: Record<string, unknown>[];
    source_of_truth?: Record<string, string>;
  };

  if (!body.integration_id) {
    return NextResponse.json({ error: "integration_id is required" }, { status: 400 });
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
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
