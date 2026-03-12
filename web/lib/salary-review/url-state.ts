export type SalaryReviewBandFilter = "all" | "below" | "above" | "outside-band";
export type SalaryReviewBenchmarkStatus = "all" | "exact" | "fallback" | "missing";
export type SalaryReviewWorkflowStatus = "all" | "draft" | "submitted" | "in_review" | "approved" | "rejected";
export type SalaryReviewPerformanceFilter = "all" | "exceptional" | "exceeds" | "meets" | "low";
export type SalaryReviewPoolFilter = "all" | "leadership" | "general";
export type SalaryReviewTab = "overview" | "review" | "approvals" | "history";

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

export function parseSalaryReviewSearchParams(params: URLSearchParams): SalaryReviewQueryState {
  const shortcutFilter = params.get("filter");
  const bandFilter =
    shortcutFilter === "outside-band"
      ? "outside-band"
      : shortcutFilter === "above-band"
        ? "above"
        : shortcutFilter === "below-band"
          ? "below"
          : readEnumValue(
              params.get("band"),
              ["all", "below", "above", "outside-band"] as const,
              DEFAULT_SALARY_REVIEW_QUERY_STATE.bandFilter
            );

  return {
    tab: readEnumValue(
      params.get("tab"),
      ["overview", "review", "approvals", "history"] as const,
      DEFAULT_SALARY_REVIEW_QUERY_STATE.tab
    ),
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
