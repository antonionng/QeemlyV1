"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { Card } from "@/components/ui/card";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { ArrowRight, CheckCircle2, Database, ShieldCheck } from "lucide-react";

type Stats = {
  sources: { total: number; enabled: number };
  jobs_24h: { total: number; success: number; failed: number; running: number; partial: number };
  benchmarks: { total: number };
  freshness: { score: string; last_updated_at: string | null; staleness_hours: number | null };
};

export default function AdminPublishPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<NormalizedAdminApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchAdminJson<Stats>("/api/admin/stats")
      .then((payload) => setStats(payload))
      .catch((err) => {
        setError(normalizeAdminApiError(err));
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const publishChecks = [
    {
      label: "Sources enabled",
      value: loading ? "Loading..." : `${stats?.sources.enabled ?? 0} of ${stats?.sources.total ?? 0}`,
    },
    {
      label: "Recent runs",
      value: loading ? "Loading..." : `${stats?.jobs_24h.success ?? 0} successful in 24h`,
    },
    {
      label: "Freshness score",
      value: loading ? "Loading..." : stats?.freshness.score ?? "unknown",
    },
    {
      label: "Shared rows",
      value: loading ? "Loading..." : `${stats?.benchmarks.total ?? 0} rows`,
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
