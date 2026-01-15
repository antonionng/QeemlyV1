"use client";

import clsx from "clsx";
import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { getLocation, getRole, SAMPLE_INSIGHTS, type Insight } from "@/lib/dashboard/dummy-data";

const INSIGHT_ICONS = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  opportunity: Lightbulb,
  risk: Zap,
};

const INSIGHT_COLORS = {
  trend: {
    bg: "bg-brand-100",
    text: "text-brand-700",
    border: "border-brand-200",
    badge: "bg-brand-500",
  },
  anomaly: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    badge: "bg-amber-500",
  },
  opportunity: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badge: "bg-emerald-500",
  },
  risk: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    badge: "bg-rose-500",
  },
};

const PRIORITY_COLORS = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-brand-400",
};

function InsightCard({ insight }: { insight: Insight }) {
  const Icon = INSIGHT_ICONS[insight.type];
  const colors = INSIGHT_COLORS[insight.type];
  const role = insight.relatedRoleId ? getRole(insight.relatedRoleId) : null;
  const location = insight.relatedLocationId ? getLocation(insight.relatedLocationId) : null;

  return (
    <div
      className={clsx(
        "group relative rounded-xl border p-4 transition-all hover:shadow-md",
        colors.border,
        "bg-white"
      )}
    >
      {/* Priority indicator */}
      <div
        className={clsx(
          "absolute right-3 top-3 h-2 w-2 rounded-full",
          PRIORITY_COLORS[insight.priority]
        )}
      />

      {/* Icon + Type */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            colors.bg
          )}
        >
          <Icon className={clsx("h-4 w-4", colors.text)} />
        </div>
        <span className={clsx("text-xs font-semibold uppercase", colors.text)}>
          {insight.type}
        </span>
      </div>

      {/* Title */}
      <h4 className="mb-2 font-semibold text-brand-900">{insight.title}</h4>

      {/* Description */}
      <p className="mb-3 text-sm text-brand-700">{insight.description}</p>

      {/* Metric badge */}
      {insight.metric && (
        <div
          className={clsx(
            "mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white",
            colors.badge
          )}
        >
          {insight.change !== undefined && insight.change > 0 && (
            <TrendingUp className="h-3.5 w-3.5" />
          )}
          {insight.metric}
        </div>
      )}

      {/* Context tags */}
      <div className="flex flex-wrap gap-1.5">
        {role && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {role.title}
          </span>
        )}
        {location && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {location.city}
          </span>
        )}
      </div>

      {/* Action link */}
      <button
        type="button"
        className="mt-3 flex items-center gap-1 text-sm font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100"
      >
        Explore <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AIInsightsWidget() {
  const [filter, setFilter] = useState<Insight["type"] | "all">("all");

  const filteredInsights =
    filter === "all"
      ? SAMPLE_INSIGHTS
      : SAMPLE_INSIGHTS.filter(i => i.type === filter);

  const counts = {
    all: SAMPLE_INSIGHTS.length,
    trend: SAMPLE_INSIGHTS.filter(i => i.type === "trend").length,
    opportunity: SAMPLE_INSIGHTS.filter(i => i.type === "opportunity").length,
    risk: SAMPLE_INSIGHTS.filter(i => i.type === "risk").length,
    anomaly: SAMPLE_INSIGHTS.filter(i => i.type === "anomaly").length,
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-500" />
        <span className="text-sm font-medium text-brand-700">
          AI-powered insights from your data
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-brand-100/50 p-1">
        {(["all", "trend", "opportunity", "risk", "anomaly"] as const).map(type => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap",
              filter === type
                ? "bg-white text-brand-900 shadow-sm"
                : "text-brand-600 hover:text-brand-800"
            )}
          >
            {type}
            <span
              className={clsx(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                filter === type ? "bg-brand-100" : "bg-brand-200/50"
              )}
            >
              {counts[type]}
            </span>
          </button>
        ))}
      </div>

      {/* Insights list */}
      <div className="flex-1 space-y-3 overflow-auto">
        {filteredInsights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

