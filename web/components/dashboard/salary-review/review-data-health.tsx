"use client";

import { Database } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { BenchmarkTrustSummary } from "@/lib/benchmarks/trust";

type ReviewDataHealthProps = {
  benchmarkTrust: BenchmarkTrustSummary;
  activeEmployees: number;
};

export function ReviewDataHealth({ benchmarkTrust, activeEmployees }: ReviewDataHealthProps) {
  const coveragePct =
    activeEmployees > 0
      ? Math.round((benchmarkTrust.benchmarkedEmployees / activeEmployees) * 100)
      : 0;

  return (
    <Card className="dash-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-accent-600" />
          <h3 className="text-base font-semibold text-accent-900">Review Data Health</h3>
        </div>
        <Link href="/dashboard/data/runs" className="text-sm text-accent-600 hover:underline">
          View runs
        </Link>
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <div className="rounded-xl border border-accent-200 bg-accent-50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-accent-700">Benchmark coverage</span>
            <span className="text-accent-700">
              {benchmarkTrust.benchmarkedEmployees}/{activeEmployees} ({coveragePct}%)
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent-200">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${coveragePct}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-brand-700">Primary benchmark source</span>
            <span className="rounded-full border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {benchmarkTrust.primarySourceLabel}
            </span>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-accent-600 sm:grid-cols-2">
            <span>Market-backed: {benchmarkTrust.marketBacked}</span>
            <span>Workspace-backed: {benchmarkTrust.workspaceBacked}</span>
            <span>Exact matches: {benchmarkTrust.exactMatches}</span>
            <span>Fallback matches: {benchmarkTrust.fallbackMatches}</span>
          </div>
          {benchmarkTrust.freshestAt && (
            <p className="mt-3 text-xs text-accent-500">
              Latest benchmark refresh: {new Date(benchmarkTrust.freshestAt).toLocaleDateString("en-GB")}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
