"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { useComplianceContext } from "@/lib/compliance/context";

export function ComplianceTopStrip() {
  const { complianceScore, activeEmployees, refresh, refreshing } = useComplianceContext();
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-600">
            {complianceScore.toFixed(1)}% Compliance Score
          </span>
        </div>
        <div className="hidden items-center gap-2 text-sm text-accent-500 sm:flex">
          <span className="text-accent-400">Active Employees</span>
          <span className="font-semibold text-brand-700">{activeEmployees}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          void refresh();
        }}
        disabled={refreshing}
        className="flex items-center gap-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-700"
      >
        {refreshing ? "Refreshing..." : "Refresh"}
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
