"use client";

import { useEffect, useState } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { Clock, RefreshCw, CheckCircle, AlertCircle, XCircle, TrendingUp, Database, Zap } from "lucide-react";

type FreshnessRow = {
  id: string;
  workspace_id: string | null;
  source_id: string | null;
  metric_type: string;
  last_updated_at: string;
  record_count: number | null;
  confidence: string;
  computed_at: string;
  ingestion_sources?: { slug: string; name: string; config?: { health?: string } } | null;
};

type Source = {
  id: string;
  slug: string;
  name: string;
  config?: { health?: string };
  last_run?: { completed_at: string; status: string };
};

function stalenessScore(lastUpdated: string): "fresh" | "stale" | "critical" {
  const hours = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
  if (hours < 6) return "fresh";
  if (hours < 24) return "stale";
  return "critical";
}

function formatStaleness(lastUpdated: string): string {
  const hours = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

export default function FreshnessPage() {
  const [rows, setRows] = useState<FreshnessRow[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAdminJson<FreshnessRow[]>("/api/admin/freshness"),
      fetchAdminJson<Source[]>("/api/admin/sources"),
    ])
      .then(([freshnessData, sourcesData]) => {
        setRows(Array.isArray(freshnessData) ? freshnessData : []);
        setSources(Array.isArray(sourcesData) ? sourcesData : []);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setRows([]);
        setSources([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const freshCount = rows.filter((r) => stalenessScore(r.last_updated_at) === "fresh").length;
  const staleCount = rows.filter((r) => stalenessScore(r.last_updated_at) === "stale").length;
  const criticalCount = rows.filter((r) => stalenessScore(r.last_updated_at) === "critical").length;

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  return (
    <div>
      <AdminPageError error={error} onRetry={fetchData} className="mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Data Freshness</h1>
          <p className="page-subtitle">
            Monitor data staleness and quality metrics across all sources
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-text-secondary" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total Sources</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{sources.length}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Fresh</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{freshCount}</p>
          <p className="text-xs text-text-tertiary">&lt; 6 hours old</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Stale</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{staleCount}</p>
          <p className="text-xs text-text-tertiary">6-24 hours old</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-rose-500" />
            <p className="text-xs font-medium text-rose-600 uppercase tracking-wide">Critical</p>
          </div>
          <p className="text-2xl font-bold text-rose-600">{criticalCount}</p>
          <p className="text-xs text-text-tertiary">&gt; 24 hours old</p>
        </div>
      </div>

      {loading ? (
        <div className="panel p-8 text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : error ? (
        <AdminPageError error={error} onRetry={fetchData} />
      ) : rows.length === 0 ? (
        <div className="panel p-12 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-brand-200" />
          <p className="text-text-secondary">No freshness metrics yet</p>
          <p className="mt-1 text-xs text-text-tertiary">Run ingestion to generate metrics</p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="section-header">Freshness by Source</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="table-head px-5 py-3 text-left">Source</th>
                <th className="table-head px-5 py-3 text-left">Type</th>
                <th className="table-head px-5 py-3 text-left">Records</th>
                <th className="table-head px-5 py-3 text-left">Staleness</th>
                <th className="table-head px-5 py-3 text-left">Status</th>
                <th className="table-head px-5 py-3 text-left">Confidence</th>
                <th className="table-head px-5 py-3 text-left">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const score = stalenessScore(r.last_updated_at);
                const source = r.source_id ? sourceMap.get(r.source_id) : null;
                const sourceName = r.ingestion_sources?.name ?? source?.name ?? "Platform";
                const sourceSlug = r.ingestion_sources?.slug ?? source?.slug ?? "—";
                const health = r.ingestion_sources?.config?.health ?? source?.config?.health;
                
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-surface-2">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          health === "live" ? "bg-emerald-50" : 
                          health === "degraded" ? "bg-amber-50" : "bg-blue-50"
                        }`}>
                          {health === "live" ? (
                            <Zap className="h-4 w-4 text-emerald-600" />
                          ) : health === "degraded" ? (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Database className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{sourceName}</p>
                          <p className="font-mono text-xs text-text-tertiary">{sourceSlug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 capitalize text-text-secondary">{r.metric_type}</td>
                    <td className="py-3 px-5">
                      <span className="font-medium text-text-primary">{r.record_count?.toLocaleString() ?? 0}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`font-mono text-sm ${
                        score === "fresh" ? "text-emerald-600" :
                        score === "stale" ? "text-amber-600" : "text-rose-600"
                      }`}>
                        {formatStaleness(r.last_updated_at)}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          score === "fresh"
                            ? "bg-emerald-50 text-emerald-700"
                            : score === "stale"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {score === "fresh" ? <CheckCircle className="h-3 w-3" /> :
                         score === "stale" ? <AlertCircle className="h-3 w-3" /> :
                         <XCircle className="h-3 w-3" />}
                        {score}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.confidence === "high" ? "bg-emerald-50 text-emerald-700" :
                        r.confidence === "medium" ? "bg-amber-50 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {r.confidence}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">
                      {getRelativeTime(r.last_updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
