"use client";

import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useComplianceContext } from "@/lib/compliance/context";

export function ComplianceTopStrip() {
  const { complianceScore, activeEmployees, dataWarnings, refresh, refreshing } = useComplianceContext();
  const hasWarnings = dataWarnings.length > 0;
  return (
    <div className="rounded-2xl border border-border bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-600">
              {complianceScore.toFixed(1)}% Unified Risk Score
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
      {hasWarnings && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertCircle className="h-4 w-4" />
          <span>
            Fallback data is active for one or more sections while upstream records are missing.
          </span>
        </div>
      )}
    </div>
  );
}
