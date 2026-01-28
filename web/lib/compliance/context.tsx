"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCompliance, type ComplianceState } from "./use-compliance";

const ComplianceContext = createContext<ComplianceState | null>(null);

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const compliance = useCompliance();
  
  return (
    <ComplianceContext.Provider value={compliance}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useComplianceContext() {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error("useComplianceContext must be used within a ComplianceProvider");
  }
  return context;
}
