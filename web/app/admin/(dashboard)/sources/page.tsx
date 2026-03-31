"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import {
  Database,
  RefreshCw,
  Play,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Globe,
  FileText,
} from "lucide-react";

type Source = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  regions: string[];
  enabled: boolean;
  approved_for_commercial: boolean;
  needs_review: boolean;
  update_cadence: string;
  config?: { health?: string };
  last_run: { completed_at: string; status: string; records_created?: number } | null;
};

function getHealthConfig(health: string | undefined) {
  const effectiveHealth = health || "unknown";
  switch (effectiveHealth) {
    case "live":
      return { color: "bg-emerald-500", label: "Live API", icon: Zap, textColor: "text-emerald-600" };
    case "static":
      return { color: "bg-blue-500", label: "Static", icon: HardDrive, textColor: "text-blue-600" };
    case "degraded":
      return { color: "bg-amber-500", label: "Degraded", icon: AlertTriangle, textColor: "text-amber-600" };
    default:
      return { color: "bg-gray-400", label: "Unknown", icon: Database, textColor: "text-gray-500" };
  }
}

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

export function SourcesPageContent({ embedded = false }: { embedded?: boolean }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSources = () => {
    setLoading(true);
    setError(null);
    fetchAdminJson<Source[]>("/api/admin/sources")
      .then((data) => setSources(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setSources([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const runNow = async (sourceId: string, sourceName: string) => {
    setRunning(sourceId);
    try {
      const res = await fetch("/api/admin/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: sourceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Trigger failed");
      showToast(`Ingestion started for ${sourceName}. ${data.records_created ?? 0} records created.`, "success");
      fetchSources();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to run ingestion", "error");
    } finally {
      setRunning(null);
    }
  };

  const toggleEnabled = async (source: Source) => {
    const newEnabled = !source.enabled;
    setToggling(source.id);
    
    // Optimistic update
    setSources((prev) =>
      prev.map((s) => (s.id === source.id ? { ...s, enabled: newEnabled } : s))
    );

    try {
      const res = await fetch(`/api/admin/sources/${source.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      showToast(`${source.name} ${newEnabled ? "enabled" : "disabled"}`, "success");
    } catch (err) {
      // Revert on error
      setSources((prev) =>
        prev.map((s) => (s.id === source.id ? { ...s, enabled: !newEnabled } : s))
      );
      showToast(err instanceof Error ? err.message : "Failed to toggle", "error");
    } finally {
      setToggling(null);
    }
  };

  const getEffectiveHealth = (s: Source) => s.config?.health || "unknown";
  
  const healthStats = {
    live: sources.filter((s) => getEffectiveHealth(s) === "live").length,
    static: sources.filter((s) => getEffectiveHealth(s) === "static").length,
    degraded: sources.filter((s) => getEffectiveHealth(s) === "degraded").length,
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <AdminPageError error={error} onRetry={fetchSources} className="mb-6" />
      <div className="mb-6 flex items-center justify-between">
        {!embedded ? (
          <div>
            <h1 className="page-title">Ingestion Sources</h1>
            <p className="page-subtitle">
              Manage data sources feeding into the benchmark pipeline
            </p>
          </div>
        ) : (
          <div>
            <h2 className="section-header">Source Configuration</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Enable, disable, and trigger benchmark feeds without leaving the intake workflow.
            </p>
          </div>
        )}
        <button
          onClick={fetchSources}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Health Summary */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="panel p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total Sources</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{sources.length}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Live APIs</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{healthStats.live}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Static Data</p>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{healthStats.static}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Degraded</p>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{healthStats.degraded}</p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-5">
            <AdminPageError error={error} onRetry={fetchSources} />
          </div>
        ) : sources.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="mx-auto mb-3 h-10 w-10 text-brand-200" />
            <p className="text-text-secondary">No sources configured</p>
            <p className="mt-1 text-xs text-text-tertiary">Add ingestion sources to start collecting market data</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="w-8"></th>
                <th className="table-head px-5 py-3 text-left">Source</th>
                <th className="table-head px-5 py-3 text-left">Health</th>
                <th className="table-head px-5 py-3 text-left">Category</th>
                <th className="table-head px-5 py-3 text-left">Regions</th>
                <th className="table-head px-5 py-3 text-left">Last Run</th>
                <th className="table-head px-5 py-3 text-left">Status</th>
                <th className="table-head px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => {
                const effectiveHealth = getEffectiveHealth(s);
                const healthConfig = getHealthConfig(s.config?.health);
                const HealthIcon = healthConfig.icon;
                const isExpanded = expanded === s.id;

                return (
                  <Fragment key={s.id}>
                    <tr className="border-b border-border/50 hover:bg-surface-2">
                      <td className="py-3 pl-4">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : s.id)}
                          className="rounded p-1 hover:bg-brand-50"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-text-secondary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-text-secondary" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${effectiveHealth === "live" ? "bg-emerald-50" : effectiveHealth === "degraded" ? "bg-amber-50" : "bg-blue-50"}`}>
                            {effectiveHealth === "live" ? (
                              <Globe className={`h-4 w-4 ${healthConfig.textColor}`} />
                            ) : (
                              <FileText className={`h-4 w-4 ${healthConfig.textColor}`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{s.name}</p>
                            <p className="font-mono text-xs text-text-tertiary">{s.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          effectiveHealth === "live" ? "bg-emerald-50 text-emerald-700" :
                          effectiveHealth === "degraded" ? "bg-amber-50 text-amber-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${healthConfig.color}`} />
                          {healthConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 capitalize text-text-primary">{s.category}</td>
                      <td className="px-5 py-3 text-xs text-text-secondary">
                        {Array.isArray(s.regions) && s.regions.length ? s.regions.slice(0, 3).join(", ") : "—"}
                        {s.regions?.length > 3 && <span className="text-text-tertiary"> +{s.regions.length - 3}</span>}
                      </td>
                      <td className="py-3 px-5">
                        {s.last_run ? (
                          <div>
                            <span className={`text-sm ${s.last_run.status === "success" ? "text-emerald-600" : s.last_run.status === "failed" ? "text-rose-600" : "text-amber-600"}`}>
                              {s.last_run.status === "success" ? (
                                <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
                              ) : s.last_run.status === "failed" ? (
                                <XCircle className="h-3.5 w-3.5 inline mr-1" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                              )}
                              {getRelativeTime(s.last_run.completed_at)}
                            </span>
                            {s.last_run.records_created !== undefined && (
                              <span className="block text-xs text-text-tertiary">{s.last_run.records_created} records</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-tertiary">Never</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-wrap gap-1">
                          {s.enabled ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                              Enabled
                            </span>
                          ) : (
                            <span className="rounded bg-surface-3 px-2 py-0.5 text-xs font-medium text-text-secondary">
                              Disabled
                            </span>
                          )}
                          {s.needs_review && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                              Review
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleEnabled(s)}
                            disabled={toggling === s.id}
                            className="rounded p-1.5 hover:bg-brand-50 disabled:opacity-50"
                            title={s.enabled ? "Disable" : "Enable"}
                          >
                            {s.enabled ? (
                              <ToggleRight className="h-5 w-5 text-brand-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-text-tertiary" />
                            )}
                          </button>
                          <button
                            onClick={() => runNow(s.id, s.name)}
                            disabled={running === s.id || !s.enabled}
                            className="flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {running === s.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            Run
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row with description */}
                    {isExpanded && (
                      <tr key={`${s.id}-expanded`} className="border-b border-border/50 bg-surface-2">
                        <td></td>
                        <td colSpan={7} className="py-4 px-5">
                          <div className="text-sm text-text-secondary">
                            <p className="mb-2">{s.description || "No description available."}</p>
                            <div className="flex gap-6 text-xs">
                              <span>
                                <strong className="text-text-primary">Update Cadence:</strong> {s.update_cadence}
                              </span>
                              <span>
                                <strong className="text-text-primary">Commercial:</strong> {s.approved_for_commercial ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function SourcesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/intake");
  }, [router]);

  return null;
}
