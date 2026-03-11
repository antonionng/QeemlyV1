import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCompanySettings } from "@/lib/company/settings";

const { getBenchmarkMock } = vi.hoisted(() => ({
  getBenchmarkMock: vi.fn(),
}));

vi.mock("@/lib/benchmarks/data-service", () => ({
  getBenchmark: getBenchmarkMock,
}));

import { useBenchmarkState } from "@/lib/benchmarks/benchmark-state";

describe("useBenchmarkState.runBenchmark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCompanySettings.setState({
      industry: "Fintech",
      companySize: "201-500",
    });
    useBenchmarkState.setState({
      formData: {
        context: "existing",
        roleId: null,
        levelId: null,
        locationId: null,
        employmentType: "national",
        currentSalaryLow: null,
        currentSalaryHigh: null,
        industry: null,
        companySize: null,
        fundingStage: null,
        targetPercentile: null,
      },
      isFormComplete: false,
      currentResult: null,
      recentResults: [],
      savedFilters: [],
      step: "form",
      detailTab: "summary",
    });
    getBenchmarkMock.mockResolvedValue({
      roleId: "software-engineer",
      locationId: "dubai",
      levelId: "ic3",
      currency: "AED",
      percentiles: {
        p10: 10000,
        p25: 12000,
        p50: 14000,
        p75: 16000,
        p90: 18000,
      },
      sampleSize: 12,
      confidence: "Medium",
      lastUpdated: "2026-03-11T00:00:00.000Z",
      momChange: 0,
      yoyChange: 0,
      trend: [],
      benchmarkSource: "market",
    });
  });

  it("uses workspace cohort defaults when the form leaves segmentation unset", async () => {
    const state = useBenchmarkState.getState();
    state.updateFormField("roleId", "software-engineer");
    state.updateFormField("levelId", "ic3");
    state.updateFormField("locationId", "dubai");

    await useBenchmarkState.getState().runBenchmark();

    expect(getBenchmarkMock).toHaveBeenCalledWith("software-engineer", "dubai", "ic3", {
      industry: "Fintech",
      companySize: "201-500",
    });
    expect(useBenchmarkState.getState().currentResult?.formData.industry).toBe("Fintech");
    expect(useBenchmarkState.getState().currentResult?.formData.companySize).toBe("201-500");
  });

  it("prefers explicit cohort overrides from the form", async () => {
    const state = useBenchmarkState.getState();
    state.updateFormField("roleId", "software-engineer");
    state.updateFormField("levelId", "ic3");
    state.updateFormField("locationId", "dubai");
    state.updateFormField("industry", "HealthTech");
    state.updateFormField("companySize", "51-200");

    await useBenchmarkState.getState().runBenchmark();

    expect(getBenchmarkMock).toHaveBeenCalledWith("software-engineer", "dubai", "ic3", {
      industry: "HealthTech",
      companySize: "51-200",
    });
    expect(useBenchmarkState.getState().currentResult?.formData.industry).toBe("HealthTech");
    expect(useBenchmarkState.getState().currentResult?.formData.companySize).toBe("51-200");
  });
});
