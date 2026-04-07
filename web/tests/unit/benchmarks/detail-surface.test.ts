import { describe, expect, it } from "vitest";
import {
  buildDetailSurface,
  type DetailSurfaceContract,
  type DetailSurfaceInput,
} from "@/lib/benchmarks/detail-surface";
import type {
  BenchmarkDetailAiBriefing,
  BenchmarkDetailSupportData,
} from "@/lib/benchmarks/detail-ai";
import type { SalaryBenchmark, Location } from "@/lib/dashboard/dummy-data";

const BASE_LOCATION: Location = {
  id: "dubai",
  city: "Dubai",
  country: "UAE",
  countryCode: "AE",
  currency: "AED",
  flag: "AE",
};

const BASE_BENCHMARK: SalaryBenchmark = {
  roleId: "swe",
  locationId: "dubai",
  levelId: "ic3",
  currency: "AED",
  payPeriod: "annual",
  percentiles: { p10: 120000, p25: 150000, p50: 200000, p75: 260000, p90: 320000 },
  sampleSize: 50,
  confidence: "High",
  lastUpdated: "2026-01-01T00:00:00.000Z",
  momChange: 0.5,
  yoyChange: 5,
  trend: [],
};

function makeSection(overrides: Partial<BenchmarkDetailAiBriefing["views"]["levelTable"]> = {}) {
  return {
    summary: "Test summary",
    action: "Test action",
    packageBreakdown: null,
    compensationMix: null,
    levelBands: null,
    comparisonPoints: null,
    trendPoints: null,
    ...overrides,
  };
}

function makeFullBriefing(
  overrides: Partial<BenchmarkDetailAiBriefing> = {},
): BenchmarkDetailAiBriefing {
  return {
    executiveBriefing: "Executive brief text",
    hiringSignal: "Hiring signal text",
    negotiationPosture: "Negotiation posture text",
    views: {
      levelTable: makeSection({
        levelBands: [
          { levelId: "ic2", levelName: "Mid", p10: 100000, p25: 130000, p50: 170000, p75: 220000, p90: 270000 },
          { levelId: "ic3", levelName: "Senior", p10: 120000, p25: 150000, p50: 200000, p75: 260000, p90: 320000 },
          { levelId: "ic4", levelName: "Staff", p10: 160000, p25: 200000, p50: 270000, p75: 340000, p90: 420000 },
        ],
      }),
      aiInsights: makeSection(),
      trend: makeSection({
        trendPoints: Array.from({ length: 12 }, (_, i) => ({
          month: `Month ${i + 1}`,
          p25: 150000 + i * 500,
          p50: 200000 + i * 600,
          p75: 260000 + i * 700,
        })),
      }),
      salaryBreakdown: makeSection({
        packageBreakdown: { basicSalaryPct: 60, housingPct: 25, transportPct: 10, otherAllowancesPct: 5 },
      }),
      industry: makeSection({
        comparisonPoints: [
          { id: "Fintech", label: "Fintech", median: 220000, currency: "AED", sampleSize: 30, yoyChange: 4, relativeValue: null },
          { id: "SaaS", label: "SaaS", median: 200000, currency: "AED", sampleSize: 25, yoyChange: 3, relativeValue: null },
        ],
      }),
      companySize: makeSection({
        comparisonPoints: [
          { id: "51-200", label: "51-200", median: 190000, currency: "AED", sampleSize: 20, yoyChange: 2, relativeValue: null },
        ],
      }),
      geoComparison: makeSection({
        comparisonPoints: [
          { id: "dubai", label: "Dubai", median: 200000, currency: "AED", sampleSize: 50, yoyChange: 5, relativeValue: 200000 },
          { id: "riyadh", label: "Riyadh", median: 180000, currency: "SAR", sampleSize: 30, yoyChange: 3, relativeValue: 175000 },
        ],
      }),
      compMix: makeSection({
        compensationMix: { basicSalaryPct: 55, housingPct: 30, transportPct: 10, otherAllowancesPct: 5 },
      }),
      offerBuilder: makeSection({
        packageBreakdown: { basicSalaryPct: 60, housingPct: 25, transportPct: 10, otherAllowancesPct: 5 },
      }),
    },
    ...overrides,
  };
}

function makeFullSupportData(): BenchmarkDetailSupportData {
  const makeBenchmark = (levelId: string, median: number): SalaryBenchmark => ({
    roleId: "swe",
    locationId: "dubai",
    levelId,
    currency: "AED",
    percentiles: { p10: median * 0.6, p25: median * 0.75, p50: median, p75: median * 1.3, p90: median * 1.6 },
    sampleSize: 20,
    confidence: "Medium",
    lastUpdated: "2026-01-01T00:00:00.000Z",
    momChange: 0,
    yoyChange: 0,
    trend: [],
  });

  return {
    levelTableBenchmarks: {
      ic1: makeBenchmark("ic1", 120000),
      ic2: makeBenchmark("ic2", 170000),
      ic3: makeBenchmark("ic3", 200000),
    },
    offerBuilderBenchmarks: {
      ic2: makeBenchmark("ic2", 170000),
      ic3: makeBenchmark("ic3", 200000),
      ic4: makeBenchmark("ic4", 270000),
    },
    industryBenchmarks: { Fintech: makeBenchmark("ic3", 220000) },
    industryFallbackBenchmark: null,
    companySizeBenchmarks: { "51-200": makeBenchmark("ic3", 195000) },
    companySizeFallbackBenchmark: null,
    geoBenchmarksByLocation: {
      dubai: makeBenchmark("ic3", 200000),
      riyadh: makeBenchmark("ic3", 180000),
    },
  };
}

function makeInput(overrides: Partial<DetailSurfaceInput> = {}): DetailSurfaceInput {
  return {
    aiBriefing: makeFullBriefing(),
    supportData: makeFullSupportData(),
    benchmark: BASE_BENCHMARK,
    roleTitle: "Software Engineer",
    levelName: "Senior (IC3)",
    location: BASE_LOCATION,
    industry: "Fintech",
    companySize: "51-200",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Contract structure tests
// ---------------------------------------------------------------------------

describe("buildDetailSurface", () => {
  it("returns a contract with all 9 module keys", () => {
    const contract = buildDetailSurface(makeInput());
    const moduleKeys = Object.keys(contract.modules);
    expect(moduleKeys).toEqual([
      "levelTable",
      "industry",
      "companySize",
      "trend",
      "geoComparison",
      "compMix",
      "salaryBreakdown",
      "aiInsights",
      "offerBuilder",
    ]);
  });

  it("populates summary from AI briefing", () => {
    const contract = buildDetailSurface(makeInput());
    expect(contract.summary.executiveBriefing).toBe("Executive brief text");
    expect(contract.summary.hiringSignal).toBe("Hiring signal text");
    expect(contract.summary.negotiationPosture).toBe("Negotiation posture text");
  });

  it("sets summary to null when AI briefing is absent", () => {
    const contract = buildDetailSurface(makeInput({ aiBriefing: null }));
    expect(contract.summary.executiveBriefing).toBeNull();
    expect(contract.summary.hiringSignal).toBeNull();
    expect(contract.summary.negotiationPosture).toBeNull();
  });

  describe("every module has required shape", () => {
    const contract = buildDetailSurface(makeInput());

    for (const [key, mod] of Object.entries(contract.modules)) {
      it(`${key} has status, source, title, subtitle, data, narrative, message`, () => {
        expect(mod).toHaveProperty("status");
        expect(mod).toHaveProperty("source");
        expect(mod).toHaveProperty("title");
        expect(mod).toHaveProperty("subtitle");
        expect(mod).toHaveProperty("data");
        expect(mod).toHaveProperty("narrative");
        expect(mod).toHaveProperty("message");
        expect(["ready", "empty", "error"]).toContain(mod.status);
        expect(["ai", "market", "derived", "mixed"]).toContain(mod.source);
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Full AI + support data
// ---------------------------------------------------------------------------

describe("full AI + support data", () => {
  const contract = buildDetailSurface(makeInput());

  it("all modules are ready", () => {
    for (const mod of Object.values(contract.modules)) {
      expect(mod.status).toBe("ready");
    }
  });

  it("levelTable uses AI bands", () => {
    expect(contract.modules.levelTable.source).toBe("ai");
    expect(contract.modules.levelTable.data.rows.length).toBe(3);
    expect(contract.modules.levelTable.data.rows[0].source).toBe("ai");
  });

  it("levelTable rows include p85 derived from p75 and p90", () => {
    const row = contract.modules.levelTable.data.rows[1]; // ic3
    expect(row.p85).toBe(Math.round((row.p75 + row.p90) / 2));
  });

  it("industry uses AI comparison points", () => {
    expect(contract.modules.industry.source).toBe("ai");
    expect(contract.modules.industry.data.rows.length).toBe(2);
    expect(contract.modules.industry.data.rows[0].isHighlighted).toBe(true);
  });

  it("trend uses AI trend points", () => {
    expect(contract.modules.trend.source).toBe("ai");
    expect(contract.modules.trend.data.points.length).toBe(12);
    expect(contract.modules.trend.data.periodChange).not.toBeNull();
  });

  it("compMix uses AI compensation mix", () => {
    expect(contract.modules.compMix.source).toBe("ai");
    const { breakdown } = contract.modules.compMix.data;
    expect(breakdown.basicSalaryPct + breakdown.housingPct + breakdown.transportPct + breakdown.otherAllowancesPct).toBe(100);
  });

  it("salaryBreakdown uses AI package breakdown", () => {
    expect(contract.modules.salaryBreakdown.source).toBe("ai");
    expect(contract.modules.salaryBreakdown.data.breakdown.basicSalaryPct).toBe(60);
  });

  it("aiInsights is ready when briefing exists", () => {
    expect(contract.modules.aiInsights.status).toBe("ready");
    expect(contract.modules.aiInsights.data.executiveBriefing).toBe("Executive brief text");
  });

  it("geoComparison marks selected location", () => {
    const dubaiRow = contract.modules.geoComparison.data.rows.find((r) => r.locationId === "dubai");
    expect(dubaiRow?.isSelected).toBe(true);
  });

  it("offerBuilder has breakdown and adjacent levels", () => {
    expect(contract.modules.offerBuilder.data.breakdown).not.toBeNull();
    expect(contract.modules.offerBuilder.data.adjacentLevels.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AI failure: only support data
// ---------------------------------------------------------------------------

describe("AI failure - support data only", () => {
  const contract = buildDetailSurface(makeInput({ aiBriefing: null }));

  it("levelTable falls back to market data", () => {
    expect(contract.modules.levelTable.source).toBe("market");
    expect(contract.modules.levelTable.status).toBe("ready");
    expect(contract.modules.levelTable.data.rows.length).toBe(3);
    expect(contract.modules.levelTable.data.rows[0].source).toBe("market");
  });

  it("industry falls back to market data", () => {
    expect(contract.modules.industry.source).toBe("market");
    expect(contract.modules.industry.data.rows.length).toBe(1);
  });

  it("compMix and salaryBreakdown are empty without AI", () => {
    expect(contract.modules.compMix.status).toBe("empty");
    expect(contract.modules.salaryBreakdown.status).toBe("empty");
  });

  it("aiInsights is empty without briefing", () => {
    expect(contract.modules.aiInsights.status).toBe("empty");
    expect(contract.modules.aiInsights.message).not.toBeNull();
  });

  it("trend falls back to derived points", () => {
    expect(contract.modules.trend.source).toBe("derived");
    expect(contract.modules.trend.data.points.length).toBe(12);
  });

  it("geoComparison falls back to market data", () => {
    expect(contract.modules.geoComparison.source).toBe("market");
    expect(contract.modules.geoComparison.data.rows.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// No data at all
// ---------------------------------------------------------------------------

describe("no AI and no support data", () => {
  const contract = buildDetailSurface(makeInput({ aiBriefing: null, supportData: null }));

  it("levelTable is empty", () => {
    expect(contract.modules.levelTable.status).toBe("empty");
    expect(contract.modules.levelTable.data.rows).toEqual([]);
    expect(contract.modules.levelTable.message).not.toBeNull();
  });

  it("industry is empty", () => {
    expect(contract.modules.industry.status).toBe("empty");
    expect(contract.modules.industry.data.rows).toEqual([]);
  });

  it("companySize is empty", () => {
    expect(contract.modules.companySize.status).toBe("empty");
  });

  it("geoComparison is empty", () => {
    expect(contract.modules.geoComparison.status).toBe("empty");
  });

  it("trend uses derived fallback from benchmark", () => {
    expect(contract.modules.trend.source).toBe("derived");
    expect(contract.modules.trend.status).toBe("ready");
    expect(contract.modules.trend.data.points.length).toBe(12);
  });

  it("all module messages are set for empty modules", () => {
    const emptyModules = Object.values(contract.modules).filter((m) => m.status === "empty");
    for (const mod of emptyModules) {
      expect(mod.message).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Partial AI data
// ---------------------------------------------------------------------------

describe("partial AI data", () => {
  it("uses AI for modules with data and empty for modules without", () => {
    const briefing = makeFullBriefing();
    briefing.views.industry.comparisonPoints = null;
    briefing.views.companySize.comparisonPoints = null;

    const contract = buildDetailSurface(makeInput({ aiBriefing: briefing }));

    expect(contract.modules.levelTable.source).toBe("ai");
    expect(contract.modules.levelTable.status).toBe("ready");

    expect(contract.modules.industry.source).toBe("market");
    expect(contract.modules.industry.status).toBe("ready");

    expect(contract.modules.companySize.source).toBe("market");
    expect(contract.modules.companySize.status).toBe("ready");
  });
});

// ---------------------------------------------------------------------------
// Narrative pass-through
// ---------------------------------------------------------------------------

describe("narrative pass-through", () => {
  it("passes narrative from AI section to module", () => {
    const contract = buildDetailSurface(makeInput());
    expect(contract.modules.levelTable.narrative.summary).toBe("Test summary");
    expect(contract.modules.levelTable.narrative.action).toBe("Test action");
  });

  it("provides empty narrative when AI is absent", () => {
    const contract = buildDetailSurface(makeInput({ aiBriefing: null }));
    expect(contract.modules.levelTable.narrative.summary).toBe("");
    expect(contract.modules.levelTable.narrative.action).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Industry fallback path
// ---------------------------------------------------------------------------

describe("industry fallback benchmark", () => {
  it("shows broader market fallback when no direct matches", () => {
    const supportData = makeFullSupportData();
    supportData.industryBenchmarks = {};
    supportData.industryFallbackBenchmark = {
      ...BASE_BENCHMARK,
      percentiles: { p10: 100000, p25: 130000, p50: 175000, p75: 230000, p90: 280000 },
    };

    const contract = buildDetailSurface(
      makeInput({ aiBriefing: null, supportData }),
    );

    expect(contract.modules.industry.data.rows.length).toBe(1);
    expect(contract.modules.industry.data.rows[0].id).toBe("broader-market");
    expect(contract.modules.industry.data.fallbackLabel).toBe("Broader market");
  });
});
