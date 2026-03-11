"use client";

import { AlertCircle, ArrowRight, CheckCircle, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import clsx from "clsx";
import type { OverviewInsight } from "@/lib/dashboard/company-overview";

interface KeyInsightsProps {
  items: OverviewInsight[];
  benchmarkCoverage?: {
    activeEmployees: number;
    benchmarkedEmployees: number;
    coveragePct?: number;
  };
}

export function KeyInsights({ items, benchmarkCoverage }: KeyInsightsProps) {
  const coveragePct =
    benchmarkCoverage && benchmarkCoverage.activeEmployees > 0
      ? Math.round((benchmarkCoverage.benchmarkedEmployees / benchmarkCoverage.activeEmployees) * 100)
      : null;
  const coverageBadgeClass =
    typeof coveragePct !== "number"
      ? ""
      : coveragePct >= 90
        ? "bg-emerald-100 text-emerald-700"
        : coveragePct >= 60
          ? "bg-amber-100 text-amber-700"
          : "bg-rose-100 text-rose-700";

  const getTypeStyles = (tone: OverviewInsight["tone"]) => {
    switch (tone) {
      case "danger":
        return "bg-rose-50/70 border-rose-200";
      case "warning":
        return "bg-amber-50/70 border-amber-200";
      case "info":
        return "bg-brand-50 border-brand-100";
      case "positive":
        return "bg-emerald-50/70 border-emerald-200";
    }
  };

  const getIconStyles = (tone: OverviewInsight["tone"]) => {
    switch (tone) {
      case "danger":
        return "text-red-500 bg-red-100";
      case "warning":
        return "text-amber-500 bg-amber-100";
      case "info":
        return "text-blue-500 bg-blue-100";
      case "positive":
        return "text-emerald-500 bg-emerald-100";
    }
  };

  const getTextStyles = (tone: OverviewInsight["tone"]) => {
    switch (tone) {
      case "danger":
        return "text-red-800";
      case "warning":
        return "text-amber-800";
      case "info":
        return "text-blue-800";
      case "positive":
        return "text-emerald-800";
    }
  };

  const getSubtextStyles = (tone: OverviewInsight["tone"]) => {
    switch (tone) {
      case "danger":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      case "info":
        return "text-blue-600";
      case "positive":
        return "text-emerald-600";
    }
  };

  return (
    <Card className="dash-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-accent-900">Key Insights</h3>
        <div className="flex items-center gap-2">
          {typeof coveragePct === "number" && (
            <span
              className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold", coverageBadgeClass)}
            >
              Coverage {coveragePct}%
            </span>
          )}
          <span className="text-xs text-accent-500">{items.length} items</span>
        </div>
      </div>
      <div className="space-y-3">
        {items.slice(0, 5).map((item) => {
          const Icon = item.tone === "positive" ? CheckCircle : item.tone === "info" ? TrendingUp : AlertCircle;

          return (
            <div
              key={item.id}
              className={clsx(
                "rounded-xl border p-4 transition-all hover:shadow-sm",
                getTypeStyles(item.tone)
              )}
            >
              <div className="flex items-start gap-3">
                <div className={clsx("rounded-lg p-1.5 flex-shrink-0", getIconStyles(item.tone))}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-medium", getTextStyles(item.tone))}>
                    {item.title}
                  </p>
                  <p className={clsx("text-xs mt-1", getSubtextStyles(item.tone))}>
                    {item.description}
                  </p>
                  {item.href && item.actionLabel && (
                    <Link href={item.href}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={clsx(
                          "mt-2 h-8 gap-1 rounded-full bg-white px-3 text-xs shadow-sm",
                          getTextStyles(item.tone),
                          "hover:bg-white"
                        )}
                      >
                        {item.actionLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 p-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  No immediate insight items
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Coverage and compensation signals are currently stable.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
