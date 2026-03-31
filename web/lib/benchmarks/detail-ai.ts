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

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
