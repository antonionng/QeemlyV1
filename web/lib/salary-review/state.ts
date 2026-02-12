// Salary Review State Management

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  type Employee, 
  MOCK_EMPLOYEES, 
  getCompanyMetrics,
  type PerformanceRating,
  computeTenure,
} from "../employees";
import { type ReviewCycle } from "../company";

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

export interface SalaryReviewState {
  // Settings
  settings: ReviewSettings;
  
  // Employees
  employees: ReviewEmployee[];
  
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
  selectAll: () => void;
  deselectAll: () => void;
  applyDefaultIncreases: () => void;
  resetReview: () => void;
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

// Initialize employees with review data
function initializeEmployees(): ReviewEmployee[] {
  const activeEmployees = MOCK_EMPLOYEES.filter(e => e.status === "active");
  
  return activeEmployees.map(employee => ({
    ...employee,
    proposedIncrease: 0,
    proposedPercentage: 0,
    newSalary: employee.baseSalary,
    isSelected: true,
    guidance: generateGuidance(employee),
  }));
}

const DEFAULT_SETTINGS: ReviewSettings = {
  cycle: "annual",
  budgetType: "percentage",
  budgetPercentage: 5,
  budgetAbsolute: 0,
  effectiveDate: new Date(new Date().getFullYear(), 3, 1).toISOString().split("T")[0], // April 1st
  includeBonus: false,
};

export const useSalaryReview = create<SalaryReviewState>()(
  persist(
    (set, get) => {
      const initialEmployees = initializeEmployees();
      const metrics = getCompanyMetrics();
      const totalCurrentPayroll = metrics.totalPayroll;
      
      return {
        settings: DEFAULT_SETTINGS,
        employees: initialEmployees,
        totalCurrentPayroll,
        totalProposedPayroll: totalCurrentPayroll,
        totalIncrease: 0,
        budgetUsed: 0,
        budgetRemaining: totalCurrentPayroll * (DEFAULT_SETTINGS.budgetPercentage / 100),
        
        updateSettings: (newSettings) => set((state) => {
          const updatedSettings = { ...state.settings, ...newSettings };
          const budget = updatedSettings.budgetType === "percentage"
            ? state.totalCurrentPayroll * (updatedSettings.budgetPercentage / 100)
            : updatedSettings.budgetAbsolute;
          
          return {
            settings: updatedSettings,
            budgetRemaining: budget - state.totalIncrease,
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
          employees: initializeEmployees(),
          totalIncrease: 0,
          budgetUsed: 0,
        }),
      };
    },
    {
      name: "qeemly:salary-review",
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
