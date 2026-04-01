export type SalaryReviewProposalRecord = {
  id: string;
  workspace_id: string;
  created_by: string | null;
  source: "manual" | "ai";
  review_mode: "company_wide" | "department_split";
  review_scope: "company_wide" | "master" | "department";
  parent_cycle_id: string | null;
  department: string | null;
  allocation_method: "direct" | "finance_approval" | null;
  allocation_status: "pending" | "approved" | "returned" | null;
  cycle: "monthly" | "annual";
  budget_type: "percentage" | "absolute";
  budget_percentage: number;
  budget_absolute: number;
  effective_date: string;
  status: "draft" | "submitted" | "in_review" | "approved" | "rejected" | "applied";
  summary: {
    selectedEmployees: number;
    proposedEmployees: number;
    totalCurrentPayroll: number;
    totalIncrease: number;
    totalProposedPayroll: number;
    maxIncreasePercentage: number;
  };
  created_at?: string;
  updated_at?: string;
};

export type SalaryChangeReason =
  | "annual_review"
  | "promotion"
  | "market_adjustment"
  | "retention"
  | "counter_offer"
  | "equity_correction";

export const SALARY_CHANGE_REASONS: { value: SalaryChangeReason; label: string }[] = [
  { value: "annual_review", label: "Annual Review" },
  { value: "promotion", label: "Promotion" },
  { value: "market_adjustment", label: "Market Adjustment" },
  { value: "retention", label: "Retention" },
  { value: "counter_offer", label: "Counter-offer" },
  { value: "equity_correction", label: "Equity Correction" },
];

export type SalaryReviewProposalItemRecord = {
  id: string;
  cycle_id: string;
  employee_id: string | null;
  employee_name: string;
  selected: boolean;
  current_salary: number;
  proposed_increase: number;
  proposed_salary: number;
  proposed_percentage: number;
  reason_summary: string | null;
  change_reason: SalaryChangeReason | null;
  recommended_level_id: string | null;
  recommended_level_name: string | null;
  benchmark_snapshot: Record<string, unknown>;
};

export type SalaryReviewDepartmentAllocationRecord = {
  id: string;
  master_cycle_id: string;
  department: string;
  allocated_budget: number;
  allocation_method: "direct" | "finance_approval";
  allocation_status: "pending" | "approved" | "returned";
  child_cycle_id: string | null;
  selected_employee_ids?: string[];
};

export type SalaryReviewApprovalStepRecord = {
  id: string;
  cycle_id: string;
  step_order: number;
  step_key: "manager" | "director" | "hr" | "exec";
  step_label: string;
  status: "pending" | "approved" | "rejected" | "returned";
  trigger_reason: string | null;
  actor_user_id: string | null;
  acted_at: string | null;
  note: string | null;
};

export type SalaryReviewNoteRecord = {
  id: string;
  cycle_id: string;
  employee_id: string | null;
  step_id: string | null;
  workspace_id: string;
  created_by: string | null;
  note: string;
  created_at: string;
};

export type SalaryReviewAuditEventRecord = {
  id: string;
  cycle_id: string;
  workspace_id: string;
  employee_id: string | null;
  actor_user_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};
