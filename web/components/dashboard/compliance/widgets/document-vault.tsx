"use client";

import { Badge } from "@/components/ui/badge";
import { FileText, Lock, MoreHorizontal, Download, Eye, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const DOCUMENTS = [
  {
    name: "Trade License 2026",
    type: "PDF",
    expiry: "Mar 12, 2026",
    status: "Active",
    size: "1.2 MB",
  },
  {
    name: "Employee Handbook V4",
    type: "DOCX",
    expiry: "N/A",
    status: "Review",
    size: "4.5 MB",
  },
  {
    name: "VAT Registration",
    type: "PDF",
    expiry: "Permanent",
    status: "Active",
    size: "840 KB",
  },
  {
    name: "Group Insurance Policy",
    type: "PDF",
    expiry: "Feb 05, 2026",
    status: "Expiring",
    size: "2.1 MB",
  },
];

export function DocumentVaultWidget() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Lock className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-brand-900">Compliance Vault</span>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-brand-200">
          Upload New
        </Button>
      </div>

      <div className="space-y-2">
        {DOCUMENTS.map((doc) => (
          <div
            key={doc.name}
            className="group flex items-center justify-between rounded-xl border border-border/40 bg-white p-3 transition-all hover:border-brand-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h5 className="truncate text-xs font-bold text-brand-900">{doc.name}</h5>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-brand-500">
                  <span>{doc.type}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-tight">Expiry</span>
                <span className={doc.status === "Expiring" ? "text-[11px] font-bold text-red-500" : "text-[11px] font-medium text-brand-700"}>
                  {doc.expiry}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-brand-50 text-brand-500">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-brand-50 text-brand-500">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/30 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-100 p-1 text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-900">Renewal Alert</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-brand-600">
              The <span className="font-bold">Group Insurance Policy</span> expires in 8 days. Start the renewal process to avoid a lapse in coverage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
