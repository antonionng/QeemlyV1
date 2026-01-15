import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileDown,
  Filter,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SAMPLE_BENCHMARK, formatMoney } from "@/lib/sample-benchmark";
import {
  BenchmarkSearchConfidenceVisual,
  BenchmarkSearchExportVisual,
  BenchmarkSearchFiltersVisual,
  BenchmarkSearchHeroVisual,
  BenchmarkSearchHowItWorksVisual,
  BenchmarkSearchResultsVisual,
  BenchmarkSearchWorkflowsVisual,
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

const sampleQuery = {
  role: SAMPLE_BENCHMARK.role,
  location: SAMPLE_BENCHMARK.location,
  level: SAMPLE_BENCHMARK.level,
  currency: SAMPLE_BENCHMARK.currency,
};

const faqs = [
  {
    q: "What do P25 / P50 / P75 mean?",
    a: "Percentiles summarize a salary range. P25 is the lower end, P50 is the typical/median, and P75 is the upper end. Use them to anchor offers and calibrate level expectations.",
  },
  {
    q: "What does “confidence” reflect?",
    a: "A simple signal of data quality based on freshness, sample size, and consistency. Higher confidence means you can rely on the range with less manual validation.",
  },
  {
    q: "Is this monthly or annual compensation?",
    a: "The demo values on this site are shown as monthly amounts. You can standardize outputs to match how your team makes offers (monthly/annual) when you’re inside the product.",
  },
  {
    q: "Which markets do you cover?",
    a: "Qeemly is Gulf-first. Coverage focuses on GCC markets and the realities of expat vs local comp dynamics, currency, and city-level differences.",
  },
  {
    q: "Can I export results for hiring managers or finance?",
    a: "Yes — exports are designed to be offer-ready and board-friendly, with clear percentiles and confidence so stakeholders can approve quickly.",
  },
  {
    q: "How is data handled?",
    a: "We prioritize privacy and aggregation. Benchmarks are displayed as ranges, not individual records, and are designed to reduce pay risk while keeping insights actionable.",
  },
];

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm">
        <div className="grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-14">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="w-fit gap-2">
                <Zap size={14} />
                Benchmark Search
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Gulf-first
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Confidence scoring
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
                Real-time salary ranges by role, level, and location
              </h1>
              <p className="text-lg text-brand-700">
                Benchmark offers in minutes with percentiles (P25/P50/P75), Gulf-aware filters, and explainable confidence so you
                can move fast without guessing.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={{ pathname: "/preview", query: sampleQuery }}>
                <Button>
                  Run a sample search <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Get started</Button>
              </Link>
              <Link href="/pricing" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                See pricing
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Output</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Percentiles + confidence</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Coverage</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Gulf-first benchmarks</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Workflow</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Export-ready outputs</div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-brand-700/80">
              Try it now:{" "}
              <span className="font-semibold text-brand-900">
                {SAMPLE_BENCHMARK.role} · {SAMPLE_BENCHMARK.location} · {SAMPLE_BENCHMARK.level} · {SAMPLE_BENCHMARK.currency}
              </span>
            </div>

            <form action="/preview" className="rounded-3xl border border-border/70 bg-brand-50/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input name="role" placeholder="Search role (e.g., Product Manager)" fullWidth />
                <Button type="submit" className="sm:w-36">
                  Preview
                </Button>
              </div>
              <div className="mt-3 text-xs text-brand-700/80">
                Preview uses default filters (Dubai, IC3, AED) unless you use the sample search button.
              </div>
            </form>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
            <BenchmarkSearchHeroVisual />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-8 shadow-sm sm:px-10 lg:px-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Trusted by teams</div>
            <div className="text-xl font-semibold text-brand-900">Built for HR, founders, and finance</div>
            <div className="text-sm text-brand-700/90">Benchmark confidently with ranges that match how GCC teams hire.</div>
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
          <h2 className="text-2xl font-semibold text-brand-900">From role to range in three steps</h2>
          <p className="text-sm text-brand-700/90">
            Focus on the decision, not spreadsheet clean-up. Benchmark Search turns messy market signals into a clear range with
            context and confidence.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">1) Pick the profile</div>
                  <div className="text-sm text-brand-700/90">Role, level, and location — aligned to GCC hiring realities.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Filter className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">2) Apply Gulf-aware filters</div>
                  <div className="text-sm text-brand-700/90">Currency, city, and profile slices like expat vs local.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">3) Get percentiles + confidence</div>
                  <div className="text-sm text-brand-700/90">Use P25/P50/P75 to anchor offers and avoid pay risk.</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
          <BenchmarkSearchHowItWorksVisual />
        </div>
      </section>

      {/* CORE OUTPUTS */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">What you get</div>
            <h2 className="text-2xl font-semibold text-brand-900">Percentiles that make offers easy to approve</h2>
            <p className="text-sm text-brand-700/90">
              Stop debating “what’s fair” from scratch. Use a clear range and a confidence signal to align hiring managers and
              finance.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {([
                { label: "P25", value: formatMoney(SAMPLE_BENCHMARK.currency, SAMPLE_BENCHMARK.p25) },
                { label: "Median (P50)", value: formatMoney(SAMPLE_BENCHMARK.currency, SAMPLE_BENCHMARK.p50) },
                { label: "P75", value: formatMoney(SAMPLE_BENCHMARK.currency, SAMPLE_BENCHMARK.p75) },
              ] as const).map((item) => (
                <Card key={item.label} className="p-5">
                  <div className="text-sm font-semibold text-brand-800/80">{item.label}</div>
                  <div className="mt-2 text-xl font-semibold text-brand-900">{item.value}</div>
                  <div className="mt-1 text-xs text-brand-700/80">High confidence</div>
                </Card>
              ))}
            </div>

            <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-brand-700/80">
              Use this to justify offers, calibrate levels, and reduce negotiation whiplash.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={{ pathname: "/preview", query: sampleQuery }}>
                <Button>
                  See the preview <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                Talk to us
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
            <BenchmarkSearchResultsVisual />
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Why Qeemly</div>
          <h2 className="text-2xl font-semibold text-brand-900">Gulf-first data, not generic global averages</h2>
          <p className="text-sm text-brand-700/90">
            GCC hiring has unique dynamics: currency, city variance, and expat vs local differences. Benchmark Search is designed
            around that reality.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-900">Role & level filters</div>
                  <p className="mt-1 text-sm text-brand-700/90">Calibrate offers with consistent leveling across roles.</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-900">Freshness signals</div>
                  <p className="mt-1 text-sm text-brand-700/90">Know whether the range reflects today’s market.</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-900">Confidence scoring</div>
                  <p className="mt-1 text-sm text-brand-700/90">Act fast when confidence is high; validate when it isn’t.</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
                  <div className="text-sm font-semibold text-brand-900">Pay-risk reduction</div>
                  <p className="mt-1 text-sm text-brand-700/90">Avoid outliers and inequities with clear ranges.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
          <BenchmarkSearchFiltersVisual />
        </div>
      </section>

      {/* CONFIDENCE */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Confidence</div>
            <h2 className="text-2xl font-semibold text-brand-900">A confidence score you can explain to stakeholders</h2>
            <p className="text-sm text-brand-700/90">
              When you share a benchmark internally, the first question is always: “Can we trust this?” Confidence makes the answer
              clear.
            </p>

            <div className="grid gap-3">
              {[
                "Freshness (how recent the signal is)",
                "Sample size (how much data backs the range)",
                "Consistency (how stable values are across sources)",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-sm text-brand-800/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-brand-700/80">
              Use high-confidence ranges to move quickly; use lower-confidence ranges as a prompt to validate with a targeted
              check.
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
            <BenchmarkSearchConfidenceVisual />
          </div>
        </div>
      </section>

      {/* EXPORTS */}
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Export & sharing</div>
          <h2 className="text-2xl font-semibold text-brand-900">Offer-ready outputs in one click</h2>
          <p className="text-sm text-brand-700/90">
            Share ranges with hiring managers and finance without rewriting the story every time. Keep approvals consistent, fast,
            and defensible.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <FileDown className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-900">Hiring manager share</div>
                  <p className="mt-1 text-sm text-brand-700/90">Clear percentiles + recommended offer band.</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-900">Finance-ready summaries</div>
                  <p className="mt-1 text-sm text-brand-700/90">Consistent formatting for approvals and audits.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
          <BenchmarkSearchExportVisual />
        </div>
      </section>

      {/* USE CASES */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Use cases</div>
            <h2 className="text-2xl font-semibold text-brand-900">Designed for the whole decision chain</h2>
          </div>
          <Link href={{ pathname: "/preview", query: sampleQuery }} className="text-sm font-semibold text-brand-700 hover:text-brand-900">
            Run the sample search
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
                <p className="mt-1 text-sm text-brand-700/90">Set fair ranges, reduce pay risk, and move faster with confidence.</p>
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
                <p className="mt-1 text-sm text-brand-700/90">Hire confidently, avoid overpaying, and protect runway.</p>
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
                <p className="mt-1 text-sm text-brand-700/90">Forecast budgets with defensible ranges and consistent exports.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
          <BenchmarkSearchWorkflowsVisual />
        </div>
      </section>

      {/* FAQ */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">FAQ</div>
          <h2 className="text-2xl font-semibold text-brand-900">Answers before you run the preview</h2>
          <p className="text-sm text-brand-700/90">
            We’re building trust by design. If you have a question that isn’t covered here, we’re happy to walk you through it.
          </p>
          <Link href="/contact">
            <Button variant="outline">Talk to us</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {faqs.map((item) => (
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
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Ready to benchmark?</div>
            <h2 className="text-3xl font-semibold text-brand-900">Run a sample search and see the output instantly</h2>
            <p className="text-sm text-brand-700/90">
              Start with the preview. If you like what you see, request access and unlock exports, saved reports, and full analytics.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={{ pathname: "/preview", query: sampleQuery }}>
                <Button>
                  Run sample search <ArrowRight className="h-4 w-4" />
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
                <div className="text-sm font-semibold text-brand-900">What you’ll see in the preview</div>
                <div className="space-y-2 text-sm text-brand-800/90">
                  {[
                    "P25 / P50 / P75 range for your role",
                    "Confidence signal and freshness indicators",
                    "A taste of exports and dashboard modules",
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

