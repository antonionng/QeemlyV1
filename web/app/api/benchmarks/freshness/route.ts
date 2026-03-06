import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertBenchmarksFreshness } from "@/lib/ingestion/freshness";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const recordCount = Number(body?.recordCount ?? 0);
    if (!Number.isFinite(recordCount) || recordCount <= 0) {
      return NextResponse.json({ error: "recordCount must be a positive number" }, { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!profile?.workspace_id) {
      return NextResponse.json({ error: "No workspace found for current user" }, { status: 400 });
    }

    await upsertBenchmarksFreshness(profile.workspace_id, recordCount, null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update benchmark freshness" },
      { status: 500 }
    );
  }
}
