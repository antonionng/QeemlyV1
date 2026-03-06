"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { type PolicyItem } from "@/lib/compliance/data";
import { useComplianceContext } from "@/lib/compliance/context";
import clsx from "clsx";

type Props = { onItemClick: (item: PolicyItem) => void };

export function CompliancePolicyCard({ onItemClick }: Props) {
  const { policyItems } = useComplianceContext();
  const avgCompletion = policyItems.length > 0
    ? (policyItems.reduce((sum, item) => sum + item.rate, 0) / policyItems.length).toFixed(1)
    : "0.0";

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-brand-900">
          Policy Compliance
        </h3>
        <span className="text-[11px] font-medium text-accent-500">
          Avg. Completion:{" "}
          <span className="font-bold text-brand-900">{avgCompletion}%</span>
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {policyItems.map((policy) => (
          <button
            key={policy.id}
            type="button"
            onClick={() => onItemClick(policy)}
            className="w-full space-y-2 text-left transition-colors hover:bg-accent-50 -mx-2 px-2 py-1 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-accent-400" />
                <span className="text-xs font-medium text-brand-700">
                  {policy.name}
                </span>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                  policy.status === "Success" &&
                    "bg-emerald-50 text-emerald-600 border-emerald-100",
                  policy.status === "Pending" &&
                    "bg-amber-50 text-amber-600 border-amber-100",
                  policy.status === "Critical" &&
                    "bg-red-50 text-red-600 border-red-100"
                )}
              >
                {policy.rate}% Signed
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent-100">
              <div
                className={clsx(
                  "h-full transition-all",
                  policy.status === "Success" && "bg-emerald-500",
                  policy.status === "Pending" && "bg-amber-500",
                  policy.status === "Critical" && "bg-red-500"
                )}
                style={{ width: `${policy.rate}%` }}
              />
            </div>
          </button>
        ))}
        {policyItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-accent-500">
            <p>No policy records are available yet. Add policies in Workforce Compliance settings to track completion.</p>
            <Link
              href="/dashboard/settings?tab=compliance"
              className="mt-2 inline-block font-semibold text-brand-700 hover:text-brand-900"
            >
              Add policy records
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
