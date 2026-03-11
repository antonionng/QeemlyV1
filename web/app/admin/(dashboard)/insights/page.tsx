"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ArrowRight, AlertTriangle, Building2, Database, ShieldCheck, Zap } from "lucide-react";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { Card } from "@/components/ui/card";
import {
  fetchAdminJson,
  normalizeAdminApiError,
  type NormalizedAdminApiError,
} from "@/lib/admin/api-client";
import {
  buildExecutiveHeadlineCards,
  getExecutiveCardToneClasses,
  getIntegrityFlagTone,
} from "@/lib/admin/executive-dashboard";
import type { ExecutiveInsightsResponse } from "@/lib/admin/executive-insights";

function fetchExecutiveInsights() {
  return fetchAdminJson<ExecutiveInsightsResponse>("/api/admin/executive-insights");
}

export default function AdminInsightsPage() {
  const [insights, setInsights] = useState<ExecutiveInsightsResponse | null>(null);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = () => {
    setLoading(true);
    setError(null);
    fetchExecutiveInsights()
      .then((payload) => {
        setInsights(payload);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setInsights(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExecutiveInsights()
      .then((payload) => {
        setInsights(payload);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setInsights(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const headlineCards = insights ? buildExecutiveHeadlineCards(insights) : [];

  return (
    <div>
      <AdminPageError error={error} onRetry={loadInsights} className="mb-6" />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Executive Insights</h1>
          <p className="page-subtitle">
            Cross-platform visibility into market intelligence, tenant health, and operational risk.
          </p>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {insights ? (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-6">
            {headlineCards.map((card) => (
              <Card key={card.label} className={`p-5 ${getExecutiveCardToneClasses(card.tone)}`}>
                <p className="text-xs font-semibold uppercase tracking-wide">{card.label}</p>
                <p className="mt-3 text-3xl font-bold">{card.value}</p>
                <p className="mt-2 text-xs text-current/75">{card.description}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-brand-500" />
                <h2 className="section-header">Market Intelligence</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Market coverage
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.market.summary.uniqueRoles} roles, {insights.market.summary.uniqueLocations} locations,{" "}
                    {insights.market.summary.uniqueLevels} levels
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {insights.market.summary.contributorQualifiedRows} rows meet the contributor threshold
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Freshness watch
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.market.summary.staleRows} stale rows require renewed ingestion attention
                  </p>
                  <Link
                    href="/admin/freshness"
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Open Freshness
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Top roles</h3>
                  <div className="mt-3 space-y-2">
                    {insights.market.topRoles.map((role) => (
                      <div key={role.roleId} className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-text-primary">
                            {formatSlug(role.roleId)}
                          </span>
                          <span className="text-xs text-brand-600">{role.benchmarkCount} rows</span>
                        </div>
                        <p className="mt-1 text-xs text-text-tertiary">
                          {role.locationCount} locations, {role.levelCount} levels
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Source mix</h3>
                  <div className="mt-3 space-y-2">
                    {insights.market.sourceMix.map((source) => (
                      <div
                        key={source.sourceType}
                        className="rounded-lg border border-border bg-surface-2 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-text-primary">
                            {formatSlug(source.sourceType)}
                          </span>
                          <span className="text-xs text-brand-600">
                            {source.contributionCount} contributions
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-text-tertiary">
                          Present in {source.rowCount} pooled rows
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href="/admin/benchmarks"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Open benchmark explorer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-500" />
                <h2 className="section-header">Tenant And Product Health</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Workspace activity
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.tenantHealth.activeWorkspaceCount} of {insights.tenantHealth.workspaceCount} workspaces are active
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {insights.tenantHealth.uploadsLast30Days} uploads in the last 30 days
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Benchmarked tenant data
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.tenantHealth.uploadedBenchmarkRows} uploaded benchmark rows are available as tenant overlays
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {insights.tenantHealth.employeeCount} employees represented in current telemetry
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold text-text-primary">Top workspaces</h3>
                <div className="mt-3 space-y-2">
                  {insights.tenantHealth.topWorkspaces.map((workspace) => (
                    <div
                      key={workspace.workspaceId}
                      className="rounded-lg border border-border bg-surface-2 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-text-primary">
                          {workspace.workspaceName}
                        </span>
                        <span className="text-xs text-brand-600">
                          {workspace.employeeCount} employees
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-tertiary">
                        {workspace.uploadCount} uploads, {workspace.uploadedBenchmarkCount} uploaded benchmark rows
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/admin/tenants"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Open tenant explorer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h2 className="section-header">Platform Operations</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Source estate
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.ops.sources.enabled} enabled of {insights.ops.sources.total} total sources
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {insights.ops.sources.degraded} degraded source{insights.ops.sources.degraded === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Jobs last 24h
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.ops.jobs24h.success} success, {insights.ops.jobs24h.failed} failed,{" "}
                    {insights.ops.jobs24h.running} running
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {insights.ops.jobs24h.total} total jobs observed
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Freshness status
                  </p>
                  <p className="mt-2 text-sm capitalize text-text-primary">
                    {insights.ops.freshness.score}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {insights.ops.freshness.stalenessHours == null
                      ? "No freshness data yet"
                      : `${insights.ops.freshness.stalenessHours} hours since latest refresh`}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/admin/pipeline"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-3"
                >
                  Pipeline
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/freshness"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-3"
                >
                  Freshness
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/snapshots"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-3"
                >
                  Snapshots
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-500" />
                <h2 className="section-header">Integrity Flags</h2>
              </div>
              <div className="mt-4 space-y-3">
                {insights.integrityFlags.length > 0 ? (
                  insights.integrityFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`rounded-xl border px-4 py-3 ${getIntegrityFlagTone(flag.severity)}`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm font-semibold">{flag.title}</p>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-wide text-current/70">
                        {flag.id.replace(/-/g, " ")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                    <p className="text-sm font-semibold">No current integrity flags</p>
                    <p className="mt-1 text-xs text-emerald-800">
                      The combined market, tenant, and ops rollups are not currently reporting elevated platform risks.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-text-secondary">
            {loading ? "Loading executive insights..." : "Executive insights are not available yet."}
          </p>
        </Card>
      )}
    </div>
  );
}

function formatSlug(value: string): string {
  return value.replace(/-/g, " ");
}
