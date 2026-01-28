"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useBenchmarks, type BenchmarksState } from "./use-benchmarks";

const BenchmarksContext = createContext<BenchmarksState | null>(null);

export function BenchmarksProvider({ children }: { children: ReactNode }) {
  const benchmarks = useBenchmarks();
  
  return (
    <BenchmarksContext.Provider value={benchmarks}>
      {children}
    </BenchmarksContext.Provider>
  );
}

export function useBenchmarksContext() {
  const context = useContext(BenchmarksContext);
  if (!context) {
    throw new Error("useBenchmarksContext must be used within a BenchmarksProvider");
  }
  return context;
}
