import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { invalidateMarketBenchmarkCache } from "@/lib/benchmarks/platform-market";
import { getPublishedBenchmarkCoverageSummary } from "@/lib/benchmarks/coverage-contract";
import { refreshPlatformMarketPool } from "@/lib/benchmarks/platform-market-pool";
import {
  MARKET_PUBLISH_SUMMARY,
  MARKET_PUBLISH_TITLE,
  mapMarketPublishEventRow,
} from "@/lib/benchmarks/market-publish";
import { createServiceClient } from "@/lib/supabase/service";

function buildCoverageDetail(coverage: {
  missingExactTriples: number;
  supportedExactTriples: number;
  missingExamples: string[];
}) {
  const exampleSuffix =
    coverage.missingExamples.length > 0
      ? ` Examples: ${coverage.missingExamples.slice(0, 3).join(", ")}.`
      : "";
  return `${coverage.missingExactTriples} of ${coverage.supportedExactTriples} exact benchmark rows are still missing.${exampleSuffix}`;
}

export async function POST() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const poolResult = await refreshPlatformMarketPool();
    invalidateMarketBenchmarkCache();
    const coverage = await getPublishedBenchmarkCoverageSummary();

    if (coverage.missingExactTriples > 0) {
      return NextResponse.json(
        {
          error: "Cannot publish market dataset until exact benchmark coverage is complete.",
          detail: buildCoverageDetail(coverage),
          coverage,
        },
        { status: 409 },
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("market_publish_events")
      .insert({
        title: MARKET_PUBLISH_TITLE,
        summary: MARKET_PUBLISH_SUMMARY,
        row_count: poolResult.rowCount,
        tenant_visible: true,
        published_by: auth.user.id,
        published_at: new Date().toISOString(),
      })
      .select("id, title, summary, row_count, published_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to record market publish event" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      event: mapMarketPublishEventRow(data as Record<string, unknown>),
      coverage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish market dataset" },
      { status: 500 },
    );
  }
}
