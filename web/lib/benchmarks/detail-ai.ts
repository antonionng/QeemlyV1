import type { SalaryBenchmark } from "@/lib/dashboard/dummy-data";

export type BenchmarkDetailAiBreakdown = {
  basicSalaryPct: number;
  housingPct: number;
  transportPct: number;
  otherAllowancesPct: number;
};

export type BenchmarkDetailAiLevelBand = {
  levelId: string;
  levelName: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
};

export type BenchmarkDetailAiComparisonPoint = {
  id: string;
  label: string;
  median: number;
  currency: string | null;
  sampleSize: number | null;
  yoyChange: number | null;
  relativeValue: number | null;
};

export type BenchmarkDetailAiTrendPoint = {
  month: string;
  p25: number;
  p50: number;
  p75: number;
};

export type BenchmarkDetailAiSection = {
  summary: string;
  action: string | null;
  packageBreakdown?: BenchmarkDetailAiBreakdown | null;
  compensationMix?: BenchmarkDetailAiBreakdown | null;
  levelBands?: BenchmarkDetailAiLevelBand[] | null;
  comparisonPoints?: BenchmarkDetailAiComparisonPoint[] | null;
  trendPoints?: BenchmarkDetailAiTrendPoint[] | null;
};

export type BenchmarkDetailAiBriefing = {
  executiveBriefing: string;
  hiringSignal: string;
  negotiationPosture: string;
  views: {
    levelTable: BenchmarkDetailAiSection;
    aiInsights: BenchmarkDetailAiSection;
    trend: BenchmarkDetailAiSection;
    salaryBreakdown: BenchmarkDetailAiSection;
    industry: BenchmarkDetailAiSection;
    companySize: BenchmarkDetailAiSection;
    geoComparison: BenchmarkDetailAiSection;
    compMix: BenchmarkDetailAiSection;
    offerBuilder: BenchmarkDetailAiSection;
  };
};

export type BenchmarkDetailSupportStatus = "idle" | "loading" | "ready" | "unavailable";

export type BenchmarkDetailSupportData = {
  levelTableBenchmarks: Record<string, SalaryBenchmark>;
  offerBuilderBenchmarks: Record<string, SalaryBenchmark>;
  industryBenchmarks: Record<string, SalaryBenchmark>;
  industryFallbackBenchmark: SalaryBenchmark | null;
  companySizeBenchmarks: Record<string, SalaryBenchmark>;
  companySizeFallbackBenchmark: SalaryBenchmark | null;
  geoBenchmarksByLocation: Record<string, SalaryBenchmark>;
};

export function normalizeAiBreakdown(
  breakdown: BenchmarkDetailAiBreakdown | null | undefined,
): BenchmarkDetailAiBreakdown | null {
  if (!breakdown) return null;

  const basicSalaryPct = clampPercentage(breakdown.basicSalaryPct);
  const housingPct = clampPercentage(breakdown.housingPct);
  const transportPct = clampPercentage(breakdown.transportPct);
  const consumed = basicSalaryPct + housingPct + transportPct;
  const otherAllowancesPct = clampPercentage(100 - consumed);

  return {
    basicSalaryPct,
    housingPct,
    transportPct,
    otherAllowancesPct,
  };
}

export function isBenchmarkDetailSurfaceReady(input: {
  aiDetailBriefing: BenchmarkDetailAiBriefing | null | undefined;
  aiDetailBriefingStatus: BenchmarkDetailSupportStatus | null | undefined;
  detailSupportData: BenchmarkDetailSupportData | null | undefined;
  detailSupportStatus: BenchmarkDetailSupportStatus | null | undefined;
}): boolean {
  const { aiDetailBriefing, aiDetailBriefingStatus, detailSupportData, detailSupportStatus } = input;

  if (aiDetailBriefingStatus !== "ready" || !aiDetailBriefing) {
    return false;
  }

  if (detailSupportStatus !== "ready" || !detailSupportData) {
    return false;
  }

  const hasBreakdown = Boolean(
    normalizeAiBreakdown(
      aiDetailBriefing.views.salaryBreakdown.packageBreakdown
        ?? aiDetailBriefing.views.offerBuilder.packageBreakdown
        ?? aiDetailBriefing.views.compMix.compensationMix
        ?? null,
    ),
  );
  const hasLevelTableData =
    (aiDetailBriefing.views.levelTable.levelBands?.length ?? 0) > 0 ||
    Object.keys(detailSupportData.levelTableBenchmarks).length > 0;
  const hasOfferBuilderData =
    (aiDetailBriefing.views.offerBuilder.levelBands?.length ?? 0) > 0 ||
    (aiDetailBriefing.views.levelTable.levelBands?.length ?? 0) > 0 ||
    Object.keys(detailSupportData.offerBuilderBenchmarks).length > 0;
  const hasIndustryData =
    (aiDetailBriefing.views.industry.comparisonPoints?.length ?? 0) > 0 ||
    Object.keys(detailSupportData.industryBenchmarks).length > 0 ||
    Boolean(detailSupportData.industryFallbackBenchmark);
  const hasCompanySizeData =
    (aiDetailBriefing.views.companySize.comparisonPoints?.length ?? 0) > 0 ||
    Object.keys(detailSupportData.companySizeBenchmarks).length > 0 ||
    Boolean(detailSupportData.companySizeFallbackBenchmark);
  const hasGeoData =
    (aiDetailBriefing.views.geoComparison.comparisonPoints?.length ?? 0) > 0 ||
    Object.keys(detailSupportData.geoBenchmarksByLocation).length > 0;

  return (
    hasBreakdown &&
    hasLevelTableData &&
    hasOfferBuilderData &&
    hasIndustryData &&
    hasCompanySizeData &&
    hasGeoData
  );
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
