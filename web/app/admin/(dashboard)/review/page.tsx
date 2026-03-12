"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageError } from "@/components/admin/admin-page-error";
import { Card } from "@/components/ui/card";
import { fetchAdminJson, normalizeAdminApiError, type NormalizedAdminApiError } from "@/lib/admin/api-client";
import { ArrowRight, CheckCircle2, Database, ShieldCheck, Sparkles } from "lucide-react";

type Stats = {
  sources: { total: number; enabled: number };
  jobs_24h: { total: number; success: number; failed: number; running: number; partial: number };
  benchmarks: { total: number };
  freshness: { score: string; last_updated_at: string | null; staleness_hours: number | null };
};

export default function AdminReviewPage() {
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

  const reviewChecklist = [
    "Map incoming roles into the Qeemly canonical role set.",
    "Confirm locations align with the supported Gulf markets.",
    "Review level mapping and confidence before publish.",
    "Verify stale or low-density cohorts before refreshing the live dataset.",
  ];

  return (
    <div className="space-y-6">
      <AdminPageError error={error} onRetry={loadData} className="mb-6" />
      <div>
        <h1 className="page-title">Review & Normalize</h1>
        <p className="page-subtitle">
          Govern mappings, confidence, and publish readiness for the shared Qeemly market dataset.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Coverage Queue</h2>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            {loading
              ? "Loading coverage metrics..."
              : `${stats?.benchmarks.total ?? 0} benchmark rows currently sit in the shared market layer.`}
          </p>
          <p className="mt-2 text-xs text-text-tertiary">
            Review coverage gaps before trusting the published layer for tenant benchmarking.
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Freshness Signal</h2>
          </div>
          <p className="mt-3 text-sm capitalize text-text-secondary">
            {loading ? "Loading freshness..." : stats?.freshness.score ?? "unknown"}
          </p>
          <p className="mt-2 text-xs text-text-tertiary">
            Pair freshness checks with source provenance and confidence before publish.
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-500" />
            <h2 className="section-header">Governance Reminder</h2>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            Tenant company uploads do not belong in this queue. Review here should apply only to shared-market evidence.
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-brand-500" />
          <h2 className="section-header">Review Checklist</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reviewChecklist.map((item) => (
            <div key={item} className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-sm text-text-primary">{item}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="section-header">Next Steps</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/inbox"
            className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
          >
            <p className="text-sm font-semibold text-text-primary">Open Inbox</p>
            <p className="mt-1 text-xs text-text-tertiary">Stage manual CSV and PDF evidence before review.</p>
          </Link>
          <Link
            href="/admin/freshness"
            className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
          >
            <p className="text-sm font-semibold text-text-primary">Open Freshness & Quality</p>
            <p className="mt-1 text-xs text-text-tertiary">Confirm staleness and confidence before publish.</p>
          </Link>
          <Link
            href="/admin/publish"
            className="rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3"
          >
            <p className="text-sm font-semibold text-text-primary">Open Publish</p>
            <p className="mt-1 text-xs text-text-tertiary">Promote reviewed evidence into the live market layer.</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
