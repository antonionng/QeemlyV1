"use client";

import clsx from "clsx";
import {
  Check,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
} from "lucide-react";
import { useIntegrationsStore } from "@/lib/integrations/store";
import type { IntegrationSyncLog, SyncLogStatus } from "@/lib/integrations/types";

type Props = {
  integrationId: string;
};

const STATUS_CONFIG: Record<
  SyncLogStatus,
  { label: string; color: string; bgColor: string; icon: typeof Check }
> = {
  success: { label: "Success", color: "text-emerald-700", bgColor: "bg-emerald-50", icon: Check },
  partial: { label: "Partial", color: "text-amber-700", bgColor: "bg-amber-50", icon: AlertTriangle },
  failed: { label: "Failed", color: "text-red-700", bgColor: "bg-red-50", icon: XCircle },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string, completedAt: string | null) {
  if (!completedAt) return "In progress...";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffSec = Math.round((end - start) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  return `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`;
}

function SyncLogEntry({ log }: { log: IntegrationSyncLog }) {
  const config = STATUS_CONFIG[log.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {/* Status Icon */}
      <div
        className={clsx(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          config.bgColor
        )}
      >
        <StatusIcon className={clsx("h-3.5 w-3.5", config.color)} />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={clsx("text-xs font-semibold", config.color)}>
            {config.label}
          </span>
          <span className="text-[10px] text-brand-400">
            {formatDate(log.started_at)}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {log.records_created > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
              <Plus className="h-3 w-3" />
              {log.records_created} created
            </span>
          )}
          {log.records_updated > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-600">
              <ArrowUpCircle className="h-3 w-3" />
              {log.records_updated} updated
            </span>
          )}
          {log.records_failed > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-red-600">
              <XCircle className="h-3 w-3" />
              {log.records_failed} failed
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-brand-400">
            <Clock className="h-3 w-3" />
            {formatDuration(log.started_at, log.completed_at)}
          </span>
        </div>

        {/* Error message */}
        {log.error_message && (
          <p className="mt-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 border border-red-100">
            {log.error_message}
          </p>
        )}

        {/* Sync type badge */}
        <span className="mt-1.5 inline-block rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-500 capitalize">
          {log.sync_type} sync
        </span>
      </div>
    </div>
  );
}

export function SyncStatus({ integrationId }: Props) {
  const store = useIntegrationsStore();
  const logs = store.getSyncLogs(integrationId);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Clock className="h-8 w-8 text-brand-200" />
        <p className="mt-3 text-sm text-brand-600">No sync history yet</p>
        <p className="mt-1 text-xs text-brand-400">
          Sync logs will appear here after the first data sync.
        </p>
      </div>
    );
  }

  // Summary stats
  const totalCreated = logs.reduce((sum, l) => sum + l.records_created, 0);
  const totalUpdated = logs.reduce((sum, l) => sum + l.records_updated, 0);
  const totalFailed = logs.reduce((sum, l) => sum + l.records_failed, 0);
  const successRate = logs.length > 0
    ? Math.round((logs.filter((l) => l.status === "success").length / logs.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-brand-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-brand-900">{logs.length}</p>
          <p className="text-[10px] text-brand-500 font-medium">Total Syncs</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-emerald-700">{totalCreated}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Created</p>
        </div>
        <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-blue-700">{totalUpdated}</p>
          <p className="text-[10px] text-blue-600 font-medium">Updated</p>
        </div>
        <div className="rounded-xl bg-brand-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-brand-700">{successRate}%</p>
          <p className="text-[10px] text-brand-500 font-medium">Success</p>
        </div>
      </div>

      {/* Log List */}
      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {logs.map((log) => (
          <SyncLogEntry key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}
