"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BenchmarkSourceBadge } from "@/components/ui/benchmark-source-badge";
import {
  buildMarketLensCards,
  type BenchmarkStatsSummary,
} from "@/lib/company-vs-market";
import clsx from "clsx";

export default function MarketOverviewPage() {
  const [stats, setStats] = useState<BenchmarkStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch("/api/benchmarks/stats", { cache: "no-store" });
      if (!response.ok) {
        setStats(null);
        return;
      }
      const payload = (await response.json()) as BenchmarkStatsSummary;
      setStats(payload);
    } catch (err) {
      console.error("Failed to load market overview stats:", err);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
          <p className="mt-3 text-brand-600">Loading market data...</p>
        </div>
      </div>
    );
  }

  const marketCards = stats ? buildMarketLensCards(stats) : [];
  const freshnessLabel = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleDateString("en-GB")
    : "Awaiting refresh";
  const marketDiagnostics = stats?.diagnostics?.market;
  const marketDiagnosticMessage =
    marketDiagnostics?.error || marketDiagnostics?.warning || marketDiagnostics?.clientWarning;
  const toneClasses = {
    neutral: "border-accent-200 bg-white text-accent-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
    market: "border-brand-200 bg-brand-50 text-brand-900",
    overlay: "border-accent-200 bg-accent-50 text-accent-900",
  } as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="page-title">Market Overview</h1>
          <p className="text-sm text-accent-500">
            Track the Qeemly aggregated market dataset before drilling into specific benchmarks.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setRefreshing(true);
              void loadStats();
            }}
            disabled={refreshing}
            className="h-9 rounded-full border-0 bg-accent-800 px-5 text-white hover:bg-accent-700"
          >
            <RefreshCw className={clsx("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/dashboard/benchmarks">
            <Button
              size="sm"
              className="h-9 rounded-full border-0 bg-brand-500 px-5 text-white hover:bg-brand-600"
            >
              Open Benchmarking
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <BenchmarkSourceBadge source="market" />
              {stats && stats.workspace.count > 0 && <BenchmarkSourceBadge source="uploaded" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-accent-900">Qeemly market dataset</h2>
              <p className="mt-1 max-w-2xl text-sm text-accent-600">
                This page is market-first. It shows the Qeemly aggregated benchmark pool and treats any company-uploaded bands as a secondary overlay only.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-accent-200 bg-white px-4 py-3 text-sm text-accent-700">
            <p className="font-semibold text-accent-900">Latest refresh</p>
            <p>{freshnessLabel}</p>
          </div>
        </div>
      </Card>

      {marketDiagnosticMessage && (
        <Card className="dash-card border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h3 className="text-base font-semibold">Market dataset diagnostics</h3>
          <p className="mt-2 text-sm">
            {marketDiagnosticMessage}
          </p>
          <p className="mt-2 text-xs text-amber-800">
            Read mode: {marketDiagnostics?.readMode === "service" ? "service role" : "session"}
          </p>
        </Card>
      )}

      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {marketCards.map((card) => (
              <Card
                key={card.label}
                className={clsx("dash-card border p-5", toneClasses[card.tone])}
              >
                <p className="text-sm font-semibold">{card.label}</p>
                <p className="mt-3 text-3xl font-bold">{card.value}</p>
                <p className="mt-2 text-xs text-current/75">{card.description}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="dash-card p-5">
              <h3 className="text-base font-semibold text-accent-900">What this page answers</h3>
              <p className="mt-2 text-sm text-accent-500">
                Use Market Overview to understand the breadth, freshness, and coverage of the Qeemly market pool before going deeper into specific roles, levels, and locations.
              </p>
              <Link
                href="/dashboard/benchmarks"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Drill into Benchmarking
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>

            <Card className="dash-card p-5">
              <h3 className="text-base font-semibold text-accent-900">Your data overlay</h3>
              <p className="mt-2 text-sm text-accent-500">
                {stats.workspace.count > 0
                  ? `${stats.workspace.count} workspace band rows are available as a policy overlay, but the market dataset remains the primary benchmark source.`
                  : "No company band overlay has been uploaded yet, so this market view reflects only the Qeemly aggregated dataset."}
              </p>
              <Link
                href="/dashboard/upload"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-700 hover:text-accent-900"
              >
                <Upload className="h-4 w-4" />
                Upload company benchmark bands
              </Link>
            </Card>
          </div>
        </>
      ) : (
        <Card className="dash-card p-5">
          <h3 className="text-base font-semibold text-accent-900">Market data is not available yet</h3>
          <p className="mt-2 text-sm text-accent-500">
            Once the Qeemly market dataset is refreshed, this page will summarize its coverage and point you into Benchmarking for detailed exploration.
          </p>
          <Link
            href="/dashboard/benchmarks"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Open Benchmarking
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}
    </div>
  );
}
