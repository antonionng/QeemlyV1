"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { Card } from "@/components/ui/card";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import {
  ArrowDownToLine,
  BarChart3,
  CheckCircle2,
  Database,
  FileJson,
  Filter,
  RefreshCw,
  ShieldCheck,
  TableProperties,
} from "lucide-react";

type Stats = {
  sources: { total: number; enabled: number };
  jobs_24h: { total: number; success: number; failed: number; running: number; partial: number };
  benchmarks: { total: number };
  freshness: { score: string; last_updated_at: string | null; staleness_hours: number | null };
};

type MarketPublishLatestResponse = {
  event: {
    id: string;
    title: string;
    summary: string;
    rowCount: number;
    publishedAt: string;
  } | null;
};

type CoverageSummary = {
  supportedExactTriples: number;
  coveredExactTriples: number;
  officialCoveredExactTriples: number;
  proxyBackedExactTriples: number;
  missingExactTriples: number;
  coveragePercent: number;
  missingExamples: string[];
};

type MarketSourceCoverage = {
  sourceSlug: string;
  exactTriples: number;
  coveragePercent: number;
  sampleTriples: string[];
};

type MissingCoverageGroup = {
  label: string;
  missingExactTriples: number;
};

type MissingCoverageGroups = {
  byRoleFamily: MissingCoverageGroup[];
  byCountry: MissingCoverageGroup[];
};

type MissingBenchmarkTriple = {
  key: string;
  roleTitle: string;
  levelName: string;
  locationLabel: string;
};

type MarketSeedResponse = {
  ok: boolean;
  poolRows: number;
  selectedSourceSlugs: string[];
  coverage: CoverageSummary;
  sourceCoverage: MarketSourceCoverage[];
  sourceDiagnostics: Array<{
    sourceSlug: string;
    rawExactTriples: number;
    coveragePercent: number;
    outcome: "fetch_empty" | "normalize_empty" | "dq_empty" | "partial_success" | "success";
    fetchedRows: number;
    normalizedRows: number;
    normalizeFailedRows: number;
    dqPassedRows: number;
    dqFailedRows: number;
    upsertedRows: number;
    upsertFailedRows: number;
  }>;
  contributionMix: {
    rowsWithEmployeeSupport: number;
    rowsWithUploadedSupport: number;
    rowsWithAdminSupport: number;
  };
  missingCoverageGroups: MissingCoverageGroups;
  topMissingExactTriples: MissingBenchmarkTriple[];
};

type MarketPoolRefreshResponse = {
  ok: boolean;
  rows: number;
};

type MarketPublishResponse = {
  ok: boolean;
  event: {
    id: string;
    title: string;
    summary: string;
    rowCount: number;
    publishedAt: string;
  };
  coverage: CoverageSummary;
};

type FreshnessRow = {
  id: string;
  source_id: string | null;
  metric_type: string;
  last_updated_at: string;
  record_count: number | null;
  confidence: string;
  ingestion_sources?: { slug: string; name: string } | null;
};

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
};

type MetaResponse = {
  roles: string[];
  locations: string[];
  levels: string[];
  sources: string[];
};

type Snapshot = {
  id: string;
  fetched_at: string;
  schema_version: string;
  row_count: number | null;
  ingestion_sources?: { slug: string; name: string } | null;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: "AED",
  SAR: "SAR",
  QAR: "QAR",
  BHD: "BHD",
  KWD: "KWD",
  OMR: "OMR",
  USD: "USD",
};

function formatMoney(amount: number, currency: string) {
  return `${CURRENCY_SYMBOLS[currency] ?? currency} ${amount.toLocaleString()}`;
}

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function extractCoverageFromError(error: unknown): CoverageSummary | null {
  if (!error || typeof error !== "object" || !("coverage" in error)) return null;
  const coverage = (error as { coverage?: unknown }).coverage;
  if (!coverage || typeof coverage !== "object") return null;
  const candidate = coverage as Partial<CoverageSummary>;
  if (
    typeof candidate.supportedExactTriples !== "number" ||
    typeof candidate.coveredExactTriples !== "number" ||
    typeof candidate.missingExactTriples !== "number" ||
    typeof candidate.coveragePercent !== "number" ||
    !Array.isArray(candidate.missingExamples)
  ) {
    return null;
  }
  return {
    supportedExactTriples: candidate.supportedExactTriples,
    coveredExactTriples: candidate.coveredExactTriples,
    officialCoveredExactTriples:
      typeof candidate.officialCoveredExactTriples === "number" ? candidate.officialCoveredExactTriples : 0,
    proxyBackedExactTriples:
      typeof candidate.proxyBackedExactTriples === "number" ? candidate.proxyBackedExactTriples : 0,
    missingExactTriples: candidate.missingExactTriples,
    coveragePercent: candidate.coveragePercent,
    missingExamples: candidate.missingExamples.filter((value): value is string => typeof value === "string"),
  };
}

export default function AdminMarketPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [latestPublish, setLatestPublish] = useState<MarketPublishLatestResponse["event"]>(null);
  const [freshnessRows, setFreshnessRows] = useState<FreshnessRow[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [meta, setMeta] = useState<MetaResponse>({ roles: [], locations: [], levels: [], sources: [] });
  const [benchmarkTotal, setBenchmarkTotal] = useState(0);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [coverageSummary, setCoverageSummary] = useState<CoverageSummary | null>(null);
  const [sourceCoverage, setSourceCoverage] = useState<MarketSourceCoverage[]>([]);
  const [sourceDiagnostics, setSourceDiagnostics] = useState<MarketSeedResponse["sourceDiagnostics"]>([]);
  const [contributionMix, setContributionMix] = useState<MarketSeedResponse["contributionMix"] | null>(null);
  const [missingCoverageGroups, setMissingCoverageGroups] = useState<MissingCoverageGroups | null>(null);
  const [topMissingExactTriples, setTopMissingExactTriples] = useState<MissingBenchmarkTriple[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [refreshingPool, setRefreshingPool] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const loadSnapshots = async () => {
    try {
      const payload = await fetchAdminJson<Snapshot[]>("/api/admin/snapshots?limit=10");
      setSnapshots(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(normalizeAdminApiError(err));
      setSnapshots([]);
    }
  };

  const loadBenchmarks = async () => {
    const params = new URLSearchParams();
    params.set("page", "0");
    params.set("limit", "20");
    if (roleFilter) params.set("role_id", roleFilter);
    if (locationFilter) params.set("location_id", locationFilter);
    if (levelFilter) params.set("level_id", levelFilter);
    if (sourceFilter) params.set("source", sourceFilter);

    const payload = await fetchAdminJson<{ data: Benchmark[]; total: number }>(`/api/admin/benchmarks?${params}`);
    setBenchmarks(Array.isArray(payload.data) ? payload.data : []);
    setBenchmarkTotal(payload.total ?? 0);
  };

  const loadCoreData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsPayload, latestPublishPayload, freshnessPayload, metaPayload] = await Promise.all([
        fetchAdminJson<Stats>("/api/admin/stats"),
        fetchAdminJson<MarketPublishLatestResponse>("/api/market-publish/latest"),
        fetchAdminJson<FreshnessRow[]>("/api/admin/freshness"),
        fetchAdminJson<MetaResponse>("/api/admin/benchmarks/meta"),
      ]);
      setStats(statsPayload);
      setLatestPublish(latestPublishPayload.event);
      setFreshnessRows(Array.isArray(freshnessPayload) ? freshnessPayload.slice(0, 8) : []);
      setMeta(metaPayload);
      await loadBenchmarks();
      if (advancedOpen) {
        await loadSnapshots();
      }
    } catch (err) {
      setError(normalizeAdminApiError(err));
      setStats(null);
      setLatestPublish(null);
      setFreshnessRows([]);
      setBenchmarks([]);
      setMeta({ roles: [], locations: [], levels: [], sources: [] });
      setBenchmarkTotal(0);
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoreData();
  }, []);

  useEffect(() => {
    void loadBenchmarks().catch((err) => setError(normalizeAdminApiError(err)));
  }, [roleFilter, locationFilter, levelFilter, sourceFilter]);

  useEffect(() => {
    if (!advancedOpen || snapshots.length > 0) return;
    void loadSnapshots();
  }, [advancedOpen, snapshots.length]);

  const publishChecks = [
    {
      label: "Sources enabled",
      value: loading ? "Loading..." : `${stats?.sources?.enabled ?? 0} of ${stats?.sources?.total ?? 0}`,
    },
    {
      label: "Recent runs",
      value: loading ? "Loading..." : `${stats?.jobs_24h?.success ?? 0} successful in 24h`,
    },
    {
      label: "Freshness score",
      value: loading ? "Loading..." : stats?.freshness?.score ?? "unknown",
    },
    {
      label: "Shared rows",
      value: loading ? "Loading..." : `${stats?.benchmarks?.total ?? 0} rows`,
    },
  ];

  const freshnessSummary = useMemo(() => {
    const fresh = freshnessRows.filter((row) => {
      const hours = (Date.now() - new Date(row.last_updated_at).getTime()) / 3_600_000;
      return hours < 6;
    }).length;
    const stale = freshnessRows.filter((row) => {
      const hours = (Date.now() - new Date(row.last_updated_at).getTime()) / 3_600_000;
      return hours >= 6 && hours < 24;
    }).length;
    const critical = freshnessRows.length - fresh - stale;
    return { fresh, stale, critical };
  }, [freshnessRows]);

  const runSharedMarketSeed = async () => {
    setSeeding(true);
    setActionMessage(null);
    setError(null);
    try {
      const payload = await fetchAdminJson<MarketSeedResponse>("/api/admin/market-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setCoverageSummary(payload.coverage);
      setSourceCoverage(payload.sourceCoverage);
      setSourceDiagnostics(payload.sourceDiagnostics);
      setContributionMix(payload.contributionMix);
      setMissingCoverageGroups(payload.missingCoverageGroups);
      setTopMissingExactTriples(payload.topMissingExactTriples);
      setActionMessage(`Seeded shared market data. ${payload.poolRows} pooled rows are now available.`);
      await loadCoreData();
    } catch (err) {
      setError(normalizeAdminApiError(err));
    } finally {
      setSeeding(false);
    }
  };

  const refreshPublishedPool = async () => {
    setRefreshingPool(true);
    setActionMessage(null);
    setError(null);
    try {
      const payload = await fetchAdminJson<MarketPoolRefreshResponse>("/api/benchmarks/market-pool/refresh", {
        method: "POST",
      });
      setCoverageSummary(null);
      setSourceCoverage([]);
      setSourceDiagnostics([]);
      setContributionMix(null);
      setMissingCoverageGroups(null);
      setTopMissingExactTriples([]);
      setActionMessage(`Rebuilt the published market pool. ${payload.rows} shared rows are live.`);
      await loadCoreData();
    } catch (err) {
      setError(normalizeAdminApiError(err));
    } finally {
      setRefreshingPool(false);
    }
  };

  const publishDataset = async () => {
    setPublishing(true);
    setActionMessage(null);
    setError(null);
    try {
      const payload = await fetchAdminJson<MarketPublishResponse>("/api/admin/market-publish", {
        method: "POST",
      });
      setCoverageSummary(payload.coverage);
      setActionMessage("Published the latest Qeemly market dataset for tenants.");
      await loadCoreData();
    } catch (err) {
      const coverage = extractCoverageFromError(err);
      if (coverage) {
        setCoverageSummary(coverage);
      }
      setError(normalizeAdminApiError(err));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageError error={error} onRetry={() => void loadCoreData()} className="mb-6" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Market Overview</h1>
          <p className="page-subtitle">
            See what is live, what is fresh, and which operator actions can change the shared market layer.
          </p>
        </div>
        <button
          onClick={() => void loadCoreData()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {actionMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Latest Publish</p>
          <p className="mt-2 text-xl font-bold text-text-primary">
            {latestPublish ? formatRelativeTime(latestPublish.publishedAt) : "No publish yet"}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {latestPublish ? latestPublish.summary : "Automatic PDF publishing records an audit event after ingest."}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Shared Rows</p>
          <p className="mt-2 text-xl font-bold text-text-primary">{stats?.benchmarks?.total ?? 0}</p>
          <p className="mt-1 text-xs text-text-tertiary">Current live benchmark rows in the pooled market layer.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Sources Enabled</p>
          <p className="mt-2 text-xl font-bold text-text-primary">
            {stats ? `${stats.sources.enabled} / ${stats.sources.total}` : "0 / 0"}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">Automated feeds available for ingestion today.</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Freshness Score</p>
          <p className="mt-2 text-xl font-bold capitalize text-text-primary">{stats?.freshness?.score ?? "unknown"}</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Last updated {formatRelativeTime(stats?.freshness?.last_updated_at ?? null)}.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Coverage Summary</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {publishChecks.map((check) => (
              <div key={check.label} className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{check.label}</p>
                <p className="mt-2 text-sm font-semibold text-text-primary">{check.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            PDF review rows publish automatically after ingest. Use the advanced controls below only when you need manual refreshes, seeding, or diagnostics.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Freshness Monitor</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Fresh</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{freshnessSummary.fresh}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Stale</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">{freshnessSummary.stale}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Critical</p>
              <p className="mt-2 text-2xl font-bold text-rose-600">{freshnessSummary.critical}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {freshnessRows.map((row) => (
              <div key={row.id} className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="text-sm font-semibold text-text-primary">
                  {row.ingestion_sources?.name ?? row.source_id ?? "Platform"}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  {row.metric_type} · {row.record_count?.toLocaleString() ?? 0} rows · {formatRelativeTime(row.last_updated_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand-500" />
          <h2 className="section-header">Published Benchmarks</h2>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary"
          >
            <option value="">All roles</option>
            {meta.roles.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary"
          >
            <option value="">All locations</option>
            {meta.locations.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary"
          >
            <option value="">All levels</option>
            {meta.levels.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary"
          >
            <option value="">All sources</option>
            {meta.sources.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-sm text-text-secondary">{benchmarkTotal} benchmark rows match the current filters.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="table-head px-4 py-3 text-left">Role</th>
                <th className="table-head px-4 py-3 text-left">Location</th>
                <th className="table-head px-4 py-3 text-left">Level</th>
                <th className="table-head px-4 py-3 text-left">Median</th>
                <th className="table-head px-4 py-3 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((row) => (
                <tr key={row.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-text-primary">{row.role_id}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.location_id}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.level_id}</td>
                  <td className="px-4 py-3 text-text-primary">{formatMoney(row.p50, row.currency)}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <button
          type="button"
          onClick={() => setAdvancedOpen((current) => !current)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <TableProperties className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Advanced</h2>
          </div>
          <span className="text-sm font-medium text-brand-600">{advancedOpen ? "Hide" : "Show"}</span>
        </button>

        {advancedOpen ? (
          <div className="mt-4 space-y-6">
            <div>
              <p className="text-sm text-text-secondary">
                Manual tools for seeding, rebuilding, and inspecting raw pipeline artifacts.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runSharedMarketSeed()}
                  disabled={seeding || refreshingPool || publishing}
                  className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {seeding ? "Running..." : "Run Shared Market Seed"}
                </button>
                <button
                  type="button"
                  onClick={() => void refreshPublishedPool()}
                  disabled={seeding || refreshingPool || publishing}
                  className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshingPool ? "Refreshing..." : "Refresh Published Market Pool"}
                </button>
                <button
                  type="button"
                  onClick={() => void publishDataset()}
                  disabled={seeding || refreshingPool || publishing}
                  className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {publishing ? "Publishing..." : "Publish Dataset"}
                </button>
              </div>
            </div>

            {coverageSummary ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-sm font-semibold text-text-primary">
                    {coverageSummary.coveredExactTriples} of {coverageSummary.supportedExactTriples} exact benchmark rows are live
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Official exact coverage: {coverageSummary.officialCoveredExactTriples}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Proxy-backed exact coverage: {coverageSummary.proxyBackedExactTriples}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {coverageSummary.missingExactTriples === 0
                      ? "Exact coverage is complete"
                      : `${coverageSummary.missingExactTriples} exact rows are still missing`}
                  </p>
                  {coverageSummary.missingExamples.length > 0 ? (
                    <p className="mt-2 text-xs text-text-secondary">
                      Example gaps: {coverageSummary.missingExamples.join(", ")}
                    </p>
                  ) : null}
                </div>

                {sourceCoverage.length > 0 ? (
                  <div className="rounded-xl border border-border bg-surface-2 p-4">
                    <p className="text-sm font-semibold text-text-primary">Raw source coverage</p>
                    <div className="mt-3 space-y-2">
                      {sourceCoverage.map((item) => (
                        <p key={item.sourceSlug} className="text-xs text-text-secondary">
                          {item.sourceSlug} · {item.exactTriples} exact rows
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {contributionMix ? (
                  <div className="rounded-xl border border-border bg-surface-2 p-4">
                    <p className="text-sm font-semibold text-text-primary">Contribution mix</p>
                    <p className="mt-2 text-xs text-text-secondary">
                      Employee-supported rows: {contributionMix.rowsWithEmployeeSupport}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Uploaded-band rows: {contributionMix.rowsWithUploadedSupport}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Admin-market rows: {contributionMix.rowsWithAdminSupport}
                    </p>
                  </div>
                ) : null}

                {sourceDiagnostics.length > 0 ? (
                  <div className="rounded-xl border border-border bg-surface-2 p-4">
                    <p className="text-sm font-semibold text-text-primary">Source funnel diagnostics</p>
                    <div className="mt-3 space-y-2">
                      {sourceDiagnostics.map((item) => (
                        <p key={item.sourceSlug} className="text-xs text-text-secondary">
                          {item.sourceSlug} · Fetched {item.fetchedRows} · Normalized {item.normalizedRows} · Upserted {item.upsertedRows}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {missingCoverageGroups ? (
                  <div className="rounded-xl border border-border bg-surface-2 p-4">
                    <p className="text-sm font-semibold text-text-primary">Biggest exact coverage gaps</p>
                    <div className="mt-3 space-y-2">
                      {missingCoverageGroups.byRoleFamily.map((item) => (
                        <p key={`role-${item.label}`} className="text-xs text-text-secondary">
                          {item.label} · {item.missingExactTriples} missing
                        </p>
                      ))}
                      {missingCoverageGroups.byCountry.map((item) => (
                        <p key={`country-${item.label}`} className="text-xs text-text-secondary">
                          {item.label} · {item.missingExactTriples} missing
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {topMissingExactTriples.length > 0 ? (
                  <div className="rounded-xl border border-border bg-surface-2 p-4">
                    <p className="text-sm font-semibold text-text-primary">Top missing exact triples</p>
                    <div className="mt-3 space-y-2">
                      {topMissingExactTriples.map((item) => (
                        <p key={item.key} className="text-xs text-text-secondary">
                          {item.roleTitle} · {item.levelName} · {item.locationLabel}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-semibold text-text-primary">Raw snapshots</p>
              </div>
              <div className="mt-3 space-y-2">
                {snapshots.map((snapshot) => (
                  <p key={snapshot.id} className="text-xs text-text-secondary">
                    {snapshot.ingestion_sources?.name ?? snapshot.ingestion_sources?.slug ?? "Unknown source"} ·{" "}
                    {snapshot.row_count?.toLocaleString() ?? 0} rows · {snapshot.schema_version}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
