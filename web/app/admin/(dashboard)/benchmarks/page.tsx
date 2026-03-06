"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import {
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Briefcase,
  TrendingUp,
  Globe,
  X,
} from "lucide-react";

type Benchmark = {
  id: string;
  role_id: string;
  location_id: string;
  level_id: string;
  currency: string;
  p50: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  sample_size: number | null;
  source: string;
  confidence: string;
  valid_from: string;
};

type MetaResponse = {
  roles: string[];
  locations: string[];
  levels: string[];
  sources: string[];
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: "د.إ",
  SAR: "﷼",
  QAR: "﷼",
  BHD: ".د.ب",
  KWD: "د.ك",
  OMR: "ر.ع.",
  USD: "$",
};

function formatSalary(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol} ${formatted}`;
}

export default function BenchmarksPage() {
  const [data, setData] = useState<Benchmark[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  // Filters
  const [roleFilter, setRoleFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // Stats
  const [stats, setStats] = useState<{
    uniqueRoles: number;
    uniqueLocations: number;
    uniqueLevels: number;
  } | null>(null);
  const [meta, setMeta] = useState<MetaResponse>({
    roles: [],
    locations: [],
    levels: [],
    sources: [],
  });

  const fetchBenchmarks = useCallback((p = 0) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(limit));
    if (roleFilter) params.set("role_id", roleFilter);
    if (locationFilter) params.set("location_id", locationFilter);
    if (levelFilter) params.set("level_id", levelFilter);
    if (sourceFilter) params.set("source", sourceFilter);

    fetchAdminJson<{ data: Benchmark[]; total: number }>(`/api/admin/benchmarks?${params}`)
      .then((res) => {
        setData(Array.isArray(res.data) ? res.data : []);
        setTotal(res.total ?? 0);
        setPage(p);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [roleFilter, locationFilter, levelFilter, sourceFilter]);

  const fetchStats = useCallback(() => {
    fetchAdminJson<MetaResponse>("/api/admin/benchmarks/meta")
      .then((payload) => {
        setMeta({
          roles: payload.roles ?? [],
          locations: payload.locations ?? [],
          levels: payload.levels ?? [],
          sources: payload.sources ?? [],
        });
        setStats({
          uniqueRoles: (payload.roles ?? []).length,
          uniqueLocations: (payload.locations ?? []).length,
          uniqueLevels: (payload.levels ?? []).length,
        });
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setMeta({ roles: [], locations: [], levels: [], sources: [] });
        setStats(null);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBenchmarks(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBenchmarks]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const clearFilters = () => {
    setRoleFilter("");
    setLocationFilter("");
    setLevelFilter("");
    setSourceFilter("");
  };

  const hasFilters = roleFilter || locationFilter || levelFilter || sourceFilter;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <AdminPageError error={error} onRetry={() => {
        fetchStats();
        fetchBenchmarks(page);
      }} className="mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Qeemly Market Benchmarks</h1>
          <p className="page-subtitle">
            Anonymized, aggregated market benchmark pool across contributing tenants
          </p>
        </div>
        <button
          onClick={() => fetchBenchmarks(page)}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-brand-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Total Benchmarks</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{total.toLocaleString()}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Roles Covered</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats?.uniqueRoles ?? "—"}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Locations</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats?.uniqueLocations ?? "—"}</p>
        </div>
        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Levels</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats?.uniqueLevels ?? "—"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="panel mb-4 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-secondary">Filters:</span>
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All Roles</option>
            {meta.roles.map((roleId) => (
              <option key={roleId} value={roleId}>{roleId.replace(/-/g, " ")}</option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All Locations</option>
            {meta.locations.map((locationId) => (
              <option key={locationId} value={locationId}>{locationId.replace(/-/g, " ")}</option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All Levels</option>
            {meta.levels.map((levelId) => (
              <option key={levelId} value={levelId}>{levelId}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All Sources</option>
            {meta.sources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="panel overflow-hidden">
        {loading && data.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="p-5">
            <AdminPageError
              error={error}
              onRetry={() => {
                fetchStats();
                fetchBenchmarks(page);
              }}
            />
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 text-brand-200" />
            <p className="text-text-secondary">No benchmarks found</p>
            <p className="mt-1 text-xs text-text-tertiary">
              {hasFilters ? "Try adjusting your filters" : "No market datapoints found in the Qeemly pool yet"}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="table-head px-5 py-3 text-left">Role</th>
                  <th className="table-head px-5 py-3 text-left">Location</th>
                  <th className="table-head px-5 py-3 text-left">Level</th>
                  <th className="table-head px-5 py-3 text-right">P10</th>
                  <th className="table-head px-5 py-3 text-right">P25</th>
                  <th className="table-head bg-brand-50 px-5 py-3 text-right">P50</th>
                  <th className="table-head px-5 py-3 text-right">P75</th>
                  <th className="table-head px-5 py-3 text-right">P90</th>
                  <th className="table-head px-5 py-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-surface-2">
                    <td className="py-3 px-5">
                      <span className="font-medium capitalize text-text-primary">
                        {b.role_id.replace(/-/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 capitalize text-text-primary">
                      {b.location_id.replace(/-/g, " ")}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium uppercase text-text-secondary">{b.level_id}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-tertiary">
                      {formatSalary(b.p10, b.currency)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-secondary">
                      {formatSalary(b.p25, b.currency)}
                    </td>
                    <td className="bg-brand-50 px-5 py-3 text-right font-mono font-medium text-text-primary">
                      {formatSalary(b.p50, b.currency)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-secondary">
                      {formatSalary(b.p75, b.currency)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-text-tertiary">
                      {formatSalary(b.p90, b.currency)}
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          b.source === "market" ? "bg-brand-50 text-brand-600" : "bg-surface-3 text-text-secondary"
                        }`}
                      >
                        {b.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-4">
                <p className="text-sm text-text-secondary">
                  {total.toLocaleString()} total · Page {page + 1} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchBenchmarks(Math.max(0, page - 1))}
                    disabled={page === 0 || loading}
                    className="rounded-lg border border-border p-2 hover:bg-surface-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => fetchBenchmarks(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1 || loading}
                    className="rounded-lg border border-border p-2 hover:bg-surface-2 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
