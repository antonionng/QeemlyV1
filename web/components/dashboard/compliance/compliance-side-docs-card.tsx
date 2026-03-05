"use client";

import { FileText, AlertCircle } from "lucide-react";
import { type DocumentItem } from "@/lib/compliance/data";
import { useComplianceContext } from "@/lib/compliance/context";
import clsx from "clsx";

type Props = {
  onItemClick: (item: DocumentItem) => void;
  onViewAll: () => void;
};

export function ComplianceSideDocs({ onItemClick, onViewAll }: Props) {
  const { documentItems } = useComplianceContext();
  const expiringDoc = documentItems.find((d) => d.status === "Expiring");

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h4 className="text-sm font-bold text-brand-900">
        Compliance Documents
      </h4>

      <div className="mt-4 space-y-2">
        {documentItems.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => onItemClick(doc)}
            className="group flex w-full items-center justify-between rounded-xl border border-border bg-white p-3 text-left transition-all hover:border-brand-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-brand-900">
                  {doc.name}
                </p>
                <p className="mt-0.5 text-[10px] text-accent-500">
                  {doc.docType} &bull; {doc.size}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 ml-2">
              <span className="text-[10px] font-bold text-accent-500 uppercase tracking-tight">
                Expiry
              </span>
              <span
                className={clsx(
                  "text-[11px] font-medium",
                  doc.status === "Expiring"
                    ? "text-red-500 font-bold"
                    : "text-brand-700"
                )}
              >
                {doc.expiry}
              </span>
            </div>
          </button>
        ))}
      </div>

      {expiringDoc && (
        <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/30 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-1 text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-900">Renewal Alert</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-accent-600">
                The <span className="font-bold">{expiringDoc.name}</span>{" "}
                expires soon. Start the renewal process to avoid a lapse in
                coverage.
              </p>
            </div>
          </div>
        </div>
      )}

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
