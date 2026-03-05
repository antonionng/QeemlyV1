import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

type InviteRole = "admin" | "member" | "employee";

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const fullName = String(body?.full_name || "").trim() || null;
    const workspaceId = String(body?.workspace_id || "").trim();
    const role = (body?.role || "member") as InviteRole;

    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: "email and workspace_id are required" },
        { status: 400 }
      );
    }

    if (!["admin", "member", "employee"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const invite = await supabase.auth.admin.inviteUserByEmail(email);
    if (invite.error) {
      return NextResponse.json({ error: invite.error.message }, { status: 500 });
    }

    const userId = invite.data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          workspace_id: workspaceId,
          role,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      invited: true,
      email,
      workspace_id: workspaceId,
      role,
      user_id: userId ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
