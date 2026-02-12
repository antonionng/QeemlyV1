"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SalaryViewMode } from "@/components/ui/salary-view-toggle";

interface SalaryViewState {
  salaryView: SalaryViewMode;
  setSalaryView: (view: SalaryViewMode) => void;
}

export const useSalaryView = create<SalaryViewState>()(
  persist(
    (set) => ({
      salaryView: "annual",
      setSalaryView: (view) => set({ salaryView: view }),
    }),
    {
      name: "qeemly-salary-view",
    }
  )
);

/**
 * Helper to apply salary view conversion.
 * If salaryView is "monthly", divides annual value by 12.
 * If salaryView is "annual", returns the value as-is.
 * Assumes input values are annual.
 */
export function applyViewMode(annualValue: number, salaryView: SalaryViewMode): number {
  return salaryView === "monthly" ? annualValue / 12 : annualValue;
}
