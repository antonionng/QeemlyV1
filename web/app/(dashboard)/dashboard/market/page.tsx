"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildMarketOverviewCards,
  filterMarketDrilldownRows,
  formatMarketEntityLabel,
  type MarketOverviewFilters,
  type MarketOverviewTone,
} from "@/lib/benchmarks/market-overview";
import type {
  MarketInsightsResponse,
  MarketRowConfidence,
} from "@/lib/benchmarks/market-insights";

const toneClasses: Record<MarketOverviewTone, string> = {
  neutral: "border-accent-200 bg-white text-accent-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
  market: "border-brand-200 bg-brand-50 text-brand-900",
  overlay: "border-sky-200 bg-sky-50 text-sky-900",
};

export default function MarketOverviewPage() {
  const [insights, setInsights] = useState<MarketInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingView, setRefreshingView] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketOverviewFilters>({
    roleId: "",
    locationId: "",
    levelId: "",
  });

  const loadInsights = useCallback(async () => {
    try {
      const response = await fetch("/api/benchmarks/market-insights", { cache: "no-store" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Unable to load market insights.");
      }
      const payload = (await response.json()) as MarketInsightsResponse;
      setInsights(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load market insights.";
      setInsights({
        status: "error",
        summary: {
          benchmarkCount: 0,
          uniqueRoles: 0,
          uniqueLocations: 0,
          uniqueLevels: 0,
          contributorQualifiedRows: 0,
          lowConfidenceRows: 0,
          coverageStrength: "thin",
        },
        freshness: {
          latest: null,
          staleRows: 0,
          staleThresholdDays: 30,
          freshnessStatus: "fresh",
        },
        hero: {
          title: "Market data could not be loaded.",
          summary: "Qeemly could not fetch the market dataset for this workspace right now.",
          recommendedAction: "Retry the view refresh. If the issue persists, check your market data access.",
        },
        coverage: {
          topRoles: [],
          topLocations: [],
          topLevels: [],
          sourceMix: [],
          lowDensityRows: [],
        },
        drilldowns: {
          rows: [],
        },
        workspaceOverlay: {
          count: 0,
          uniqueRoles: 0,
          uniqueLocations: 0,
          sources: [],
        },
        diagnostics: {
          market: {
            readMode: "session",
            clientWarning: null,
            error: message,
            warning: null,
            hasServiceRoleKey: false,
            hasPlatformWorkspaceId: false,
          },
        },
      });
    } finally {
      setLoading(false);
      setRefreshingView(false);
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const handleRefreshView = useCallback(() => {
    setActionMessage(null);
    setRefreshingView(true);
    void loadInsights();
  }, [loadInsights]);

  const handleRebuildDataset = useCallback(async () => {
    setRebuilding(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/benchmarks/market-pool/refresh", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; rows?: number };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to rebuild the market dataset.");
      }

      setActionMessage(
        `Market dataset rebuilt successfully. ${payload.rows ?? 0} pooled rows were refreshed.`,
      );
      await loadInsights();
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unable to rebuild the market dataset.",
      );
    } finally {
      setRebuilding(false);
    }
  }, [loadInsights]);

  const marketCards = insights ? buildMarketOverviewCards(insights) : [];
  const filterOptions = useMemo(() => {
    if (!insights) {
      return {
        roles: [] as string[],
        locations: [] as string[],
        levels: [] as string[],
      };
    }

    return {
      roles: getUniqueSorted(insights.drilldowns.rows.map((row) => row.roleId)),
      locations: getUniqueSorted(insights.drilldowns.rows.map((row) => row.locationId)),
      levels: getUniqueSorted(insights.drilldowns.rows.map((row) => row.levelId)),
    };
  }, [insights]);
  const filteredRows = insights ? filterMarketDrilldownRows(insights, filters).slice(0, 12) : [];

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
          <p className="mt-3 text-brand-600">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const latestRefresh = insights.freshness.latest
    ? new Date(insights.freshness.latest).toLocaleDateString("en-GB")
    : "Awaiting refresh";
  const coverageStrengthLabel =
    insights.summary.coverageStrength === "strong"
      ? "Strong coverage"
      : insights.summary.coverageStrength === "developing"
        ? "Developing coverage"
        : "Thin coverage";
  const freshnessStatusLabel =
    insights.freshness.freshnessStatus === "fresh"
      ? "Fresh dataset"
      : insights.freshness.freshnessStatus === "mixed"
        ? "Freshness needs attention"
        : "Freshness at risk";
  const marketDiagnostics = insights.diagnostics.market;
  const marketDiagnosticMessage =
    marketDiagnostics.error || marketDiagnostics.warning || marketDiagnostics.clientWarning;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="page-title">Market Overview</h1>
          <p className="text-sm text-accent-500">
            Review the health, breadth, and trustworthiness of the Qeemly market dataset before pricing individual roles.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleRefreshView}
            disabled={refreshingView}
            className="h-9 rounded-full border-0 bg-accent-800 px-5 text-white hover:bg-accent-700"
          >
            <RefreshCw className={clsx("mr-2 h-4 w-4", refreshingView && "animate-spin")} />
            Refresh View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRebuildDataset}
            disabled={rebuilding}
            className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
          >
            <RefreshCw className={clsx("mr-2 h-4 w-4", rebuilding && "animate-spin")} />
            Rebuild Market Dataset
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

      <Card className="dash-card border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-accent-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                Qeemly Market Dataset
              </span>
              {insights.workspaceOverlay.count > 0 && (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  Company Overlay Available
                </span>
              )}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-accent-950">{insights.hero.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-accent-700">
              {insights.hero.summary}
            </p>
            <div className="mt-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
                <Sparkles className="h-4 w-4 text-brand-500" />
                Recommended Next Step
              </div>
              <p className="mt-1 text-sm text-accent-700">{insights.hero.recommendedAction}</p>
            </div>
          </div>

          <div className="min-w-[240px] rounded-3xl border border-accent-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-500">
              Latest Refresh
            </p>
            <p className="mt-2 text-2xl font-bold text-accent-950">{latestRefresh}</p>
            <p className="mt-1 text-sm text-accent-600">
              {insights.summary.contributorQualifiedRows.toLocaleString()} trusted cohorts currently meet the contributor threshold.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <TrustChip label={coverageStrengthLabel} />
          <TrustChip label={freshnessStatusLabel} />
          <TrustChip label={`${insights.summary.uniqueLocations} locations visible`} />
          <TrustChip label={`${insights.summary.uniqueLevels} levels available`} />
        </div>
      </Card>

      {actionMessage && (
        <Card className="dash-card border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          {actionMessage}
        </Card>
      )}

      {marketDiagnosticMessage && (
        <Card className="dash-card border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Market Access Needs Attention</h3>
              <p className="mt-1 text-sm">{marketDiagnosticMessage}</p>
              <p className="mt-2 text-xs text-amber-800">
                Reading via {marketDiagnostics.readMode === "service" ? "service access" : "session access"}.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {marketCards.map((card) => (
          <Card key={card.label} className={clsx("dash-card border p-5", toneClasses[card.tone])}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-current/70">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-current">{card.value}</p>
            <p className="mt-2 text-sm text-current/75">{card.description}</p>
          </Card>
        ))}
      </div>

      {(insights.status === "empty" || insights.status === "error") && (
        <Card className="dash-card p-6">
          <h3 className="text-lg font-semibold text-accent-950">{insights.hero.title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-accent-600">{insights.hero.summary}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              size="sm"
              onClick={handleRefreshView}
              disabled={refreshingView}
              className="h-9 rounded-full border-0 bg-accent-800 px-5 text-white hover:bg-accent-700"
            >
              Retry View Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRebuildDataset}
              disabled={rebuilding}
              className="h-9 rounded-full border-border bg-white px-5 text-accent-700 hover:bg-accent-50"
            >
              Rebuild Market Dataset
            </Button>
          </div>
        </Card>
      )}

      {insights.status === "ready" && (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="dash-card p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-500" />
                <h3 className="text-lg font-semibold text-accent-950">Where The Dataset Is Strongest</h3>
              </div>
              <p className="mt-2 text-sm text-accent-600">
                These coverage slices show where the market dataset is broadest and most reusable for pricing work.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <CoverageList
                  title="Top Roles"
                  items={insights.coverage.topRoles.map((role) => ({
                    id: role.roleId,
                    label: formatMarketEntityLabel(role.roleId, "role"),
                    value: `${role.benchmarkCount} cohorts`,
                    meta: `${role.locationCount} locations, ${role.levelCount} levels`,
                  }))}
                />
                <CoverageList
                  title="Top Locations"
                  items={insights.coverage.topLocations.map((location) => ({
                    id: location.locationId,
                    label: formatMarketEntityLabel(location.locationId, "location"),
                    value: `${location.benchmarkCount} cohorts`,
                    meta: `${location.roleCount} roles, ${location.levelCount} levels`,
                  }))}
                />
                <CoverageList
                  title="Top Levels"
                  items={insights.coverage.topLevels.map((level) => ({
                    id: level.levelId,
                    label: formatMarketEntityLabel(level.levelId, "level"),
                    value: `${level.benchmarkCount} cohorts`,
                    meta: `${level.roleCount} roles, ${level.locationCount} locations`,
                  }))}
                />
              </div>
            </Card>

            <Card className="dash-card p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-accent-950">Coverage Watchouts</h3>
              </div>
              <p className="mt-2 text-sm text-accent-600">
                Use this watchlist to spot thin or aging cohorts before relying on them in pricing discussions.
              </p>

              <div className="mt-5 space-y-3">
                {insights.coverage.lowDensityRows.length > 0 ? (
                  insights.coverage.lowDensityRows.map((row) => (
                    <div
                      key={`${row.roleId}-${row.locationId}-${row.levelId}`}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-amber-950">
                            {formatMarketEntityLabel(row.roleId, "role")} ·{" "}
                            {formatMarketEntityLabel(row.locationId, "location")} ·{" "}
                            {formatMarketEntityLabel(row.levelId, "level")}
                          </p>
                          <p className="mt-1 text-xs text-amber-800">
                            {row.contributorCount} contributors · {formatConfidenceLabel(row.confidence)}
                            {row.provenance
                              ? ` · ${formatMarketEntityLabel(row.provenance, "provenance")}`
                              : ""}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-amber-900">
                          {row.freshnessAt ? formatShortDate(row.freshnessAt) : "Unknown"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-900">
                    No thin cohorts are currently flagged in the visible market dataset.
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="dash-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-accent-950">Cohort Explorer</h3>
                  <p className="mt-2 text-sm text-accent-600">
                    Filter live market cohorts by role, location, and level without leaving the overview.
                  </p>
                </div>
                <Link
                  href="/dashboard/benchmarks"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Open Full Benchmarking
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <select
                  value={filters.roleId}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, roleId: event.target.value }))
                  }
                  className="rounded-2xl border border-accent-200 bg-white px-3 py-2 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">All roles</option>
                  {filterOptions.roles.map((roleId) => (
                    <option key={roleId} value={roleId}>
                      {formatMarketEntityLabel(roleId, "role")}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.locationId}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, locationId: event.target.value }))
                  }
                  className="rounded-2xl border border-accent-200 bg-white px-3 py-2 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">All locations</option>
                  {filterOptions.locations.map((locationId) => (
                    <option key={locationId} value={locationId}>
                      {formatMarketEntityLabel(locationId, "location")}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.levelId}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, levelId: event.target.value }))
                  }
                  className="rounded-2xl border border-accent-200 bg-white px-3 py-2 text-sm text-accent-900 focus:border-brand-300 focus:outline-none"
                >
                  <option value="">All levels</option>
                  {filterOptions.levels.map((levelId) => (
                    <option key={levelId} value={levelId}>
                      {formatMarketEntityLabel(levelId, "level")}
                    </option>
                  ))}
                </select>
              </div>

              {filteredRows.length > 0 ? (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-accent-100 text-left text-accent-500">
                        <th className="pb-3 pr-4 font-medium">Cohort</th>
                        <th className="pb-3 pr-4 font-medium">P25</th>
                        <th className="pb-3 pr-4 font-medium">Median</th>
                        <th className="pb-3 pr-4 font-medium">P75</th>
                        <th className="pb-3 pr-4 font-medium">Confidence</th>
                        <th className="pb-3 pr-4 font-medium">Freshness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr
                          key={`${row.roleId}-${row.locationId}-${row.levelId}`}
                          className="border-b border-accent-100/70"
                        >
                          <td className="py-4 pr-4">
                            <p className="font-medium text-accent-950">
                              {formatMarketEntityLabel(row.roleId, "role")}
                            </p>
                            <p className="mt-1 text-xs text-accent-600">
                              {formatMarketEntityLabel(row.locationId, "location")} ·{" "}
                              {formatMarketEntityLabel(row.levelId, "level")}
                              {row.provenance
                                ? ` · ${formatMarketEntityLabel(row.provenance, "provenance")}`
                                : ""}
                            </p>
                          </td>
                          <td className="py-4 pr-4 text-accent-800">
                            {formatCurrency(row.p25, row.currency)}
                          </td>
                          <td className="py-4 pr-4 font-medium text-accent-950">
                            {formatCurrency(row.p50, row.currency)}
                          </td>
                          <td className="py-4 pr-4 text-accent-800">
                            {formatCurrency(row.p75, row.currency)}
                          </td>
                          <td className="py-4 pr-4">
                            <p className="text-accent-900">{formatConfidenceLabel(row.confidence)}</p>
                            <p className="mt-1 text-xs text-accent-500">
                              {row.contributorCount} contributors
                              {row.sampleSize ? ` · Sample ${row.sampleSize}` : ""}
                            </p>
                          </td>
                          <td className="py-4 pr-4 text-accent-700">
                            {row.freshnessAt ? formatShortDate(row.freshnessAt) : "Unknown"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-6 text-sm text-accent-600">
                  No visible cohorts match the current filters.
                </div>
              )}
            </Card>

            <Card className="dash-card p-6">
              <h3 className="text-lg font-semibold text-accent-950">What To Explore Next</h3>
              <p className="mt-2 text-sm text-accent-600">
                Use the overview to decide whether you are ready to price roles or whether coverage quality needs attention first.
              </p>

              <div className="mt-5 space-y-3">
                <ActionCard
                  title="Move Into Benchmarking"
                  body="When coverage looks strong for your key roles, open the full pricing workflow and compare market ranges in more detail."
                  href="/dashboard/benchmarks"
                  cta="Open Benchmarking"
                />
                <ActionCard
                  title="Strengthen Your Company Overlay"
                  body={
                    insights.workspaceOverlay.count > 0
                      ? `${insights.workspaceOverlay.count} company pay bands are already available as a secondary overlay. Refresh them if your policy ranges have changed.`
                      : "Upload company pay bands to compare internal policy against the market dataset without changing the market-first view."
                  }
                  href="/dashboard/upload"
                  cta={insights.workspaceOverlay.count > 0 ? "Update Company Bands" : "Upload Company Bands"}
                  icon={<Upload className="h-4 w-4" />}
                />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function CoverageList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; label: string; value: string; meta: string }>;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-accent-900">{title}</h4>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-accent-100 bg-accent-50/40 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-accent-950">{item.label}</p>
                <span className="text-xs font-medium text-brand-700">{item.value}</span>
              </div>
              <p className="mt-1 text-xs text-accent-600">{item.meta}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-accent-500">No coverage slices available yet.</p>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  title,
  body,
  href,
  cta,
  icon,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-accent-100 bg-accent-50/40 p-4">
      <h4 className="text-sm font-semibold text-accent-950">{title}</h4>
      <p className="mt-2 text-sm text-accent-600">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        {icon}
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function TrustChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
      {label}
    </span>
  );
}

function getUniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB");
}

function formatCurrency(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currency} ${formatted}`;
}

function formatConfidenceLabel(confidence: MarketRowConfidence): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "moderate":
      return "Moderate confidence";
    default:
      return "Use caution";
  }
}
