/** @vitest-environment jsdom */

import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  useCompanySettingsMock,
  useSalaryViewMock,
  fetchDbEmployeesMock,
  createOfferMock,
  getBenchmarkMock,
  getBenchmarksBatchMock,
} = vi.hoisted(() => ({
  useCompanySettingsMock: vi.fn(),
  useSalaryViewMock: vi.fn(),
  fetchDbEmployeesMock: vi.fn(),
  createOfferMock: vi.fn(),
  getBenchmarkMock: vi.fn(),
  getBenchmarksBatchMock: vi.fn(),
}));

vi.mock("@/lib/company", () => ({
  useCompanySettings: useCompanySettingsMock,
}));

vi.mock("@/lib/salary-view-store", () => ({
  useSalaryView: useSalaryViewMock,
}));

vi.mock("@/lib/employees/data-service", () => ({
  fetchDbEmployees: fetchDbEmployeesMock,
}));

vi.mock("@/lib/offers/store", () => ({
  useOffersStore: () => ({
    createOffer: createOfferMock,
  }),
}));

vi.mock("@/lib/benchmarks/data-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/benchmarks/data-service")>();
  return {
    ...actual,
    getBenchmark: getBenchmarkMock,
    getBenchmarksBatch: getBenchmarksBatchMock,
  };
});

import { OfferBuilderView } from "@/components/dashboard/benchmarks/drilldown/views/offer-builder-view";
import { CompMixView } from "@/components/dashboard/benchmarks/drilldown/views/comp-mix-view";
import { buildDetailSurface } from "@/lib/benchmarks/detail-surface";

const baseBenchmark = {
  roleId: "swe-fe",
  locationId: "riyadh",
  levelId: "ic4",
  currency: "AED" as const,
  payPeriod: "annual" as const,
  sourcePayPeriod: "annual" as const,
  percentiles: {
    p10: 250000,
    p25: 300000,
    p50: 384000,
    p75: 420000,
    p90: 460000,
  },
  sampleSize: 12,
  confidence: "Medium" as const,
  lastUpdated: "2026-03-31T00:00:00.000Z",
  momChange: 0,
  yoyChange: 0,
  trend: [],
  benchmarkSource: "market" as const,
};

const aiDetailBriefing = {
  executiveBriefing: "Shared AI view.",
  hiringSignal: "Competitive market.",
  negotiationPosture: "Use a clear package.",
  views: {
    levelTable: { summary: "Level guidance", action: "Hold the band." },
    aiInsights: { summary: "Insight guidance", action: "Stay above median." },
    trend: { summary: "Trend guidance", action: "Move quickly." },
    salaryBreakdown: { summary: "Breakdown guidance", action: "Explain each component." },
    industry: { summary: "Industry guidance", action: "Expect premium asks." },
    companySize: { summary: "Company-size guidance", action: "Use clarity." },
    geoComparison: { summary: "Geo guidance", action: "Watch market gaps." },
    compMix: {
      summary: "Mix guidance",
      action: "Keep the mix market-aligned.",
      compensationMix: {
        basicSalaryPct: 70,
        housingPct: 15,
        transportPct: 8,
        otherAllowancesPct: 7,
      },
    },
    offerBuilder: {
      summary: "Offer guidance",
      action: "Lead with the strongest cash anchor.",
      packageBreakdown: {
        basicSalaryPct: 72,
        housingPct: 14,
        transportPct: 8,
        otherAllowancesPct: 6,
      },
    },
  },
};

const resultLocation = {
  id: "riyadh",
  city: "Riyadh",
  country: "Saudi Arabia",
  countryCode: "SA",
  currency: "AED" as const,
  flag: "SA",
};

function makeResult() {
  const detailSurface = buildDetailSurface({
    aiBriefing: aiDetailBriefing,
    supportData: null,
    benchmark: baseBenchmark,
    roleTitle: "Frontend Engineer",
    levelName: "Staff (IC4)",
    location: resultLocation,
    industry: "Technology",
    companySize: "201-500",
  });

  return {
    formData: {
      context: "existing" as const,
      roleId: "swe-fe",
      levelId: "ic4",
      locationId: "riyadh",
      employmentType: "national" as const,
      currentSalaryLow: null,
      currentSalaryHigh: null,
      industry: "Technology",
      companySize: "201-500",
      fundingStage: null,
      targetPercentile: 50 as const,
    },
    benchmark: baseBenchmark,
    role: {
      id: "swe-fe",
      title: "Frontend Engineer",
      family: "Engineering",
      icon: "FE",
    },
    level: {
      id: "ic4",
      name: "Staff (IC4)",
      category: "IC",
    },
    location: resultLocation,
    isOverridden: false,
    aiDetailBriefing,
    aiDetailBriefingStatus: "ready" as const,
    detailSurface,
    detailSurfaceStatus: "ready" as const,
    createdAt: new Date("2026-03-31T00:00:00.000Z"),
  };
}

describe("benchmark AI mix views", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;

    useCompanySettingsMock.mockReturnValue({
      targetPercentile: 50,
      companyName: "Qeemly",
    });
    useSalaryViewMock.mockReturnValue({
      salaryView: "annual",
      setSalaryView: vi.fn(),
    });
    fetchDbEmployeesMock.mockResolvedValue([]);
    createOfferMock.mockResolvedValue(null);
    getBenchmarkMock.mockResolvedValue(baseBenchmark);
    getBenchmarksBatchMock.mockImplementation(
      async (
        entries: Array<{
          roleId: string;
          locationId: string;
          levelId: string;
          industry?: string | null;
          companySize?: string | null;
        }>,
      ) =>
      Object.fromEntries(
        entries.map((entry) => [
          [
            entry.roleId,
            entry.locationId,
            entry.levelId,
            entry.industry ?? "",
            entry.companySize ?? "",
          ].join("::"),
          baseBenchmark,
        ]),
      ),
    );
  });

  it("uses the AI package breakdown in offer builder instead of the 100 percent base placeholder", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(OfferBuilderView, { result: makeResult() }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("72% of total package");
    expect(container.textContent).toContain("14% of total package");
    expect(container.textContent).toContain("8% of total package");
    expect(container.textContent).toContain("6% of total package");
    expect(container.textContent).not.toContain("100% of total package");

    await act(async () => {
      root.unmount();
    });
  });

  it("uses the AI compensation mix components instead of a single cash compensation row", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(CompMixView, { result: makeResult() }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Basic Salary");
    expect(container.textContent).toContain("Housing");
    expect(container.textContent).toContain("Transport");
    expect(container.textContent).toContain("Accommodation");
    expect(container.textContent).toContain("Other Allowances");
    expect(container.textContent).toContain("70%");
    expect(container.textContent).toContain("15%");
    expect(container.textContent).toContain("8%");
    expect(container.textContent).toContain("7%");
    expect(container.textContent).not.toContain("Cash Compensation100%");

    await act(async () => {
      root.unmount();
    });
  });

  it("holds the offer builder in a loading state while the AI briefing is still pending", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(OfferBuilderView, {
          result: {
            ...makeResult(),
            detailSurface: null,
            detailSurfaceStatus: "loading",
          },
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Qeemly AI is preparing the package breakdown for this market view.");
    expect(container.textContent).toContain("Qeemly AI is preparing adjacent-level anchors for this market view.");
    expect(container.textContent).not.toContain("100% of total package");
    expect(getBenchmarksBatchMock).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it("holds the compensation mix view in a loading state while the AI briefing is still pending", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(CompMixView, {
          result: {
            ...makeResult(),
            detailSurface: null,
            detailSurfaceStatus: "loading",
          },
        }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Qeemly AI is preparing the compensation mix for this market view.");
    expect(container.textContent).not.toContain("Cash Compensation");
    expect(container.textContent).not.toContain(
      "Detailed compensation component splits are not yet available for this workspace.",
    );

    await act(async () => {
      root.unmount();
    });
  });
});
