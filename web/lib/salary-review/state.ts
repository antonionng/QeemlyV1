// Salary Review State Management

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  type Employee, 
  getCompanyMetricsAsync,
  getEmployees,
  computeTenure,
} from "../employees";
import { type ReviewCycle } from "../company";
import { type SalaryReviewAiPlanResponse } from "./ai-plan";
import {
  addSalaryReviewProposalNote,
  createSalaryReviewProposal,
  fetchApprovalQueueSalaryReviewProposals,
  fetchLatestSalaryReviewProposal,
  fetchSalaryReviewProposalDetail,
  reviewSalaryReviewProposal,
  submitSalaryReviewProposal,
  updateSalaryReviewProposal,
} from "./proposal-api";
import type {
  SalaryReviewApprovalStepRecord,
  SalaryReviewAuditEventRecord,
  SalaryReviewNoteRecord,
  SalaryReviewProposalItemRecord,
  SalaryReviewProposalRecord,
} from "./proposal-types";

// Types
export type BudgetType = "percentage" | "absolute";

export interface ReviewSettings {
  cycle: ReviewCycle;
  budgetType: BudgetType;
  budgetPercentage: number;
  budgetAbsolute: number;
  effectiveDate: string;
  includeBonus: boolean;
}

export interface ReviewEmployee extends Employee {
  proposedIncrease: number; // Absolute amount
  proposedPercentage: number; // % increase
  newSalary: number;
  isSelected: boolean;
  guidance?: {
    type: "promotion-signal" | "flag" | "standard" | "retention-risk";
    message: string;
  };
}

export interface EmployeeWorkflowState {
  managerFollowUpDone: boolean;
  calibrationNeeded: boolean;
  recommendationReady: boolean;
  updatedAt: string;
}

export type ColumnKey =
  | "name"
  | "role"
  | "department"
  | "location"
  | "current"
  | "basic"
  | "housing"
  | "transport"
  | "other"
  | "proposed"
  | "increase"
  | "band"
  | "performance"
  | "guidance";

export const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "department", label: "Department" },
  { key: "location", label: "Location" },
  { key: "current", label: "Current Salary" },
  { key: "basic", label: "Basic" },
  { key: "housing", label: "Housing" },
  { key: "transport", label: "Transport" },
  { key: "other", label: "Other Allowances" },
  { key: "proposed", label: "Proposed" },
  { key: "increase", label: "Increase %" },
  { key: "band", label: "Band Position" },
  { key: "performance", label: "Performance" },
  { key: "guidance", label: "Guidance" },
];

export const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  "name",
  "role",
  "department",
  "current",
  "proposed",
  "increase",
  "band",
  "performance",
];

export interface SalaryReviewState {
  // Settings
  settings: ReviewSettings;
  
  // Column visibility
  visibleColumns: ColumnKey[];
  
  // Employees
  employees: ReviewEmployee[];
  workflowByEmployee: Record<string, EmployeeWorkflowState>;
  isLoading: boolean;
  isUsingMockData: boolean;
  activeProposal: SalaryReviewProposalRecord | null;
  proposalItemsByEmployee: Record<string, SalaryReviewProposalItemRecord>;
  approvalSteps: SalaryReviewApprovalStepRecord[];
  proposalNotes: SalaryReviewNoteRecord[];
  proposalAuditEvents: SalaryReviewAuditEventRecord[];
  isProposalLoading: boolean;
  approvalQueue: SalaryReviewProposalRecord[];
  selectedApprovalProposalId: string | null;
  selectedApprovalProposal: SalaryReviewProposalRecord | null;
  selectedApprovalItemsByEmployee: Record<string, SalaryReviewProposalItemRecord>;
  selectedApprovalSteps: SalaryReviewApprovalStepRecord[];
  selectedApprovalNotes: SalaryReviewNoteRecord[];
  selectedApprovalAuditEvents: SalaryReviewAuditEventRecord[];
  isApprovalQueueLoading: boolean;
  isApprovalDetailLoading: boolean;
  
  // Computed
  totalCurrentPayroll: number;
  totalProposedPayroll: number;
  totalIncrease: number;
  budgetUsed: number;
  budgetRemaining: number;
  
  // Actions
  updateSettings: (settings: Partial<ReviewSettings>) => void;
  updateEmployeeIncrease: (employeeId: string, increase: number) => void;
  toggleEmployeeSelection: (employeeId: string) => void;
  toggleColumnVisibility: (column: ColumnKey) => void;
  resetColumns: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  applyDefaultIncreases: () => void;
  resetReview: () => void;
  loadEmployeesFromDb: () => Promise<void>;
  updateEmployeeWorkflow: (
    employeeId: string,
    updates: Partial<Omit<EmployeeWorkflowState, "updatedAt">>
  ) => void;
  applySuggestedIncrease: (employeeId: string) => void;
  applyAiProposal: (plan: SalaryReviewAiPlanResponse, selectedEmployeeIds?: string[]) => void;
  loadLatestProposal: () => Promise<void>;
  loadApprovalProposalList: () => Promise<void>;
  loadApprovalProposalDetail: (proposalId: string) => Promise<void>;
  selectApprovalProposal: (proposalId: string | null) => Promise<void>;
  reviewSelectedApprovalProposal: (
    action: "approve" | "reject" | "return",
    note?: string
  ) => Promise<void>;
  addApprovalProposalNote: (
    note: string,
    employeeId?: string | null,
    stepId?: string | null
  ) => Promise<void>;
  saveDraftProposal: (source?: "manual" | "ai") => Promise<void>;
  submitActiveProposal: () => Promise<void>;
  reviewActiveProposal: (action: "approve" | "reject" | "return", note?: string) => Promise<void>;
  addProposalNote: (note: string, employeeId?: string | null, stepId?: string | null) => Promise<void>;
}

function getBudgetAmount(settings: ReviewSettings, totalCurrentPayroll: number): number {
  return settings.budgetType === "percentage"
    ? totalCurrentPayroll * (settings.budgetPercentage / 100)
    : settings.budgetAbsolute;
}

function computeReviewTotals(
  employees: ReviewEmployee[],
  totalCurrentPayroll: number,
  settings: ReviewSettings
) {
  const totalIncrease = employees
    .filter((employee) => employee.isSelected)
    .reduce((sum, employee) => sum + employee.proposedIncrease, 0);
  const budget = getBudgetAmount(settings, totalCurrentPayroll);

  return {
    totalIncrease,
    totalProposedPayroll: totalCurrentPayroll + totalIncrease,
    budgetUsed: totalIncrease,
    budgetRemaining: budget - totalIncrease,
  };
}

function clearReviewEmployees(employees: ReviewEmployee[]): ReviewEmployee[] {
  return employees.map((employee) => ({
    ...employee,
    proposedIncrease: 0,
    proposedPercentage: 0,
    newSalary: employee.baseSalary,
    isSelected: true,
  }));
}

function buildProposalItemMap(items: SalaryReviewProposalItemRecord[]) {
  return Object.fromEntries(
    items
      .filter((item) => item.employee_id)
      .map((item) => [String(item.employee_id), item])
  );
}

function applyProposalItemsToEmployees(
  employees: ReviewEmployee[],
  items: SalaryReviewProposalItemRecord[]
): ReviewEmployee[] {
  const itemMap = buildProposalItemMap(items);
  return employees.map((employee) => {
    const item = itemMap[employee.id];
    if (!item) {
      return employee;
    }
    return {
      ...employee,
      isSelected: Boolean(item.selected),
      proposedIncrease: Number(item.proposed_increase || 0),
      proposedPercentage: Number(item.proposed_percentage || 0),
      newSalary: Number(item.proposed_salary || employee.baseSalary),
    };
  });
}

function buildSettingsFromProposal(
  proposal: SalaryReviewProposalRecord | null,
  currentSettings: ReviewSettings
): ReviewSettings {
  if (!proposal) {
    return currentSettings;
  }

  return {
    ...currentSettings,
    cycle: proposal.cycle,
    budgetType: proposal.budget_type,
    budgetPercentage: Number(proposal.budget_percentage || 0),
    budgetAbsolute: Number(proposal.budget_absolute || 0),
    effectiveDate: proposal.effective_date,
  };
}

function sortProposalQueue(proposals: SalaryReviewProposalRecord[]) {
  return [...proposals].sort((left, right) => {
    const rightTime = new Date(right.updated_at || right.created_at || 0).getTime();
    const leftTime = new Date(left.updated_at || left.created_at || 0).getTime();
    return rightTime - leftTime;
  });
}

function upsertProposalInQueue(
  proposals: SalaryReviewProposalRecord[],
  proposal: SalaryReviewProposalRecord | null
) {
  if (!proposal || proposal.status === "draft") {
    return proposals.filter((existing) => existing.id !== proposal?.id);
  }

  const withoutCurrent = proposals.filter((existing) => existing.id !== proposal.id);
  return sortProposalQueue([proposal, ...withoutCurrent]);
}

function serializeBenchmarkSnapshot(employee: ReviewEmployee) {
  return employee.benchmarkContext
    ? {
        source: employee.benchmarkContext.source,
        provenance: employee.benchmarkContext.provenance ?? null,
        matchQuality: employee.benchmarkContext.matchQuality ?? null,
        confidence: employee.benchmarkContext.confidence ?? null,
        freshnessAt: employee.benchmarkContext.freshnessAt ?? null,
        sampleSize: employee.benchmarkContext.sampleSize ?? null,
      }
    : null;
}

function toDraftItems(employees: ReviewEmployee[]): Array<{
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  proposedIncrease: number;
  proposedSalary: number;
  proposedPercentage: number;
  selected: boolean;
  reasonSummary: string;
  benchmarkSnapshot: Record<string, unknown> | null;
  bandPosition: ReviewEmployee["bandPosition"];
}> {
  return employees.map((employee) => ({
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
    currentSalary: employee.baseSalary,
    proposedIncrease: employee.proposedIncrease,
    proposedSalary: employee.newSalary,
    proposedPercentage: employee.proposedPercentage,
    selected: employee.isSelected,
    reasonSummary: employee.guidance?.message || "Salary review proposal",
    benchmarkSnapshot: serializeBenchmarkSnapshot(employee),
    bandPosition: employee.bandPosition,
  }));
}

function allocateBudgetByWeight(
  employees: ReviewEmployee[],
  budget: number
): Map<string, number> {
  const selectedEmployees = employees.filter((employee) => employee.isSelected);
  if (selectedEmployees.length === 0 || budget <= 0) {
    return new Map(selectedEmployees.map((employee) => [employee.id, 0]));
  }

  const weightedEmployees = selectedEmployees.map((employee) => {
    let weight = employee.baseSalary;
    if (employee.bandPosition === "below") weight *= 1.3;
    else if (employee.bandPosition === "above") weight *= 0.7;

    if (employee.performanceRating === "exceptional") weight *= 1.4;
    else if (employee.performanceRating === "exceeds") weight *= 1.2;
    else if (employee.performanceRating === "low") weight *= 0.5;

    return {
      employee,
      weight: Math.max(weight, 0),
    };
  });

  const totalWeight = weightedEmployees.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return new Map(weightedEmployees.map(({ employee }) => [employee.id, 0]));
  }

  const roundedBudget = Math.round(budget);
  const allocations = weightedEmployees.map(({ employee, weight }) => {
    const raw = (roundedBudget * weight) / totalWeight;
    const baseAllocation = Math.floor(raw);
    return {
      employee,
      raw,
      baseAllocation,
      fractional: raw - baseAllocation,
    };
  });

  let allocated = allocations.reduce((sum, item) => sum + item.baseAllocation, 0);
  const byPriority = [...allocations].sort((left, right) => right.fractional - left.fractional);
  let index = 0;

  while (allocated < roundedBudget && byPriority.length > 0) {
    byPriority[index % byPriority.length].baseAllocation += 1;
    allocated += 1;
    index += 1;
  }

  return new Map(allocations.map((item) => [item.employee.id, item.baseAllocation]));
}

// Generate guidance for an employee, factoring in performance + tenure
function generateGuidance(employee: Employee): ReviewEmployee["guidance"] {
  const tenure = computeTenure(employee.hireDate);
  const tenureYears = tenure.years + tenure.months / 12;

  // High performer + below band + long tenure = strong retention risk
  if (
    (employee.performanceRating === "exceeds" || employee.performanceRating === "exceptional") &&
    employee.bandPosition === "below" &&
    tenureYears >= 2
  ) {
    return {
      type: "retention-risk",
      message: `Strong retention risk — ${employee.performanceRating} performer below band with ${tenure.label} tenure`,
    };
  }

  // New hire (< 1 year) + exceptional = fast-track signal
  if (employee.performanceRating === "exceptional" && tenureYears < 1) {
    return {
      type: "promotion-signal",
      message: "Fast-track candidate — exceptional performer in first year",
    };
  }

  // High performer at top of band
  if (employee.performanceRating === "exceptional" && employee.bandPercentile > 80) {
    return {
      type: "promotion-signal",
      message: "Consider promotion — exceptional performer at top of band",
    };
  }

  // High performer below band (shorter tenure)
  if (
    (employee.performanceRating === "exceeds" || employee.performanceRating === "exceptional") &&
    employee.bandPosition === "below"
  ) {
    return {
      type: "retention-risk",
      message: "Retention risk — strong performer below market",
    };
  }

  // Low performer above band = overpayment flag
  if (employee.performanceRating === "low" && employee.bandPosition === "above") {
    return {
      type: "flag",
      message: "Overpayment concern — low performance at above-market pay",
    };
  }

  // Low performer getting significant comp vs market
  if (employee.performanceRating === "low" && employee.marketComparison > 5) {
    return {
      type: "flag",
      message: "Performance not aligned with current compensation level",
    };
  }

  // Long tenure (5+ years) with no recent review — may need attention
  if (tenureYears >= 5 && !employee.lastReviewDate) {
    return {
      type: "retention-risk",
      message: `${tenure.label} tenure with no performance review on file`,
    };
  }

  return undefined;
}

function defaultWorkflowState(employee: Employee): EmployeeWorkflowState {
  const guidance = generateGuidance(employee);
  return {
    managerFollowUpDone: false,
    calibrationNeeded: guidance?.type === "flag" || guidance?.type === "retention-risk",
    recommendationReady: false,
    updatedAt: new Date().toISOString(),
  };
}

function buildWorkflowMap(employees: Employee[]): Record<string, EmployeeWorkflowState> {
  return Object.fromEntries(
    employees.map((employee) => [employee.id, defaultWorkflowState(employee)])
  );
}

function computeSuggestedIncrease(employee: Employee): number {
  const tenure = computeTenure(employee.hireDate);
  let suggestedPct = 3;

  if (employee.bandPosition === "below") suggestedPct += 2;
  if (employee.bandPosition === "in-band") suggestedPct += 1;
  if (employee.bandPosition === "above") suggestedPct -= 1;

  if (employee.performanceRating === "exceptional") suggestedPct += 3;
  else if (employee.performanceRating === "exceeds") suggestedPct += 2;
  else if (employee.performanceRating === "low") suggestedPct -= 2;

  if (tenure.totalMonths >= 36) suggestedPct += 1;
  if (tenure.totalMonths < 12) suggestedPct -= 1;

  const clampedPct = Math.max(0, Math.min(15, suggestedPct));
  const rawIncrease = (employee.baseSalary * clampedPct) / 100;
  return Math.round(rawIncrease / 100) * 100;
}

const DEFAULT_SETTINGS: ReviewSettings = {
  cycle: "annual",
  budgetType: "percentage",
  budgetPercentage: 5,
  budgetAbsolute: 0,
  effectiveDate: new Date(new Date().getFullYear(), 3, 1).toISOString().split("T")[0], // April 1st
  includeBonus: false,
};

// Transform employees into review employees
function transformToReviewEmployees(employees: Employee[]): ReviewEmployee[] {
  const activeEmployees = employees.filter(e => e.status === "active");
  return activeEmployees.map(employee => ({
    ...employee,
    proposedIncrease: 0,
    proposedPercentage: 0,
    newSalary: employee.baseSalary,
    isSelected: true,
    guidance: generateGuidance(employee),
  }));
}

export const useSalaryReview = create<SalaryReviewState>()(
  persist(
    (set, get) => {
      const initialEmployees: ReviewEmployee[] = [];
      const initialWorkflowByEmployee = buildWorkflowMap(initialEmployees);
      const totalCurrentPayroll = 0;
      
      return {
        settings: DEFAULT_SETTINGS,
        visibleColumns: DEFAULT_VISIBLE_COLUMNS,
        employees: initialEmployees,
        workflowByEmployee: initialWorkflowByEmployee,
        isLoading: false,
        isUsingMockData: false,
        activeProposal: null,
        proposalItemsByEmployee: {},
        approvalSteps: [],
        proposalNotes: [],
        proposalAuditEvents: [],
        isProposalLoading: false,
        approvalQueue: [],
        selectedApprovalProposalId: null,
        selectedApprovalProposal: null,
        selectedApprovalItemsByEmployee: {},
        selectedApprovalSteps: [],
        selectedApprovalNotes: [],
        selectedApprovalAuditEvents: [],
        isApprovalQueueLoading: false,
        isApprovalDetailLoading: false,
        totalCurrentPayroll,
        totalProposedPayroll: totalCurrentPayroll,
        totalIncrease: 0,
        budgetUsed: 0,
        budgetRemaining: totalCurrentPayroll * (DEFAULT_SETTINGS.budgetPercentage / 100),
        
        toggleColumnVisibility: (column) => set((state) => {
          const isVisible = state.visibleColumns.includes(column);
          if (column === "name") return state;
          return {
            visibleColumns: isVisible
              ? state.visibleColumns.filter((c) => c !== column)
              : [...state.visibleColumns, column],
          };
        }),

        resetColumns: () => set({ visibleColumns: DEFAULT_VISIBLE_COLUMNS }),

        updateSettings: (newSettings) => set((state) => {
          const updatedSettings = { ...state.settings, ...newSettings };
          const employees = state.employees;
          const totals = computeReviewTotals(employees, state.totalCurrentPayroll, updatedSettings);

          return {
            settings: updatedSettings,
            employees,
            ...totals,
          };
        }),
        
        updateEmployeeIncrease: (employeeId, increase) => set((state) => {
          const employees = state.employees.map(emp => {
            if (emp.id === employeeId) {
              const proposedPercentage = (increase / emp.baseSalary) * 100;
              return {
                ...emp,
                proposedIncrease: increase,
                proposedPercentage,
                newSalary: emp.baseSalary + increase,
              };
            }
            return emp;
          });
          
          return {
            employees,
            ...computeReviewTotals(employees, state.totalCurrentPayroll, state.settings),
          };
        }),
        
        toggleEmployeeSelection: (employeeId) => set((state) => {
          const employees = state.employees.map(emp => 
            emp.id === employeeId ? { ...emp, isSelected: !emp.isSelected } : emp
          );
          return {
            employees,
            ...computeReviewTotals(employees, state.totalCurrentPayroll, state.settings),
          };
        }),
        
        selectAll: () => set((state) => {
          const employees = state.employees.map(emp => ({ ...emp, isSelected: true }));
          return {
            employees,
            ...computeReviewTotals(employees, state.totalCurrentPayroll, state.settings),
          };
        }),
        
        deselectAll: () => set((state) => {
          const employees = state.employees.map(emp => ({ ...emp, isSelected: false }));
          return {
            employees,
            ...computeReviewTotals(employees, state.totalCurrentPayroll, state.settings),
          };
        }),
        
        applyDefaultIncreases: () => set((state) => {
          const budget = getBudgetAmount(state.settings, state.totalCurrentPayroll);
          const allocations = allocateBudgetByWeight(state.employees, budget);
          
          const employees = state.employees.map(emp => {
            if (!emp.isSelected) return emp;

            const proposedIncrease = allocations.get(emp.id) ?? 0;
            const proposedPercentage = (proposedIncrease / emp.baseSalary) * 100;
            
            return {
              ...emp,
              proposedIncrease,
              proposedPercentage,
              newSalary: emp.baseSalary + proposedIncrease,
            };
          });

          return {
            employees,
            ...computeReviewTotals(employees, state.totalCurrentPayroll, state.settings),
          };
        }),
        
        resetReview: () => set((state) => {
          const settings = DEFAULT_SETTINGS;
          const employees = clearReviewEmployees(state.employees);
          return {
            settings,
            employees,
            workflowByEmployee: buildWorkflowMap(employees),
            activeProposal: null,
            proposalItemsByEmployee: {},
            approvalSteps: [],
            proposalNotes: [],
            proposalAuditEvents: [],
            approvalQueue: [],
            selectedApprovalProposalId: null,
            selectedApprovalProposal: null,
            selectedApprovalItemsByEmployee: {},
            selectedApprovalSteps: [],
            selectedApprovalNotes: [],
            selectedApprovalAuditEvents: [],
            ...computeReviewTotals(employees, state.totalCurrentPayroll, settings),
          };
        }),
        
        loadEmployeesFromDb: async () => {
          set({ isLoading: true });
          try {
            const [employees, metrics] = await Promise.all([
              getEmployees(),
              getCompanyMetricsAsync(),
            ]);
            
            let reviewEmployees = transformToReviewEmployees(employees);
            const proposalItems = Object.values(get().proposalItemsByEmployee);
            if (proposalItems.length > 0) {
              reviewEmployees = applyProposalItemsToEmployees(reviewEmployees, proposalItems);
            }
            const previousWorkflow = get().workflowByEmployee;
            const workflowByEmployee = Object.fromEntries(
              reviewEmployees.map((employee) => [
                employee.id,
                previousWorkflow[employee.id] ?? defaultWorkflowState(employee),
              ])
            );
            const totalCurrentPayroll = metrics.totalPayroll;
            const totals = computeReviewTotals(reviewEmployees, totalCurrentPayroll, get().settings);
            
            set({
              employees: reviewEmployees,
              workflowByEmployee,
              isUsingMockData: false,
              totalCurrentPayroll,
              ...totals,
              isLoading: false,
            });
          } catch (error) {
            console.error("Failed to load employees:", error);
            set({ isLoading: false });
          }
        },

        updateEmployeeWorkflow: (employeeId, updates) => set((state) => {
          const existing = state.workflowByEmployee[employeeId];
          const employee = state.employees.find((emp) => emp.id === employeeId);
          if (!employee && !existing) return state;

          const baseState = existing ?? defaultWorkflowState(employee!);

          return {
            workflowByEmployee: {
              ...state.workflowByEmployee,
              [employeeId]: {
                ...baseState,
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

        applySuggestedIncrease: (employeeId) => set((state) => {
          const employees = state.employees.map((employee) => {
            if (employee.id !== employeeId) return employee;
            const proposedIncrease = computeSuggestedIncrease(employee);
            const proposedPercentage = employee.baseSalary > 0
              ? (proposedIncrease / employee.baseSalary) * 100
              : 0;
            return {
              ...employee,
              proposedIncrease,
              proposedPercentage,
              newSalary: employee.baseSalary + proposedIncrease,
            };
          });

          return {
            employees,
            ...computeReviewTotals(employees, state.totalCurrentPayroll, state.settings),
          };
        }),

        applyAiProposal: (plan, selectedEmployeeIds) => set((state) => {
          const selectedSet =
            selectedEmployeeIds && selectedEmployeeIds.length > 0
              ? new Set(selectedEmployeeIds)
              : null;
          const proposalMap = new Map(
            plan.items.map((item) => [item.employeeId, Math.max(0, item.proposedIncrease)])
          );

          const employees = state.employees.map((employee) => {
            const hasProposal = proposalMap.has(employee.id);
            if (!hasProposal) return employee;
            if (selectedSet && !selectedSet.has(employee.id)) return employee;

            const proposedIncrease = proposalMap.get(employee.id) ?? 0;
            const proposedPercentage =
              employee.baseSalary > 0 ? (proposedIncrease / employee.baseSalary) * 100 : 0;

            return {
              ...employee,
              proposedIncrease,
              proposedPercentage,
              newSalary: employee.baseSalary + proposedIncrease,
            };
          });

          return {
            employees,
            ...computeReviewTotals(employees, state.totalCurrentPayroll, state.settings),
          };
        }),

        loadLatestProposal: async () => {
          set({ isProposalLoading: true });
          try {
            const detail = await fetchLatestSalaryReviewProposal();
            if (!detail.proposal) {
              set({
                activeProposal: null,
                proposalItemsByEmployee: {},
                approvalSteps: [],
                proposalNotes: [],
                proposalAuditEvents: [],
                isProposalLoading: false,
              });
              return;
            }

            set((state) => {
              const employees = applyProposalItemsToEmployees(state.employees, detail.items);
              const settings = buildSettingsFromProposal(detail.proposal, state.settings);
              return {
                activeProposal: detail.proposal,
                proposalItemsByEmployee: buildProposalItemMap(detail.items),
                approvalSteps: detail.approvalSteps,
                proposalNotes: detail.notes,
                proposalAuditEvents: detail.auditEvents,
                settings,
                employees,
                ...computeReviewTotals(employees, state.totalCurrentPayroll, settings),
                isProposalLoading: false,
              };
            });
          } catch (error) {
            set({ isProposalLoading: false });
            throw error;
          }
        },

        loadApprovalProposalList: async () => {
          set({ isApprovalQueueLoading: true });
          try {
            const response = await fetchApprovalQueueSalaryReviewProposals();
            set((state) => {
              const approvalQueue = sortProposalQueue(response.proposals);
              const hasSelectedProposal =
                !!state.selectedApprovalProposalId &&
                approvalQueue.some((proposal) => proposal.id === state.selectedApprovalProposalId);

              return {
                approvalQueue,
                selectedApprovalProposalId: hasSelectedProposal ? state.selectedApprovalProposalId : null,
                selectedApprovalProposal: hasSelectedProposal ? state.selectedApprovalProposal : null,
                selectedApprovalItemsByEmployee: hasSelectedProposal ? state.selectedApprovalItemsByEmployee : {},
                selectedApprovalSteps: hasSelectedProposal ? state.selectedApprovalSteps : [],
                selectedApprovalNotes: hasSelectedProposal ? state.selectedApprovalNotes : [],
                selectedApprovalAuditEvents: hasSelectedProposal ? state.selectedApprovalAuditEvents : [],
                isApprovalQueueLoading: false,
              };
            });
          } catch (error) {
            set({ isApprovalQueueLoading: false });
            throw error;
          }
        },

        loadApprovalProposalDetail: async (proposalId) => {
          set({ isApprovalDetailLoading: true });
          try {
            const detail = await fetchSalaryReviewProposalDetail(proposalId);
            set((state) => ({
              approvalQueue: upsertProposalInQueue(state.approvalQueue, detail.proposal),
              selectedApprovalProposalId: detail.proposal?.id ?? proposalId,
              selectedApprovalProposal: detail.proposal,
              selectedApprovalItemsByEmployee: buildProposalItemMap(detail.items),
              selectedApprovalSteps: detail.approvalSteps,
              selectedApprovalNotes: detail.notes,
              selectedApprovalAuditEvents: detail.auditEvents,
              isApprovalDetailLoading: false,
            }));
          } catch (error) {
            set({ isApprovalDetailLoading: false });
            throw error;
          }
        },

        selectApprovalProposal: async (proposalId) => {
          if (!proposalId) {
            set({
              selectedApprovalProposalId: null,
              selectedApprovalProposal: null,
              selectedApprovalItemsByEmployee: {},
              selectedApprovalSteps: [],
              selectedApprovalNotes: [],
              selectedApprovalAuditEvents: [],
              isApprovalDetailLoading: false,
            });
            return;
          }

          set({ selectedApprovalProposalId: proposalId });
          await get().loadApprovalProposalDetail(proposalId);
        },

        reviewSelectedApprovalProposal: async (action, note) => {
          const proposalId = get().selectedApprovalProposalId;
          if (!proposalId) return;
          set({ isApprovalDetailLoading: true });
          try {
            const detail = await reviewSalaryReviewProposal(proposalId, { action, note });
            set((state) => ({
              approvalQueue: upsertProposalInQueue(state.approvalQueue, detail.proposal),
              selectedApprovalProposalId: detail.proposal?.id ?? proposalId,
              selectedApprovalProposal: detail.proposal,
              selectedApprovalItemsByEmployee: buildProposalItemMap(detail.items),
              selectedApprovalSteps: detail.approvalSteps,
              selectedApprovalNotes: detail.notes,
              selectedApprovalAuditEvents: detail.auditEvents,
              isApprovalDetailLoading: false,
            }));
          } catch (error) {
            set({ isApprovalDetailLoading: false });
            throw error;
          }
        },

        addApprovalProposalNote: async (note, employeeId, stepId) => {
          const proposalId = get().selectedApprovalProposalId;
          if (!proposalId || !note.trim()) return;
          set({ isApprovalDetailLoading: true });
          try {
            await addSalaryReviewProposalNote(proposalId, {
              note,
              employeeId,
              stepId,
            });
            const detail = await fetchSalaryReviewProposalDetail(proposalId);
            set((state) => ({
              approvalQueue: upsertProposalInQueue(state.approvalQueue, detail.proposal),
              selectedApprovalProposalId: detail.proposal?.id ?? proposalId,
              selectedApprovalProposal: detail.proposal,
              selectedApprovalItemsByEmployee: buildProposalItemMap(detail.items),
              selectedApprovalSteps: detail.approvalSteps,
              selectedApprovalNotes: detail.notes,
              selectedApprovalAuditEvents: detail.auditEvents,
              isApprovalDetailLoading: false,
            }));
          } catch (error) {
            set({ isApprovalDetailLoading: false });
            throw error;
          }
        },

        saveDraftProposal: async (source = "manual") => {
          const state = get();
          set({ isProposalLoading: true });
          try {
            const draftBody = {
              source,
              cycle: state.settings.cycle === "monthly" ? "monthly" : "annual",
              budgetType: state.settings.budgetType,
              budgetPercentage: state.settings.budgetPercentage,
              budgetAbsolute: state.settings.budgetAbsolute,
              effectiveDate: state.settings.effectiveDate,
              items: toDraftItems(state.employees),
            } as const;
            const detail = state.activeProposal?.id
              ? await updateSalaryReviewProposal(state.activeProposal.id, {
                  items: draftBody.items,
                  cycle: draftBody.cycle,
                  effectiveDate: draftBody.effectiveDate,
                  budgetType: draftBody.budgetType,
                  budgetPercentage: draftBody.budgetPercentage,
                  budgetAbsolute: draftBody.budgetAbsolute,
                })
              : await createSalaryReviewProposal(draftBody);

            set((current) => ({
              activeProposal: detail.proposal,
              proposalItemsByEmployee: buildProposalItemMap(detail.items),
              approvalSteps: detail.approvalSteps,
              proposalNotes: detail.notes,
              proposalAuditEvents: detail.auditEvents,
              settings: detail.proposal
                ? {
                    ...current.settings,
                    cycle: detail.proposal.cycle,
                    budgetType: detail.proposal.budget_type,
                    budgetPercentage: Number(detail.proposal.budget_percentage || 0),
                    budgetAbsolute: Number(detail.proposal.budget_absolute || 0),
                    effectiveDate: detail.proposal.effective_date,
                  }
                : current.settings,
              employees: applyProposalItemsToEmployees(current.employees, detail.items),
              ...computeReviewTotals(
                applyProposalItemsToEmployees(current.employees, detail.items),
                current.totalCurrentPayroll,
                detail.proposal
                  ? {
                      ...current.settings,
                      cycle: detail.proposal.cycle,
                      budgetType: detail.proposal.budget_type,
                      budgetPercentage: Number(detail.proposal.budget_percentage || 0),
                      budgetAbsolute: Number(detail.proposal.budget_absolute || 0),
                      effectiveDate: detail.proposal.effective_date,
                    }
                  : current.settings
              ),
              isProposalLoading: false,
            }));
          } catch (error) {
            set({ isProposalLoading: false });
            throw error;
          }
        },

        submitActiveProposal: async () => {
          const proposalId = get().activeProposal?.id;
          if (!proposalId) return;
          set({ isProposalLoading: true });
          try {
            const detail = await submitSalaryReviewProposal(proposalId);
            set((state) => ({
              activeProposal: detail.proposal,
              proposalItemsByEmployee: buildProposalItemMap(detail.items),
              approvalSteps: detail.approvalSteps,
              proposalNotes: detail.notes,
              proposalAuditEvents: detail.auditEvents,
              approvalQueue: upsertProposalInQueue(state.approvalQueue, detail.proposal),
              selectedApprovalProposalId: detail.proposal?.id ?? state.selectedApprovalProposalId,
              selectedApprovalProposal: detail.proposal,
              selectedApprovalItemsByEmployee: buildProposalItemMap(detail.items),
              selectedApprovalSteps: detail.approvalSteps,
              selectedApprovalNotes: detail.notes,
              selectedApprovalAuditEvents: detail.auditEvents,
              employees: applyProposalItemsToEmployees(state.employees, detail.items),
              ...computeReviewTotals(
                applyProposalItemsToEmployees(state.employees, detail.items),
                state.totalCurrentPayroll,
                state.settings
              ),
              isProposalLoading: false,
            }));
          } catch (error) {
            set({ isProposalLoading: false });
            throw error;
          }
        },

        reviewActiveProposal: async (action, note) => {
          const proposalId = get().activeProposal?.id;
          if (!proposalId) return;
          set({ isProposalLoading: true });
          try {
            const detail = await reviewSalaryReviewProposal(proposalId, { action, note });
            set((state) => ({
              activeProposal: detail.proposal,
              proposalItemsByEmployee: buildProposalItemMap(detail.items),
              approvalSteps: detail.approvalSteps,
              proposalNotes: detail.notes,
              proposalAuditEvents: detail.auditEvents,
              approvalQueue: upsertProposalInQueue(state.approvalQueue, detail.proposal),
              selectedApprovalProposalId:
                state.selectedApprovalProposalId === proposalId
                  ? detail.proposal?.id ?? proposalId
                  : state.selectedApprovalProposalId,
              selectedApprovalProposal:
                state.selectedApprovalProposalId === proposalId
                  ? detail.proposal
                  : state.selectedApprovalProposal,
              selectedApprovalItemsByEmployee:
                state.selectedApprovalProposalId === proposalId
                  ? buildProposalItemMap(detail.items)
                  : state.selectedApprovalItemsByEmployee,
              selectedApprovalSteps:
                state.selectedApprovalProposalId === proposalId
                  ? detail.approvalSteps
                  : state.selectedApprovalSteps,
              selectedApprovalNotes:
                state.selectedApprovalProposalId === proposalId
                  ? detail.notes
                  : state.selectedApprovalNotes,
              selectedApprovalAuditEvents:
                state.selectedApprovalProposalId === proposalId
                  ? detail.auditEvents
                  : state.selectedApprovalAuditEvents,
              employees: applyProposalItemsToEmployees(state.employees, detail.items),
              ...computeReviewTotals(
                applyProposalItemsToEmployees(state.employees, detail.items),
                state.totalCurrentPayroll,
                state.settings
              ),
              isProposalLoading: false,
            }));
          } catch (error) {
            set({ isProposalLoading: false });
            throw error;
          }
        },

        addProposalNote: async (note, employeeId, stepId) => {
          const proposalId = get().activeProposal?.id;
          if (!proposalId || !note.trim()) return;
          try {
            await addSalaryReviewProposalNote(proposalId, {
              note,
              employeeId,
              stepId,
            });
            const detail = await fetchLatestSalaryReviewProposal();
            if (!detail.proposal) return;
            set((state) => ({
              activeProposal: detail.proposal,
              proposalItemsByEmployee: buildProposalItemMap(detail.items),
              approvalSteps: detail.approvalSteps,
              proposalNotes: detail.notes,
              proposalAuditEvents: detail.auditEvents,
              employees: applyProposalItemsToEmployees(state.employees, detail.items),
              ...computeReviewTotals(
                applyProposalItemsToEmployees(state.employees, detail.items),
                state.totalCurrentPayroll,
                state.settings
              ),
            }));
          } catch (error) {
            throw error;
          }
        },
      };
    },
    {
      name: "qeemly:salary-review",
      partialize: (state) => ({
        settings: state.settings,
        visibleColumns: state.visibleColumns,
        workflowByEmployee: state.workflowByEmployee,
      }),
    }
  )
);
