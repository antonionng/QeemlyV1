/**
 * Deterministic Detail Surface Contract
 *
 * A server-owned response contract for the benchmark drilldown screen.
 * AI provides narrative content; the adapter normalizes, validates, and
 * defaults every module so the UI always receives an exact, stable shape.
 */

import type {
  BenchmarkDetailAiBriefing,
  BenchmarkDetailAiBreakdown,
  BenchmarkDetailAiSection,
  BenchmarkDetailSupportData,
} from "./detail-ai";
import { normalizeAiBreakdown } from "./detail-ai";
import type { SalaryBenchmark, Location } from "@/lib/dashboard/dummy-data";
import { LEVELS, LOCATIONS } from "@/lib/dashboard/dummy-data";

// ---------------------------------------------------------------------------
// Contract primitives
// ---------------------------------------------------------------------------

export type ModuleStatus = "ready" | "empty" | "error";
export type ModuleSource = "ai" | "market" | "derived" | "mixed";

export type DetailModuleNarrative = {
  summary: string;
  action: string | null;
};

export type NormalizedBreakdown = {
  basicSalaryPct: number;
  housingPct: number;
  transportPct: number;
  otherAllowancesPct: number;
};

// ---------------------------------------------------------------------------
// Per-module data shapes
// ---------------------------------------------------------------------------

export type LevelTableRow = {
  levelId: string;
  levelName: string;
  p25: number;
  p50: number;
  p75: number;
  p85: number;
  p90: number;
  source: "ai" | "market";
};

export type LevelTableModuleData = {
  rows: LevelTableRow[];
  breakdown: NormalizedBreakdown | null;
};

export type ComparisonRow = {
  id: string;
  label: string;
  median: number;
  currency: string | null;
  sampleSize: number | null;
  yoyChange: number | null;
  relativeValue: number | null;
  isHighlighted: boolean;
  source: "ai" | "market";
};

export type IndustryModuleData = {
  rows: ComparisonRow[];
  fallbackLabel: string | null;
};

export type CompanySizeModuleData = {
  rows: ComparisonRow[];
  fallbackLabel: string | null;
};

export type TrendPoint = {
  month: string;
  p25: number;
  p50: number;
  p75: number;
};

export type TrendModuleData = {
  points: TrendPoint[];
  periodChange: number | null;
  currentMedian: number | null;
  startMedian: number | null;
};

export type GeoComparisonRow = {
  locationId: string;
  city: string;
  country: string;
  flag: string;
  median: number;
  currency: string;
  yoyChange: number | null;
  sampleSize: number | null;
  relativeValue: number;
  isSelected: boolean;
  source: "ai" | "market";
};

export type GeoModuleData = {
  rows: GeoComparisonRow[];
};

export type CompMixModuleData = {
  breakdown: NormalizedBreakdown;
};

export type SalaryBreakdownModuleData = {
  breakdown: NormalizedBreakdown;
};

export type AiInsightsModuleData = {
  executiveBriefing: string;
  hiringSignal: string;
  negotiationPosture: string;
};

export type OfferBuilderModuleData = {
  breakdown: NormalizedBreakdown | null;
  adjacentLevels: LevelTableRow[];
};

// ---------------------------------------------------------------------------
// Module wrapper
// ---------------------------------------------------------------------------

export type DetailModule<T> = {
  status: ModuleStatus;
  source: ModuleSource;
  title: string;
  subtitle: string;
  data: T;
  narrative: DetailModuleNarrative;
  message: string | null;
};

// ---------------------------------------------------------------------------
// Full contract
// ---------------------------------------------------------------------------

export type DetailSurfaceContract = {
  summary: {
    executiveBriefing: string | null;
    hiringSignal: string | null;
    negotiationPosture: string | null;
  };
  modules: {
    levelTable: DetailModule<LevelTableModuleData>;
    industry: DetailModule<IndustryModuleData>;
    companySize: DetailModule<CompanySizeModuleData>;
    trend: DetailModule<TrendModuleData>;
    geoComparison: DetailModule<GeoModuleData>;
    compMix: DetailModule<CompMixModuleData>;
    salaryBreakdown: DetailModule<SalaryBreakdownModuleData>;
    aiInsights: DetailModule<AiInsightsModuleData>;
    offerBuilder: DetailModule<OfferBuilderModuleData>;
  };
};

// ---------------------------------------------------------------------------
// Adapter input
// ---------------------------------------------------------------------------

export type DetailSurfaceInput = {
  aiBriefing: BenchmarkDetailAiBriefing | null;
  supportData: BenchmarkDetailSupportData | null;
  benchmark: SalaryBenchmark;
  roleTitle: string;
  levelName: string;
  location: Location;
  industry: string | null;
  companySize: string | null;
};

// ---------------------------------------------------------------------------
// Adapter: builds the deterministic contract
// ---------------------------------------------------------------------------

export function buildDetailSurface(input: DetailSurfaceInput): DetailSurfaceContract {
  const { aiBriefing, supportData, benchmark, roleTitle, levelName, location } = input;

  return {
    summary: {
      executiveBriefing: aiBriefing?.executiveBriefing ?? null,
      hiringSignal: aiBriefing?.hiringSignal ?? null,
      negotiationPosture: aiBriefing?.negotiationPosture ?? null,
    },
    modules: {
      levelTable: buildLevelTableModule(input),
      industry: buildIndustryModule(input),
      companySize: buildCompanySizeModule(input),
      trend: buildTrendModule(input),
      geoComparison: buildGeoModule(input),
      compMix: buildCompMixModule(input),
      salaryBreakdown: buildSalaryBreakdownModule(input),
      aiInsights: buildAiInsightsModule(input),
      offerBuilder: buildOfferBuilderModule(input),
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function narrativeFrom(section: BenchmarkDetailAiSection | undefined): DetailModuleNarrative {
  return {
    summary: section?.summary ?? "",
    action: section?.action ?? null,
  };
}

const EMPTY_NARRATIVE: DetailModuleNarrative = { summary: "", action: null };

const EMPTY_BREAKDOWN: NormalizedBreakdown = {
  basicSalaryPct: 0,
  housingPct: 0,
  transportPct: 0,
  otherAllowancesPct: 0,
};

function resolveBreakdown(
  aiBriefing: BenchmarkDetailAiBriefing | null,
): NormalizedBreakdown | null {
  if (!aiBriefing) return null;
  return (
    normalizeAiBreakdown(aiBriefing.views.salaryBreakdown?.packageBreakdown) ??
    normalizeAiBreakdown(aiBriefing.views.offerBuilder?.packageBreakdown) ??
    normalizeAiBreakdown(aiBriefing.views.compMix?.compensationMix) ??
    null
  );
}

function resolveCompMixBreakdown(
  aiBriefing: BenchmarkDetailAiBriefing | null,
): NormalizedBreakdown | null {
  if (!aiBriefing) return null;
  return (
    normalizeAiBreakdown(aiBriefing.views.compMix?.compensationMix) ??
    normalizeAiBreakdown(aiBriefing.views.offerBuilder?.packageBreakdown) ??
    null
  );
}

function deriveP85(p75: number, p90: number): number {
  return Math.round((p75 + p90) / 2);
}

function benchmarkToLevelRow(levelId: string, b: SalaryBenchmark): LevelTableRow {
  const level = LEVELS.find((l) => l.id === levelId);
  return {
    levelId,
    levelName: level?.name ?? levelId,
    p25: b.percentiles.p25,
    p50: b.percentiles.p50,
    p75: b.percentiles.p75,
    p85: deriveP85(b.percentiles.p75, b.percentiles.p90),
    p90: b.percentiles.p90,
    source: "market",
  };
}

// ---------------------------------------------------------------------------
// Module builders
// ---------------------------------------------------------------------------

function buildLevelTableModule(input: DetailSurfaceInput): DetailModule<LevelTableModuleData> {
  const { aiBriefing, supportData, roleTitle, levelName } = input;
  const aiView = aiBriefing?.views.levelTable;
  const aiBands = aiView?.levelBands;

  let rows: LevelTableRow[] = [];
  let source: ModuleSource = "derived";

  if (aiBands && aiBands.length > 0) {
    rows = aiBands.map((band) => ({
      levelId: band.levelId,
      levelName: band.levelName,
      p25: band.p25,
      p50: band.p50,
      p75: band.p75,
      p85: deriveP85(band.p75, band.p90),
      p90: band.p90,
      source: "ai" as const,
    }));
    source = "ai";
  } else if (supportData && Object.keys(supportData.levelTableBenchmarks).length > 0) {
    rows = Object.entries(supportData.levelTableBenchmarks).map(
      ([levelId, b]) => benchmarkToLevelRow(levelId, b),
    );
    source = "market";
  }

  const breakdown = resolveBreakdown(aiBriefing);

  return {
    status: rows.length > 0 ? "ready" : "empty",
    source,
    title: "Level Data",
    subtitle: `${roleTitle} - ${levelName}`,
    data: { rows, breakdown },
    narrative: narrativeFrom(aiView),
    message: rows.length === 0 ? "No level data available for this role." : null,
  };
}

function buildIndustryModule(input: DetailSurfaceInput): DetailModule<IndustryModuleData> {
  const { aiBriefing, supportData, roleTitle, location, industry } = input;
  const aiView = aiBriefing?.views.industry;
  const aiPoints = aiView?.comparisonPoints;

  let rows: ComparisonRow[] = [];
  let fallbackLabel: string | null = null;
  let source: ModuleSource = "derived";

  if (aiPoints && aiPoints.length > 0) {
    rows = aiPoints.map((pt) => ({
      id: pt.id,
      label: pt.label,
      median: pt.median,
      currency: pt.currency,
      sampleSize: pt.sampleSize,
      yoyChange: pt.yoyChange,
      relativeValue: pt.relativeValue,
      isHighlighted: industry
        ? pt.id === industry || pt.label === industry
        : false,
      source: "ai" as const,
    }));
    source = "ai";
  } else if (supportData) {
    const entries = Object.entries(supportData.industryBenchmarks);
    rows = entries.map(([ind, b]) => ({
      id: ind,
      label: ind,
      median: b.percentiles.p50,
      currency: b.currency,
      sampleSize: b.sampleSize > 0 ? b.sampleSize : null,
      yoyChange: b.yoyChange || null,
      relativeValue: null,
      isHighlighted: ind === industry,
      source: "market" as const,
    }));
    if (rows.length === 0 && supportData.industryFallbackBenchmark) {
      const fb = supportData.industryFallbackBenchmark;
      rows = [
        {
          id: "broader-market",
          label: "Broader market",
          median: fb.percentiles.p50,
          currency: fb.currency,
          sampleSize: fb.sampleSize > 0 ? fb.sampleSize : null,
          yoyChange: fb.yoyChange || null,
          relativeValue: null,
          isHighlighted: false,
          source: "market" as const,
        },
      ];
      fallbackLabel = "Broader market";
    }
    source = "market";
  }

  return {
    status: rows.length > 0 ? "ready" : "empty",
    source,
    title: "Industry Breakdown",
    subtitle: `${roleTitle} in ${location.city}`,
    data: { rows, fallbackLabel },
    narrative: narrativeFrom(aiView),
    message: rows.length === 0 ? "No industry comparison data available." : null,
  };
}

function buildCompanySizeModule(input: DetailSurfaceInput): DetailModule<CompanySizeModuleData> {
  const { aiBriefing, supportData, roleTitle, location, companySize } = input;
  const aiView = aiBriefing?.views.companySize;
  const aiPoints = aiView?.comparisonPoints;

  let rows: ComparisonRow[] = [];
  let fallbackLabel: string | null = null;
  let source: ModuleSource = "derived";

  if (aiPoints && aiPoints.length > 0) {
    rows = aiPoints.map((pt) => ({
      id: pt.id,
      label: pt.label,
      median: pt.median,
      currency: pt.currency,
      sampleSize: pt.sampleSize,
      yoyChange: pt.yoyChange,
      relativeValue: pt.relativeValue,
      isHighlighted: companySize
        ? pt.id === companySize || pt.label === companySize
        : false,
      source: "ai" as const,
    }));
    source = "ai";
  } else if (supportData) {
    const entries = Object.entries(supportData.companySizeBenchmarks);
    rows = entries.map(([size, b]) => ({
      id: size,
      label: size,
      median: b.percentiles.p50,
      currency: b.currency,
      sampleSize: b.sampleSize > 0 ? b.sampleSize : null,
      yoyChange: b.yoyChange || null,
      relativeValue: null,
      isHighlighted: size === companySize,
      source: "market" as const,
    }));
    if (rows.length === 0 && supportData.companySizeFallbackBenchmark) {
      const fb = supportData.companySizeFallbackBenchmark;
      rows = [
        {
          id: "broader-market",
          label: "Broader market",
          median: fb.percentiles.p50,
          currency: fb.currency,
          sampleSize: fb.sampleSize > 0 ? fb.sampleSize : null,
          yoyChange: fb.yoyChange || null,
          relativeValue: null,
          isHighlighted: false,
          source: "market" as const,
        },
      ];
      fallbackLabel = "Broader market";
    }
    source = "market";
  }

  return {
    status: rows.length > 0 ? "ready" : "empty",
    source,
    title: "Top Company Sizes",
    subtitle: `${roleTitle} in ${location.city}`,
    data: { rows, fallbackLabel },
    narrative: narrativeFrom(aiView),
    message: rows.length === 0 ? "No company size comparison data available." : null,
  };
}

function buildTrendModule(input: DetailSurfaceInput): DetailModule<TrendModuleData> {
  const { aiBriefing, benchmark, roleTitle } = input;
  const aiView = aiBriefing?.views.trend;
  const aiTrendPoints = aiView?.trendPoints;

  let points: TrendPoint[] = [];
  let source: ModuleSource = "derived";

  if (aiTrendPoints && aiTrendPoints.length >= 2) {
    points = aiTrendPoints.map((tp) => ({
      month: tp.month,
      p25: tp.p25,
      p50: tp.p50,
      p75: tp.p75,
    }));
    source = "ai";
  } else if (benchmark.trend && benchmark.trend.length >= 2) {
    points = benchmark.trend.map((tp) => ({
      month: tp.month,
      p25: tp.p25,
      p50: tp.p50,
      p75: tp.p75,
    }));
    source = "market";
  } else {
    points = buildFallbackTrendPoints(benchmark);
    source = "derived";
  }

  const currentMedian = points.length > 0 ? points[points.length - 1].p50 : null;
  const startMedian = points.length > 0 ? points[0].p50 : null;
  const periodChange =
    currentMedian !== null && startMedian !== null && startMedian > 0
      ? Math.round(((currentMedian - startMedian) / startMedian) * 1000) / 10
      : null;

  return {
    status: points.length >= 2 ? "ready" : "empty",
    source,
    title: "Salary Trend",
    subtitle: roleTitle,
    data: { points, periodChange, currentMedian, startMedian },
    narrative: narrativeFrom(aiView),
    message: points.length < 2 ? "Insufficient trend data for this benchmark." : null,
  };
}

function buildFallbackTrendPoints(benchmark: SalaryBenchmark): TrendPoint[] {
  const { p25, p50, p75 } = benchmark.percentiles;
  if (!p50) return [];

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const now = new Date();
  const yoyFactor = benchmark.yoyChange ? benchmark.yoyChange / 100 : 0;
  const momFactor = benchmark.momChange
    ? benchmark.momChange / 100
    : yoyFactor / 12;

  return Array.from({ length: 12 }, (_, i) => {
    const monthsAgo = 11 - i;
    const growthFactor = 1 - momFactor * monthsAgo;
    const d = new Date(now);
    d.setMonth(d.getMonth() - monthsAgo);
    return {
      month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      p25: Math.round(p25 * growthFactor),
      p50: Math.round(p50 * growthFactor),
      p75: Math.round(p75 * growthFactor),
    };
  });
}

function buildGeoModule(input: DetailSurfaceInput): DetailModule<GeoModuleData> {
  const { aiBriefing, supportData, roleTitle, location } = input;
  const aiView = aiBriefing?.views.geoComparison;
  const aiPoints = aiView?.comparisonPoints;

  let rows: GeoComparisonRow[] = [];
  let source: ModuleSource = "derived";

  if (aiPoints && aiPoints.length > 0) {
    rows = aiPoints.reduce<GeoComparisonRow[]>((acc, pt) => {
        const loc = LOCATIONS.find((l) => l.id === pt.id);
        if (!loc) return acc;
        acc.push({
          locationId: pt.id,
          city: loc.city,
          country: loc.country,
          flag: loc.flag,
          median: pt.median,
          currency: pt.currency ?? loc.currency,
          yoyChange: pt.yoyChange ?? null,
          sampleSize: pt.sampleSize ?? null,
          relativeValue: pt.relativeValue ?? pt.median,
          isSelected: pt.id === location.id,
          source: "ai" as const,
        });
        return acc;
      }, []);
    source = "ai";
  } else if (supportData && Object.keys(supportData.geoBenchmarksByLocation).length > 0) {
    const maxMedian = Math.max(
      ...Object.values(supportData.geoBenchmarksByLocation).map((b) => b.percentiles.p50),
    );
    rows = Object.entries(supportData.geoBenchmarksByLocation).reduce<GeoComparisonRow[]>(
      (acc, [locId, b]) => {
        const loc = LOCATIONS.find((l) => l.id === locId);
        if (!loc) return acc;
        acc.push({
          locationId: locId,
          city: loc.city,
          country: loc.country,
          flag: loc.flag,
          median: b.percentiles.p50,
          currency: b.currency,
          yoyChange: b.yoyChange || null,
          sampleSize: b.sampleSize > 0 ? b.sampleSize : null,
          relativeValue: maxMedian > 0 ? b.percentiles.p50 : 0,
          isSelected: locId === location.id,
          source: "market" as const,
        });
        return acc;
      },
      [],
    );
    source = "market";
  }

  return {
    status: rows.length > 0 ? "ready" : "empty",
    source,
    title: "GCC Comparison",
    subtitle: `${roleTitle} across locations`,
    data: { rows },
    narrative: narrativeFrom(aiView),
    message: rows.length === 0 ? "No geographic comparison data available." : null,
  };
}

function buildCompMixModule(input: DetailSurfaceInput): DetailModule<CompMixModuleData> {
  const { aiBriefing, roleTitle } = input;
  const aiView = aiBriefing?.views.compMix;
  const breakdown = resolveCompMixBreakdown(aiBriefing);

  if (breakdown) {
    return {
      status: "ready",
      source: "ai",
      title: "Compensation Mix",
      subtitle: roleTitle,
      data: { breakdown },
      narrative: narrativeFrom(aiView),
      message: null,
    };
  }

  return {
    status: "empty",
    source: "derived",
    title: "Compensation Mix",
    subtitle: roleTitle,
    data: { breakdown: EMPTY_BREAKDOWN },
    narrative: narrativeFrom(aiView),
    message: "Compensation mix data is not available for this benchmark.",
  };
}

function buildSalaryBreakdownModule(input: DetailSurfaceInput): DetailModule<SalaryBreakdownModuleData> {
  const { aiBriefing, roleTitle, levelName } = input;
  const aiView = aiBriefing?.views.salaryBreakdown;
  const breakdown = resolveBreakdown(aiBriefing);

  if (breakdown) {
    return {
      status: "ready",
      source: "ai",
      title: "Salary Breakdown",
      subtitle: `${roleTitle} - ${levelName}`,
      data: { breakdown },
      narrative: narrativeFrom(aiView),
      message: null,
    };
  }

  return {
    status: "empty",
    source: "derived",
    title: "Salary Breakdown",
    subtitle: `${roleTitle} - ${levelName}`,
    data: { breakdown: EMPTY_BREAKDOWN },
    narrative: narrativeFrom(aiView),
    message: "Salary breakdown data is not available for this benchmark.",
  };
}

function buildAiInsightsModule(input: DetailSurfaceInput): DetailModule<AiInsightsModuleData> {
  const { aiBriefing, roleTitle } = input;
  const aiView = aiBriefing?.views.aiInsights;

  if (
    aiBriefing?.executiveBriefing ||
    aiBriefing?.hiringSignal ||
    aiBriefing?.negotiationPosture
  ) {
    return {
      status: "ready",
      source: "ai",
      title: "AI Insights",
      subtitle: roleTitle,
      data: {
        executiveBriefing: aiBriefing.executiveBriefing ?? "",
        hiringSignal: aiBriefing.hiringSignal ?? "",
        negotiationPosture: aiBriefing.negotiationPosture ?? "",
      },
      narrative: narrativeFrom(aiView),
      message: null,
    };
  }

  return {
    status: "empty",
    source: "derived",
    title: "AI Insights",
    subtitle: roleTitle,
    data: { executiveBriefing: "", hiringSignal: "", negotiationPosture: "" },
    narrative: narrativeFrom(aiView),
    message: "AI insights are not available for this benchmark.",
  };
}

function buildOfferBuilderModule(input: DetailSurfaceInput): DetailModule<OfferBuilderModuleData> {
  const { aiBriefing, supportData, benchmark, roleTitle, levelName } = input;
  const aiView = aiBriefing?.views.offerBuilder;
  const aiLevelBands =
    aiView?.levelBands ?? aiBriefing?.views.levelTable?.levelBands ?? null;

  const breakdown =
    normalizeAiBreakdown(
      aiBriefing?.views.offerBuilder?.packageBreakdown as BenchmarkDetailAiBreakdown | null | undefined,
    ) ??
    resolveCompMixBreakdown(aiBriefing);

  let adjacentLevels: LevelTableRow[] = [];
  let source: ModuleSource = "derived";

  if (aiLevelBands && aiLevelBands.length > 0) {
    adjacentLevels = aiLevelBands.map((band) => ({
      levelId: band.levelId,
      levelName: band.levelName,
      p25: band.p25,
      p50: band.p50,
      p75: band.p75,
      p85: deriveP85(band.p75, band.p90),
      p90: band.p90,
      source: "ai" as const,
    }));
    source = breakdown ? "ai" : "mixed";
  } else if (supportData && Object.keys(supportData.offerBuilderBenchmarks).length > 0) {
    adjacentLevels = Object.entries(supportData.offerBuilderBenchmarks).map(
      ([levelId, b]) => benchmarkToLevelRow(levelId, b),
    );
    source = breakdown ? "mixed" : "market";
  }

  const hasContent = breakdown !== null || adjacentLevels.length > 0;

  return {
    status: hasContent ? "ready" : "empty",
    source,
    title: "Offer Builder",
    subtitle: `${roleTitle} - ${levelName}`,
    data: { breakdown, adjacentLevels },
    narrative: narrativeFrom(aiView),
    message: hasContent ? null : "Offer builder data is not available for this benchmark.",
  };
}
