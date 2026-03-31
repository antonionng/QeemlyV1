export type SalaryReviewAiMode = "assistive";

export type SalaryReviewAiBudgetType = "percentage" | "absolute";

export type SalaryReviewAiPlanRequest = {
  mode: SalaryReviewAiMode;
  cycle: "annual" | "monthly";
  budgetType: SalaryReviewAiBudgetType;
  budgetPercentage?: number;
  budgetAbsolute?: number;
  selectedEmployeeIds?: string[];
};

export type BenchmarkProvenance = "workspace" | "ingestion" | "none";

export type BenchmarkMatchQuality = "exact" | "role_level_fallback" | "none";
export type BenchmarkMatchType =
  | "exact"
  | "location_fallback"
  | "global_role_level_fallback"
  | "adjacent_level_fallback"
  | "family_fallback"
  | "family_location_fallback"
  | "none";

export type SalaryReviewAiProposalFactor = {
  key: "market_gap" | "performance" | "band_position" | "tenure";
  label: string;
  value: string;
  weight: number;
  impact: "positive" | "neutral" | "negative";
};

export type SalaryReviewAiProposalItem = {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  proposedIncrease: number;
  proposedSalary: number;
  proposedPercentage: number;
  confidence: number;
  rationale: string[];
  aiRationale: string | null;
  factors: SalaryReviewAiProposalFactor[];
  benchmark: {
    provenance: BenchmarkProvenance;
    sourceSlug: string | null;
    sourceName: string | null;
    matchQuality: BenchmarkMatchQuality;
    matchType?: BenchmarkMatchType;
    fallbackReason?: string | null;
    freshness: {
      lastUpdatedAt: string | null;
      confidence: "high" | "medium" | "low" | "unknown";
    };
  };
  warnings: string[];
};

export type SalaryReviewAiPlanSummary = {
  mode: SalaryReviewAiMode;
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetUsedPercentage: number;
  totalCurrentPayroll: number;
  totalProposedPayroll: number;
  employeesConsidered: number;
  employeesWithWarnings: number;
};

export type SalaryReviewAiPlanResponse = {
  generatedAt: string;
  strategicSummary: string | null;
  summary: SalaryReviewAiPlanSummary;
  items: SalaryReviewAiProposalItem[];
  warnings: string[];
};

export type SalaryReviewAiPlanValidation =
  | { ok: true; value: SalaryReviewAiPlanRequest }
  | { ok: false; status: number; error: string };

const MAX_SELECTED_EMPLOYEES = 1000;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function validateSalaryReviewAiPlanRequest(body: unknown): SalaryReviewAiPlanValidation {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "Invalid request body" };
  }

  const candidate = body as Partial<SalaryReviewAiPlanRequest>;
  if (candidate.mode !== "assistive") {
    return { ok: false, status: 400, error: "mode must be 'assistive'" };
  }

  if (candidate.cycle !== "annual" && candidate.cycle !== "monthly") {
    return { ok: false, status: 400, error: "cycle must be one of: annual, monthly" };
  }

  if (candidate.budgetType !== "percentage" && candidate.budgetType !== "absolute") {
    return { ok: false, status: 400, error: "budgetType must be one of: percentage, absolute" };
  }

  const budgetPercentage = toFiniteNumber(candidate.budgetPercentage);
  const budgetAbsolute = toFiniteNumber(candidate.budgetAbsolute);

  if (candidate.budgetType === "percentage") {
    if (budgetPercentage == null || budgetPercentage < 0) {
      return { ok: false, status: 400, error: "budgetPercentage is required for percentage budget type" };
    }
  }

  if (candidate.budgetType === "absolute") {
    if (budgetAbsolute == null || budgetAbsolute < 0) {
      return { ok: false, status: 400, error: "budgetAbsolute is required for absolute budget type" };
    }
  }

  let selectedEmployeeIds: string[] | undefined;
  if (candidate.selectedEmployeeIds != null) {
    if (!Array.isArray(candidate.selectedEmployeeIds)) {
      return { ok: false, status: 400, error: "selectedEmployeeIds must be an array of strings" };
    }
    selectedEmployeeIds = candidate.selectedEmployeeIds
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
    if (selectedEmployeeIds.length > MAX_SELECTED_EMPLOYEES) {
      return { ok: false, status: 400, error: `selectedEmployeeIds exceeds limit ${MAX_SELECTED_EMPLOYEES}` };
    }
  }

  return {
    ok: true,
    value: {
      mode: "assistive",
      cycle: candidate.cycle,
      budgetType: candidate.budgetType,
      budgetPercentage: budgetPercentage ?? undefined,
      budgetAbsolute: budgetAbsolute ?? undefined,
      selectedEmployeeIds,
    },
  };
}

