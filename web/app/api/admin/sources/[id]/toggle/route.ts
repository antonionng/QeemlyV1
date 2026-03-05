import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Source ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const enabled = body?.enabled;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "body.enabled (boolean) is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("ingestion_sources")
      .update({
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
