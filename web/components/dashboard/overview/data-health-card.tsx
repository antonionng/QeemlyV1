"use client";

import { Database, AlertCircle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { BenchmarkTrustSummary } from "@/lib/benchmarks/trust";
import type { OverviewDataHealth } from "@/lib/dashboard/company-overview";

interface DataHealthCardProps {
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
  };
  benchmarkTrust?: BenchmarkTrustSummary;
  dataHealth: OverviewDataHealth;
}

export function DataHealthCard({ benchmarkCoverage, benchmarkTrust, dataHealth }: DataHealthCardProps) {
  const latestFresh = dataHealth.latestBenchmarkFreshness;
  const lastSync = dataHealth.lastSync;
  const activeEmployees = benchmarkCoverage?.activeEmployees ?? 0;
  const benchmarkedEmployees = benchmarkCoverage?.benchmarkedEmployees ?? 0;
  const hasCoverage = activeEmployees > 0;
  const coveragePct = hasCoverage ? Math.round((benchmarkedEmployees / activeEmployees) * 100) : 0;
  const trustFreshness = benchmarkTrust?.freshestAt
    ? new Date(benchmarkTrust.freshestAt).toLocaleDateString()
    : null;

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-accent-600" strokeWidth={1.5} />
          <h3 className="overview-card-heading">Data Health</h3>
        </div>
        <Link href="/dashboard/data/runs">
          <span className="text-sm text-accent-600 hover:underline">View runs</span>
        </Link>
      </div>
      <div className="space-y-4 text-sm">
        {hasCoverage && (
          <div className="rounded-2xl border border-accent-200 bg-accent-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-accent-700">Benchmark coverage</span>
              <span className="text-accent-700">
                {benchmarkedEmployees}/{activeEmployees} ({coveragePct}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-accent-200">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
            {coveragePct < 100 && (
              <p className="mt-2 text-xs text-accent-600">
                Some employees do not have role/location/level benchmark matches yet.
              </p>
            )}
          </div>
        )}
        {benchmarkTrust && benchmarkTrust.benchmarkedEmployees > 0 && (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-brand-700">Primary benchmark source</span>
              <Badge variant="outline" className="border-brand-200 text-brand-700">
                {benchmarkTrust.primarySourceLabel}
              </Badge>
            </div>
            <div className="grid gap-2 text-xs text-accent-600 sm:grid-cols-2">
              <span>
                Market-backed: {benchmarkTrust.marketBacked}/{benchmarkTrust.benchmarkedEmployees}
              </span>
              <span>
                Workspace-backed: {benchmarkTrust.workspaceBacked}/{benchmarkTrust.benchmarkedEmployees}
              </span>
              <span>
                Exact matches: {benchmarkTrust.exactMatches}/{benchmarkTrust.benchmarkedEmployees}
              </span>
              <span>
                Role + level fallback: {benchmarkTrust.fallbackMatches}/{benchmarkTrust.benchmarkedEmployees}
              </span>
            </div>
            {trustFreshness && (
              <p className="mt-2 text-xs text-accent-500">Latest benchmark refresh: {trustFreshness}</p>
            )}
          </div>
        )}
        {latestFresh && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
            <span className="text-accent-700">Benchmark freshness</span>
            <div className="flex items-center gap-2">
              <span className="text-accent-500">
                {new Date(latestFresh.lastUpdatedAt).toLocaleDateString()}
              </span>
              <Badge
                variant="outline"
                className={
                  latestFresh.confidence === "high"
                    ? "border-emerald-200 text-emerald-700"
                    : latestFresh.confidence === "medium"
                      ? "border-amber-200 text-amber-700"
                      : "border-rose-200 text-rose-700"
                }
              >
                {latestFresh.confidence}
              </Badge>
            </div>
          </div>
        )}
        {lastSync && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
            <span className="text-accent-700">Last sync</span>
            <div className="flex items-center gap-2">
              {lastSync.status === "success" ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-500" strokeWidth={1.5} />
              )}
              <span className="text-accent-500">
                {new Date(lastSync.startedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
        {!latestFresh && !lastSync && (
          <p className="text-accent-500">No data health metrics yet.</p>
        )}
      </div>
    </Card>
  );
}
