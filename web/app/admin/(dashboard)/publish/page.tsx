"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { Card } from "@/components/ui/card";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { ArrowRight, CheckCircle2, Database, RefreshCw, ShieldCheck } from "lucide-react";

type Stats = {
  sources: { total: number; enabled: number };
  jobs_24h: { total: number; success: number; failed: number; running: number; partial: number };
  benchmarks: { total: number };
  freshness: { score: string; last_updated_at: string | null; staleness_hours: number | null };
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

export default function AdminPublishPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);
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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAdminJson<Stats>("/api/admin/stats");
      setStats(payload);
    } catch (err) {
      setError(normalizeAdminApiError(err));
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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
      await loadData();
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
      await loadData();
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
      setSourceCoverage([]);
      setSourceDiagnostics([]);
      setContributionMix(null);
      setMissingCoverageGroups(null);
      setTopMissingExactTriples([]);
      setActionMessage("Published the latest Qeemly market dataset for tenants.");
      await loadData();
    } catch (err) {
      const coverage = extractCoverageFromError(err);
      if (coverage) {
        setCoverageSummary(coverage);
        setSourceCoverage([]);
        setSourceDiagnostics([]);
        setContributionMix(null);
        setMissingCoverageGroups(null);
        setTopMissingExactTriples([]);
      }
      setError(normalizeAdminApiError(err));
    } finally {
      setPublishing(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <AdminPageError error={error} onRetry={loadData} className="mb-6" />
      <div>
        <h1 className="page-title">Publish</h1>
        <p className="page-subtitle">
          Review the release gate for the shared Qeemly market dataset before pushing changes downstream to tenants.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Release Gate</h2>
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
            This page is the publish checkpoint. Source runs, review, and freshness should all be confirmed before the market layer is refreshed for tenants.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">What Publish Means</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-text-primary">Shared-market only</p>
              <p className="mt-1 text-xs text-text-tertiary">
                Publishing affects the Qeemly market dataset, not tenant company uploads.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-text-primary">Tenant overlays stay separate</p>
              <p className="mt-1 text-xs text-text-tertiary">
                Company benchmark uploads remain overlays and should not pass through this release gate.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-brand-500" />
          <h2 className="section-header">Publish Controls</h2>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Use these controls to populate or rebuild the shared market dataset that tenant benchmark pages read.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void runSharedMarketSeed()}
            disabled={seeding || refreshingPool || publishing}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {seeding ? "Running Shared Market Seed..." : "Run Shared Market Seed"}
          </button>
          <button
            type="button"
            onClick={() => void refreshPublishedPool()}
            disabled={seeding || refreshingPool || publishing}
            className="inline-flex items-center rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshingPool ? "Refreshing Published Market Pool..." : "Refresh Published Market Pool"}
          </button>
          <button
            type="button"
            onClick={() => void publishDataset()}
            disabled={seeding || refreshingPool || publishing}
            className="inline-flex items-center rounded-lg bg-accent-900 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {publishing ? "Publishing Dataset..." : "Publish Dataset"}
          </button>
        </div>
        {actionMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {actionMessage}
          </div>
        )}
        {coverageSummary && (
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-primary">
            <p className="font-semibold">
              {coverageSummary.coveredExactTriples} of {coverageSummary.supportedExactTriples} exact benchmark rows are
              {" "}live
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              Coverage: {coverageSummary.coveragePercent}% of the supported role, level, and location matrix.
            </p>
            <p className="mt-2 text-xs text-text-tertiary">
              Official exact coverage: {coverageSummary.officialCoveredExactTriples}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              Proxy-backed exact coverage: {coverageSummary.proxyBackedExactTriples}
            </p>
            <p className="mt-2 text-xs text-text-tertiary">
              {coverageSummary.missingExactTriples === 0
                ? "Exact coverage is complete"
                : `${coverageSummary.missingExactTriples} exact rows are still missing`}
            </p>
            {coverageSummary.missingExamples.length > 0 && (
              <p className="mt-2 text-xs text-text-tertiary">
                Example gaps: {coverageSummary.missingExamples.slice(0, 3).join(", ")}
              </p>
            )}
          </div>
        )}
        {sourceCoverage.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-primary">
            <p className="font-semibold">Raw source coverage</p>
            <p className="mt-1 text-xs text-text-tertiary">
              These counts reflect ingested market rows before tenant-visible pooling thresholds are applied.
            </p>
            <div className="mt-3 space-y-3">
              {sourceCoverage.map((source) => (
                <div key={source.sourceSlug} className="rounded-lg border border-border bg-surface-1 p-3">
                  <p className="font-medium">{source.sourceSlug}</p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {source.exactTriples} exact rows. {source.coveragePercent}% of the supported matrix.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {contributionMix && (
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-primary">
            <p className="font-semibold">Contribution mix</p>
            <p className="mt-1 text-xs text-text-tertiary">
              This shows which published rows already have support from tenant employees, uploaded bands, or admin market sources.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface-1 p-3">
                <p className="text-xs text-text-tertiary">Employee-supported rows: {contributionMix.rowsWithEmployeeSupport}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-1 p-3">
                <p className="text-xs text-text-tertiary">Uploaded-band rows: {contributionMix.rowsWithUploadedSupport}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-1 p-3">
                <p className="text-xs text-text-tertiary">Admin-market rows: {contributionMix.rowsWithAdminSupport}</p>
              </div>
            </div>
          </div>
        )}
        {sourceDiagnostics.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-primary">
            <p className="font-semibold">Source funnel diagnostics</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Each source shows fetched rows, normalization yield, DQ passage, upserts, and current exact-coverage output.
            </p>
            <div className="mt-3 space-y-3">
              {sourceDiagnostics.map((source) => (
                <div key={source.sourceSlug} className="rounded-lg border border-border bg-surface-1 p-3">
                  <p className="font-medium">{source.sourceSlug}</p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Outcome: {source.outcome}. Raw exact rows: {source.rawExactTriples}. Coverage: {source.coveragePercent}%.
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Fetched {source.fetchedRows}. Normalized {source.normalizedRows}. DQ passed {source.dqPassedRows}. Upserted {source.upsertedRows}.
                  </p>
                  {(source.normalizeFailedRows > 0 || source.dqFailedRows > 0 || source.upsertFailedRows > 0) && (
                    <p className="mt-1 text-xs text-text-tertiary">
                      Losses: normalize {source.normalizeFailedRows}, dq {source.dqFailedRows}, upsert {source.upsertFailedRows}.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {missingCoverageGroups && (
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-primary">
            <p className="font-semibold">Biggest exact coverage gaps</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-1 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">By role family</p>
                <div className="mt-2 space-y-2">
                  {missingCoverageGroups.byRoleFamily.slice(0, 5).map((group) => (
                    <p key={group.label} className="text-xs text-text-tertiary">
                      <span className="font-medium text-text-primary">{group.label}</span>: {group.missingExactTriples} missing
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-1 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">By country</p>
                <div className="mt-2 space-y-2">
                  {missingCoverageGroups.byCountry.slice(0, 5).map((group) => (
                    <p key={group.label} className="text-xs text-text-tertiary">
                      <span className="font-medium text-text-primary">{group.label}</span>: {group.missingExactTriples} missing
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {topMissingExactTriples.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-primary">
            <p className="font-semibold">Top missing exact triples</p>
            <div className="mt-3 space-y-3">
              {topMissingExactTriples.map((triple) => (
                <div key={triple.key} className="rounded-lg border border-border bg-surface-1 p-3">
                  <p className="font-medium text-text-primary">{triple.roleTitle}</p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {triple.levelName}. {triple.locationLabel}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">{triple.key}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="section-header">Publish Readiness Links</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/review"
            className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
          >
            <p className="text-sm font-semibold text-text-primary">Review & Normalize</p>
            <p className="mt-1 text-xs text-text-tertiary">Resolve mappings and confidence issues first.</p>
          </Link>
          <Link
            href="/admin/freshness"
            className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
          >
            <p className="text-sm font-semibold text-text-primary">Freshness & Quality</p>
            <p className="mt-1 text-xs text-text-tertiary">Verify the dataset is fresh enough to publish.</p>
          </Link>
          <Link
            href="/admin/benchmarks"
            className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
          >
            <p className="text-sm font-semibold text-text-primary">Benchmarks</p>
            <p className="mt-1 text-xs text-text-tertiary">Inspect the shared-market rows that tenants will see.</p>
          </Link>
        </div>
        <div className="mt-5">
          <Link
            href="/admin/workbench"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Back to Workbench Home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>

      <Card className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <h2 className="section-header">Release principle</h2>
        </div>
        <p className="mt-3 text-sm text-emerald-800">
          Publish only after the shared-market evidence is staged, reviewed, and validated. The platform should never blur this workflow with tenant-specific data management.
        </p>
      </Card>
    </div>
  );
}
