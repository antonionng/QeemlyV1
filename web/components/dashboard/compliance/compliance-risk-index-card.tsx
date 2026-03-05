"use client";

import { AlertTriangle, Info } from "lucide-react";
import { type RiskItem } from "@/lib/compliance/data";
import { useComplianceContext } from "@/lib/compliance/context";

type Props = { onItemClick: (item: RiskItem) => void };

function barColor(level: number) {
  if (level > 70) return "bg-red-500";
  if (level > 40) return "bg-amber-500";
  return "bg-emerald-500";
}

function textColor(level: number) {
  if (level > 70) return "text-red-600";
  if (level > 40) return "text-amber-600";
  return "text-emerald-600";
}

export function ComplianceRiskIndexCard({ onItemClick }: Props) {
  const { riskItems } = useComplianceContext();
  const hasHighRisk = riskItems.some((risk) => risk.level > 70);

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-brand-900">Risk Heatmap</h3>
        <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
          <AlertTriangle className="h-3 w-3" />
          {hasHighRisk ? "High Risk" : "Stable"}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {riskItems.map((risk) => (
          <button
            key={risk.id}
            type="button"
            onClick={() => onItemClick(risk)}
            className="w-full space-y-2 text-left transition-colors hover:bg-accent-50 -mx-2 px-2 py-1 rounded-lg"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-700">{risk.area}</span>
              <span className={`font-bold ${textColor(risk.level)}`}>
                {risk.level}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-accent-100">
              <div
                className={`h-full transition-all duration-700 ${barColor(risk.level)}`}
                style={{ width: `${risk.level}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-accent-50 p-4 border border-accent-200/60">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-accent-600">
            Risk scores are calculated based on <span className="font-bold">missing documentation</span>,{" "}
            <span className="font-bold">expired licenses</span>, and{" "}
            <span className="font-bold">recent legislative changes</span> in your operating jurisdictions.
          </p>
        </div>
      </div>
    </div>
  );
}
