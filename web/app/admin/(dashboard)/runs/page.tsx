"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import {
  AlertTriangle,
  CheckCircle,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";

type Job = {
  id: string;
  status: string;
  source_id: string;
  records_created: number;
  records_updated: number;
  records_failed: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

type Source = {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  approved_for_commercial: boolean;
  needs_review: boolean;
  config?: { health?: string };
};

type Stats = {
  jobs_24h: { total: number; success: number; failed: number; running: number; partial: number };
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function isRunnableSource(source: Source): boolean {
  return source.enabled && source.approved_for_commercial && !source.needs_review;
}

export default function AdminRunsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedSource, setSelectedSource] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    setError(null);
    Promise.all([
      fetchAdminJson<Job[]>("/api/admin/jobs"),
      fetchAdminJson<Source[]>("/api/admin/sources"),
      fetchAdminJson<Stats>("/api/admin/stats"),
    ])
      .then(([jobRows, sourceRows, statsRow]) => {
        setJobs(Array.isArray(jobRows) ? jobRows : []);
        setSources(Array.isArray(sourceRows) ? sourceRows : []);
        setStats(statsRow);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setJobs([]);
        setSources([]);
        setStats(null);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const runnableSources = sources
    .filter((source) => isRunnableSource(source))
    .sort((a, b) => a.name.localeCompare(b.name));
  const hasRunningJobs = jobs.some((job) => job.status === "running" || job.status === "queued");

  useEffect(() => {
    if (!hasRunningJobs && !triggering) return;
    const timer = setInterval(() => {
      loadData({ silent: true });
    }, 2500);
    return () => clearInterval(timer);
  }, [hasRunningJobs, triggering]);

  const triggerRun = async (sourceIds: string[]) => {
    if (sourceIds.length === 0) {
      setToast({ type: "error", message: "No runnable sources are currently available." });
      return;
    }

    setTriggering(true);
    setToast(null);
    try {
      const results = await Promise.all(
        sourceIds.map(async (sourceId) => {
          const response = await fetch("/api/admin/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source_id: sourceId }),
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.error ?? "Failed to trigger run");
          }
          return payload;
        }),
      );

      const createdTotal = results.reduce(
        (sum, result) => sum + Number(result.records_created ?? 0),
        0,
      );
      setToast({
        type: "success",
        message: `${results.length} run${results.length === 1 ? "" : "s"} triggered. ${createdTotal} records created so far.`,
      });
      setTimeout(() => loadData({ silent: true }), 300);
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to trigger run",
      });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div>
      <AdminPageError error={error} onRetry={() => loadData()} className="mb-6" />
      {toast ? (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Runs</h1>
          <p className="page-subtitle">
            Trigger source ingestion and inspect recent run outcomes inside the market data workbench.
          </p>
        </div>
        <button
          onClick={() => loadData()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-4">
        <div className="panel p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Runs in 24h</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{stats?.jobs_24h.total ?? 0}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Successful</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats?.jobs_24h.success ?? 0}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Running</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats?.jobs_24h.running ?? 0}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Failed</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{stats?.jobs_24h.failed ?? 0}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5">
          <h2 className="section-header">Run Controls</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-secondary">
                Source
              </label>
              <select
                value={selectedSource}
                onChange={(event) => setSelectedSource(event.target.value)}
                className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select a source</option>
                {runnableSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => triggerRun(selectedSource ? [selectedSource] : [])}
              disabled={triggering || !selectedSource}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Selected Source
            </button>
            <button
              onClick={() => triggerRun(runnableSources.map((source) => source.id))}
              disabled={triggering || runnableSources.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-2 disabled:opacity-50"
            >
              {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run All Runnable Sources
            </button>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-text-primary">Operator guidance</p>
              <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                Use this surface for shared-market source runs only. Tenant uploads remain inside the tenant dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="section-header">Runnable Sources</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {runnableSources.length > 0 ? (
              runnableSources.map((source) => (
                <div key={source.id} className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-sm font-semibold text-text-primary">{source.name}</p>
                  <p className="mt-1 font-mono text-xs text-text-tertiary">{source.slug}</p>
                  <p className="mt-2 text-xs text-text-secondary">
                    {source.config?.health ? `Health: ${source.config.health}` : "Health unknown"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-tertiary">
                No runnable sources configured yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="section-header">Recent Runs</h2>
          <span className="text-xs text-text-secondary">Last 50 ingestion jobs</span>
        </div>
        {loading && jobs.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Clock3 className="mx-auto mb-3 h-10 w-10 text-brand-200" />
            <p className="text-text-secondary">No runs yet</p>
            <p className="mt-1 text-xs text-text-tertiary">Trigger a source to create the first run.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="table-head px-5 py-3 text-left">Started</th>
                <th className="table-head px-5 py-3 text-left">Completed</th>
                <th className="table-head px-5 py-3 text-left">Source</th>
                <th className="table-head px-5 py-3 text-left">Status</th>
                <th className="table-head px-5 py-3 text-left">Records</th>
                <th className="table-head px-5 py-3 text-left">Error</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const source = sourceMap.get(job.source_id);
                return (
                  <tr key={job.id} className="border-b border-border/50 hover:bg-surface-2">
                    <td className="px-5 py-3 text-text-secondary">{getRelativeTime(job.created_at)}</td>
                    <td className="px-5 py-3 text-text-secondary">
                      {job.completed_at ? getRelativeTime(job.completed_at) : "Running"}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-text-primary">{source?.name ?? "Unknown"}</p>
                      <p className="font-mono text-xs text-text-tertiary">{source?.slug ?? job.source_id}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          job.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : job.status === "failed"
                              ? "bg-rose-50 text-rose-700"
                              : job.status === "partial"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {job.status === "success" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : job.status === "failed" ? (
                          <XCircle className="h-3 w-3" />
                        ) : job.status === "partial" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">
                      <span className="text-emerald-600">{job.records_created}</span>
                      {job.records_failed > 0 ? (
                        <span className="ml-2 text-rose-600">-{job.records_failed}</span>
                      ) : null}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-xs text-text-tertiary" title={job.error_message ?? ""}>
                      {job.error_message ?? "None"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
