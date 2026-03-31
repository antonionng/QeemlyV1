import { NextResponse } from "next/server";
import { adminErrorResponse, adminRouteErrorResponse, throwIfAdminQueryError } from "@/lib/admin/api-client";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { invalidateMarketBenchmarkCache } from "@/lib/benchmarks/platform-market";
import { MARKET_PUBLISH_SUMMARY, MARKET_PUBLISH_TITLE } from "@/lib/benchmarks/market-publish";
import { refreshPlatformMarketPool } from "@/lib/benchmarks/platform-market-pool";
import { buildManualAdminBenchmarkPayload, type AdminResearchPdfRow } from "@/lib/admin/research/pilot-workflow";
import { createServiceClient } from "@/lib/supabase/service";

const UPSERT_CONFLICT_TARGET =
  "workspace_id,role_id,location_id,level_id,industry_key,company_size_key,source_key,valid_from";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) {
    return adminErrorResponse("Upload ID is required", { status: 400 });
  }

  const workspaceId = process.env.PLATFORM_WORKSPACE_ID;
  if (!workspaceId) {
    return NextResponse.json(
      {
        error: "Server misconfiguration",
        missing: ["PLATFORM_WORKSPACE_ID"],
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("admin_market_research_pdf_rows")
      .select(
        "id, upload_id, row_index, source_family, raw_text, role_title, function_name, employment_type, pay_period, currency, location_hint, level_hint, salary_2025_min, salary_2025_max, salary_2026_min, salary_2026_max, parse_confidence, review_status, review_notes",
      )
      .eq("upload_id", id)
      .order("row_index");
    throwIfAdminQueryError(error, "Failed to load PDF review rows");

    const approvedRows = ((data ?? []) as AdminResearchPdfRow[]).filter(
      (row) => row.review_status === "approved",
    );

    if (approvedRows.length === 0) {
      return adminErrorResponse("No approved review rows to ingest", {
        status: 400,
        detail: "Approve at least one extracted row before ingestion.",
      });
    }

    let ingestedCount = 0;
    const failures: string[] = [];
    const publishedRowIds: string[] = [];

    for (const row of approvedRows) {
      const payload = buildManualAdminBenchmarkPayload(row, workspaceId);
      if ("error" in payload) {
        if (payload.error) {
          failures.push(payload.error);
        }
        continue;
      }

      const { error: upsertError } = await supabase.from("salary_benchmarks").upsert(payload.ok, {
        onConflict: UPSERT_CONFLICT_TARGET,
      });
      if (upsertError) {
        failures.push(`${row.id}: ${upsertError.message}`);
        continue;
      }

      publishedRowIds.push(row.id);
      ingestedCount += 1;
    }

    const failedCount = failures.length;
    if (ingestedCount > 0) {
      const poolResult = await refreshPlatformMarketPool();
      invalidateMarketBenchmarkCache();

      const { error: publishEventError } = await supabase
        .from("market_publish_events")
        .insert({
          title: MARKET_PUBLISH_TITLE,
          summary: MARKET_PUBLISH_SUMMARY,
          row_count: poolResult.rowCount,
          tenant_visible: true,
          published_by: auth.user.id,
          published_at: new Date().toISOString(),
        });
      throwIfAdminQueryError(publishEventError, "Failed to record market publish event");

      for (const row of approvedRows) {
        if (!publishedRowIds.includes(row.id)) continue;

        const { error: rowUpdateError } = await supabase
          .from("admin_market_research_pdf_rows")
          .update({
            review_status: "published",
            review_notes: row.review_notes ?? "Published to the live market dataset.",
          })
          .eq("id", row.id);
        throwIfAdminQueryError(rowUpdateError, "Failed to update published review row");
      }
    }

    const nextUploadStatus = failedCount === 0 ? "published" : "reviewing";
    const nextUploadNotes =
      failedCount === 0
        ? `Published ${ingestedCount} Robert Walters rows to the live market dataset.`
        : `Published ${ingestedCount} Robert Walters rows to the live market dataset. ${failedCount} rows still need review.`;

    const { error: uploadUpdateError } = await supabase
      .from("admin_market_research_uploads")
      .update({
        ingestion_status: nextUploadStatus,
        ingestion_notes: nextUploadNotes,
      })
      .eq("id", id);
    throwIfAdminQueryError(uploadUpdateError, "Failed to update upload ingestion status");

    return NextResponse.json({
      ok: failedCount === 0,
      publishedCount: ingestedCount,
      failedCount,
      failures: failedCount > 0 ? failures : undefined,
    });
  } catch (error) {
    return adminRouteErrorResponse(error);
  }
}
