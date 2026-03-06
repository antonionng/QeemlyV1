"use client";

import { FileText, Shield, History, User, Clock } from "lucide-react";
import { type AuditLogItem } from "@/lib/compliance/data";
import { useComplianceContext } from "@/lib/compliance/context";

type Props = {
  onItemClick: (item: AuditLogItem) => void;
  onViewAll: () => void;
};

const ICON_MAP: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  document: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  policy: { icon: Shield, color: "text-emerald-500", bg: "bg-emerald-50" },
  risk: { icon: History, color: "text-brand-500", bg: "bg-brand-50" },
  user: { icon: User, color: "text-amber-500", bg: "bg-amber-50" },
};

export function ComplianceSideAudit({ onItemClick, onViewAll }: Props) {
  const { auditLogItems } = useComplianceContext();
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-brand-900">Audit Log</h4>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-brand-600 hover:underline"
        >
          View All
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {auditLogItems.map((log) => {
          const meta = ICON_MAP[log.iconType] ?? ICON_MAP.document;
          const Icon = meta.icon;
          return (
            <button
              key={log.id}
              type="button"
              onClick={() => onItemClick(log)}
              className="flex w-full gap-3 text-left hover:bg-accent-50 -mx-1 px-1 py-1 rounded-lg transition-colors"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 border-b border-border pb-3">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-brand-900 truncate pr-2">
                    {log.action}:{" "}
                    <span className="font-medium text-accent-600">
                      {log.target}
                    </span>
                  </p>
                  <span className="flex items-center gap-1 shrink-0 text-[10px] text-accent-400">
                    <Clock className="h-3 w-3" />
                    {log.time}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-accent-500">
                  By{" "}
                  <span className="font-medium text-brand-700">{log.user}</span>
                </p>
              </div>
            </button>
          );
        })}
        {auditLogItems.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-accent-500">
            No audit activity captured yet.
          </p>
        )}
      </div>
    </div>
  );
}
