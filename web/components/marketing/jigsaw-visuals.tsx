import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Dot } from "lucide-react";
import { SAMPLE_BENCHMARK, formatMoneyK } from "@/lib/sample-benchmark";

type VisualProps = { className?: string };

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "h-full overflow-hidden rounded-2xl bg-white/70 p-4 shadow-[0_18px_50px_rgba(15,15,26,0.08)] ring-1 ring-border/70",
        className,
      )}
    >
      {children}
    </div>
  );
}

function MiniBadge({
  label,
  tone = "brand",
}: {
  label: string;
  tone?: "brand" | "muted" | "ghost";
}) {
  const styles =
    tone === "brand"
      ? "bg-brand-500 text-white"
      : tone === "muted"
        ? "bg-accent-100 text-accent-800 ring-1 ring-border/70"
        : "bg-white text-accent-700 ring-1 ring-border";

  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", styles)}>{label}</span>;
}

function SparkBars({ tone = "brand" }: { tone?: "brand" | "muted" }) {
  const base = "bg-accent-200";
  const hi = tone === "brand" ? "bg-brand-500/80" : "bg-accent-400/70";
  return (
    <div className="flex items-end gap-1.5">
      <div className={clsx("h-3 w-1.5 rounded-full", base)} />
      <div className={clsx("h-5 w-1.5 rounded-full", base)} />
      <div className={clsx("h-4 w-1.5 rounded-full", base)} />
      <div className={clsx("h-7 w-1.5 rounded-full", hi)} />
      <div className={clsx("h-6 w-1.5 rounded-full", base)} />
      <div className={clsx("h-8 w-1.5 rounded-full", hi)} />
    </div>
  );
}

export function HireSmarterVisual({ className }: VisualProps) {
  return (
    <div className={clsx(className)}>
      <Panel className="flex flex-col bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">Salary range</div>
            <div className="mt-1 truncate text-sm font-semibold text-brand-900">Backend Engineer</div>
          </div>
          <MiniBadge label="Verified" tone="ghost" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted p-3 ring-1 ring-border/60">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">P50</div>
            <div className="mt-1 text-lg font-semibold text-brand-900">{formatMoneyK(SAMPLE_BENCHMARK.currency, SAMPLE_BENCHMARK.p50)}</div>
            <div className="mt-1 text-xs text-accent-600">
              {SAMPLE_BENCHMARK.location.split(",")[0]} • {SAMPLE_BENCHMARK.level}
            </div>
          </div>
          <div className="rounded-xl bg-muted p-3 ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">Confidence</div>
              <MiniBadge label="High" tone="muted" />
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent-200">
              <div className="h-full w-[78%] rounded-full bg-brand-500/85" />
            </div>
            <div className="mt-2 text-xs text-accent-600">Based on verified GCC submissions</div>
          </div>
        </div>

        {/* Extra panels to make the “mini dashboard” feel longer */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white p-3 ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">Offer check</div>
              <MiniBadge label="Within band" tone="ghost" />
            </div>
            <div className="mt-1 text-lg font-semibold text-brand-900">+3.2%</div>
            <div className="mt-1 text-xs text-accent-600">Fair-pay signal: strong</div>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">Budget forecast</div>
              <MiniBadge label="Preview" tone="muted" />
            </div>
            <div className="mt-1 text-lg font-semibold text-brand-900">AED 3.1M</div>
            <div className="mt-1 text-xs text-accent-600">Next 2 quarters • Scenario A</div>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="text-xs font-semibold text-accent-700">
            Updated today <span className="text-accent-500/70">•</span> Live market
          </div>
          <SparkBars />
        </div>
      </Panel>
    </div>
  );
}

export function KnowMarketVisual({ className }: VisualProps) {
  return (
    <div className={clsx("relative", className)}>
      <Panel className="bg-muted/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <MiniBadge label={SAMPLE_BENCHMARK.location.split(",")[0]} tone="ghost" />
            <MiniBadge label={SAMPLE_BENCHMARK.level} tone="ghost" />
            <MiniBadge label={SAMPLE_BENCHMARK.currency} tone="ghost" />
          </div>
          <MiniBadge label="Live" tone="brand" />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:items-center">
          {/* Percentiles */}
          <div className="space-y-2">
            {[
              { k: "P25", v: SAMPLE_BENCHMARK.p25, w: "48%" },
              { k: "P50", v: SAMPLE_BENCHMARK.p50, w: "63%" },
              { k: "P75", v: SAMPLE_BENCHMARK.p75, w: "80%" },
            ].map((p) => (
              <div key={p.k} className="flex items-center gap-3">
                <div className="w-9 text-xs font-bold text-accent-700">{p.k}</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent-200">
                  <div
                    className={clsx("h-full rounded-full", p.k === "P50" ? "bg-brand-500/80" : "bg-accent-400/60")}
                    style={{ width: p.w }}
                  />
                </div>
                <div className="w-20 text-right text-xs font-semibold text-brand-900">{formatMoneyK(SAMPLE_BENCHMARK.currency, p.v)}</div>
              </div>
            ))}
            <div className="text-[11px] text-accent-600">Percentiles by city, level, and profile</div>
          </div>

          {/* Trendline */}
          <div className="rounded-2xl bg-white p-3 ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-brand-900">Trendline</div>
              <div className="text-[11px] font-semibold text-accent-600">Last 90 days</div>
            </div>
            <svg viewBox="0 0 220 60" className="mt-2 h-16 w-full">
              <path
                d="M10 46 C 40 42, 55 20, 80 26 S 125 45, 150 30 S 185 18, 210 22"
                fill="none"
                stroke="rgba(92,69,253,0.85)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M10 46 C 40 42, 55 20, 80 26 S 125 45, 150 30 S 185 18, 210 22 L210 58 L10 58 Z"
                fill="rgba(92,69,253,0.08)"
              />
            </svg>
            <div className="mt-1 flex items-center justify-between text-[11px] text-accent-600">
              <span>Stable</span>
              <span className="font-semibold text-accent-800">{SAMPLE_BENCHMARK.trendDelta}</span>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function GulfFocusedVisual({ className }: VisualProps) {
  const cities = ["Dubai", "Riyadh", "Abu Dhabi", "Doha"];
  return (
    <div className={clsx("relative", className)}>
      <Panel className="bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">Regional coverage</div>
            <div className="mt-1 text-sm font-semibold text-brand-900">GCC hubs & profiles</div>
          </div>
          <MiniBadge label="GCC" tone="muted" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {cities.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-accent-700 ring-1 ring-border/60"
            >
              <Dot className="h-4 w-4 text-accent-500" />
              {c}
            </span>
          ))}
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-accent-700 ring-1 ring-border/60">
            + more
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted p-3 ring-1 ring-border/60">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">Currency</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["AED", "SAR", "QAR"].map((cur) => (
                <span
                  key={cur}
                  className={clsx(
                    "rounded-full px-2 py-1 text-[11px] font-bold ring-1 ring-border/60",
                    cur === "AED" ? "bg-brand-50 text-brand-700" : "bg-white text-accent-600",
                  )}
                >
                  {cur}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-muted p-3 ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">Delta</div>
              <MiniBadge label="Expat vs local" tone="ghost" />
            </div>
            <div className="mt-2 text-lg font-semibold text-brand-900">+8–12%</div>
            <div className="mt-1 text-xs text-accent-600">Typical variation by profile</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function AiChecksVisual({ className }: VisualProps) {
  return (
    <div className={clsx("relative", className)}>
      <Panel className="bg-muted/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600/90">Safeguards</div>
            <div className="mt-1 text-sm font-semibold text-brand-900">Explainable checks</div>
          </div>
          <MiniBadge label="Transparent" tone="ghost" />
        </div>

        <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-border/60">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-brand-900">Confidence meter</div>
            <div className="text-[11px] font-semibold text-accent-600">High</div>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "h-2 rounded-full",
                  i < 7 ? "bg-brand-500/85" : "bg-accent-200",
                )}
              />
            ))}
          </div>
          <div className="mt-3 grid gap-1.5 text-[11px] text-accent-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent-700" />
              Sample size & freshness validated
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent-700" />
              Outliers flagged before export
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent-700" />
              Low-signal roles marked clearly
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}



