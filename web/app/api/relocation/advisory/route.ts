import { NextResponse } from "next/server";
import { findMarketBenchmark } from "@/lib/benchmarks/platform-market";
import { getRelocationAiAdvisory, type RelocationAdvisoryRequest } from "@/lib/relocation/ai-advisory";
import { calculateRelocation } from "@/lib/relocation/calculator";
import { createServiceClient } from "@/lib/supabase/service";
import { getWorkspaceContext } from "@/lib/workspace-context";

type WorkspaceSettingsRow = {
  industry?: string | null;
  company_size?: string | null;
  target_percentile?: number | null;
  comp_split_basic_pct?: number | null;
  comp_split_housing_pct?: number | null;
  comp_split_transport_pct?: number | null;
  comp_split_other_pct?: number | null;
};

function isRelocationAdvisoryRequest(
  value: unknown,
): value is RelocationAdvisoryRequest {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<RelocationAdvisoryRequest>;

  return (
    typeof payload.homeCityId === "string" &&
    typeof payload.targetCityId === "string" &&
    typeof payload.baseSalary === "number" &&
    typeof payload.compApproach === "string" &&
    typeof payload.roleId === "string" &&
    typeof payload.levelId === "string" &&
    (payload.hybridCap === undefined || typeof payload.hybridCap === "number") &&
    (payload.rentOverride === undefined || typeof payload.rentOverride === "number")
  );
}

export async function POST(request: Request) {
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json(
      { error: wsContext.error },
      { status: wsContext.status },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | RelocationAdvisoryRequest
    | null;

  if (!isRelocationAdvisoryRequest(body)) {
    return NextResponse.json(
      { error: "Invalid relocation advisory payload" },
      { status: 400 },
    );
  }

  const deterministicResult = calculateRelocation(body);
  if (!deterministicResult) {
    return NextResponse.json(
      { error: "Unable to calculate relocation scenario" },
      { status: 400 },
    );
  }

  const serviceClient = createServiceClient();
  const { data: workspaceSettings } = await serviceClient
    .from("workspace_settings")
    .select(
      "industry, company_size, target_percentile, comp_split_basic_pct, comp_split_housing_pct, comp_split_transport_pct, comp_split_other_pct",
    )
    .eq("workspace_id", wsContext.context.workspace_id)
    .maybeSingle();

  const settings = (workspaceSettings as WorkspaceSettingsRow | null) ?? null;

  const benchmark = await findMarketBenchmark(
    serviceClient,
    body.roleId,
    body.targetCityId,
    body.levelId,
    {
      industry: settings?.industry ?? null,
      companySize: settings?.company_size ?? null,
    },
  );

  const aiAdvisory = await getRelocationAiAdvisory({
    request: body,
    deterministicResult,
    policyContext: {
      industry: settings?.industry ?? null,
      companySize: settings?.company_size ?? null,
      targetPercentile: settings?.target_percentile ?? null,
      compSplitBasicPct: settings?.comp_split_basic_pct ?? null,
      compSplitHousingPct: settings?.comp_split_housing_pct ?? null,
      compSplitTransportPct: settings?.comp_split_transport_pct ?? null,
      compSplitOtherPct: settings?.comp_split_other_pct ?? null,
    },
    benchmarkContext: benchmark
      ? {
          roleId: body.roleId,
          levelId: body.levelId,
          locationId: body.targetCityId,
          currency: benchmark.currency,
          p25: benchmark.p25,
          p50: benchmark.p50,
          p75: benchmark.p75,
          p90: benchmark.p90,
          sampleSize: benchmark.sample_size ?? 0,
          benchmarkSource: benchmark.source,
        }
      : null,
  });

  return NextResponse.json({
    deterministicResult,
    aiAdvisory,
    recommendedResult: aiAdvisory
      ? {
          ...deterministicResult,
          recommendedSalary: aiAdvisory.recommendedSalary,
          recommendedRange: aiAdvisory.recommendedRange,
        }
      : deterministicResult,
  });
}
