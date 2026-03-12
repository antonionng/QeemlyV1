"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { Card } from "@/components/ui/card";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { ADMIN_DATA_OWNERSHIP, WORKBENCH_STAGES, getWorkbenchCoverageSummary } from "@/lib/admin/workbench";
import { Activity, ArrowRight, Database, FolderInput, RefreshCw, ShieldCheck } from "lucide-react";

type Source = {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  config?: { health?: string };
  last_run?: { completed_at: string; status: string };
};

type Stats = {
  sources: { total: number; enabled: number };
  jobs_24h: { total: number; success: number; failed: number; running: number; partial: number };
  benchmarks: { total: number };
  freshness: { score: string; last_updated_at: string | null; staleness_hours: number | null };
};

function getHealthLabel(health: string | undefined): string {
  switch (health) {
    case "live":
      return "Live API";
    case "static":
      return "Static source";
    case "degraded":
      return "Needs attention";
    default:
      return "Unknown";
  }
}

export default function WorkbenchHomePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAdminJson<Source[]>("/api/admin/sources"),
      fetchAdminJson<Stats>("/api/admin/stats"),
    ])
      .then(([sourceRows, statsRow]) => {
        setSources(Array.isArray(sourceRows) ? sourceRows : []);
        setStats(statsRow);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setSources([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = getWorkbenchCoverageSummary({
    totalSources: stats?.sources.total ?? 0,
    enabledSources: stats?.sources.enabled ?? 0,
    totalBenchmarks: stats?.benchmarks.total ?? 0,
    freshnessScore: stats?.freshness.score ?? "unknown",
  });

  const highlightedSources = sources.filter((source) => source.enabled).slice(0, 6);

  return (
    <div>
      <AdminPageError error={error} onRetry={loadData} className="mb-6" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Market Data Workbench</h1>
          <p className="page-subtitle">
            Steward the shared Qeemly market dataset from intake through publish.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Workflow Stages</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {WORKBENCH_STAGES.map((stage) => (
              <Link
                key={stage.id}
                href={stage.href}
                className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
              >
                <p className="text-sm font-semibold text-text-primary">{stage.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-tertiary">{stage.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Ownership Boundary</h2>
          </div>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Tenant dashboard
              </p>
              <ul className="mt-3 space-y-2 text-sm text-text-primary">
                {ADMIN_DATA_OWNERSHIP.tenantDashboard.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                Super admin workbench
              </p>
              <ul className="mt-3 space-y-2 text-sm text-text-primary">
                {ADMIN_DATA_OWNERSHIP.superAdminWorkbench.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Source Coverage</p>
          <p className="mt-3 text-2xl font-bold text-text-primary">{summary.sourceCoverageLabel}</p>
          <p className="mt-2 text-sm text-text-tertiary">
            Keep source health and operator actions in the workbench instead of the platform admin overview.
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Shared Market Coverage</p>
          <p className="mt-3 text-2xl font-bold text-text-primary">{summary.benchmarkCoverageLabel}</p>
          <p className="mt-2 text-sm text-text-tertiary">
            This layer remains the primary benchmark source that tenants compare against.
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Publish Status</p>
          <p className="mt-3 text-2xl font-bold capitalize text-text-primary">{summary.publishStatusLabel}</p>
          <p className="mt-2 text-sm text-text-tertiary">
            Use review, freshness, and publish checks before refreshing the live market layer.
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Active Sources</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {highlightedSources.length > 0 ? (
              highlightedSources.map((source) => (
                <div key={source.id} className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-sm font-semibold text-text-primary">{source.name}</p>
                  <p className="mt-1 font-mono text-xs text-text-tertiary">{source.slug}</p>
                  <p className="mt-3 text-xs text-text-secondary">{getHealthLabel(source.config?.health)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-tertiary">
                No enabled sources yet.
              </div>
            )}
          </div>
          <Link
            href="/admin/sources"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Open Sources
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <FolderInput className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Manual Research Intake</h2>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            CSV research files and source PDFs should enter the shared-market workflow through Inbox, not through tenant upload flows.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-text-primary">Structured import</p>
              <p className="mt-1 text-xs text-text-tertiary">
                CSV and spreadsheet evidence destined for staged normalization.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-text-primary">Document review</p>
              <p className="mt-1 text-xs text-text-tertiary">
                PDFs and salary guides that require analyst extraction and confidence review.
              </p>
            </div>
          </div>
          <Link
            href="/admin/inbox"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Open Inbox
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
