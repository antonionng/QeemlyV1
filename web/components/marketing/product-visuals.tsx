import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

function MiniSparkline({
  className,
  variant = "purple",
}: {
  className?: string;
  variant?: "purple" | "blue";
}) {
  const stroke = variant === "purple" ? "#6D5EF6" : "#2BA8FF";
  const fill = variant === "purple" ? "rgba(109,94,246,0.16)" : "rgba(43,168,255,0.14)";

  return (
    <svg viewBox="0 0 240 88" className={clsx("h-16 w-full", className)} aria-hidden>
      <path
        d="M4,64 C24,58 32,52 44,56 C58,61 70,72 84,70 C98,68 112,46 128,44 C144,42 154,55 168,52 C184,48 194,34 208,36 C222,38 232,44 236,42"
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M4,64 C24,58 32,52 44,56 C58,61 70,72 84,70 C98,68 112,46 128,44 C144,42 154,55 168,52 C184,48 194,34 208,36 C222,38 232,44 236,42 L236,88 L4,88 Z"
        fill={fill}
      />
      <circle cx="128" cy="44" r="6" fill={stroke} opacity="0.9" />
    </svg>
  );
}

function MiniDistribution({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 92" className={clsx("h-20 w-full", className)} aria-hidden>
      <path
        d="M8,82 C32,78 40,56 56,46 C74,35 86,18 110,18 C130,18 140,34 154,44 C170,55 184,77 212,82"
        fill="none"
        stroke="#6D5EF6"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M8,82 C32,78 40,56 56,46 C74,35 86,18 110,18 C130,18 140,34 154,44 C170,55 184,77 212,82 L212,92 L8,92 Z"
        fill="rgba(109,94,246,0.14)"
      />
      {/* Percentile markers */}
      <line x1="92" y1="12" x2="92" y2="90" stroke="rgba(15,23,42,0.10)" strokeWidth="2" />
      <line x1="130" y1="12" x2="130" y2="90" stroke="rgba(15,23,42,0.10)" strokeWidth="2" />
      <line x1="168" y1="12" x2="168" y2="90" stroke="rgba(15,23,42,0.10)" strokeWidth="2" />
      <circle cx="92" cy="52" r="5" fill="#6D5EF6" />
      <circle cx="130" cy="32" r="5" fill="#6D5EF6" />
      <circle cx="168" cy="56" r="5" fill="#6D5EF6" />
    </svg>
  );
}

function VisualShell({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl bg-brand-50/60 ring-1 ring-border/70",
        "shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(109,94,246,0.14),transparent_55%),radial-gradient(circle_at_80%_60%,rgba(43,168,255,0.10),transparent_60%)]" />
      <div className="relative p-5 sm:p-6">
        {title ? (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-500">{title}</div>
              {subtitle ? <div className="text-sm font-semibold text-brand-900">{subtitle}</div> : null}
            </div>
            <Badge variant="brand">Live</Badge>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function MiniInput({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-wider text-brand-500">{label}</div>
      <div className="h-10 rounded-2xl border border-border bg-white px-3 text-sm font-semibold text-brand-800/90 flex items-center">
        {value ?? "—"}
      </div>
    </div>
  );
}

function MiniSelect({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-wider text-brand-500">{label}</div>
      <div className="h-10 rounded-2xl border border-border bg-white px-3 text-sm font-semibold text-brand-800/90 flex items-center justify-between">
        <span>{value}</span>
        <span className="text-brand-400">▾</span>
      </div>
    </div>
  );
}

function MiniKpi({ label, value, tone = "purple" }: { label: string; value: string; tone?: "purple" | "blue" }) {
  const ring = tone === "purple" ? "ring-brand-200/70 bg-brand-50/40" : "ring-sky-200/70 bg-sky-50/40";
  return (
    <div className={clsx("rounded-2xl p-4 ring-1 ring-border/70 bg-white", ring)}>
      <div className="text-xs font-semibold text-brand-800/80">{label}</div>
      <div className="mt-2 text-xl font-semibold text-brand-900">{value}</div>
      <div className="mt-1 text-[11px] text-brand-700/70">High confidence</div>
    </div>
  );
}

function ConfidenceMeter() {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-brand-900">Confidence</div>
        <Badge variant="brand">High</Badge>
      </div>
      <div className="mt-3 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-2 rounded-full",
              i < 7 ? "bg-brand-500" : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="mt-3 grid gap-2 text-xs text-brand-700/80">
        <div className="flex items-center justify-between">
          <span>Freshness</span>
          <span className="font-semibold text-brand-900">High</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Sample size</span>
          <span className="font-semibold text-brand-900">Strong</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Consistency</span>
          <span className="font-semibold text-brand-900">Stable</span>
        </div>
      </div>
    </div>
  );
}

function MiniSidebar() {
  return (
    <div className="w-14 shrink-0 rounded-2xl border border-border bg-white p-2">
      <div className="grid gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-10 rounded-xl ring-1 ring-border/60",
              i === 0 ? "bg-brand-50" : "bg-muted/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function MiniHeaderBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
      <div className="text-sm font-semibold text-brand-900">{title}</div>
      <div className="flex gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-1 ring-border/70" />
        <span className="inline-flex h-8 w-16 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
          Export
        </span>
      </div>
    </div>
  );
}

/* ------------------------- Benchmark Search visuals ------------------------- */

export function BenchmarkSearchHeroVisual() {
  return (
    <VisualShell title="Benchmark Search" subtitle="Market snapshot UI mock">
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-3">
          <div className="grid gap-3">
            <MiniInput label="Role" value="Backend Engineer" />
            <div className="grid grid-cols-3 gap-3">
              <MiniSelect label="Location" value="Dubai" />
              <MiniSelect label="Level" value="IC3" />
              <MiniSelect label="Currency" value="AED" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active>Dubai</Chip>
            <Chip active>IC3</Chip>
            <Chip active>AED</Chip>
            <Chip>Expat</Chip>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-brand-900">Trendline</div>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Last 90 days
              </Badge>
            </div>
            <MiniSparkline className="mt-2" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <MiniKpi label="P25" value="AED 24.5k" />
            <MiniKpi label="P50" value="AED 30.2k" tone="blue" />
            <MiniKpi label="P75" value="AED 38.7k" />
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-brand-900">Distribution</div>
              <Badge variant="brand">High confidence</Badge>
            </div>
            <MiniDistribution className="mt-2" />
          </div>
        </div>
      </div>
    </VisualShell>
  );
}

export function BenchmarkSearchHowItWorksVisual() {
  return (
    <VisualShell title="How it works" subtitle="Input → Filters → Output">
      <div className="grid gap-3">
        <Card className="p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Step 1</div>
          <div className="mt-1 text-sm font-semibold text-brand-900">Choose the profile</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniInput label="Role" value="Backend Engineer" />
            <MiniSelect label="Level" value="IC3" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Step 2</div>
          <div className="mt-1 text-sm font-semibold text-brand-900">Apply Gulf-aware filters</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip active>Dubai</Chip>
            <Chip active>AED</Chip>
            <Chip>Expat vs Local</Chip>
            <Chip>Tech</Chip>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Step 3</div>
          <div className="mt-1 text-sm font-semibold text-brand-900">Get percentiles + confidence</div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <MiniKpi label="P25" value="AED 24.5k" />
            <MiniKpi label="P50" value="AED 30.2k" tone="blue" />
            <MiniKpi label="P75" value="AED 38.7k" />
          </div>
        </Card>
      </div>
    </VisualShell>
  );
}

export function BenchmarkSearchResultsVisual() {
  return (
    <VisualShell title="Outputs" subtitle="Market snapshot">
      <MiniHeaderBar title="Market snapshot" />
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active>Dubai</Chip>
        <Chip active>IC3</Chip>
        <Chip active>AED</Chip>
        <Chip>Engineering</Chip>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniKpi label="P25" value="AED 24.5k" />
        <MiniKpi label="Median (P50)" value="AED 30.2k" tone="blue" />
        <MiniKpi label="P75" value="AED 38.7k" />
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-brand-900">Distribution preview</div>
          <Badge variant="ghost" className="border-border/80 bg-white/70">
            Sample output
          </Badge>
        </div>
        <MiniDistribution className="mt-2" />
      </div>
    </VisualShell>
  );
}

export function BenchmarkSearchFiltersVisual() {
  return (
    <VisualShell title="Filters" subtitle="Localization + profiles">
      <div className="grid gap-4 lg:grid-cols-[0.55fr_1.45fr]">
        <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
          <div className="text-sm font-semibold text-brand-900">Filters</div>
          <MiniSelect label="Country" value="UAE" />
          <MiniSelect label="City" value="Dubai" />
          <MiniSelect label="Currency" value="AED" />
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Profile</div>
            <div className="flex flex-wrap gap-2">
              <Chip active>Expat</Chip>
              <Chip>Local</Chip>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Industry</div>
            <div className="flex flex-wrap gap-2">
              <Chip active>Tech</Chip>
              <Chip>Fintech</Chip>
              <Chip>Retail</Chip>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-brand-900">Active filters</div>
              <Badge variant="brand">Live</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip active>Dubai</Chip>
              <Chip active>IC3</Chip>
              <Chip active>AED</Chip>
              <Chip>Expat</Chip>
              <Chip>Tech</Chip>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-sm font-semibold text-brand-900">Expat</div>
              <div className="mt-2 text-2xl font-semibold text-brand-900">AED 33.4k</div>
              <div className="mt-1 text-xs text-brand-700/80">+4.1% YoY</div>
              <MiniSparkline className="mt-2" variant="blue" />
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-sm font-semibold text-brand-900">Local</div>
              <div className="mt-2 text-2xl font-semibold text-brand-900">AED 29.8k</div>
              <div className="mt-1 text-xs text-brand-700/80">+3.4% YoY</div>
              <MiniSparkline className="mt-2" />
            </div>
          </div>
        </div>
      </div>
    </VisualShell>
  );
}

export function BenchmarkSearchConfidenceVisual() {
  return (
    <VisualShell title="Confidence scoring" subtitle="Explainable and actionable">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <ConfidenceMeter />
        <div className="grid gap-3">
          <Card className="p-4">
            <div className="text-sm font-semibold text-brand-900">Freshness</div>
            <div className="mt-1 text-xs text-brand-700/80">Recent submissions carry more weight.</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-semibold text-brand-900">Sample size</div>
            <div className="mt-1 text-xs text-brand-700/80">More signal increases reliability.</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-semibold text-brand-900">Consistency</div>
            <div className="mt-1 text-xs text-brand-700/80">Tighter distributions raise confidence.</div>
          </Card>
        </div>
      </div>
    </VisualShell>
  );
}

export function BenchmarkSearchExportVisual() {
  return (
    <VisualShell title="Export" subtitle="Offer-ready outputs">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="rounded-2xl border border-border bg-white p-4 opacity-80">
          <MiniHeaderBar title="Market snapshot" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniKpi label="P25" value="AED 24.5k" />
            <MiniKpi label="P50" value="AED 30.2k" tone="blue" />
            <MiniKpi label="P75" value="AED 38.7k" />
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Notes</div>
            <div className="mt-2 h-10 rounded-xl bg-white/70 ring-1 ring-border/60" />
            <div className="mt-2 h-10 rounded-xl bg-white/70 ring-1 ring-border/60" />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-brand-900">Export benchmark</div>
            <Badge variant="ghost" className="border-border/80 bg-white/70">
              PDF / CSV
            </Badge>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <span className="text-sm font-semibold text-brand-900">Include chart</span>
              <span className="h-5 w-10 rounded-full bg-brand-500" />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <span className="text-sm font-semibold text-brand-900">Include confidence</span>
              <span className="h-5 w-10 rounded-full bg-brand-500" />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <span className="text-sm font-semibold text-brand-900">Include notes</span>
              <span className="h-5 w-10 rounded-full bg-muted" />
            </div>
            <div className="rounded-2xl bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white">
              Export
            </div>
          </div>
        </div>
      </div>
    </VisualShell>
  );
}

export function BenchmarkSearchWorkflowsVisual() {
  return (
    <VisualShell title="Workflows" subtitle="Save, share, approve">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Recent benchmarks</div>
          <div className="mt-3 space-y-2">
            {["Backend Engineer", "Product Manager", "Data Scientist"].map((r) => (
              <div key={r} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-brand-900">{r}</span>
                <Badge variant="ghost" className="border-border/70 bg-white/70">
                  Dubai
                </Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Saved roles</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Backend", "PM", "Data", "DevOps", "UX"].map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border px-3 py-3 text-xs text-brand-700/80">
            Re-run benchmarks in one click.
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Approvals</div>
          <div className="mt-3 space-y-2 text-xs">
            {[
              { label: "HR review", status: "Approved" },
              { label: "Finance", status: "Pending" },
              { label: "Hiring manager", status: "Approved" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="font-semibold text-brand-900">{s.label}</span>
                <Badge variant={s.status === "Approved" ? "brand" : "ghost"} className={s.status === "Approved" ? "" : "border-border/70 bg-white/70"}>
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </VisualShell>
  );
}

/* ------------------------- Analytics visuals ------------------------- */

export function AnalyticsHeroVisual() {
  return (
    <VisualShell title="Analytics Dashboard" subtitle="Live market intelligence">
      <div className="flex gap-4">
        <MiniSidebar />
        <div className="min-w-0 flex-1 space-y-3">
          <MiniHeaderBar title="Market snapshot" />
          <div className="flex flex-wrap gap-2">
            <Chip active>Dubai</Chip>
            <Chip active>Tech</Chip>
            <Chip active>IC3</Chip>
            <Chip>AED</Chip>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <MiniKpi label="Median (P50)" value="AED 30.2k" tone="blue" />
            <MiniKpi label="Trend" value="+1.9%" />
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Confidence</div>
                <Badge variant="brand">High</Badge>
              </div>
              <div className="mt-3 grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={clsx("h-2 rounded-full", i < 7 ? "bg-brand-500" : "bg-muted")} />
                ))}
              </div>
              <div className="mt-3 text-xs text-brand-700/80">Freshness + sample size validated</div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-brand-900">Trendline</div>
                <Badge variant="ghost" className="border-border/80 bg-white/70">
                  Last 90 days
                </Badge>
              </div>
              <MiniSparkline className="mt-2" />
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-sm font-semibold text-brand-900">Expat vs Local</div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                  <span className="font-semibold text-brand-900">Expat</span>
                  <span className="font-semibold text-brand-900">AED 33.4k</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                  <span className="font-semibold text-brand-900">Local</span>
                  <span className="font-semibold text-brand-900">AED 29.8k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VisualShell>
  );
}

export function AnalyticsHowItWorksVisual() {
  return (
    <VisualShell title="How it works" subtitle="Benchmark → Insights → Planning">
      <div className="grid gap-3">
        <Card className="p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Benchmark</div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <MiniKpi label="P25" value="AED 24.5k" />
            <MiniKpi label="P50" value="AED 30.2k" tone="blue" />
            <MiniKpi label="P75" value="AED 38.7k" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Insights</div>
          <div className="mt-2 rounded-2xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-brand-900">Trendlines</div>
              <Badge variant="brand">Live</Badge>
            </div>
            <MiniSparkline className="mt-2" variant="blue" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Planning</div>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-sm font-semibold text-brand-900">Scenario</div>
              <div className="mt-3 space-y-2">
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-[62%] rounded-full bg-brand-500" />
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 w-[44%] rounded-full bg-brand-500" />
                </div>
              </div>
              <div className="mt-3 text-xs text-brand-700/80">Headcount + raises</div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-sm font-semibold text-brand-900">Forecast</div>
              <MiniSparkline className="mt-2" />
            </div>
          </div>
        </Card>
      </div>
    </VisualShell>
  );
}

export function AnalyticsSuiteOverviewVisual() {
  return (
    <VisualShell title="Suite modules" subtitle="Benchmarks, insights, planning">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { title: "Comp Benchmarks", pill: "Suite" },
          { title: "Talent Insights", pill: "Live" },
          { title: "Budget & Planning", pill: "Board-ready" },
        ].map((m) => (
          <Card key={m.title} className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-brand-900">{m.title}</div>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                {m.pill}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2">
              <div className="h-10 rounded-xl bg-muted/50 ring-1 ring-border/60" />
              <div className="h-10 rounded-xl bg-muted/50 ring-1 ring-border/60" />
              <div className="h-10 rounded-xl bg-muted/50 ring-1 ring-border/60" />
            </div>
          </Card>
        ))}
      </div>
    </VisualShell>
  );
}

export function AnalyticsBenchmarksModuleVisual() {
  return (
    <VisualShell title="Comp Benchmarks" subtitle="Distributions + percentiles">
      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-brand-900">Distribution</div>
          <div className="flex gap-2">
            <Chip active>Dubai</Chip>
            <Chip active>IC3</Chip>
          </div>
        </div>
        <MiniDistribution className="mt-3" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniKpi label="P25" value="AED 24.5k" />
        <MiniKpi label="P50" value="AED 30.2k" tone="blue" />
        <MiniKpi label="P75" value="AED 38.7k" />
      </div>
    </VisualShell>
  );
}

export function AnalyticsInsightsModuleVisual() {
  return (
    <VisualShell title="Talent Insights" subtitle="Trendlines + deltas">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-brand-900">Trendlines</div>
            <Badge variant="brand">Live</Badge>
          </div>
          <MiniSparkline className="mt-2" variant="blue" />
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-semibold text-brand-900">Velocity</div>
          <div className="mt-3 text-3xl font-semibold text-brand-900">+2.3%</div>
          <div className="mt-1 text-xs text-brand-700/80">Month over month</div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-semibold text-brand-900">Expat</div>
          <div className="mt-2 text-2xl font-semibold text-brand-900">AED 33.4k</div>
          <MiniSparkline className="mt-2" variant="blue" />
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-semibold text-brand-900">Local</div>
          <div className="mt-2 text-2xl font-semibold text-brand-900">AED 29.8k</div>
          <MiniSparkline className="mt-2" />
        </div>
      </div>
    </VisualShell>
  );
}

export function AnalyticsPlanningModuleVisual() {
  return (
    <VisualShell title="Budget & Planning" subtitle="Scenarios + forecast">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-semibold text-brand-900">Headcount</div>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div className="h-2 w-[58%] rounded-full bg-brand-500" />
          </div>
          <div className="mt-2 text-xs text-brand-700/80">Scenario A</div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-semibold text-brand-900">Raise %</div>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div className="h-2 w-[42%] rounded-full bg-brand-500" />
          </div>
          <div className="mt-2 text-xs text-brand-700/80">Annual cycle</div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-semibold text-brand-900">Budget impact</div>
          <div className="mt-2 text-2xl font-semibold text-brand-900">AED 1.2M</div>
          <div className="mt-1 text-xs text-brand-700/80">Projected</div>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-brand-900">Forecast</div>
          <Badge variant="ghost" className="border-border/80 bg-white/70">
            Next 2 quarters
          </Badge>
        </div>
        <MiniSparkline className="mt-2" />
      </div>
    </VisualShell>
  );
}

export function AnalyticsExportsVisual() {
  return (
    <VisualShell title="Exports" subtitle="Board-ready reports">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-semibold text-brand-900">Report sections</div>
          <div className="mt-3 space-y-2">
            {["Benchmarks", "Insights", "Planning", "Notes"].map((s) => (
              <div key={s} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-brand-900">{s}</span>
                <span className="h-5 w-5 rounded-lg bg-white ring-1 ring-border/60" />
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white">
            Create report
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-brand-900">Preview</div>
            <Badge variant="brand">Ready</Badge>
          </div>
          <div className="mt-3 grid gap-2">
            <div className="h-10 rounded-xl bg-muted/50 ring-1 ring-border/60" />
            <div className="h-28 rounded-xl bg-muted/50 ring-1 ring-border/60" />
            <div className="h-10 rounded-xl bg-muted/50 ring-1 ring-border/60" />
            <div className="h-20 rounded-xl bg-muted/50 ring-1 ring-border/60" />
          </div>
        </div>
      </div>
    </VisualShell>
  );
}

export function AnalyticsWorkflowsVisual() {
  return (
    <VisualShell title="Workflows" subtitle="Saved reports + approvals">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Saved reports</div>
          <div className="mt-3 space-y-2">
            {["Q4 Hiring Plan", "Engineering Bands", "Market Movement"].map((r) => (
              <div key={r} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-brand-900">{r}</span>
                <Badge variant="ghost" className="border-border/70 bg-white/70">
                  Draft
                </Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Approvals</div>
          <div className="mt-3 space-y-2 text-xs">
            {[
              { label: "HR", status: "Approved" },
              { label: "Finance", status: "Pending" },
              { label: "Leadership", status: "Pending" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="font-semibold text-brand-900">{s.label}</span>
                <Badge variant={s.status === "Approved" ? "brand" : "ghost"} className={s.status === "Approved" ? "" : "border-border/70 bg-white/70"}>
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Scheduled exports</div>
          <div className="mt-3 space-y-2">
            {["Weekly snapshot", "Monthly board pack", "Quarterly plan"].map((s) => (
              <div key={s} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-brand-900">{s}</span>
                <Badge variant="brand">On</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </VisualShell>
  );
}

/* ------------------------- Solutions visuals ------------------------- */

export function SolutionsHrTeamsVisual() {
  return (
    <VisualShell title="For HR Teams" subtitle="Fair frameworks + faster approvals">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-brand-900">Pay bands</div>
            <Badge variant="brand">Policy</Badge>
          </div>
          <div className="mt-3 grid gap-2">
            {["IC2", "IC3", "IC4"].map((lvl) => (
              <div key={lvl} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-brand-900">{lvl}</span>
                <span className="text-xs font-semibold text-brand-900">P50: AED 30k</span>
                <Badge variant="ghost" className="border-border/70 bg-white/70">
                  High confidence
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-border px-3 py-3 text-xs text-brand-700/80">
            Standardize offers across teams with explainable confidence.
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Parity checks</div>
          <div className="mt-3 space-y-2 text-xs">
            {[
              { label: "Engineering", status: "OK" },
              { label: "Product", status: "Review" },
              { label: "Data", status: "OK" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="font-semibold text-brand-900">{s.label}</span>
                <Badge
                  variant={s.status === "OK" ? "brand" : "ghost"}
                  className={s.status === "OK" ? "" : "border-border/70 bg-white/70"}
                >
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </VisualShell>
  );
}

export function SolutionsFoundersVisual() {
  return (
    <VisualShell title="For Founders" subtitle="Hire confidently, protect runway">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-brand-900">Offer calibration</div>
            <Badge variant="brand">Fast</Badge>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <MiniKpi label="P25" value="AED 24.5k" />
            <MiniKpi label="P50" value="AED 30.2k" tone="blue" />
            <MiniKpi label="P75" value="AED 38.7k" />
          </div>
          <div className="mt-3 rounded-2xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-brand-900">Market movement</div>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                90 days
              </Badge>
            </div>
            <MiniSparkline className="mt-2" variant="blue" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Runway impact</div>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs">
              <div className="font-semibold text-brand-900">Scenario A</div>
              <div className="mt-1 text-brand-700/80">+3 hires → +AED 420k/year</div>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs">
              <div className="font-semibold text-brand-900">Scenario B</div>
              <div className="mt-1 text-brand-700/80">+5 hires → +AED 690k/year</div>
            </div>
          </div>
        </Card>
      </div>
    </VisualShell>
  );
}

export function SolutionsFinanceVisual() {
  return (
    <VisualShell title="For Finance" subtitle="Forecast budgets accurately">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-brand-900">Budget forecast</div>
            <Badge variant="brand">Scenario</Badge>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <MiniKpi label="Headcount" value="48" tone="blue" />
            <MiniKpi label="Raise %" value="4.0%" />
            <MiniKpi label="Impact" value="AED 1.2M" />
          </div>
          <div className="mt-3 rounded-2xl border border-border bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-brand-900">Forecast</div>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Next 2 quarters
              </Badge>
            </div>
            <MiniSparkline className="mt-2" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold text-brand-900">Exports</div>
          <div className="mt-3 space-y-2 text-xs">
            {["Board pack", "Comp report", "Variance notes"].map((t) => (
              <div key={t} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                <span className="font-semibold text-brand-900">{t}</span>
                <Badge variant="brand">Ready</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </VisualShell>
  );
}



