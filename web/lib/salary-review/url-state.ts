export type SalaryReviewBandFilter = "all" | "below" | "above" | "outside-band" | "in-band";
export type SalaryReviewBenchmarkStatus = "all" | "exact" | "fallback" | "missing";
export type SalaryReviewWorkflowStatus = "all" | "draft" | "submitted" | "in_review" | "approved" | "rejected";
export type SalaryReviewPerformanceFilter = "all" | "exceptional" | "exceeds" | "meets" | "low";
export type SalaryReviewPoolFilter = "all" | "leadership" | "general";
export type SalaryReviewTab = "overview" | "review" | "approvals" | "history";
export type SalaryReviewCohort =
  | "active-employees"
  | "in-band"
  | "outside-band"
  | "above-band";

export type SalaryReviewQueryState = {
  tab: SalaryReviewTab;
  proposalId: string | null;
  department: string;
  location: string;
  pool: SalaryReviewPoolFilter;
  benchmarkStatus: SalaryReviewBenchmarkStatus;
  workflowStatus: SalaryReviewWorkflowStatus;
  bandFilter: SalaryReviewBandFilter;
  performance: SalaryReviewPerformanceFilter;
  search: string;
};

export const DEFAULT_SALARY_REVIEW_QUERY_STATE: SalaryReviewQueryState = {
  tab: "overview",
  proposalId: null,
  department: "all",
  location: "all",
  pool: "all",
  benchmarkStatus: "all",
  workflowStatus: "all",
  bandFilter: "all",
  performance: "all",
  search: "",
};

function readEnumValue<T extends string>(
  value: string | null,
  allowedValues: readonly T[],
  fallback: T
): T {
  return value && allowedValues.includes(value as T) ? (value as T) : fallback;
}

function resolveBandFilter(params: URLSearchParams): SalaryReviewBandFilter {
  const cohort = readEnumValue(
    params.get("cohort"),
    ["active-employees", "in-band", "outside-band", "above-band"] as const,
    "active-employees"
  );

  if (params.has("cohort")) {
    if (cohort === "in-band") {
      return "in-band";
    }

    if (cohort === "outside-band") {
      return "outside-band";
    }

    if (cohort === "above-band") {
      return "above";
    }

    return DEFAULT_SALARY_REVIEW_QUERY_STATE.bandFilter;
  }

  const shortcutFilter = params.get("filter");
  if (shortcutFilter === "outside-band") {
    return "outside-band";
  }
  if (shortcutFilter === "above-band") {
    return "above";
  }
  if (shortcutFilter === "below-band") {
    return "below";
  }

  return readEnumValue(
    params.get("band"),
    ["all", "below", "above", "outside-band", "in-band"] as const,
    DEFAULT_SALARY_REVIEW_QUERY_STATE.bandFilter
  );
}

function hasEmployeeDrilldownParams(params: URLSearchParams): boolean {
  return (
    params.has("cohort") ||
    params.has("filter") ||
    params.has("band") ||
    params.has("department") ||
    params.has("location") ||
    params.has("pool") ||
    params.has("benchmarkStatus") ||
    params.has("workflowStatus") ||
    params.has("performance") ||
    params.has("search")
  );
}

export function parseSalaryReviewSearchParams(params: URLSearchParams): SalaryReviewQueryState {
  const rawTab = readEnumValue(
    params.get("tab"),
    ["overview", "review", "approvals", "history"] as const,
    DEFAULT_SALARY_REVIEW_QUERY_STATE.tab
  );
  const bandFilter = resolveBandFilter(params);
  const tab =
    rawTab === "review" && hasEmployeeDrilldownParams(params) ? "overview" : rawTab;

  return {
    tab,
    proposalId: params.get("proposalId") || DEFAULT_SALARY_REVIEW_QUERY_STATE.proposalId,
    department: params.get("department") || DEFAULT_SALARY_REVIEW_QUERY_STATE.department,
    location: params.get("location") || DEFAULT_SALARY_REVIEW_QUERY_STATE.location,
    pool: readEnumValue(
      params.get("pool"),
      ["all", "leadership", "general"] as const,
      DEFAULT_SALARY_REVIEW_QUERY_STATE.pool
    ),
    benchmarkStatus: readEnumValue(
      params.get("benchmarkStatus"),
      ["all", "exact", "fallback", "missing"] as const,
      DEFAULT_SALARY_REVIEW_QUERY_STATE.benchmarkStatus
    ),
    workflowStatus: readEnumValue(
      params.get("workflowStatus"),
      ["all", "draft", "submitted", "in_review", "approved", "rejected"] as const,
      DEFAULT_SALARY_REVIEW_QUERY_STATE.workflowStatus
    ),
    bandFilter,
    performance: readEnumValue(
      params.get("performance"),
      ["all", "exceptional", "exceeds", "meets", "low"] as const,
      DEFAULT_SALARY_REVIEW_QUERY_STATE.performance
    ),
    search: params.get("search") || DEFAULT_SALARY_REVIEW_QUERY_STATE.search,
  };
}
