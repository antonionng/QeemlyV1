export type SalaryReviewProposalRecord = {
  id: string;
  workspace_id: string;
  created_by: string | null;
  source: "manual" | "ai";
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
  benchmark_snapshot: Record<string, unknown>;
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
