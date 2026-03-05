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
  "location",
  "current",
  "basic",
  "housing",
  "transport",
  "other",
  "proposed",
  "increase",
  "band",
  "performance",
  "guidance",
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
          const oldCycle = state.settings.cycle;
          const updatedSettings = { ...state.settings, ...newSettings };
          const budget = updatedSettings.budgetType === "percentage"
            ? state.totalCurrentPayroll * (updatedSettings.budgetPercentage / 100)
            : updatedSettings.budgetAbsolute;

          let employees = state.employees;
          let totalIncrease = state.totalIncrease;

          if (newSettings.cycle && newSettings.cycle !== oldCycle) {
            const isToMonthly = newSettings.cycle === 'monthly' && oldCycle !== 'monthly';
            const isFromMonthly = oldCycle === 'monthly' && newSettings.cycle !== 'monthly';

            if (isToMonthly || isFromMonthly) {
              const factor = isToMonthly ? 1 / 12 : 12;
              employees = state.employees.map(emp => {
                const proposedIncrease = Math.round(emp.proposedIncrease * factor);
                const newSalary = Math.round(emp.baseSalary * factor) + proposedIncrease;
                const proposedPercentage = emp.baseSalary > 0
                  ? (proposedIncrease / Math.round(emp.baseSalary * factor)) * 100
                  : 0;
                return {
                  ...emp,
                  proposedIncrease,
                  proposedPercentage,
                  newSalary,
                };
              });
              totalIncrease = employees
                .filter(e => e.isSelected)
                .reduce((sum, e) => sum + e.proposedIncrease, 0);
            }
          }

          return {
            settings: updatedSettings,
            employees,
            totalIncrease,
            totalProposedPayroll: state.totalCurrentPayroll + totalIncrease,
            budgetUsed: totalIncrease,
            budgetRemaining: budget - totalIncrease,
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
          
          const totalIncrease = employees
            .filter(e => e.isSelected)
            .reduce((sum, e) => sum + e.proposedIncrease, 0);
          
          const budget = state.settings.budgetType === "percentage"
            ? state.totalCurrentPayroll * (state.settings.budgetPercentage / 100)
            : state.settings.budgetAbsolute;
          
          return {
            employees,
            totalIncrease,
            totalProposedPayroll: state.totalCurrentPayroll + totalIncrease,
            budgetUsed: totalIncrease,
            budgetRemaining: budget - totalIncrease,
          };
        }),
        
        toggleEmployeeSelection: (employeeId) => set((state) => ({
          employees: state.employees.map(emp => 
            emp.id === employeeId ? { ...emp, isSelected: !emp.isSelected } : emp
          ),
        })),
        
        selectAll: () => set((state) => ({
          employees: state.employees.map(emp => ({ ...emp, isSelected: true })),
        })),
        
        deselectAll: () => set((state) => ({
          employees: state.employees.map(emp => ({ ...emp, isSelected: false })),
        })),
        
        applyDefaultIncreases: () => set((state) => {
          const budget = state.settings.budgetType === "percentage"
            ? state.totalCurrentPayroll * (state.settings.budgetPercentage / 100)
            : state.settings.budgetAbsolute;
          
          const selectedEmployees = state.employees.filter(e => e.isSelected);
          const totalSelectedPayroll = selectedEmployees.reduce((sum, e) => sum + e.baseSalary, 0);
          
          // Distribute budget proportionally
          const employees = state.employees.map(emp => {
            if (!emp.isSelected) return emp;
            
            // Base increase is proportional to salary
            let increaseRatio = emp.baseSalary / totalSelectedPayroll;
            
            // Adjust based on band position
            if (emp.bandPosition === "below") {
              increaseRatio *= 1.3; // 30% more for those below band
            } else if (emp.bandPosition === "above") {
              increaseRatio *= 0.7; // 30% less for those above band
            }
            
            // Adjust based on performance
            if (emp.performanceRating === "exceptional") {
              increaseRatio *= 1.4;
            } else if (emp.performanceRating === "exceeds") {
              increaseRatio *= 1.2;
            } else if (emp.performanceRating === "low") {
              increaseRatio *= 0.5;
            }
            
            const proposedIncrease = Math.round((budget * increaseRatio) / 100) * 100;
            const proposedPercentage = (proposedIncrease / emp.baseSalary) * 100;
            
            return {
              ...emp,
              proposedIncrease,
              proposedPercentage,
              newSalary: emp.baseSalary + proposedIncrease,
            };
          });
          
          const totalIncrease = employees
            .filter(e => e.isSelected)
            .reduce((sum, e) => sum + e.proposedIncrease, 0);
          
          return {
            employees,
            totalIncrease,
            totalProposedPayroll: state.totalCurrentPayroll + totalIncrease,
            budgetUsed: totalIncrease,
            budgetRemaining: budget - totalIncrease,
          };
        }),
        
        resetReview: () => set({
          settings: DEFAULT_SETTINGS,
          employees: initialEmployees,
          workflowByEmployee: initialWorkflowByEmployee,
          totalIncrease: 0,
          budgetUsed: 0,
        }),
        
        loadEmployeesFromDb: async () => {
          set({ isLoading: true });
          try {
            const [employees, metrics] = await Promise.all([
              getEmployees(),
              getCompanyMetricsAsync(),
            ]);
            
            const reviewEmployees = transformToReviewEmployees(employees);
            const previousWorkflow = get().workflowByEmployee;
            const workflowByEmployee = Object.fromEntries(
              reviewEmployees.map((employee) => [
                employee.id,
                previousWorkflow[employee.id] ?? defaultWorkflowState(employee),
              ])
            );
            const totalCurrentPayroll = metrics.totalPayroll;
            const budget = get().settings.budgetType === "percentage"
              ? totalCurrentPayroll * (get().settings.budgetPercentage / 100)
              : get().settings.budgetAbsolute;
            
            set({
              employees: reviewEmployees,
              workflowByEmployee,
              isUsingMockData: false,
              totalCurrentPayroll,
              totalProposedPayroll: totalCurrentPayroll,
              totalIncrease: 0,
              budgetUsed: 0,
              budgetRemaining: budget,
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

          const totalIncrease = employees
            .filter(e => e.isSelected)
            .reduce((sum, e) => sum + e.proposedIncrease, 0);

          const budget = state.settings.budgetType === "percentage"
            ? state.totalCurrentPayroll * (state.settings.budgetPercentage / 100)
            : state.settings.budgetAbsolute;

          return {
            employees,
            totalIncrease,
            totalProposedPayroll: state.totalCurrentPayroll + totalIncrease,
            budgetUsed: totalIncrease,
            budgetRemaining: budget - totalIncrease,
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

          const totalIncrease = employees
            .filter((employee) => employee.isSelected)
            .reduce((sum, employee) => sum + employee.proposedIncrease, 0);

          const budget =
            state.settings.budgetType === "percentage"
              ? state.totalCurrentPayroll * (state.settings.budgetPercentage / 100)
              : state.settings.budgetAbsolute;

          return {
            employees,
            totalIncrease,
            totalProposedPayroll: state.totalCurrentPayroll + totalIncrease,
            budgetUsed: totalIncrease,
            budgetRemaining: budget - totalIncrease,
          };
        }),
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
