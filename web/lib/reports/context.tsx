"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useReports, type ReportsState } from "./use-reports";

const ReportsContext = createContext<ReportsState | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const reports = useReports();
  
  return (
    <ReportsContext.Provider value={reports}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReportsContext() {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReportsContext must be used within a ReportsProvider");
  }
  return context;
}
