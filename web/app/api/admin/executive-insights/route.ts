import { NextResponse } from "next/server";
import { adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { buildExecutiveInsightsResponse } from "@/lib/admin/executive-insights";
import { fetchMarketBenchmarks } from "@/lib/benchmarks/platform-market";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createServiceClient();
    const uploadsCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const jobsCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: workspaces, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, name")
      .limit(200);
    throwIfAdminQueryError(workspaceError, "Failed to load workspaces");

    const workspaceIds = (workspaces ?? []).map((workspace) => workspace.id);

    const [
      marketRows,
      employeesResult,
      uploadsResult,
      uploadedBenchmarksResult,
      sourcesResult,
      jobsResult,
      freshnessResult,
    ] = await Promise.all([
      fetchMarketBenchmarks(supabase),
      workspaceIds.length > 0
        ? supabase.from("employees").select("workspace_id").in("workspace_id", workspaceIds)
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length > 0
        ? supabase
            .from("data_uploads")
            .select("workspace_id, created_at")
            .in("workspace_id", workspaceIds)
            .gte("created_at", uploadsCutoff)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      workspaceIds.length > 0
        ? supabase
            .from("salary_benchmarks")
            .select("workspace_id, source")
            .in("workspace_id", workspaceIds)
            .eq("source", "uploaded")
        : Promise.resolve({ data: [], error: null }),
      supabase.from("ingestion_sources").select("id, enabled, config"),
      supabase.from("ingestion_jobs").select("status").gte("created_at", jobsCutoff),
      supabase.from("data_freshness_metrics").select("last_updated_at").limit(50),
    ]);

    throwIfAdminQueryError(employeesResult.error, "Failed to load employees");
    throwIfAdminQueryError(uploadsResult.error, "Failed to load uploads");
    throwIfAdminQueryError(uploadedBenchmarksResult.error, "Failed to load uploaded benchmarks");
    throwIfAdminQueryError(sourcesResult.error, "Failed to load ingestion sources");
    throwIfAdminQueryError(jobsResult.error, "Failed to load ingestion jobs");
    throwIfAdminQueryError(freshnessResult.error, "Failed to load freshness metrics");

    return NextResponse.json(
      buildExecutiveInsightsResponse({
        marketRows,
        workspaces: workspaces ?? [],
        employees: employeesResult.data ?? [],
        uploads: uploadsResult.data ?? [],
        uploadedBenchmarks: uploadedBenchmarksResult.data ?? [],
        sources: sourcesResult.data ?? [],
        jobs: jobsResult.data ?? [],
        freshnessRows: freshnessResult.data ?? [],
      }),
    );
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
