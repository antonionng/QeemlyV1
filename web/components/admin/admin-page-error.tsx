"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import type { NormalizedAdminApiError } from "@/lib/admin/api-client";

type AdminPageErrorProps = {
  error: NormalizedAdminApiError | null;
  onRetry?: () => void;
  className?: string;
};

export function AdminPageError({ error, onRetry, className }: AdminPageErrorProps) {
  if (!error) return null;

  return (
    <div className={`panel border border-rose-200 bg-rose-50/70 p-4 ${className ?? ""}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-700">{error.title}</p>
            {error.detail ? (
              <p className="mt-1 text-sm text-rose-700/90">{error.detail}</p>
            ) : (
              <p className="mt-1 text-sm text-rose-700/90">
                The admin API request failed before this page could load its data.
              </p>
            )}
            {error.status ? (
              <p className="mt-2 text-xs uppercase tracking-wide text-rose-700/70">
                HTTP {error.status}
              </p>
            ) : null}
          </div>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
