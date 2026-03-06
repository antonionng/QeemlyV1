"use client";

import { useEffect, useState } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { FileJson, RefreshCw, ChevronDown, ChevronRight, Database, Zap, AlertTriangle, HardDrive, Calendar } from "lucide-react";

type Snapshot = {
  id: string;
  source_id: string;
  fetched_at: string;
  schema_version: string;
  checksum: string | null;
  row_count: number | null;
  storage_path: string | null;
  sample_preview: unknown;
  ingestion_sources?: { slug: string; name: string; config?: { health?: string } } | null;
};

type Source = {
  id: string;
  slug: string;
  name: string;
  config?: { health?: string };
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

function getHealthIcon(health: string | undefined) {
  switch (health) {
    case "live":
      return { icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" };
    case "static":
      return { icon: HardDrive, color: "text-blue-600", bg: "bg-blue-50" };
    case "degraded":
      return { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" };
    default:
      return { icon: Database, color: "text-gray-600", bg: "bg-gray-50" };
  }
}

export default function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAdminJson<Snapshot[]>("/api/admin/snapshots"),
      fetchAdminJson<Source[]>("/api/admin/sources"),
    ])
      .then(([snapshotsData, sourcesData]) => {
        setSnapshots(Array.isArray(snapshotsData) ? snapshotsData : []);
        setSources(Array.isArray(sourcesData) ? sourcesData : []);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setSnapshots([]);
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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const totalRows = snapshots.reduce((sum, s) => sum + (s.row_count ?? 0), 0);

  return (
    <div>
      <AdminPageError error={error} onRetry={fetchData} className="mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Raw Snapshots</h1>
          <p className="page-subtitle">
            Raw data captured from external APIs before normalization
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
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileJson className="h-4 w-4 text-brand-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total Snapshots</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{snapshots.length}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total Rows</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalRows.toLocaleString()}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Latest</p>
          </div>
          <p className="text-lg font-bold text-blue-600">
            {snapshots.length > 0 ? getRelativeTime(snapshots[0]?.fetched_at) : "—"}
          </p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-5">
            <AdminPageError error={error} onRetry={fetchData} />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="p-12 text-center">
            <FileJson className="mx-auto mb-3 h-10 w-10 text-brand-200" />
            <p className="text-text-secondary">No snapshots yet</p>
            <p className="mt-1 text-xs text-text-tertiary">Raw data is stored when ingestion runs</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="table-head w-10 px-5 py-3 text-left" />
                <th className="table-head px-5 py-3 text-left">Source</th>
                <th className="table-head px-5 py-3 text-left">Fetched</th>
                <th className="table-head px-5 py-3 text-left">Rows</th>
                <th className="table-head px-5 py-3 text-left">Schema</th>
                <th className="table-head px-5 py-3 text-left">Checksum</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.flatMap((s) => {
                const source = s.source_id ? sourceMap.get(s.source_id) : null;
                const sourceName = s.ingestion_sources?.name ?? source?.name ?? "Unknown";
                const sourceSlug = s.ingestion_sources?.slug ?? source?.slug ?? s.source_id?.slice(0, 8);
                const health = s.ingestion_sources?.config?.health ?? source?.config?.health;
                const healthConfig = getHealthIcon(health);
                const HealthIcon = healthConfig.icon;
                
                return [
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-border/50 hover:bg-surface-2"
                    onClick={() => toggleExpand(s.id)}
                  >
                    <td className="py-3 px-5">
                      {expanded.has(s.id) ? (
                        <ChevronDown className="h-4 w-4 text-text-secondary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-text-secondary" />
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${healthConfig.bg}`}>
                          <HealthIcon className={`h-4 w-4 ${healthConfig.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{sourceName}</p>
                          <p className="font-mono text-xs text-text-tertiary">{sourceSlug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-text-primary">{getRelativeTime(s.fetched_at)}</span>
                      <span className="block text-xs text-text-tertiary">
                        {new Date(s.fetched_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-medium text-text-primary">{s.row_count?.toLocaleString() ?? "—"}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                        {s.schema_version}
                      </span>
                    </td>
                    <td className="max-w-[150px] truncate px-5 py-3 font-mono text-xs text-text-tertiary" title={s.checksum ?? ""}>
                      {s.checksum ? s.checksum.replace("sha256:", "").slice(0, 12) + "…" : "—"}
                    </td>
                  </tr>,
                  ...(expanded.has(s.id) && s.sample_preview
                    ? [
                        <tr key={`${s.id}-preview`} className="border-b border-border/50 bg-surface-2">
                          <td colSpan={6} className="py-4 px-5">
                            <div className="mb-2">
                              <span className="text-xs font-medium text-text-secondary">Sample Preview</span>
                            </div>
                            <pre className="max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-border bg-surface-1 p-4 font-mono text-xs text-text-secondary">
                              {JSON.stringify(s.sample_preview, null, 2)}
                            </pre>
                          </td>
                        </tr>,
                      ]
                    : []),
                ];
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
