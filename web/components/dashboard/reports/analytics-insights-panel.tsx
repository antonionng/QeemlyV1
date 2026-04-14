"use client";

import { useState } from "react";
import {
  Brain,
  Loader2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  HeartPulse,
  Target,
  LayoutGrid,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ANALYSIS_FOCUS_OPTIONS,
  type AnalysisFocus,
} from "@/lib/reports/ai-insights-prompt";

type InsightItem = {
  category: "trend" | "risk" | "action";
  title: string;
  body: string;
};

type AiInsightsResponse = {
  executive_summary: string;
  insights: InsightItem[];
  normalized_categories: Array<{ raw: string; canonical: string }>;
};

const CATEGORY_META: Record<
  InsightItem["category"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  trend: { icon: TrendingUp, color: "#6C5CE7", bg: "rgba(168,155,255,0.12)" },
  risk: { icon: AlertTriangle, color: "#FE9A00", bg: "rgba(254,154,0,0.1)" },
  action: { icon: Lightbulb, color: "#00BC7D", bg: "rgba(0,188,125,0.1)" },
};

const FOCUS_ICONS: Record<AnalysisFocus, React.ElementType> = {
  compensation_health: HeartPulse,
  benchmark_coverage: Target,
  department_comparison: LayoutGrid,
  risk_assessment: ShieldAlert,
  executive_summary: FileText,
};

export function AnalyticsInsightsPanel() {
  const [data, setData] = useState<AiInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFocus, setActiveFocus] = useState<AnalysisFocus | null>(null);

  const generate = async (focus: AnalysisFocus) => {
    setLoading(true);
    setError(null);
    setActiveFocus(focus);
    try {
      const res = await fetch("/api/reports/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            "Unable to generate insights right now.",
        );
      }
      const json = (await res.json()) as { insights: AiInsightsResponse };
      setData(json.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Picker state: no data generated yet
  if (!data && !loading && !error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" style={{ color: "#6C5CE7" }} />
          <h3 className="text-sm font-bold" style={{ color: "#111233" }}>AI Insights</h3>
          <span className="text-xs" style={{ color: "#969799" }}>
            Choose an analysis type
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ANALYSIS_FOCUS_OPTIONS.map((option) => {
            const Icon = FOCUS_ICONS[option.id];
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => void generate(option.id)}
                className="group flex flex-col items-start rounded-[16px] bg-white p-4 text-left transition-all hover:shadow-md"
                style={{
                  border: "1px solid #EEF1F6",
                  boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
                }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
                  style={{ background: "rgba(168,155,255,0.12)" }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color: "#6C5CE7" }} />
                </div>
                <h4 className="mt-3 text-xs font-bold" style={{ color: "#111233" }}>
                  {option.label}
                </h4>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "#969799" }}>
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    const focusLabel =
      ANALYSIS_FOCUS_OPTIONS.find((o) => o.id === activeFocus)?.label ??
      "insights";
    return (
      <div
        className="flex items-center justify-center rounded-[16px] bg-white p-10"
        style={{
          border: "1px solid #EEF1F6",
          boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
        }}
      >
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#A89BFF" }} />
        <span className="ml-3 text-sm" style={{ color: "#969799" }}>
          Generating {focusLabel.toLowerCase()} analysis...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[16px] p-5" style={{ border: "1px solid rgba(255,32,86,0.2)", background: "rgba(255,32,86,0.06)" }}>
        <p className="text-sm" style={{ color: "#FF2056" }}>{error}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void generate(activeFocus ?? "executive_summary")
          }
          className="mt-3 gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const activeLabel =
    ANALYSIS_FOCUS_OPTIONS.find((o) => o.id === activeFocus)?.label ??
    "AI Insights";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" style={{ color: "#6C5CE7" }} />
          <h3 className="text-sm font-bold" style={{ color: "#111233" }}>{activeLabel}</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeFocus ?? "executive_summary"}
            onChange={(e) =>
              void generate(e.target.value as AnalysisFocus)
            }
            disabled={loading}
            className="h-8 rounded-full bg-white px-3 text-xs font-medium focus:outline-none"
            style={{ border: "1px solid #EEF1F6", color: "#111233" }}
          >
            {ANALYSIS_FOCUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void generate(activeFocus ?? "executive_summary")
            }
            disabled={loading}
            className="h-8 gap-1.5 rounded-full text-xs"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      {/* Executive summary */}
      <div
        className="rounded-[16px] bg-white p-5"
        style={{
          border: "1px solid #EEF1F6",
          boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "#111233" }}>
          {data.executive_summary}
        </p>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.insights.map((insight, i) => {
          const meta = CATEGORY_META[insight.category] ?? CATEGORY_META.trend;
          const Icon = meta.icon;
          return (
            <div
              key={`${insight.category}-${i}`}
              className="rounded-[16px] bg-white p-5"
              style={{
                border: "1px solid #EEF1F6",
                boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: meta.bg }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: meta.color }}
                >
                  {insight.category}
                </span>
              </div>
              <h4 className="text-sm font-bold" style={{ color: "#111233" }}>
                {insight.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "#969799" }}>
                {insight.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
