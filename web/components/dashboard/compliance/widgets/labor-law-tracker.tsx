"use client";

import { Badge } from "@/components/ui/badge";
import { Scale, ArrowRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const UPDATES = [
  {
    id: 1,
    title: "UAE Labour Law Update",
    description: "New regulations on non-compete clauses and termination procedures.",
    date: "Jan 15, 2026",
    status: "Active",
    impact: "High",
    jurisdiction: "UAE",
  },
  {
    id: 2,
    title: "Saudi Nitaqat Quotas",
    description: "Adjustments to Saudization percentages for the technology sector.",
    date: "Dec 20, 2025",
    status: "Pending",
    impact: "Medium",
    jurisdiction: "KSA",
  },
  {
    id: 3,
    title: "Gratuity Calculation",
    description: "Clarification on end-of-service benefits for part-time employees.",
    date: "Nov 28, 2025",
    status: "Review",
    impact: "Low",
    jurisdiction: "Qatar",
  },
];

export function LaborLawTrackerWidget() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-brand-900">Recent Regulatory Updates</h4>
          <p className="text-xs text-brand-500">Stay compliant with local laws</p>
        </div>
        <Badge variant="ghost" className="bg-brand-50 text-brand-700 border-brand-200">
          3 New Updates
        </Badge>
      </div>

      <div className="space-y-3">
        {UPDATES.map((update) => (
          <div
            key={update.id}
            className="group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-white/50 p-4 transition-all hover:border-brand-200 hover:bg-brand-50/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm border border-border/40 text-brand-600">
                  <Scale className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">{update.jurisdiction}</span>
              </div>
              <Badge 
                variant="ghost" 
                className={
                  update.impact === "High" ? "bg-red-50 text-red-600 border-red-100" : 
                  update.impact === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" : 
                  "bg-blue-50 text-blue-600 border-blue-100"
                }
              >
                {update.impact} Impact
              </Badge>
            </div>

            <div>
              <h5 className="text-[14px] font-bold text-brand-900 group-hover:text-brand-600 transition-colors">
                {update.title}
              </h5>
              <p className="mt-1 text-xs leading-relaxed text-brand-600 line-clamp-2">
                {update.description}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[11px] text-brand-500">
                  <Clock className="h-3.5 w-3.5" />
                  {update.date}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  {update.status === "Active" ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {update.status}
                    </span>
                  ) : update.status === "Pending" ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {update.status}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-brand-500">
                      <Clock className="h-3.5 w-3.5" />
                      {update.status}
                    </span>
                  )}
                </div>
              </div>
              <button className="text-[11px] font-bold text-brand-600 flex items-center gap-1 hover:underline">
                View Details
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
