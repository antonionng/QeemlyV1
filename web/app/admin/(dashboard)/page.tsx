"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import {
  RefreshCw,
  ArrowRight,
  Building2,
  Users,
  AlertTriangle,
  Database,
  ShieldCheck,
  GitBranch,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  buildExecutiveHeadlineCards,
  getExecutiveCardToneClasses,
  getIntegrityFlagTone,
} from "@/lib/admin/executive-dashboard";
import type { ExecutiveInsightsResponse } from "@/lib/admin/executive-insights";
import { ADMIN_DATA_OWNERSHIP } from "@/lib/admin/workbench";

export default function AdminOverviewPage() {
  const [insights, setInsights] = useState<ExecutiveInsightsResponse | null>(null);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = () => {
    setLoading(true);
    setError(null);
    fetchAdminJson<ExecutiveInsightsResponse>("/api/admin/executive-insights")
      .then((payload) => {
        setInsights(payload);
      })
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setInsights(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const headlineCards = insights ? buildExecutiveHeadlineCards(insights) : [];

  return (
    <div>
      <AdminPageError error={error} onRetry={loadInsights} className="mb-6" />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="page-subtitle">
            Run the platform without mixing tenant operations with shared-market stewardship.
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

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-500" />
                <h2 className="section-header">Platform Admin Scope</h2>
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Keep super admin focused on platform oversight while the market data workbench owns the shared Qeemly dataset lifecycle.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Tenant dashboard owns
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-text-primary">
                    {ADMIN_DATA_OWNERSHIP.tenantDashboard.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Super admin workbench owns
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-text-primary">
                    {ADMIN_DATA_OWNERSHIP.superAdminWorkbench.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="section-header">Integrity Flags</h2>
              </div>
              <div className="mt-4 space-y-3">
                {insights.integrityFlags.length > 0 ? (
                  insights.integrityFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`rounded-xl border px-4 py-3 ${getIntegrityFlagTone(flag.severity)}`}
                    >
                      <p className="text-sm font-semibold">{flag.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-current/70">
                        {flag.id.replace(/-/g, " ")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                    <p className="text-sm font-semibold">No current integrity flags</p>
                    <p className="mt-1 text-xs text-emerald-800">
                      Platform health, tenant activity, and market coverage are not currently raising operator warnings.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="p-5 xl:col-span-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-500" />
                <h2 className="section-header">Platform Administration</h2>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Tenant health
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.tenantHealth.activeWorkspaceCount} of {insights.tenantHealth.workspaceCount} workspaces are active.
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {insights.tenantHealth.uploadsLast30Days} uploads observed over the last 30 days.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Users and employees
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.tenantHealth.employeeCount} employee records are currently represented in tenant telemetry.
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Uploaded benchmark overlays: {insights.tenantHealth.uploadedBenchmarkRows}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/admin/tenants"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-3"
                >
                  Open Tenants
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-3"
                >
                  Open Users
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-brand-500" />
                <h2 className="section-header">Publishing Status</h2>
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Shared market coverage
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.market.summary.benchmarkCount} pooled rows across {insights.market.summary.uniqueRoles} roles and{" "}
                    {insights.market.summary.uniqueLocations} locations.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Stewardship focus
                  </p>
                  <p className="mt-2 text-sm text-text-primary">
                    {insights.market.summary.staleRows} stale rows and {insights.market.summary.contributorQualifiedRows} contributor-qualified rows.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/publish"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Open Publish Controls
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-brand-500" />
              <h2 className="section-header">Market Data Workbench</h2>
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              Use the workbench for source intake, runs, review, freshness, and publishing. The admin overview stays intentionally lighter.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Link
                href="/admin/workbench"
                className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
              >
                <p className="text-sm font-semibold text-text-primary">Open Workbench Home</p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Current queues, ownership boundary, and workflow stages.
                </p>
              </Link>
              <Link
                href="/admin/runs"
                className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
              >
                <p className="text-sm font-semibold text-text-primary">Open Runs</p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Trigger ingestion and inspect recent source runs.
                </p>
              </Link>
              <Link
                href="/admin/review"
                className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
              >
                <p className="text-sm font-semibold text-text-primary">Open Review & Normalize</p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Govern confidence, mappings, and release readiness.
                </p>
              </Link>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-sm text-text-secondary">
            {loading ? "Loading platform overview..." : "Platform overview data is not available yet."}
          </p>
        </Card>
      )}
    </div>
  );
}
