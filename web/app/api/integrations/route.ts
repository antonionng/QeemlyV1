import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getWorkspaceContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("workspace_id, role")
    .eq("id", userId)
    .single();

  if (error || !profile?.workspace_id) {
    return null;
  }

  return profile;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getWorkspaceContext(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("workspace_id", profile.workspace_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integrations: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getWorkspaceContext(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Only admins can connect integrations" }, { status: 403 });
  }

  const body = await request.json();
  const { provider, category, config } = body;
  if (!provider || !category) {
    return NextResponse.json({ error: "provider and category are required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("integrations")
    .select("id")
    .eq("workspace_id", profile.workspace_id)
    .eq("provider", provider)
    .maybeSingle();

  const payload = {
    workspace_id: profile.workspace_id,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integration: data }, { status: 201 });
}
