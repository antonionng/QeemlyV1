"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Play,
  Loader2,
  ArrowRight,
  Zap,
  Globe,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type Job = {
  id: string;
  status: string;
  source_id: string;
  source_name?: string;
  source_slug?: string;
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
  config?: { health?: string };
  last_run?: { completed_at: string; status: string };
};

type HubStats = {
  sources: { total: number; enabled: number };
  jobs_24h: { total: number; success: number; failed: number; running: number; partial: number };
  benchmarks: { total: number };
  freshness: { score: string; last_updated_at: string | null; staleness_hours: number | null };
};

type BatchRunStatus = "queued" | "running" | "success" | "failed";

type BatchRunItem = {
  sourceName: string;
  status: BatchRunStatus;
  message?: string;
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

function getHealthColor(health: string | undefined): string {
  const effectiveHealth = health || "unknown";
  switch (effectiveHealth) {
    case "live":
      return "bg-emerald-500";
    case "static":
      return "bg-blue-500";
    case "degraded":
      return "bg-amber-500";
    default:
      return "bg-gray-400";
  }
}

function getHealthLabel(health: string | undefined): string {
  const effectiveHealth = health || "unknown";
  switch (effectiveHealth) {
    case "live":
      return "Live API";
    case "static":
      return "Static Data";
    case "degraded":
      return "Degraded";
    default:
      return "Unknown";
  }
}

export default function ControlTowerPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<HubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [batchRuns, setBatchRuns] = useState<Record<string, BatchRunItem>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchAll = (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);
    Promise.all([
      fetch("/api/admin/jobs").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/sources").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([jobsData, statsData, sourcesData]) => {
        const safeSources = Array.isArray(sourcesData) ? (sourcesData as Source[]) : [];
        const sourceMap = new Map(
          safeSources.map((s) => [s.id, s] as const)
        );
        const enrichedJobs = (Array.isArray(jobsData) ? jobsData : []).map((j: Job) => {
          const src = sourceMap.get(j.source_id);
          return {
            ...j,
            source_name: src?.name ?? "Unknown",
            source_slug: src?.slug ?? j.source_id?.slice(0, 8),
          };
        });
        setJobs(enrichedJobs);
        setStats(statsData);
        setSources(safeSources);
      })
      .catch(() => {
        setJobs([]);
        setStats(null);
        setSources([]);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const runIngestionBatch = async (targetSources: Source[]) => {
    setTriggering(true);
    const queuedState = targetSources.reduce<Record<string, BatchRunItem>>((acc, source) => {
      acc[source.id] = { sourceName: source.name, status: "queued" };
      return acc;
    }, {});
    setBatchRuns(queuedState);

    try {
      const results = await Promise.all(
        targetSources.map(async (source) => {
          setBatchRuns((prev) => ({
            ...prev,
            [source.id]: { sourceName: source.name, status: "running" },
          }));

          try {
            const res = await fetch("/api/admin/trigger", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ source_id: source.id }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error ?? "Trigger failed");
            }
            const recordsMsg =
              data.records_created > 0
                ? `${data.records_created} records created`
                : "No new records";
            setBatchRuns((prev) => ({
              ...prev,
              [source.id]: { sourceName: source.name, status: "success", message: recordsMsg },
            }));
            return { sourceId: source.id, status: "success" as const };
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Trigger failed";
            setBatchRuns((prev) => ({
              ...prev,
              [source.id]: { sourceName: source.name, status: "failed", message: errorMsg },
            }));
            return { sourceId: source.id, status: "failed" as const };
          }
        })
      );

      const successCount = results.filter((r) => r.status === "success").length;
      const failedCount = results.length - successCount;
      if (failedCount === 0) {
        showToast(`Completed ${successCount}/${results.length} ingestion runs successfully.`, "success");
      } else {
        showToast(`Completed with issues: ${successCount} succeeded, ${failedCount} failed.`, "error");
      }

      setTimeout(() => fetchAll({ silent: true }), 300);
    } finally {
      setTriggering(false);
    }
  };

  const handleTrigger = async () => {
    const enabledSources = sources.filter((s) => s.enabled);
    const sourceId = selectedSource || enabledSources[0]?.id;
    const source = sources.find((s) => s.id === sourceId);

    if (!source) {
      showToast("No ingestion source available. Configure and enable a source first.", "error");
      return;
    }

    await runIngestionBatch([source]);
  };

  const handleRunAll = async () => {
    const enabledSources = sources.filter((s) => s.enabled);
    if (enabledSources.length === 0) {
      showToast("No enabled sources to run. Enable at least one source first.", "error");
      return;
    }

    await runIngestionBatch(enabledSources);
  };

  // Poll while local batch is active or server reports running jobs.
  useEffect(() => {
    const hasLocalActive = Object.values(batchRuns).some(
      (run) => run.status === "queued" || run.status === "running"
    );
    const hasServerRunning = jobs.some((j) => j.status === "running");
    if (!hasLocalActive && !hasServerRunning && !triggering) return;

    const interval = setInterval(() => {
      fetchAll({ silent: true });
    }, 2500);

    return () => clearInterval(interval);
  }, [batchRuns, jobs, triggering]);

  const liveSources = sources.filter((s) => s.config?.health === "live");
  const staticSources = sources.filter((s) => s.config?.health === "static");
  const degradedSources = sources.filter((s) => s.config?.health === "degraded");
  const enabledSources = sources
    .filter((s) => s.enabled)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-70"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Control Tower</h1>
          <p className="page-subtitle">
            Monitor data ingestion, source health, and platform operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Pipeline Overview Diagram */}
      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-brand-50 to-info-soft p-6">
        <h2 className="section-header mb-4 text-sm">Data Pipeline Overview</h2>
        <div className="flex items-center justify-between gap-4">
          {/* External APIs */}
          <div className="flex-1 rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-5 w-5 text-brand-500" />
              <span className="font-medium text-text-primary">External APIs</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-text-secondary">{liveSources.length} Live</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs text-text-secondary">{staticSources.length} Static</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs text-text-secondary">{degradedSources.length} Degraded</span>
              </div>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 flex-shrink-0 text-brand-200" />

          {/* Ingestion Pipeline */}
          <div className="flex-1 rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-text-primary">Ingestion</span>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-text-secondary">
                <span className="font-medium text-text-primary">{stats?.jobs_24h.total ?? 0}</span> jobs (24h)
              </div>
              <div className="text-xs text-text-secondary">
                <span className="font-medium text-emerald-600">{stats?.jobs_24h.success ?? 0}</span> successful
              </div>
              <div className="text-xs text-text-secondary">
                <span className="font-medium text-rose-600">{stats?.jobs_24h.failed ?? 0}</span> failed
              </div>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 flex-shrink-0 text-brand-200" />

          {/* Benchmarks */}
          <div className="flex-1 rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="font-medium text-text-primary">Benchmarks</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-text-primary">{stats?.benchmarks.total ?? 0}</div>
              <div className="text-xs text-text-secondary">salary data points</div>
              <div className={`text-xs font-medium capitalize ${
                stats?.freshness.score === "fresh" ? "text-emerald-600" :
                stats?.freshness.score === "stale" ? "text-amber-600" : "text-rose-600"
              }`}>
                {stats?.freshness.score ?? "unknown"}
              </div>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 flex-shrink-0 text-brand-200" />

          {/* Client Tenants */}
          <div className="flex-1 rounded-lg border border-dashed border-brand-500 bg-surface-1 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-brand-500" />
              <span className="font-medium text-text-primary">Client Tenants</span>
            </div>
            <div className="space-y-1 text-xs text-text-secondary">
              <p>• Compensation analysis</p>
              <p>• Band positioning</p>
              <p>• Equity benchmarking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Source Health + Quick Actions */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Source Health Cards */}
        <div className="panel col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-header">Source Health</h2>
            <span className="text-xs text-text-secondary">
              {enabledSources.length} enabled sources
            </span>
          </div>
          <div className="max-h-[360px] overflow-auto pr-1">
            <div className="grid grid-cols-3 gap-3">
              {enabledSources.map((source) => (
              <div
                key={source.id}
                className="cursor-pointer rounded-lg border border-border p-3 transition-colors hover:border-brand-500"
                onClick={() => setSelectedSource(source.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-2 w-2 rounded-full ${getHealthColor(source.config?.health)}`} />
                  <span className="text-xs font-medium text-text-secondary">
                    {getHealthLabel(source.config?.health)}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-medium text-text-primary" title={source.name}>
                  {source.name}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-text-tertiary" title={source.slug}>
                  {source.slug}
                </p>
                {source.last_run && (
                  <p className="mt-1 text-xs text-text-tertiary">
                    {getRelativeTime(source.last_run.completed_at)}
                  </p>
                )}
                {!source.enabled && (
                  <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    Disabled
                  </span>
                )}
              </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="panel p-5">
          <h2 className="section-header mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Select Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Auto (first enabled)</option>
                {sources.filter((s) => s.enabled).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Selected
            </button>
            <button
              onClick={handleRunAll}
              disabled={triggering || sources.filter((s) => s.enabled).length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-2 disabled:opacity-50"
            >
              {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run All Enabled ({sources.filter((s) => s.enabled).length})
            </button>
            {Object.keys(batchRuns).length > 0 && (
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <h3 className="mb-2 text-xs font-medium text-text-secondary">Live Batch Progress</h3>
                <div className="space-y-1.5">
                  {Object.entries(batchRuns).map(([sourceId, run]) => (
                    <div key={sourceId} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-text-primary">{run.sourceName}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                          run.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : run.status === "failed"
                            ? "bg-rose-50 text-rose-700"
                            : run.status === "running"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {run.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                        {run.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <h3 className="mb-2 text-xs font-medium text-text-secondary">How It Works</h3>
              <p className="text-xs leading-relaxed text-text-tertiary">
                Market data from external APIs is ingested, normalized, and stored as benchmarks. 
                Client tenants use this data for compensation analysis and band positioning.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Data vs Client Data Split */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Market Data Pipeline</h2>
          </div>
          <p className="mb-4 text-sm text-text-secondary">
            External salary benchmarks ingested from government APIs, surveys, and international sources.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Active Sources</span>
              <span className="font-medium text-text-primary">{sources.filter((s) => s.enabled).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Total Benchmarks</span>
              <span className="font-medium text-emerald-600">{stats?.benchmarks.total ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Regions Covered</span>
              <span className="font-medium text-text-primary">GCC + USA</span>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Client Data</h2>
          </div>
          <p className="mb-4 text-sm text-text-secondary">
            Data uploaded by tenants via ATS integrations and CSV uploads for their compensation analysis.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Data Sources</span>
              <span className="font-medium text-text-primary">ATS + CSV Upload</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Purpose</span>
              <span className="font-medium text-text-primary">Employee comp analysis</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Privacy</span>
              <span className="font-medium text-emerald-600">Tenant-isolated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs table */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="section-header">Recent Ingestion Jobs</h2>
          <span className="text-xs text-text-secondary">Last 50 jobs</span>
        </div>
        {loading && !jobs.length ? (
          <div className="p-8 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-500" />
            <p className="mt-2 text-sm text-text-secondary">Loading...</p>
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
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-brand-200" />
                    <p className="text-text-secondary">No ingestion jobs yet</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Run ingestion once sources are configured and enabled
                    </p>
                  </td>
                </tr>
              ) : (
                jobs.slice(0, 20).map((j) => (
                  <tr key={j.id} className="border-b border-border/50 transition-colors hover:bg-surface-2">
                    <td className="px-5 py-3 text-text-secondary">
                      <span title={new Date(j.created_at).toLocaleString()}>
                        {getRelativeTime(j.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">
                      {j.completed_at ? (
                        <span title={new Date(j.completed_at).toLocaleString()} className="text-emerald-600">
                          {getRelativeTime(j.completed_at)}
                        </span>
                      ) : (
                        <span className="text-amber-500 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Running...
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-medium text-text-primary">{j.source_name}</span>
                      <span className="block font-mono text-xs text-text-tertiary">{j.source_slug}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          j.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : j.status === "failed"
                            ? "bg-rose-50 text-rose-700"
                            : j.status === "partial"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {j.status === "success" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : j.status === "failed" ? (
                          <XCircle className="h-3 w-3" />
                        ) : j.status === "partial" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-emerald-600">{j.records_created}</span>
                      {j.records_failed > 0 && (
                        <span className="text-rose-600 ml-2">-{j.records_failed}</span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-xs text-text-tertiary" title={j.error_message ?? ""}>
                      {j.error_message ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
