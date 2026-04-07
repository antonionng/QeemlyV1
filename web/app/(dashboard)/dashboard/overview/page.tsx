"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ArrowRight, Loader2, RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import {
  StatCards,
  DataHealthCard,
  DepartmentTabs,
  HealthScore,
  PayrollTrend,
  BandDistributionChart,
  QuickActions,
  ShortcutsRow,
  AdvisoryPanel,
  OverviewDetailDrawer,
} from "@/components/dashboard/overview";
import { useCompanySettings } from "@/lib/company";
import {
  hydrateCompanyOverviewSnapshot,
  type CompanyOverviewSnapshot,
} from "@/lib/dashboard/company-overview";
import {
  buildOverviewInteractionMap,
  type OverviewInteractionTarget,
  type OverviewMetricDrawerContent,
} from "@/lib/dashboard/overview-interactions";
import { useWorkspaceChangeVersion } from "@/lib/workspace-client";

const EMPTY_SNAPSHOT: CompanyOverviewSnapshot = {
  metrics: {
    totalEmployees: 0,
    activeEmployees: 0,
    benchmarkedEmployees: 0,
    totalPayroll: 0,
    inBandPercentage: 0,
    outOfBandPercentage: 0,
    avgMarketPosition: 0,
    rolesOutsideBand: 0,
    departmentsOverBenchmark: 0,
    payrollRiskFlags: 0,
    healthScore: 0,
    headcountTrend: [],
    payrollTrend: [],
    riskBreakdown: [],
    bandDistribution: {
      inBand: 0,
      above: 0,
      below: 0,
    },
    bandDistributionCounts: {
      inBand: 0,
      above: 0,
      below: 0,
    },
    headcountChange: 0,
    payrollChange: 0,
    inBandChange: 0,
    trendMode: "inferred_from_current_roster",
  },
  departmentSummaries: [],
  benchmarkCoverage: {
    activeEmployees: 0,
    benchmarkedEmployees: 0,
    unbenchmarkedEmployees: 0,
    coveragePct: 0,
  },
  benchmarkTrust: {
    benchmarkedEmployees: 0,
    marketBacked: 0,
    workspaceBacked: 0,
    exactMatches: 0,
    fallbackMatches: 0,
    freshestAt: null,
    primarySourceLabel: "No benchmark coverage",
  },
  advisoryCandidates: [],
  actions: [],
  insights: [],
  riskSummary: {
    totalAtRisk: 0,
    methodologyLabel: "Tracks benchmarked employees whose pay sits above market thresholds.",
    coverageNote: "Counts are based on benchmarked employees only.",
    departmentRows: [],
  },
  dataHealth: {
    latestBenchmarkFreshness: null,
    lastSync: null,
  },
};

export default function CompanyOverviewPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [drawerContent, setDrawerContent] = useState<OverviewMetricDrawerContent | null>(null);
  const { companyName, isConfigured } = useCompanySettings();
  const [snapshot, setSnapshot] = useState<CompanyOverviewSnapshot | null>(null);
  const router = useRouter();
  const workspaceChangeVersion = useWorkspaceChangeVersion();

  const loadData = useCallback(async ({ refresh = false }: { refresh?: boolean } = {}) => {
    try {
      const response = await fetch(
        refresh ? "/api/dashboard/company-overview?refresh=1" : "/api/dashboard/company-overview",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to load company overview.");
      }

      const payload = hydrateCompanyOverviewSnapshot(
        (await response.json()) as CompanyOverviewSnapshot,
      );
      setSnapshot(payload);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load company overview:", err);
      setError(err instanceof Error ? err.message : "Failed to load company overview.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadData();
  }, [loadData, workspaceChangeVersion]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadData({ refresh: true });
  }, [loadData]);

  const getRefreshText = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Data refreshed just now";
    if (diffMins === 1) return "Data refreshed 1 minute ago";
    if (diffMins < 60) return `Data refreshed ${diffMins} minutes ago`;
    return `Data refreshed ${Math.floor(diffMins / 60)} hours ago`;
  };

  const interactionMap = useMemo(
    () => buildOverviewInteractionMap(snapshot ?? EMPTY_SNAPSHOT),
    [snapshot]
  );
  const handleOverviewInteraction = useCallback(
    (target: OverviewInteractionTarget) => {
      if (target.action === "link" && target.href) {
        router.push(target.href);
        return;
      }

      if (target.action === "drawer" && target.drawer) {
        setDrawerContent(target.drawer);
      }
    },
    [router]
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
          <p className="mt-3 text-brand-600">Loading company data...</p>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <Card className="dash-card flex min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div>
          <h2 className="text-lg font-semibold text-accent-900">Unable to load Company Overview</h2>
          <p className="mt-1 text-sm text-accent-500">{error || "Try refreshing the page."}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
          Retry
        </Button>
      </Card>
    );
  }

  const {
    metrics,
    departmentSummaries,
    benchmarkCoverage,
    benchmarkTrust,
    advisoryCandidates,
    actions,
    dataHealth,
  } = snapshot;

  return (
    <>
      <div className="space-y-8">
        <DashboardPageHeader
          title="Company Overview"
          subtitle={`Review ${companyName || "your company"} pay health, actions, and benchmark coverage in one place.`}
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-11 rounded-full px-5 text-[13px] font-semibold"
              >
                <span>Refresh</span>
                <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </Button>
              <Link href="/dashboard/settings">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-11 rounded-full px-5 text-[13px] font-semibold"
                >
                  <span>Settings</span>
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </>
          }
        />

        {error && (
          <Card className="border-amber-200 bg-[#FFF4E5] p-6 text-sm text-amber-800">
            {error}
          </Card>
        )}

        {metrics.activeEmployees === 0 && (
          <Card className="border-dashed border-brand-200 bg-brand-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="overview-section-title">Import company data to unlock this view</h2>
                <p className="overview-supporting-text mt-1">
                  Company Overview compares your employee roster against Qeemly market data. Import
                  your latest roster to start generating coverage, trust, and company-versus-market insights.
                </p>
              </div>
              <Link href="/dashboard/upload">
                <Button variant="secondary" size="sm">
                  Import Company Data
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {!isConfigured && (
          <div className="rounded-2xl border border-amber-200 bg-[#FFF4E5] p-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-xl bg-amber-100 p-3">
                <Settings className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="overview-section-title text-amber-900">Complete your setup</h3>
                <p className="overview-supporting-text text-amber-700">
                  Configure your company settings to get accurate market comparisons.
                </p>
              </div>
              <Link href="/dashboard/settings">
                <Button size="sm">
                  Configure
                </Button>
              </Link>
            </div>
          </div>
        )}

        <ShortcutsRow />

        <section className="overview-section">
          <div>
            <h2 className="overview-section-title">Compensation Health Score + Metrics Grid</h2>
            <p className="overview-supporting-text mt-1">
              Health score, payroll, band alignment, and key compensation risk indicators.
            </p>
          </div>
          <div
            className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-[minmax(0,1.75fr)_minmax(24rem,1fr)]"
            data-testid="overview-metrics-grid"
          >
            <HealthScore
              metrics={metrics}
              interactions={interactionMap}
              onInteract={handleOverviewInteraction}
            />
            <StatCards
              metrics={metrics}
              benchmarkCoverage={benchmarkCoverage}
              interactions={interactionMap}
              onInteract={handleOverviewInteraction}
            />
          </div>
        </section>

        <QuickActions actions={actions} />

        <section className="overview-section">
          <div>
            <h2 className="overview-section-title">Payroll Trend</h2>
            <p className="overview-supporting-text mt-1">
              Track how total compensation is moving over time.
            </p>
          </div>
          <PayrollTrend metrics={metrics} />
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <BandDistributionChart
            metrics={metrics}
            benchmarkCoverage={benchmarkCoverage}
            interactions={interactionMap}
            onInteract={handleOverviewInteraction}
          />
          <DepartmentTabs summaries={departmentSummaries} />
        </div>

        <section className="overview-section">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="overview-section-title">Qeemly Advisory</h2>
              <p className="overview-supporting-text">
                Structured decision support ranked by highest compensation risk and impact.
              </p>
            </div>
            <Link
              href="/dashboard/benchmarks"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Open Benchmarking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {advisoryCandidates.map((employee) => (
              <AdvisoryPanel key={employee.id} employee={employee} />
            ))}
            {advisoryCandidates.length === 0 && (
              <Card className="p-6 text-sm text-accent-500">
                Advisory recommendations will appear here once benchmarked employees are available.
              </Card>
            )}
          </div>
        </section>

        <section className="overview-section">
          <div>
            <h2 className="overview-section-title">Data Health</h2>
            <p className="overview-supporting-text mt-1">{getRefreshText()}</p>
          </div>
          <DataHealthCard
            benchmarkCoverage={benchmarkCoverage}
            benchmarkTrust={benchmarkTrust}
            dataHealth={dataHealth}
          />
        </section>
      </div>
      <OverviewDetailDrawer content={drawerContent} onClose={() => setDrawerContent(null)} />
    </>
  );
}
