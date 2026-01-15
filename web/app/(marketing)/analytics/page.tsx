import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileDown,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AnalyticsBenchmarksModuleVisual,
  AnalyticsExportsVisual,
  AnalyticsHeroVisual,
  AnalyticsHowItWorksVisual,
  AnalyticsInsightsModuleVisual,
  AnalyticsPlanningModuleVisual,
  AnalyticsSuiteOverviewVisual,
  AnalyticsWorkflowsVisual,
} from "@/components/marketing/product-visuals";

const logos = [
  "/images/logo-1.png",
  "/images/logo-2.png",
  "/images/logo-3.png",
  "/images/logo-4.png",
  "/images/logo-5.png",
  "/images/logo-6.png",
  "/images/logo-7.png",
  "/images/logo-8.png",
];

const suiteModules = [
  {
    title: "Comp Benchmarks",
    description: "Instant salary ranges by role, level, and location — with confidence scoring.",
    icon: BarChart3,
    bullets: ["Role & level filters", "Currency flexibility", "Confidence scoring", "Export for offers"],
  },
  {
    title: "Talent Insights",
    description: "Spot expat vs local gaps and track market movement with trendlines.",
    icon: TrendingUp,
    bullets: ["Expat vs local deltas", "Trendlines by percentile", "Market velocity signals", "Geo & industry tags"],
  },
  {
    title: "Budget & Planning",
    description: "Plan headcount and raises with clarity for boards and finance.",
    icon: ShieldCheck,
    bullets: ["Raise and promo scenarios", "Team parity checks", "Benchmarks by team", "Board-ready exports"],
  },
];

export default function AnalyticsProductPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm">
        <div className="grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-14">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="w-fit gap-2">
                <Zap size={14} />
                Analytics Dashboard
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Live market signals
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Board-ready exports
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
                Market intelligence for compensation decisions
              </h1>
              <p className="text-lg text-brand-700">
                Track trends, compare profiles, and plan pay with a Gulf-first dashboard built for HR, founders, and finance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard">
                <Button>
                  View live demo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Get started</Button>
              </Link>
              <Link href="/search" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                Try Benchmark Search
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Benchmarks</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Percentiles by city & level</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Insights</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Trends & profile deltas</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Planning</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Budget + scenarios</div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-brand-700/80">
              The dashboard is where teams align: benchmarks, confidence, exports, and planning in one place.
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
            <AnalyticsHeroVisual />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-8 shadow-sm sm:px-10 lg:px-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Trusted by teams</div>
            <div className="text-xl font-semibold text-brand-900">Built for HR, founders, and finance</div>
            <div className="text-sm text-brand-700/90">A single view of market truth to speed approvals and reduce pay risk.</div>
          </div>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
            {logos.map((src, idx) => (
              <div
                key={src}
                className="relative h-8 w-full overflow-hidden rounded-lg bg-white/60 ring-1 ring-border/60"
                aria-hidden
              >
                <Image src={src} alt={`Logo ${idx + 1}`} fill className="object-contain p-2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">How it works</div>
          <h2 className="text-2xl font-semibold text-brand-900">A dashboard that matches how decisions get made</h2>
          <p className="text-sm text-brand-700/90">
            From first benchmark to final budget, the dashboard keeps everyone aligned—HR for fairness, founders for speed, and
            finance for predictability.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">1) Benchmark the role</div>
                  <div className="text-sm text-brand-700/90">Get percentiles and confidence for your market segment.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">2) Understand movement</div>
                  <div className="text-sm text-brand-700/90">Trendlines and profile deltas so you can act before it’s too late.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <FileDown className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">3) Export + plan</div>
                  <div className="text-sm text-brand-700/90">Offer-ready exports and scenario planning for finance and boards.</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
          <AnalyticsHowItWorksVisual />
        </div>
      </section>

      {/* Suite modules */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Suite modules</div>
            <h2 className="text-2xl font-semibold text-brand-900">Everything you need to benchmark, explain, and plan</h2>
            <p className="text-sm text-brand-700/90">
              Three modules cover the full lifecycle—from first offer to team-wide planning—without losing the context of Gulf
              markets.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/pricing">
                <Button variant="outline">See pricing</Button>
              </Link>
              <Link href="/contact" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                Talk to us
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
            <AnalyticsSuiteOverviewVisual />
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {suiteModules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-brand-900">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-lg font-semibold">{module.title}</div>
                      </div>
                      <p className="text-sm text-brand-700/90">{module.description}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-brand-800/90">
                    {module.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-border/70 bg-white p-3">
                  <div className="overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-border/70">
                    {module.title === "Comp Benchmarks" ? (
                      <AnalyticsBenchmarksModuleVisual />
                    ) : module.title === "Talent Insights" ? (
                      <AnalyticsInsightsModuleVisual />
                    ) : (
                      <AnalyticsPlanningModuleVisual />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* EXPORTS */}
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Exports</div>
          <h2 className="text-2xl font-semibold text-brand-900">Board-ready exports built for approvals</h2>
          <p className="text-sm text-brand-700/90">
            Share ranges, confidence, and rationale in a consistent format. Make approvals faster and reduce back-and-forth across
            HR and finance.
          </p>

          <div className="grid gap-3">
            {[
              "Offer-ready benchmark summaries",
              "Audit-friendly context and confidence indicators",
              "Exports designed for HR + finance workflows",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 text-sm text-brand-800/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                <span>{t}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
              <Button>
                View live demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Request access</Button>
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
          <AnalyticsExportsVisual />
        </div>
      </section>

      {/* USE CASES */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Use cases</div>
            <h2 className="text-2xl font-semibold text-brand-900">Designed for the whole decision chain</h2>
          </div>
          <Link href="/pricing" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
            See pricing
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-brand-900">HR Teams</div>
                <p className="mt-1 text-sm text-brand-700/90">Fairness, clarity, and consistent decisions across roles.</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-brand-900">Founders</div>
                <p className="mt-1 text-sm text-brand-700/90">Move fast, avoid overpaying, protect runway.</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-brand-900">Finance</div>
                <p className="mt-1 text-sm text-brand-700/90">Budget planning and scenarios you can defend.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
          <AnalyticsWorkflowsVisual />
        </div>
      </section>

      {/* FAQ */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">FAQ</div>
          <h2 className="text-2xl font-semibold text-brand-900">Quick answers</h2>
          <p className="text-sm text-brand-700/90">
            The dashboard is designed to be explainable: confidence, exports, and modules that map to real decisions.
          </p>
          <Link href="/contact">
            <Button variant="outline">Talk to us</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Is this the same as Benchmark Search?",
              a: "Benchmark Search is the fastest way to get a range. The Analytics Dashboard adds trendlines, profile comparisons, planning, and exports.",
            },
            {
              q: "Can I share outputs with finance and leadership?",
              a: "Yes. Exports are designed for approvals: percentiles, confidence, and clear context to reduce back-and-forth.",
            },
            {
              q: "Do you support GCC currencies and city differences?",
              a: "Yes. The product is Gulf-first with currency flexibility and city-level views where signal is strong.",
            },
            {
              q: "How does confidence work?",
              a: "Confidence reflects data freshness, sample size, and consistency—so teams know when to act quickly or validate further.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border/70 bg-white p-5 shadow-sm open:ring-2 open:ring-brand-100"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-brand-900">
                {item.q}
                <span className="float-right text-brand-500 group-open:text-brand-700">+</span>
              </summary>
              <p className="mt-3 text-sm text-brand-700/90">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-brand-50/80 via-white to-white px-6 py-12 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Ready to see the dashboard?</div>
            <h2 className="text-3xl font-semibold text-brand-900">Open the live demo and explore the suite</h2>
            <p className="text-sm text-brand-700/90">
              Start with the live demo. If you like what you see, request access to unlock exports, saved reports, and planning.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard">
                <Button>
                  View live demo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Request access</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-brand-900">In the dashboard you’ll get</div>
                <div className="space-y-2 text-sm text-brand-800/90">
                  {[
                    "Comp Benchmarks with confidence indicators",
                    "Talent Insights: trendlines and deltas",
                    "Budget & Planning: scenarios and exports",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


