"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";

const RISKS = [
  { area: "Data Privacy", level: 85, status: "Critical" },
  { area: "Employment Contracts", level: 40, status: "Moderate" },
  { area: "Pay Equity", level: 15, status: "Low" },
  { area: "Visa Compliance", level: 65, status: "High" },
  { area: "Health & Safety", level: 30, status: "Low" },
];

export function RiskHeatmapWidget() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-bold text-brand-900">Organizational Risk Index</h5>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
          <AlertTriangle className="h-3 w-3" />
          High Risk
        </div>
      </div>

      <div className="space-y-5">
        {RISKS.map((risk) => (
          <div key={risk.area} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-700">{risk.area}</span>
              <span className={`font-bold ${
                risk.level > 70 ? "text-red-600" : 
                risk.level > 40 ? "text-amber-600" : 
                "text-emerald-600"
              }`}>
                {risk.level}% Risk
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className={`h-full transition-all duration-1000 ${
                  risk.level > 70 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : 
                  risk.level > 40 ? "bg-amber-500" : 
                  "bg-emerald-500"
                }`} 
                style={{ width: `${risk.level}%` }} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-600">
            Risk scores are calculated based on <span className="font-bold">missing documentation</span>, <span className="font-bold">expired licenses</span>, and <span className="font-bold">recent legislative changes</span> in your operating jurisdictions.
          </p>
        </div>
      </div>
    </div>
  );
}
