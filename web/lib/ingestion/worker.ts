/**
 * Ingestion worker - orchestrates fetch, normalize, DQ, upsert.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { normalizeBenchmarkRow, type NormalizedBenchmarkRow } from "./normalizer";
import { validateBenchmarkRow, buildDQReport, type BenchmarkRow } from "./data-quality";
import { getIngestorForSource } from "./adapters";
import { upsertBenchmarksFreshness } from "./freshness";
import {
  benchmarkRowToIndustrySignals,
  type IndustryMarketSignalInsert,
} from "./industry-normalization";

export type IngestionResult = {
  status: "success" | "partial" | "failed";
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message?: string;
  dq_report?: Record<string, unknown>;
};

export async function runIngestionForJob(
  _jobId: string,
  sourceId: string,
  workspaceId: string | null
): Promise<IngestionResult> {
  const supabase = createServiceClient();

  const { data: source } = await supabase
    .from("ingestion_sources")
    .select("slug")
    .eq("id", sourceId)
    .single();

  if (!source) {
    return {
      status: "failed",
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      error_message: `No ingestion source found for ${sourceId}`,
    };
  }

  const ingestor = getIngestorForSource(source.slug);

  if (!ingestor) {
    return {
      status: "failed",
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      error_message: `No ingestor for source ${sourceId}`,
    };
  }

  // Target workspace for benchmarks (platform-wide uses env or first workspace)
  const targetWorkspaceId =
    workspaceId ||
    process.env.PLATFORM_WORKSPACE_ID ||
    (await getFirstWorkspaceId(supabase));

  if (!targetWorkspaceId) {
    return {
      status: "failed",
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      error_message: "No target workspace; set PLATFORM_WORKSPACE_ID",
    };
  }

  const rawRows = await ingestor.fetch(sourceId);
  if (rawRows.length === 0) {
    return {
      status: "success",
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      dq_report: {
        totalRows: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        reasons: {},
        sampleErrors: [],
        timestamp: new Date().toISOString(),
      },
    };
  }

  const validated: Array<{ index: number; row: BenchmarkRow; error: string | null }> = [];
  const toUpsert: NormalizedBenchmarkRow[] = [];
  const normalizedSignals: IndustryMarketSignalInsert[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i] as Record<string, unknown>;
    const normalized = normalizeBenchmarkRow(raw);
    if ("error" in normalized) {
      validated.push({ index: i, row: raw as unknown as BenchmarkRow, error: normalized.error });
      continue;
    }
    const dq = validateBenchmarkRow(normalized.ok);
    if ("error" in dq) {
      validated.push({ index: i, row: normalized.ok as unknown as BenchmarkRow, error: dq.error });
      continue;
    }
    validated.push({ index: i, row: normalized.ok as unknown as BenchmarkRow, error: null });
    toUpsert.push(normalized.ok);
  }

  const dqReport = buildDQReport(validated);

  let succeeded = 0;
  const validFrom = new Date().toISOString().split("T")[0];

  for (const row of toUpsert) {
    const { error } = await supabase.from("salary_benchmarks").upsert(
      {
        workspace_id: targetWorkspaceId,
        role_id: row.roleId,
        location_id: row.locationId,
        level_id: row.levelId,
        currency: row.currency,
        p10: row.p10,
        p25: row.p25,
        p50: row.p50,
        p75: row.p75,
        p90: row.p90,
        sample_size: row.sampleSize,
        source: "market",
        confidence: row.mappingConfidence,
        valid_from: validFrom,
        valid_to: null,
      },
      {
        onConflict: "workspace_id,role_id,location_id,level_id,valid_from",
      }
    );
    if (!error) {
      succeeded++;
      normalizedSignals.push(
        ...benchmarkRowToIndustrySignals({
          workspaceId: targetWorkspaceId,
          sourceSlug: source.slug,
          row,
          periodStart: validFrom,
        })
      );
    }
  }

  let signalUpsertError: string | null = null;
  if (normalizedSignals.length > 0) {
    const { error } = await supabase
      .from("industry_market_signals")
      .upsert(normalizedSignals, {
        onConflict:
          "workspace_id,source_slug,domain,industry,metric_key,period_start,role_id,location_id,level_id",
      });
    if (error) {
      signalUpsertError = error.message;
    }
  }

  const failed = dqReport.failed;
  const status =
    failed === validated.length ? "failed" : failed > 0 ? "partial" : "success";

  if (succeeded > 0) {
    await upsertBenchmarksFreshness(targetWorkspaceId, succeeded, sourceId);
  }

  return {
    status,
    records_created: succeeded,
    records_updated: 0,
    records_failed: failed,
    error_message:
      failed > 0
        ? `DQ failed for ${failed} rows${signalUpsertError ? `; signal sync: ${signalUpsertError}` : ""}`
        : signalUpsertError || undefined,
    dq_report: dqReport as unknown as Record<string, unknown>,
  };
}

async function getFirstWorkspaceId(
  supabase: ReturnType<typeof createServiceClient>
): Promise<string | null> {
  const { data } = await supabase.from("workspaces").select("id").limit(1).single();
  return data?.id ?? null;
}
