import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCompanySettings } from "@/lib/company/settings";

const { getBenchmarkMock } = vi.hoisted(() => ({
  getBenchmarkMock: vi.fn(),
}));

vi.mock("@/lib/benchmarks/data-service", () => ({
  getBenchmark: getBenchmarkMock,
}));

import {
  BENCHMARK_LOCATIONS,
  getBenchmarkLocation,
  useBenchmarkState,
} from "@/lib/benchmarks/benchmark-state";

describe("useBenchmarkState.runBenchmark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCompanySettings.setState({
      industry: "Fintech",
      companySize: "201-500",
    });
    useBenchmarkState.setState({
      workspaceId: null,
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
      isSubmitting: false,
      submissionError: null,
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

  it("stores a visible error when no benchmark row matches the request", async () => {
    getBenchmarkMock.mockResolvedValueOnce(null);

    const state = useBenchmarkState.getState();
    state.updateFormField("roleId", "software-engineer");
    state.updateFormField("levelId", "ic3");
    state.updateFormField("locationId", "dubai");

    await useBenchmarkState.getState().runBenchmark();

    expect(useBenchmarkState.getState().currentResult).toBeNull();
    expect(useBenchmarkState.getState().step).toBe("form");
    expect(useBenchmarkState.getState().submissionError).toBe(
      "No published benchmark matched this role, level, and location yet. Try another selection.",
    );
    expect(useBenchmarkState.getState().isSubmitting).toBe(false);
  });

  it("clears persisted benchmark state when the active workspace changes", () => {
    useBenchmarkState.setState({
      workspaceId: "ws-old",
      currentResult: {
        formData: {
          context: "existing",
          roleId: "software-engineer",
          levelId: "ic3",
          locationId: "dubai",
          employmentType: "national",
          currentSalaryLow: null,
          currentSalaryHigh: null,
          industry: "Fintech",
          companySize: "201-500",
          fundingStage: null,
          targetPercentile: null,
        },
        benchmark: {
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
        },
        role: {
          id: "software-engineer",
          title: "Software Engineer",
          family: "Engineering",
          icon: "SE",
        },
        level: {
          id: "ic3",
          name: "Senior (IC3)",
          category: "IC",
        },
        location: {
          id: "dubai",
          city: "Dubai",
          country: "UAE",
          countryCode: "AE",
          currency: "AED",
          flag: "AE",
        },
        isOverridden: false,
        createdAt: new Date("2026-03-12T00:00:00.000Z"),
      },
      recentResults: [{ id: "recent-1" }] as never[],
      savedFilters: [{ id: "saved-1" }] as never[],
      step: "results",
    });

    useBenchmarkState.getState().reconcileWorkspace("ws-new");

    expect(useBenchmarkState.getState().workspaceId).toBe("ws-new");
    expect(useBenchmarkState.getState().currentResult).toBeNull();
    expect(useBenchmarkState.getState().recentResults).toEqual([]);
    expect(useBenchmarkState.getState().savedFilters).toEqual([]);
    expect(useBenchmarkState.getState().step).toBe("form");
  });

  it("exposes a Gulf-only benchmark location list", () => {
    expect(BENCHMARK_LOCATIONS).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ countryCode: "GB" }),
      ]),
    );
    expect(BENCHMARK_LOCATIONS.every((location) => location.countryCode !== "GB")).toBe(true);
    expect(getBenchmarkLocation("london")).toBeUndefined();
  });
});
