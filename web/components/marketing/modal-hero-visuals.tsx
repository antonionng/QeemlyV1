import clsx from "clsx";
import { CheckCircle2, Download, Layers, ShieldCheck } from "lucide-react";
import { SAMPLE_BENCHMARK, formatMoneyK } from "@/lib/sample-benchmark";

type VisualProps = { className?: string };

function HeroFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative h-full overflow-hidden rounded-3xl border border-border bg-muted/50 p-4",
        className,
      )}
    >
      {/* Subtle “hybrid” accent layer (no gradients) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-brand-100/60 blur-2xl" />
        <div className="absolute -right-12 top-10 h-52 w-52 rounded-full bg-accent-200/60 blur-2xl" />
        <div className="absolute left-16 -bottom-14 h-56 w-56 rounded-full bg-brand-50/80 blur-2xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.30]" viewBox="0 0 800 450" preserveAspectRatio="none">
          <g stroke="rgba(148,163,184,0.55)" strokeWidth="1">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={40 + i * 45} x2="800" y2={40 + i * 45} />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v-${i}`} x1={40 + i * 65} y1="0" x2={40 + i * 65} y2="450" />
            ))}
          </g>
        </svg>
      </div>

      <div className="relative h-full">{children}</div>
    </div>
  );
}

function CardShell({ className, children }: { className?: string; children: React.ReactNode }) {
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

function MiniChip({ label, active = false }: { label: string; active?: boolean }) {
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

export function ModalHeroBenchmarkOutput({ className }: VisualProps) {
  return (
    <HeroFrame className={className}>
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <CardShell className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Export preview</div>
              <div className="mt-1 text-sm font-semibold text-brand-900">Benchmark report</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white">
              <Download className="h-3.5 w-3.5" />
              Ready
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniChip label={SAMPLE_BENCHMARK.location.split(",")[0]} active />
            <MiniChip label={SAMPLE_BENCHMARK.level} />
            <MiniChip label={SAMPLE_BENCHMARK.currency} />
            <MiniChip label="Monthly" />
          </div>

          <div className="mt-4 grid gap-2">
            {[
              { k: "P25", v: SAMPLE_BENCHMARK.p25 },
              { k: "P50", v: SAMPLE_BENCHMARK.p50 },
              { k: "P75", v: SAMPLE_BENCHMARK.p75 },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between rounded-xl bg-muted p-3 ring-1 ring-border/60">
                <div className="text-xs font-bold text-accent-700">{row.k}</div>
                <div className="text-sm font-semibold text-brand-900">{formatMoneyK(SAMPLE_BENCHMARK.currency, row.v)}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-muted p-3 ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-brand-900">Confidence</div>
              <div className="text-[11px] font-semibold text-accent-700">High</div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent-200">
              <div className="h-full w-[78%] rounded-full bg-brand-500/85" />
            </div>
          </div>
        </CardShell>

        <CardShell className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Board-ready</div>
              <div className="mt-1 text-sm font-semibold text-brand-900">Summary</div>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-accent-700 ring-1 ring-border/70">
              PDF/CSV
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {["Range integrity", "Low-signal flagged", "Audit-friendly"].map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-xl bg-muted p-3 ring-1 ring-border/60">
                <CheckCircle2 className="h-4 w-4 text-accent-700" />
                <span className="text-xs font-semibold text-accent-800">{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-border/70">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Notable</div>
            <div className="mt-2 text-sm font-semibold text-brand-900">+{SAMPLE_BENCHMARK.trendDelta}</div>
            <div className="mt-1 text-xs text-accent-600">Market movement (90d)</div>
          </div>
        </CardShell>
      </div>
    </HeroFrame>
  );
}

export function ModalHeroConfidence({ className }: VisualProps) {
  return (
    <HeroFrame className={className}>
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-2">
        <CardShell className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Methodology</div>
              <div className="mt-1 text-sm font-semibold text-brand-900">Confidence scoring</div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-accent-700 ring-1 ring-border/70">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Explainable
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {[
              { t: "Sample size", d: "More verified points → stronger signal" },
              { t: "Freshness", d: "Recent submissions carry more weight" },
              { t: "Consistency", d: "Tighter distributions → higher reliability" },
            ].map((x) => (
              <div key={x.t} className="rounded-xl bg-muted p-3 ring-1 ring-border/60">
                <div className="text-xs font-semibold text-brand-900">{x.t}</div>
                <div className="mt-1 text-[11px] text-accent-600">{x.d}</div>
              </div>
            ))}
          </div>
        </CardShell>

        <CardShell className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Output</div>
              <div className="mt-1 text-sm font-semibold text-brand-900">Confidence meter</div>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-200/60">
              High
            </span>
          </div>

          <div className="mt-4 grid grid-cols-12 gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={clsx("h-2 rounded-full", i < 9 ? "bg-brand-500/85" : "bg-accent-200")}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-muted p-3 ring-1 ring-border/60">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Why this matters</div>
            <div className="mt-2 text-xs text-accent-700">
              Low-signal segments are clearly marked, so HR and Finance can align quickly and reduce offer risk.
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-border/70">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-800">
              <Layers className="h-4 w-4 text-accent-700" />
              Aggregated only • Privacy-first
            </div>
          </div>
        </CardShell>
      </div>
    </HeroFrame>
  );
}

export function ModalHeroGulfLocalization({ className }: VisualProps) {
  return (
    <HeroFrame className={className}>
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr]">
        <CardShell className="h-full">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Localisation</div>
          <div className="mt-1 text-sm font-semibold text-brand-900">Cities & currency</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Dubai", "Riyadh", "Abu Dhabi", "Doha"].map((c) => (
              <MiniChip key={c} label={c} active={c === "Dubai"} />
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-muted p-3 ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-brand-900">Currency toggle</div>
              <div className="flex gap-1.5">
                <MiniChip label="AED" active />
                <MiniChip label="SAR" />
              </div>
            </div>
            <div className="mt-2 text-xs text-accent-600">Compare ranges without redoing analysis.</div>
          </div>
        </CardShell>

        <CardShell className="h-full">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Segmentation</div>
          <div className="mt-1 text-sm font-semibold text-brand-900">Hiring profiles</div>
          <div className="mt-4 grid gap-2">
            {[
              { t: "Local", v: "Baseline", w: "52%" },
              { t: "Expat", v: "+8–12%", w: "78%" },
            ].map((r) => (
              <div key={r.t} className="rounded-xl bg-muted p-3 ring-1 ring-border/60">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-accent-800">{r.t}</div>
                  <div className="text-xs font-semibold text-brand-900">{r.v}</div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent-200">
                  <div className={clsx("h-full rounded-full", r.t === "Expat" ? "bg-brand-500/80" : "bg-accent-400/60")} style={{ width: r.w }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-border/70">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Note</div>
            <div className="mt-1 text-xs text-accent-700">Deltas appear only when signal is strong enough.</div>
          </div>
        </CardShell>
      </div>
    </HeroFrame>
  );
}

export function ModalHeroAiSafeguards({ className }: VisualProps) {
  return (
    <HeroFrame className={className}>
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-2">
        <CardShell className="h-full">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Checks</div>
          <div className="mt-1 text-sm font-semibold text-brand-900">Outlier & integrity</div>
          <svg viewBox="0 0 260 110" className="mt-4 h-24 w-full">
            <path
              d="M10 80 C 50 60, 80 95, 120 70 S 190 52, 250 60"
              fill="none"
              stroke="rgba(148,163,184,0.85)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="200" cy="54" r="5" fill="rgba(92,69,253,0.85)" />
            <circle cx="92" cy="90" r="5" fill="rgba(245,158,11,0.85)" />
            <path d="M10 98 H250" stroke="rgba(226,232,240,1)" strokeWidth="2" />
          </svg>
          <div className="mt-3 grid gap-2">
            {["Outliers flagged", "Ranges validated", "Low-signal labeled"].map((t) => (
              <div key={t} className="flex items-center gap-2 rounded-xl bg-muted p-3 ring-1 ring-border/60">
                <CheckCircle2 className="h-4 w-4 text-accent-700" />
                <span className="text-xs font-semibold text-accent-800">{t}</span>
              </div>
            ))}
          </div>
        </CardShell>

        <CardShell className="h-full">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Transparency</div>
              <div className="mt-1 text-sm font-semibold text-brand-900">Confidence attached</div>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-200/60">
              Visible
            </span>
          </div>
          <div className="mt-4 rounded-xl bg-muted p-3 ring-1 ring-border/60">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-accent-800">Confidence meter</div>
              <div className="text-xs font-semibold text-brand-900">High</div>
            </div>
            <div className="mt-2 grid grid-cols-12 gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={clsx("h-2 rounded-full", i < 8 ? "bg-brand-500/85" : "bg-accent-200")} />
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-border/70">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">Result</div>
            <div className="mt-2 text-sm font-semibold text-brand-900">Lower pay-risk decisions</div>
            <div className="mt-1 text-xs text-accent-600">Explainability helps align HR + Finance faster.</div>
          </div>
        </CardShell>
      </div>
    </HeroFrame>
  );
}





