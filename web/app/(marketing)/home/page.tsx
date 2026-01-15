import { ArrowRight, CheckCircle, ChevronDown, Database, Globe, LineChart, Quote, Search, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import Image from "next/image";
import heroDashboard from "@/public/images/hero-dashboard.png";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { AiExplainTooltip } from "@/components/ui/ai-explain-tooltip";
import { SectionModal } from "@/components/ui/section-modal";
import { AiChecksVisual, GulfFocusedVisual, HireSmarterVisual, KnowMarketVisual } from "@/components/marketing/jigsaw-visuals";
import { SAMPLE_BENCHMARK, formatMoney } from "@/lib/sample-benchmark";
import {
  ModalHeroAiSafeguards,
  ModalHeroBenchmarkOutput,
  ModalHeroConfidence,
  ModalHeroGulfLocalization,
} from "@/components/marketing/modal-hero-visuals";
import { TourBenchmarkVisual, TourDeltasVisual, TourPlanningVisual } from "@/components/marketing/tour-visuals";

const popularRoles = ["Software Engineer", "Product Manager", "Data Scientist", "DevOps Engineer", "UX Designer"];
const gulfLocations = ["Dubai, UAE", "Abu Dhabi, UAE", "Riyadh, KSA", "Jeddah, KSA", "Doha, Qatar", "Manama, Bahrain", "Kuwait City, Kuwait", "Muscat, Oman"];
const roleLevels = ["IC1 (Junior)", "IC2", "IC3", "IC4 (Senior)", "IC5 (Staff)"];
const currencies = ["AED", "SAR", "QAR", "BHD", "KWD", "OMR", "USD"];

const stats = [
  { value: "800+", label: "Verified submissions" },
  { value: "6", label: "Gulf countries" },
  { value: "50+", label: "Tech roles" },
];

const suites = [
  {
    title: "Comp Benchmarks",
    description: "Instant salary ranges by role, level, and location.",
    items: ["Role & level filters", "Currency flexibility", "Confidence scoring", "Export for offers"],
  },
  {
    title: "Talent Insights",
    description: "Spot gaps for expat vs local, and track market movement.",
    items: ["Expat vs local deltas", "Trendlines by percentile", "Market velocity signals", "Geo & industry tags"],
  },
  {
    title: "Budget & Planning",
    description: "Plan headcount and raises with clarity for boards and finance.",
    items: ["Raise and promo scenarios", "Team-wide parity checks", "Benchmarks by team", "Board-ready exports"],
  },
];

const jigsawCards = [
  {
    title: "Gulf-focused",
    icon: Globe,
    body: "Expat vs local filters, currency flexibility, and deep regional insight.",
  },
  {
    title: "AI checks you can trust",
    icon: Sparkles,
    body: "Smart gap-filling with transparent confidence scoring to reduce pay risk.",
  },
];

type HomePageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function firstParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string | undefined {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // UI-only prototype: values can be prefilled via query params like ?role=...&location=...&level=...&currency=...
  // Next 16+ passes `searchParams` as an async API in Server Components.
  const resolvedSearchParams = (await searchParams) as Record<string, string | string[] | undefined> | undefined;
  const selectedRole = firstParam(resolvedSearchParams, "role") ?? "";
  const selectedLocation = firstParam(resolvedSearchParams, "location") ?? "Dubai, UAE";
  const selectedLevel = firstParam(resolvedSearchParams, "level") ?? "IC3";
  const selectedCurrency = firstParam(resolvedSearchParams, "currency") ?? "AED";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-20">
      <div id="sample" className="sr-only" />
      {/* Hero with Search and placeholders */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-brand-50/70 via-white to-white px-6 py-14 sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="brand" className="gap-2 w-fit">
              <Zap size={14} />
              Gulf-first compensation intelligence
            </Badge>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
                Pay with confidence, powered by Gulf salary intelligence
              </h1>
              <p className="text-lg text-brand-700">
                Real market data, AI checks, and instant salary benchmarks so you can make fair, confident offers in minutes.
              </p>
            </div>

            <div className="space-y-3">
              <form action="/preview" className="space-y-2">
                <div className="rounded-3xl bg-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-border/70 backdrop-blur-sm focus-within:ring-brand-200">
                  <div className="overflow-hidden rounded-3xl divide-y divide-border/60">
                    {/* Role (top row) */}
                    <div className="flex items-center gap-3 px-3.5 py-2.5">
                      <Search className="h-4 w-4 text-brand-400" />
                      <Input
                        name="role"
                        fullWidth
                        defaultValue={selectedRole}
                        placeholder="Search role (e.g. Backend Engineer)"
                        className="h-8 border-none bg-transparent px-0 text-sm placeholder:text-brand-500 focus:border-none focus-visible:outline-none focus-visible:ring-0 rounded-none"
                        aria-label="Role"
                      />
                    </div>

                    {/* Filters (second row) */}
                    <div className="grid grid-cols-1 divide-y divide-border/60 lg:grid-cols-[1fr_0.7fr_0.7fr_auto] lg:divide-x lg:divide-y-0">
                      {/* Location */}
                      <label className="relative flex items-center gap-3 px-3.5 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 shrink-0">Location</span>
                        <select
                          name="location"
                          defaultValue={selectedLocation}
                          className="h-8 flex-1 min-w-0 appearance-none bg-transparent pr-10 text-sm text-brand-900 focus:outline-none"
                          aria-label="Location"
                        >
                          {gulfLocations.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                      </label>

                      {/* Level */}
                      <label className="relative flex items-center gap-3 px-3.5 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 shrink-0">Level</span>
                        <select
                          name="level"
                          defaultValue={selectedLevel}
                          className="h-8 flex-1 min-w-0 appearance-none bg-transparent pr-10 text-sm text-brand-900 focus:outline-none"
                          aria-label="Level"
                        >
                          {roleLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                      </label>

                      {/* Currency */}
                      <label className="relative flex items-center gap-3 px-3.5 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 shrink-0">Currency</span>
                        <select
                          name="currency"
                          defaultValue={selectedCurrency}
                          className="h-8 flex-1 min-w-0 appearance-none bg-transparent pr-10 text-sm text-brand-900 focus:outline-none"
                          aria-label="Currency"
                        >
                          {currencies.map((cur) => (
                            <option key={cur} value={cur}>
                              {cur}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                      </label>

                      {/* CTA */}
                      <div className="p-3">
                        <Button type="submit" size="sm" className="w-full justify-center lg:w-auto">
                          Go
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="px-3.5 pb-3 pt-2">
                    <AiExplainTooltip
                      label="What do P25 / P50 / P75 mean?"
                      message={`Percentiles summarize the salary range:\n- P25 = lower end (25% earn below)\n- P50 = typical/median\n- P75 = upper end (75% earn below)\n\nConfidence reflects data quality (sample size, freshness, and consistency).\n\nExample: ${SAMPLE_BENCHMARK.role} · ${SAMPLE_BENCHMARK.location.split(",")[0]} → Typical (P50) ${formatMoney(selectedCurrency, SAMPLE_BENCHMARK.p50)} / month • High confidence`}
                    />
                  </div>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-sm text-brand-600">
                <span className="font-semibold text-brand-700">Popular:</span>
                {popularRoles.map((role) => (
                  <Link
                    key={role}
                    href={{
                      pathname: "/home",
                      query: { role, location: selectedLocation, level: selectedLevel, currency: selectedCurrency },
                    }}
                  >
                    <Chip className="cursor-pointer hover:bg-brand-100">{role}</Chip>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-2xl font-bold text-brand-900">{stat.value}</span>
                  <span className="text-sm text-brand-600">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button size="md">Get started</Button>
              </Link>
              <Link href="#sample" className="text-sm font-semibold text-brand-600 hover:text-brand-900">
                See sample output
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="relative">
              {/* Standalone hero dashboard image */}
              <div className="relative mx-auto w-full max-w-2xl aspect-[3/4] bg-transparent lg:justify-self-end">
                <Image
                  src={heroDashboard}
                  alt="Qeemly dashboard preview"
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Blocks (jigsaw layout) */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">Everything you need to benchmark compensation</h2>
          <p className="mt-2 text-brand-600">Localised data, confidence scoring, and AI safeguards.</p>
        </div>

        <div className="rounded-3xl border border-border bg-muted/40 p-4 sm:p-6">
          <div className="grid gap-4 md:auto-rows-fr md:grid-cols-3">
            {/* Tall left card */}
            <Card className="col-span-1 row-span-2 flex flex-col justify-between bg-brand-50 p-6">
              <div className="space-y-3">
                <Badge variant="ghost" className="w-fit">Live data</Badge>
                <h3 className="text-xl font-semibold text-brand-900">Hire smarter with real tech salary data</h3>
                <ul className="space-y-2 text-sm text-brand-700">
                  <li>Verified submissions across GCC tech hubs.</li>
                  <li>Level-aware ranges with confidence scores.</li>
                </ul>
                <HireSmarterVisual className="mt-5 h-60 max-w-md" />
              </div>
              <div className="mt-6">
                <div className="text-4xl font-bold text-brand-700">800+</div>
                <p className="text-sm text-brand-600">Verified submissions powering benchmarks</p>
                <SectionModal
                  title="Confidence scoring"
                  subtitle="Benchmarks your HR and Finance teams can align on."
                  triggerLabel="How confidence works →"
                  icon={<ShieldCheck className="h-5 w-5 text-brand-600" />}
                >
                  <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
                    <div className="space-y-4">
                      <p className="text-sm text-brand-700">
                        Qeemly adds a confidence score to every benchmark so decisions are explainable and consistent across GCC markets.
                      </p>
                      <ul className="space-y-2 text-sm text-brand-700">
                        <li><span className="font-semibold text-brand-900">Sample size:</span> more verified points increases confidence.</li>
                        <li><span className="font-semibold text-brand-900">Freshness:</span> recent submissions carry more weight.</li>
                        <li><span className="font-semibold text-brand-900">Consistency:</span> tighter distributions raise reliability.</li>
                      </ul>
                      <div className="rounded-2xl border border-border bg-white p-4">
                        <p className="text-sm font-semibold text-brand-900">How to use it</p>
                        <p className="mt-1 text-xs text-brand-600">
                          Use <span className="font-semibold text-brand-900">high confidence</span> to set bands and approve offers fast.
                          Use <span className="font-semibold text-brand-900">low confidence</span> to request more signal or widen your range.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-muted p-4">
                        <p className="text-sm font-semibold text-brand-900">Privacy-first by design</p>
                        <p className="mt-1 text-xs text-brand-600">Aggregated benchmarking only. No personal salary is ever shown.</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/register">
                          <Button size="sm">Get early access</Button>
                        </Link>
                        <Link href="/contact">
                          <Button variant="outline" size="sm">Talk to us</Button>
                        </Link>
                      </div>
                    </div>
                    <ModalHeroConfidence className="h-72" />
                  </div>
                </SectionModal>
              </div>
            </Card>

            {/* Wide top-right card */}
            <Card className="col-span-2 flex flex-col gap-4 bg-white p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-brand-500" />
                <h3 className="text-lg font-semibold text-brand-900">Know the market in real time</h3>
              </div>
              <ul className="space-y-2 text-sm text-brand-700">
                <li>Percentiles by city, level, and profile.</li>
                <li>Trendlines that HR and Finance can align on.</li>
              </ul>
              <div className="mt-1">
                <KnowMarketVisual className="h-40" />
              </div>
              <SectionModal
                title="Sample benchmark output"
                subtitle="What you get after you run a benchmark."
                triggerLabel="See a sample output →"
                icon={<Database className="h-5 w-5 text-brand-600" />}
                maxWidthClassName="max-w-4xl"
              >
                <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
                  <div className="space-y-4">
                    <p className="text-sm text-brand-700">
                      This is what you export and share internally: percentiles, confidence, and an audit-friendly summary your teams can align on.
                    </p>
                    <ul className="space-y-2 text-sm text-brand-700">
                      <li>P25 / P50 / P75 ranges by role, level, and city.</li>
                      <li>Currency flexibility across GCC markets.</li>
                      <li>Low-signal segments clearly labeled.</li>
                    </ul>
                    <div className="rounded-2xl border border-border bg-muted p-4">
                      <p className="text-sm font-semibold text-brand-900">Tip</p>
                      <p className="mt-1 text-xs text-brand-600">
                        Values vary by role, level, location, and sample size. Low-signal segments are marked clearly.
                      </p>
                    </div>
                  </div>
                  <ModalHeroBenchmarkOutput className="h-72" />
                </div>
              </SectionModal>
            </Card>

            {/* Bottom-right small cards */}
            {jigsawCards.map((card) => {
              const Icon = card.icon;
              const Visual = card.title === "Gulf-focused" ? GulfFocusedVisual : AiChecksVisual;
              const modal =
                card.title === "Gulf-focused" ? (
                  <SectionModal
                    title="Gulf-focused benchmarking"
                    subtitle="Built for GCC markets from day one."
                    triggerLabel="Learn more →"
                    icon={<Globe className="h-5 w-5 text-brand-600" />}
                  >
                    <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
                      <div className="space-y-4">
                        <p className="text-sm text-brand-700">
                          Filter and compare compensation using Gulf-native context: location, hiring profile, and currency.
                        </p>
                        <ul className="space-y-2 text-sm text-brand-700">
                          <li>GCC city filters built in (Dubai, Riyadh, Abu Dhabi, Doha).</li>
                          <li>Switch currencies (AED/SAR and more) without redoing analysis.</li>
                          <li>Hiring-profile segmentation where signal is strong enough.</li>
                        </ul>
                      </div>
                      <ModalHeroGulfLocalization className="h-72" />
                    </div>
                  </SectionModal>
                ) : (
                  <SectionModal
                    title="AI checks you can trust"
                    subtitle="Transparent confidence scoring, not black-box outputs."
                    triggerLabel="Learn more →"
                    icon={<Sparkles className="h-5 w-5 text-brand-600" />}
                  >
                    <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
                      <div className="space-y-4">
                        <p className="text-sm text-brand-700">
                          AI helps fill gaps and validate ranges—but always with explainability and confidence indicators.
                        </p>
                        <ul className="space-y-2 text-sm text-brand-700">
                          <li>Outliers flagged before you export or share.</li>
                          <li>Low-signal segments marked clearly (no false certainty).</li>
                          <li>Confidence attached to every range, always visible.</li>
                        </ul>
                        <Link href="#confidence" className="text-sm font-semibold text-brand-500 hover:text-brand-700">
                          See confidence details →
                        </Link>
                      </div>
                      <ModalHeroAiSafeguards className="h-72" />
                    </div>
                  </SectionModal>
                );

              return (
                <Card key={card.title} className="col-span-1 flex flex-col gap-3 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-brand-500" />
                    <h4 className="text-base font-semibold text-brand-900">{card.title}</h4>
                  </div>
                  <div className="mt-1">
                    <Visual className="h-36" />
                  </div>
                  <p className="text-sm text-brand-700">{card.body}</p>
                  <div className="mt-auto">{modal}</div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="h-px w-full bg-border/60" />

      {/* Product tour (image-led narrative) */}
      <section className="space-y-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">See how Qeemly works</h2>
          <p className="mt-2 text-brand-600">A product-first walkthrough designed for Gulf HR and Finance teams.</p>
        </div>

        {/* 1) Benchmark instantly */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge variant="ghost" className="w-fit">Step 1 • Benchmark</Badge>
            <h3 className="text-2xl font-bold text-brand-900">Get P25 / P50 / P75 in seconds</h3>
            <ul className="space-y-2 text-sm text-brand-700">
              <li>Compare Dubai, Riyadh, Abu Dhabi, Doha and more.</li>
              <li>Level-aware ranges for tech roles.</li>
              <li>Every range includes a confidence score.</li>
            </ul>
            <a href="#confidence" className="text-sm font-semibold text-brand-500 hover:text-brand-700">
              Learn how confidence scoring works →
            </a>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
            <TourBenchmarkVisual className="h-full" />
          </div>
        </div>

        {/* 2) Expat vs local deltas */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="order-2 space-y-4 lg:order-1">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
              <TourDeltasVisual className="h-full" />
            </div>
          </div>
          <div className="order-1 space-y-4 lg:order-2">
            <Badge variant="ghost" className="w-fit">Step 2 • Deltas</Badge>
            <h3 className="text-2xl font-bold text-brand-900">Expat vs local insights, built-in</h3>
            <ul className="space-y-2 text-sm text-brand-700">
              <li>See market deltas by hiring profile.</li>
              <li>Currency flexibility across GCC markets.</li>
              <li>Spot risk areas before offers go out.</li>
            </ul>
            <a href="#sample" className="text-sm font-semibold text-brand-500 hover:text-brand-700">
              See a sample report →
            </a>
          </div>
        </div>

        {/* 3) Planning + exports */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge variant="ghost" className="w-fit">Step 3 • Planning</Badge>
            <h3 className="text-2xl font-bold text-brand-900">Plan budgets and export board-ready outputs</h3>
            <ul className="space-y-2 text-sm text-brand-700">
              <li>Create salary bands with clear min/median/max.</li>
              <li>Model promotion and raise scenarios.</li>
              <li>Export ranges for offers and approvals.</li>
            </ul>
            <Link href="/contact" className="text-sm font-semibold text-brand-500 hover:text-brand-700">
              Talk to us →
            </Link>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
            <TourPlanningVisual className="h-full" />
          </div>
        </div>
      </section>

      {/* Credibility: confidence scoring + methodology */}
      <section id="confidence" className="rounded-3xl border border-border bg-white p-8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <Badge variant="brand" className="w-fit">Confidence scoring</Badge>
            <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">Benchmarks you can explain</h2>
            <p className="text-sm text-brand-700">
              Every range comes with a confidence score so HR and Finance can align quickly—without guesswork.
            </p>
            <ul className="space-y-2 text-sm text-brand-700">
              <li><span className="font-semibold text-brand-900">Sample size:</span> more verified points increases confidence.</li>
              <li><span className="font-semibold text-brand-900">Freshness:</span> recent submissions carry more weight.</li>
              <li><span className="font-semibold text-brand-900">Consistency:</span> tighter distributions raise reliability.</li>
            </ul>
            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-sm font-semibold text-brand-900">Privacy-first by design</p>
              <p className="mt-1 text-xs text-brand-600">
                Aggregated benchmarking only. No personal salary is ever shown.
              </p>
            </div>
          </div>

          <div className="relative aspect-[14/9] overflow-hidden rounded-2xl border border-border bg-white">
            <ModalHeroConfidence className="h-full" />
          </div>
        </div>
      </section>

      {/* Suites */}
      <section className="space-y-6">
        <div className="text-center">
          <Badge variant="brand" className="mb-3">Platform</Badge>
          <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">Suites built for every step</h2>
          <p className="mt-2 text-brand-600">Benchmark, explain, and plan compensation with clarity.</p>
        </div>

        <div className="space-y-4">
          {suites.map((suite) => {
            const visual =
              suite.title === "Comp Benchmarks" ? (
                <TourBenchmarkVisual className="h-full" />
              ) : suite.title === "Talent Insights" ? (
                <TourDeltasVisual className="h-full" />
              ) : (
                <TourPlanningVisual className="h-full" />
              );

            return (
              <Card key={suite.title} className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start">
                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-600">
                    <LineChart size={12} />
                    Suite
                  </div>
                  <h3 className="text-lg font-semibold text-brand-900">{suite.title}</h3>
                  <p className="text-sm text-brand-700">{suite.description}</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {suite.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-brand-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 text-brand-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-fit gap-2">
                    Explore suite
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="w-full max-w-sm lg:w-64">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-transparent">
                    {visual}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Proof & testimonial band */}
      <section className="rounded-3xl border border-border bg-muted p-8 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-brand-700">
              <Quote className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-semibold uppercase tracking-wide">Why teams trust Qeemly</span>
            </div>
            <p className="text-xl font-semibold text-brand-900">
              &ldquo;Qeemly gives us instant clarity on fair offers across the Gulf: percentiles, currency flexibility, and confidence scores in one view.&rdquo;
            </p>
            <p className="text-sm text-brand-600">Name Surname, Head of People</p>
          </div>
          <div className="w-full max-w-md">
            <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-border bg-white">
              <Image
                src="/images/team-photo.png"
                alt="Team photo placeholder"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-white p-4 text-center">
              <div className="text-2xl font-bold text-brand-900">{stat.value}</div>
              <div className="text-sm text-brand-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-3xl border border-border bg-brand-500 p-10 sm:p-14 text-white">
        <div className="flex flex-col items-start gap-6 text-left">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to benchmark with confidence?</h2>
            <p className="mt-2 max-w-2xl text-white/85">
              Get localized benchmarks, AI confidence scoring, and transparent ranges for every tech role in the Gulf.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register">
              <Button size="lg" className="!bg-white !text-brand-900 hover:!bg-gray-100">
                Get early access
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="ghost"
                size="lg"
                className="!bg-transparent !text-white ring-1 ring-white hover:!bg-white/10 hover:!text-white"
              >
                Talk to us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
