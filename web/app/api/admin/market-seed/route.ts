import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { invalidateMarketBenchmarkCache } from "@/lib/benchmarks/platform-market";
import {
  getMissingBenchmarkCoverageGroups,
  getMarketSourceCoverageSummary,
  getPublishedBenchmarkCoverageSummary,
  getPublishedContributionMixSummary,
  getTopMissingBenchmarkTriples,
} from "@/lib/benchmarks/coverage-contract";
import { refreshPlatformMarketPool } from "@/lib/benchmarks/platform-market-pool";
import { validateRuntimeEnv } from "@/lib/config/env";
import { completeJob, failJobForRetry } from "@/lib/ingestion/job-runner";
import { isSourceAllowedForIngestion, type IngestionSource } from "@/lib/ingestion/source-registry";
import { runIngestionForJob } from "@/lib/ingestion/worker";
import {
  getDefaultSharedMarketSourceSlugs,
  normalizeRequestedSourceSlugs,
} from "@/lib/seed/shared-market";
import { createServiceClient } from "@/lib/supabase/service";

export const maxDuration = 60;

type RouteBody = {
  sourceSlugs?: string[];
  skipIngestion?: boolean;
};

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const envCheck = validateRuntimeEnv(process.env, { requirePlatformWorkspace: true });
  if (!envCheck.ok) {
    return NextResponse.json(
      {
        error: "Server misconfiguration",
        missing: envCheck.missing,
      },
      { status: 503 },
    );
  }

  try {
    const body = ((await request.json().catch(() => ({}))) as RouteBody | undefined) ?? {};

    const supabase = createServiceClient();
    const { data: sources, error: sourcesError } = await supabase
      .from("ingestion_sources")
      .select(
        "id, slug, name, enabled, approved_for_commercial, needs_review, category, regions, update_cadence, expected_fields, config, description, license_url, terms_summary, created_at, updated_at",
      );

    if (sourcesError) {
      return NextResponse.json({ error: sourcesError.message }, { status: 500 });
    }

    const approvedSources = ((sources ?? []) as IngestionSource[]).filter(isSourceAllowedForIngestion);
    const effectiveSourceSlugs =
      normalizeRequestedSourceSlugs(body.sourceSlugs) ?? getDefaultSharedMarketSourceSlugs(approvedSources);
    const selectedSources = approvedSources.filter((source) => effectiveSourceSlugs.includes(source.slug));

    if (selectedSources.length === 0 && !body.skipIngestion) {
      return NextResponse.json(
        { error: "No approved ingestion sources matched the requested slugs." },
        { status: 400 },
      );
    }

    const ingested: Array<{
      jobId: string;
      slug: string;
      status: "success" | "partial" | "failed";
      recordsCreated: number;
      recordsFailed: number;
      funnel?: {
        outcome: "fetch_empty" | "normalize_empty" | "dq_empty" | "partial_success" | "success";
        fetchedRows: number;
        normalizedRows: number;
        normalizeFailedRows: number;
        dqPassedRows: number;
        dqFailedRows: number;
        upsertedRows: number;
        upsertFailedRows: number;
      };
    }> = [];

    if (!body.skipIngestion) {
      for (const source of selectedSources) {
        const { data: job, error: jobErr } = await supabase
          .from("ingestion_jobs")
          .insert({
            source_id: source.id,
            workspace_id: null,
            status: "running",
            job_type: "full",
            started_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (jobErr || !job) {
          return NextResponse.json(
            { error: jobErr?.message ?? `Failed to create ingestion job for ${source.slug}` },
            { status: 500 },
          );
        }

        try {
          const result = await runIngestionForJob(job.id, source.id, process.env.PLATFORM_WORKSPACE_ID!);
          await completeJob(job.id, result);
          ingested.push({
            jobId: job.id,
            slug: source.slug,
            status: result.status,
            recordsCreated: result.records_created,
            recordsFailed: result.records_failed,
            funnel: result.funnel,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          await failJobForRetry(job.id, message, 1, 3);
          return NextResponse.json(
            {
              error: `Ingestion failed for ${source.slug}`,
              message,
              failedJobId: job.id,
            },
            { status: 500 },
          );
        }
      }
    }

    const poolResult = await refreshPlatformMarketPool();
    invalidateMarketBenchmarkCache();
    const coverage = await getPublishedBenchmarkCoverageSummary();
    const contributionMix = await getPublishedContributionMixSummary();
    const missingCoverageGroups = await getMissingBenchmarkCoverageGroups();
    const topMissingExactTriples = await getTopMissingBenchmarkTriples();
    const sourceCoverage = await getMarketSourceCoverageSummary(
      selectedSources.map((source) => source.slug),
    );
    const sourceCoverageBySlug = new Map(
      sourceCoverage.map((source) => [source.sourceSlug, source]),
    );
    const sourceDiagnostics = ingested.map((source) => {
      const coverageForSource = sourceCoverageBySlug.get(source.slug);
      return {
        sourceSlug: source.slug,
        rawExactTriples: coverageForSource?.exactTriples ?? 0,
        coveragePercent: coverageForSource?.coveragePercent ?? 0,
        outcome: source.funnel?.outcome ?? "fetch_empty",
        fetchedRows: source.funnel?.fetchedRows ?? 0,
        normalizedRows: source.funnel?.normalizedRows ?? 0,
        normalizeFailedRows: source.funnel?.normalizeFailedRows ?? 0,
        dqPassedRows: source.funnel?.dqPassedRows ?? 0,
        dqFailedRows: source.funnel?.dqFailedRows ?? 0,
        upsertedRows: source.funnel?.upsertedRows ?? 0,
        upsertFailedRows: source.funnel?.upsertFailedRows ?? 0,
      };
    });

    return NextResponse.json({
      ok: true,
      ingested,
      selectedSourceSlugs: selectedSources.map((source) => source.slug),
      poolRows: poolResult.rowCount,
      coverage,
      sourceCoverage,
      sourceDiagnostics,
      contributionMix,
      missingCoverageGroups,
      topMissingExactTriples,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed shared market data" },
      { status: 500 },
    );
  }
}
