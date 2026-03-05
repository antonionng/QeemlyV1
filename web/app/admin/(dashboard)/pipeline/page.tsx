"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Database,
  Zap,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Users,
  Building2,
  RefreshCw,
  MapPin,
  Briefcase,
  BarChart3,
} from "lucide-react";

type Source = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  enabled: boolean;
  config?: { health?: string };
  last_run?: { completed_at: string; status: string; records_created?: number };
};

type Stats = {
  sources: { total: number; enabled: number };
  jobs_24h: { total: number; success: number; failed: number };
  benchmarks: { total: number };
  freshness: { score: string };
};

function getHealthConfig(health: string | undefined) {
  switch (health) {
    case "live":
      return { color: "bg-emerald-500", textColor: "text-emerald-600", label: "Live API", icon: Zap };
    case "static":
      return { color: "bg-blue-500", textColor: "text-blue-600", label: "Static", icon: FileText };
    case "degraded":
      return { color: "bg-amber-500", textColor: "text-amber-600", label: "Degraded", icon: AlertTriangle };
    default:
      return { color: "bg-gray-400", textColor: "text-gray-500", label: "Unknown", icon: Database };
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

export default function PipelinePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/sources").then((r) => r.ok ? r.json() : []),
      fetch("/api/admin/stats").then((r) => r.ok ? r.json() : null),
    ])
      .then(([sourcesData, statsData]) => {
        setSources(Array.isArray(sourcesData) ? sourcesData : []);
        setStats(statsData);
      })
      .catch(() => {
        setSources([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const liveSources = sources.filter((s) => s.config?.health === "live");
  const staticSources = sources.filter((s) => s.config?.health === "static");
  const degradedSources = sources.filter((s) => s.config?.health === "degraded");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Data Pipeline</h1>
          <p className="page-subtitle">
            Visual overview of how market data flows from sources to client tenants
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main Pipeline Visualization */}
      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-brand-50 via-surface-1 to-info-soft p-8">
        <div className="grid grid-cols-5 gap-6 items-start">
          {/* Column 1: External Sources */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Globe className="h-4 w-4 text-brand-500" />
              Data Sources
            </h3>
            <div className="space-y-2">
              {sources.slice(0, 6).map((source) => {
                const health = getHealthConfig(source.config?.health);
                return (
                  <div
                    key={source.id}
                    className="rounded-lg border border-border bg-surface-1 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2 w-2 rounded-full ${health.color}`} />
                      <span className={`font-medium ${health.textColor}`}>{health.label}</span>
                    </div>
                    <p className="truncate font-medium text-text-primary" title={source.name}>
                      {source.name}
                    </p>
                    {source.last_run && (
                      <p className="mt-1 text-text-tertiary">
                        {source.last_run.status === "success" ? (
                          <CheckCircle className="h-3 w-3 inline text-emerald-500 mr-1" />
                        ) : source.last_run.status === "failed" ? (
                          <XCircle className="h-3 w-3 inline text-rose-500 mr-1" />
                        ) : null}
                        {getRelativeTime(source.last_run.completed_at)}
                      </p>
                    )}
                  </div>
                );
              })}
              {sources.length > 6 && (
                <p className="text-center text-xs text-text-tertiary">+{sources.length - 6} more</p>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center pt-16">
            <ArrowRight className="h-8 w-8 text-brand-200" />
          </div>

          {/* Column 2: Ingestion Pipeline */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Zap className="h-4 w-4 text-amber-500" />
              Ingestion Pipeline
            </h3>
            <div className="space-y-4 rounded-lg border border-border bg-surface-1 p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <Database className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Fetch</p>
                  <p className="text-xs text-text-secondary">Pull from APIs</p>
                </div>
              </div>
              <div className="ml-4 h-4 border-l-2 border-dashed border-border" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Snapshot</p>
                  <p className="text-xs text-text-secondary">Store raw data</p>
                </div>
              </div>
              <div className="ml-4 h-4 border-l-2 border-dashed border-border" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Normalize</p>
                  <p className="text-xs text-text-secondary">Map roles/levels</p>
                </div>
              </div>
              <div className="ml-4 h-4 border-l-2 border-dashed border-border" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Validate</p>
                  <p className="text-xs text-text-secondary">DQ checks</p>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center pt-16">
            <ArrowRight className="h-8 w-8 text-brand-200" />
          </div>

          {/* Column 3: Output */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Benchmarks
            </h3>
            <div className="rounded-lg border border-border bg-surface-1 p-4">
              <div className="mb-2 text-3xl font-bold text-text-primary">
                {stats?.benchmarks.total?.toLocaleString() ?? "—"}
              </div>
              <p className="mb-4 text-sm text-text-secondary">salary data points</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Jobs (24h)</span>
                  <span className="font-medium text-text-primary">{stats?.jobs_24h.total ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Successful</span>
                  <span className="font-medium text-emerald-600">{stats?.jobs_24h.success ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Failed</span>
                  <span className="font-medium text-rose-600">{stats?.jobs_24h.failed ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Freshness</span>
                  <span className={`font-medium capitalize ${
                    stats?.freshness.score === "fresh" ? "text-emerald-600" :
                    stats?.freshness.score === "stale" ? "text-amber-600" : "text-rose-600"
                  }`}>
                    {stats?.freshness.score ?? "unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How This Helps Tenants */}
      <div className="panel mb-6 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-brand-500" />
          <h2 className="section-header">How This Helps Client Tenants</h2>
        </div>
        <p className="mb-6 text-sm text-text-secondary">
          Market benchmark data enriches the compensation analysis capabilities available to your client tenants.
          When tenants upload their employee data or integrate their ATS, they can compare against these benchmarks.
        </p>
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-lg border border-border p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <BarChart3 className="h-5 w-5 text-brand-500" />
            </div>
            <h3 className="mb-1 font-medium text-text-primary">Compensation Analysis</h3>
            <p className="text-xs text-text-secondary">
              Compare employee salaries against market benchmarks by role, level, and location.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="mb-1 font-medium text-text-primary">Band Positioning</h3>
            <p className="text-xs text-text-secondary">
              See where each employee falls within market percentiles (P10, P25, P50, P75, P90).
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="mb-1 font-medium text-text-primary">Equity Benchmarking</h3>
            <p className="text-xs text-text-secondary">
              Identify pay equity gaps and ensure fair compensation across demographics.
            </p>
          </div>
        </div>
      </div>

      {/* Source Health Summary */}
      <div className="grid grid-cols-3 gap-6">
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <h3 className="font-medium text-text-primary">Live APIs ({liveSources.length})</h3>
          </div>
          <p className="mb-3 text-xs text-text-secondary">Real-time data from government and international sources</p>
          <ul className="space-y-1">
            {liveSources.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <h3 className="font-medium text-text-primary">Static Data ({staticSources.length})</h3>
          </div>
          <p className="mb-3 text-xs text-text-secondary">Curated datasets based on published salary surveys</p>
          <ul className="space-y-1">
            {staticSources.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs text-text-secondary">
                <FileText className="h-3 w-3 text-blue-500" />
                {s.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <h3 className="font-medium text-text-primary">Degraded ({degradedSources.length})</h3>
          </div>
          <p className="mb-3 text-xs text-text-secondary">Sources with reliability issues - under review</p>
          <ul className="space-y-1">
            {degradedSources.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs text-text-secondary">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                {s.name}
              </li>
            ))}
            {degradedSources.length === 0 && (
              <li className="text-xs text-text-tertiary">None currently</li>
            )}
          </ul>
        </div>
      </div>

      {/* Regional Coverage */}
      <div className="panel mt-6 p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-brand-500" />
          <h2 className="section-header">Regional Coverage</h2>
        </div>
        <div className="grid grid-cols-7 gap-4 text-center">
          {[
            { code: "AE", name: "UAE", cities: "Dubai, Abu Dhabi" },
            { code: "SA", name: "Saudi Arabia", cities: "Riyadh, Jeddah" },
            { code: "QA", name: "Qatar", cities: "Doha" },
            { code: "BH", name: "Bahrain", cities: "Manama" },
            { code: "KW", name: "Kuwait", cities: "Kuwait City" },
            { code: "OM", name: "Oman", cities: "Muscat" },
            { code: "US", name: "USA", cities: "National" },
          ].map((region) => (
            <div key={region.code} className="rounded-lg border border-border p-3">
              <div className="text-lg font-bold text-text-primary">{region.code}</div>
              <div className="text-xs font-medium text-text-secondary">{region.name}</div>
              <div className="mt-1 text-xs text-text-tertiary">{region.cities}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
