import { NextRequest, NextResponse } from "next/server";
import { adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSuperAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("ingestion_sources")
      .select("id, slug, name, description, category, regions, enabled, approved_for_commercial, needs_review, update_cadence, config, created_at, updated_at")
      .order("created_at", { ascending: false });

    throwIfAdminQueryError(error, "Failed to load ingestion sources");

    const sourceIds = (data ?? []).map((s) => s.id);
    const { data: lastJobs, error: lastJobsError } = sourceIds.length
      ? await supabase
          .from("ingestion_jobs")
          .select("source_id, completed_at, status, records_created")
          .in("source_id", sourceIds)
          .order("completed_at", { ascending: false })
      : { data: [], error: null };

    throwIfAdminQueryError(lastJobsError, "Failed to load source job history");

    const lastJobBySource = new Map<string, { completed_at: string; status: string; records_created?: number }>();
    for (const j of lastJobs ?? []) {
      if (!lastJobBySource.has(j.source_id)) {
        lastJobBySource.set(j.source_id, {
          completed_at: j.completed_at ?? "",
          status: j.status ?? "",
          records_created: j.records_created ?? 0,
        });
      }
    }

    const enriched = (data ?? []).map((s) => ({
      ...s,
      last_run: lastJobBySource.get(s.id) ?? null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { slug, name, description, category, regions, enabled, config } = body;

    if (!slug || !name || !category) {
      return NextResponse.json(
        { error: "slug, name, and category are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("ingestion_sources")
      .upsert(
        {
          slug: String(slug).trim(),
          name: String(name),
          description: description ?? null,
          category: ["market", "survey", "partner", "govt"].includes(category) ? category : "market",
          regions: Array.isArray(regions) ? regions : [],
          enabled: Boolean(enabled),
          config: config ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      )
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
