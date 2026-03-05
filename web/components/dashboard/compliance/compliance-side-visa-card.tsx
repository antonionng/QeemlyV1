"use client";

import { AlertTriangle, CheckCircle2, Plane } from "lucide-react";
import {
  type VisaTimelineItem,
} from "@/lib/compliance/data";
import { useComplianceContext } from "@/lib/compliance/context";
import clsx from "clsx";

type Props = {
  onItemClick: (item: VisaTimelineItem) => void;
  onViewAll: () => void;
};

const VALUE_COLORS: Record<string, string> = {
  brand: "text-brand-900",
  amber: "text-amber-600",
  red: "text-red-600",
  emerald: "text-emerald-600",
};

export function ComplianceSideVisa({ onItemClick, onViewAll }: Props) {
  const { visaStats, visaTimeline } = useComplianceContext();
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h4 className="text-sm font-bold text-brand-900">
        Visa &amp; Permit Status
      </h4>

      {/* 2x2 KPI grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {visaStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-accent-50/50 p-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent-500">
              {stat.label}
            </p>
            <p className={clsx("mt-1 text-xl font-bold", VALUE_COLORS[stat.color])}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="mt-5 space-y-4">
        <h5 className="text-xs font-bold text-brand-900 uppercase tracking-tight">
          Timeline view
        </h5>
        <div className="relative space-y-4 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-brand-100">
          {visaTimeline.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => onItemClick(step)}
              className="relative w-full pl-7 text-left hover:bg-accent-50 -mx-1 px-1 pl-7 py-1 rounded-lg transition-colors"
            >
              <div
                className={clsx(
                  "absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 z-10",
                  step.type === "Critical" && "border-red-500",
                  step.type === "Success" && "border-emerald-500",
                  step.type === "Update" && "border-brand-500"
                )}
              >
                <div
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    step.type === "Critical" && "bg-red-500",
                    step.type === "Success" && "bg-emerald-500",
                    step.type === "Update" && "bg-brand-500"
                  )}
                />
              </div>
              <p className="text-xs font-bold text-brand-900">{step.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[11px] text-accent-500">
                  {step.description}
                </p>
                <span
                  className={clsx(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold border-transparent",
                    step.type === "Critical" && "bg-red-50 text-red-500",
                    step.type === "Success" && "bg-emerald-50 text-emerald-500",
                    step.type === "Update" && "bg-brand-50 text-brand-500"
                  )}
                >
                  {step.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onViewAll}
        className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-brand-500 text-xs font-bold text-white transition-colors hover:bg-brand-600"
      >
        View All
      </button>
    </div>
  );
}
