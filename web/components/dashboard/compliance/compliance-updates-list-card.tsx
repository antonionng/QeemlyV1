"use client";

import {
  Scale,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { type RegulatoryUpdate } from "@/lib/compliance/data";
import { useComplianceContext } from "@/lib/compliance/context";
import clsx from "clsx";

type Props = { onItemClick: (item: RegulatoryUpdate) => void };

export function ComplianceUpdatesCard({ onItemClick }: Props) {
  const { regulatoryUpdates } = useComplianceContext();

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-brand-900">
            Recent Regulatory Updates
          </h3>
          <p className="text-xs text-accent-500">
            Stay compliant with local laws
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 border border-brand-200">
          {regulatoryUpdates.length} New Updates
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {regulatoryUpdates.map((update) => (
          <button
            key={update.id}
            type="button"
            onClick={() => onItemClick(update)}
            className="group w-full text-left flex flex-col gap-3 rounded-xl border border-border bg-white p-4 transition-all hover:border-brand-200 hover:bg-brand-50/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm border border-border text-brand-600">
                  <Scale className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-accent-500 uppercase tracking-wider">
                  {update.jurisdiction}
                </span>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                  update.impact === "High" &&
                    "bg-red-50 text-red-600 border-red-100",
                  update.impact === "Medium" &&
                    "bg-amber-50 text-amber-600 border-amber-100",
                  update.impact === "Low" &&
                    "bg-blue-50 text-blue-600 border-blue-100"
                )}
              >
                {update.impact} Impact
              </span>
            </div>

            <div>
              <h5 className="text-sm font-bold text-brand-900 group-hover:text-brand-600 transition-colors">
                {update.title}
              </h5>
              <p className="mt-1 text-xs leading-relaxed text-accent-500 line-clamp-2">
                {update.description}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-accent-500">
                  <Clock className="h-3.5 w-3.5" />
                  {update.date}
                </span>
                {update.status === "Active" ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </span>
                ) : update.status === "Pending" ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Pending
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-accent-500">
                    <Clock className="h-3.5 w-3.5" />
                    Review
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-brand-600 flex items-center gap-1 group-hover:underline">
                View Details
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
