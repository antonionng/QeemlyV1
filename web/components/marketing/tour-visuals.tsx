import clsx from "clsx";
import { BarChart3, Compass, Filter, Globe, Layers, LineChart, SlidersHorizontal, Users } from "lucide-react";
import { SAMPLE_BENCHMARK, formatMoneyK } from "@/lib/sample-benchmark";

type VisualProps = { className?: string };

function Frame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "relative h-full overflow-hidden rounded-2xl border border-border bg-muted",
        className,
      )}
    >
      <div className="absolute inset-0 bg-white" />
      {/* Subtle UI grid (no gradients) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.22]">
        <svg className="h-full w-full" viewBox="0 0 800 500" preserveAspectRatio="none">
          <g stroke="rgba(148,163,184,0.55)" strokeWidth="1">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={40 + i * 45} x2="800" y2={40 + i * 45} />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`v-${i}`} x1={40 + i * 55} y1="0" x2={40 + i * 55} y2="500" />
            ))}
          </g>
        </svg>
      </div>
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function Shell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,15,26,0.08)] ring-1 ring-border/70 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Chip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
        active ? "bg-brand-50 text-brand-700 ring-brand-200/60" : "bg-white text-accent-700 ring-border/70",
      )}
    >
      {label}
    </span>
  );
}

function Sidebar() {
  const items = [
    { icon: BarChart3, active: true },
    { icon: LineChart },
    { icon: Users },
    { icon: Globe },
    { icon: Layers },
  ];
  return (
    <div className="flex h-full w-12 flex-col items-center gap-2 rounded-2xl bg-white/80 p-2 ring-1 ring-border/70">
      {items.map((it, idx) => {
        const Icon = it.icon;
        return (
          <div
            key={idx}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-xl ring-1",
              it.active ? "bg-brand-50 ring-brand-200/60" : "bg-muted ring-border/60",
            )}
          >
            <Icon className={clsx("h-4 w-4", it.active ? "text-brand-600" : "text-accent-700")} />
          </div>
        );
      })}
    </div>
  );
}

export function TourBenchmarkVisual({ className }: VisualProps) {
  return (
    <Frame className={className}>
      <div className="grid h-full grid-cols-[auto_1fr] gap-3 p-4">
        <Sidebar />
        <div className="grid h-full gap-3">
          <Shell className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-700">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip label={SAMPLE_BENCHMARK.location.split(",")[0]} active />
              <Chip label={SAMPLE_BENCHMARK.level} />
              <Chip label={SAMPLE_BENCHMARK.currency} />
              <Chip label="Monthly" />
            </div>
          </Shell>

          <div className="grid flex-1 gap-3 lg:grid-cols-[1fr_0.9fr]">
            <Shell className="h-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Distribution</div>
                  <div className="mt-1 text-sm font-semibold text-brand-900">Percentiles</div>
                </div>
                <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white">Live</span>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { k: "P25", v: SAMPLE_BENCHMARK.p25, w: "48%", hi: false },
                  { k: "P50", v: SAMPLE_BENCHMARK.p50, w: "63%", hi: true },
                  { k: "P75", v: SAMPLE_BENCHMARK.p75, w: "80%", hi: false },
                ].map((r) => (
                  <div key={r.k} className="flex items-center gap-3">
                    <div className="w-9 text-xs font-bold text-accent-700">{r.k}</div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent-200">
                      <div
                        className={clsx("h-full rounded-full", r.hi ? "bg-brand-500/85" : "bg-accent-400/60")}
                        style={{ width: r.w }}
                      />
                    </div>
                    <div className="w-24 text-right text-xs font-semibold text-brand-900">
                      {formatMoneyK(SAMPLE_BENCHMARK.currency, r.v)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-muted p-3 ring-1 ring-border/60">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-accent-800">Confidence</span>
                  <span className="text-brand-900">High</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent-200">
                  <div className="h-full w-[78%] rounded-full bg-brand-500/85" />
                </div>
              </div>
            </Shell>

            <Shell className="h-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Movement</div>
                  <div className="mt-1 text-sm font-semibold text-brand-900">Trendline (90d)</div>
                </div>
                <div className="text-xs font-semibold text-accent-800">{SAMPLE_BENCHMARK.trendDelta}</div>
              </div>
              <svg viewBox="0 0 260 90" className="mt-4 h-24 w-full">
                <path
                  d="M10 66 C 40 62, 55 34, 80 40 S 125 66, 150 46 S 185 30, 210 34 S 238 46, 250 40"
                  fill="none"
                  stroke="rgba(92,69,253,0.85)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M10 66 C 40 62, 55 34, 80 40 S 125 66, 150 46 S 185 30, 210 34 S 238 46, 250 40 L250 86 L10 86 Z"
                  fill="rgba(92,69,253,0.08)"
                />
              </svg>
              <div className="mt-3 rounded-xl bg-muted p-3 ring-1 ring-border/60">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">What you get</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2 ring-1 ring-border/60">
                    <div className="font-semibold text-accent-800">P25 / P50 / P75</div>
                    <div className="mt-1 text-[11px] text-accent-600">Clear ranges</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 ring-1 ring-border/60">
                    <div className="font-semibold text-accent-800">Confidence</div>
                    <div className="mt-1 text-[11px] text-accent-600">Signal quality</div>
                  </div>
                </div>
              </div>
            </Shell>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function TourDeltasVisual({ className }: VisualProps) {
  return (
    <Frame className={className}>
      <div className="grid h-full grid-cols-[auto_1fr] gap-3 p-4">
        <Sidebar />
        <div className="grid h-full gap-3">
          <Shell className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-700">
              <Compass className="h-4 w-4" />
              Profiles
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip label={SAMPLE_BENCHMARK.location.split(",")[0]} active />
              <Chip label={SAMPLE_BENCHMARK.currency} />
              <Chip label="Tech roles" />
            </div>
          </Shell>

          <div className="grid flex-1 gap-3 lg:grid-cols-2">
            {[
              { t: "Local", w: "52%", v: "Baseline", hi: false },
              { t: "Expat", w: "78%", v: "+8–12%", hi: true },
            ].map((p) => (
              <Shell key={p.t} className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Hiring profile</div>
                    <div className="mt-1 text-sm font-semibold text-brand-900">{p.t}</div>
                  </div>
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
                      p.hi ? "bg-brand-50 text-brand-700 ring-brand-200/60" : "bg-white text-accent-700 ring-border/70",
                    )}
                  >
                    {p.v}
                  </span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-accent-200">
                  <div className={clsx("h-full rounded-full", p.hi ? "bg-brand-500/85" : "bg-accent-400/60")} style={{ width: p.w }} />
                </div>
                <div className="mt-4 rounded-xl bg-muted p-3 ring-1 ring-border/60">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-accent-800">Delta confidence</span>
                    <span className="text-brand-900">{p.hi ? "Strong" : "Medium"}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-12 gap-1.5">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "h-2 rounded-full",
                          i < (p.hi ? 9 : 7) ? (p.hi ? "bg-brand-500/85" : "bg-accent-400/70") : "bg-accent-200",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </Shell>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function TourPlanningVisual({ className }: VisualProps) {
  return (
    <Frame className={className}>
      <div className="grid h-full grid-cols-[auto_1fr] gap-3 p-4">
        <Sidebar />
        <div className="grid h-full gap-3">
          <Shell className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-700">
              <SlidersHorizontal className="h-4 w-4" />
              Scenario planning
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip label="Scenario A" active />
              <Chip label={SAMPLE_BENCHMARK.currency} />
              <Chip label="Quarterly" />
            </div>
          </Shell>

          <div className="grid flex-1 gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <Shell className="h-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Forecast</div>
                  <div className="mt-1 text-sm font-semibold text-brand-900">Headcount budget</div>
                </div>
                <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white">
                  {formatMoneyK(SAMPLE_BENCHMARK.currency, 3100)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-12 items-end gap-1.5">
                {[6, 9, 7, 11, 10, 13, 12, 14, 15, 16, 14, 18].map((h, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "rounded-full",
                      i === 11 ? "bg-brand-500/85" : "bg-accent-300/70",
                    )}
                    style={{ height: `${h * 4}px` }}
                  />
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-muted p-3 ring-1 ring-border/60">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Controls</div>
                <div className="mt-2 grid gap-2">
                  {[
                    { l: "Promo rate", v: "8%" },
                    { l: "Raise budget", v: "6%" },
                    { l: "New hires", v: "12" },
                  ].map((x) => (
                    <div key={x.l} className="flex items-center justify-between rounded-lg bg-white p-2 ring-1 ring-border/60">
                      <span className="text-xs font-semibold text-accent-800">{x.l}</span>
                      <span className="text-xs font-semibold text-brand-900">{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Shell>

            <Shell className="h-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Exports</div>
                  <div className="mt-1 text-sm font-semibold text-brand-900">Board pack</div>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-accent-700 ring-1 ring-border/70">
                  PDF/CSV
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {[
                  { i: LineChart, t: "Bands summary" },
                  { i: Layers, t: "Scenario deltas" },
                  { i: Globe, t: "Market notes" },
                ].map((x) => {
                  const Icon = x.i;
                  return (
                    <div key={x.t} className="flex items-center gap-2 rounded-xl bg-muted p-3 ring-1 ring-border/60">
                      <Icon className="h-4 w-4 text-accent-700" />
                      <span className="text-xs font-semibold text-accent-800">{x.t}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-xl bg-brand-50 p-3 ring-1 ring-brand-200/60">
                <div className="text-xs font-semibold text-brand-900">Ready for approvals</div>
                <div className="mt-1 text-[11px] text-brand-700">Clean exports with confidence attached</div>
              </div>
            </Shell>
          </div>
        </div>
      </div>
    </Frame>
  );
}

