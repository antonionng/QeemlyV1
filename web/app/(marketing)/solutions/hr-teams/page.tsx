import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SolutionsHrTeamsVisual } from "@/components/marketing/product-visuals";

const faqs = [
  {
    q: "Can we standardize bands across teams?",
    a: "Yes. Use percentiles and confidence to create consistent bands by role/level, then keep them refreshed as the market moves.",
  },
  {
    q: "How do you help reduce pay risk?",
    a: "Clear ranges + confidence indicators make outliers visible, and exports keep decisions consistent across HR, managers, and finance.",
  },
  {
    q: "Is this Gulf-specific?",
    a: "Yes—designed for GCC realities: city variance, currency, and profile dynamics like expat vs local where signal exists.",
  },
];

export default function HrTeamsSolutionPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm">
        <div className="grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-14">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="w-fit gap-2">
                <Users size={14} />
                For HR Teams
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Fair frameworks
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Faster approvals
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
                Build fair compensation frameworks teams can trust
              </h1>
              <p className="text-lg text-brand-700">
                Use Gulf-first benchmarks, confidence scoring, and clean exports to standardize bands, reduce pay risk, and keep
                decisions consistent across the org.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/contact">
                <Button>
                  Talk to us <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline">See pricing</Button>
              </Link>
              <Link href="/search" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                Try Benchmark Search
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Bands</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Level-aware ranges</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Confidence</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Explainable scoring</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Workflow</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Exports for approvals</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
            <SolutionsHrTeamsVisual />
          </div>
        </div>
      </section>

      {/* Pain -> value */}
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">If this sounds familiar</div>
          <h2 className="text-2xl font-semibold text-brand-900">Comp breaks down at the exact moment you need clarity</h2>
          <p className="text-sm text-brand-700/90">
            HR often ends up mediating between hiring managers who want speed and finance who needs defensible numbers. Qeemly gives
            you a consistent language—ranges + confidence—so the conversation moves forward.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Inconsistent offers",
              body: "Every team negotiates differently. Exceptions become policy.",
            },
            {
              title: "Approval whiplash",
              body: "Managers ask for “market rate” but finance asks “based on what?”",
            },
            {
              title: "Pay-risk exposure",
              body: "Without a range and confidence, outliers slip into the system.",
            },
          ].map((c) => (
            <Card key={c.title} className="p-6 transition-transform hover:-translate-y-0.5">
              <div className="text-sm font-semibold text-brand-900">{c.title}</div>
              <p className="mt-2 text-sm text-brand-700/90">{c.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Before/After */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Before → After</div>
            <h2 className="text-2xl font-semibold text-brand-900">From debate to a repeatable framework</h2>
          </div>
          <Link href="/contact" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
            Talk to us →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Before</div>
            <div className="mt-2 text-lg font-semibold text-brand-900">Exceptions and subjective decisions</div>
            <div className="mt-4 space-y-3 text-sm text-brand-800/90">
              {[
                "Band definitions drift team-to-team",
                "Approvals depend on who’s in the meeting",
                "No consistent rationale to share later",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-400" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-brand-50/40">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">After</div>
            <div className="mt-2 text-lg font-semibold text-brand-900">Consistent ranges with explainable confidence</div>
            <div className="mt-4 space-y-3 text-sm text-brand-800/90">
              {[
                "Level-aware percentiles by location",
                "Confidence signal to standardize decisions",
                "Exports to align HR, managers, and finance",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">How it works</div>
          <h2 className="text-2xl font-semibold text-brand-900">From exceptions to a consistent framework</h2>
          <p className="text-sm text-brand-700/90">
            Establish role/level bands, use confidence to standardize decisions, and export clean outputs for managers and finance.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">1) Benchmark roles</div>
                  <div className="text-sm text-brand-700/90">Percentiles aligned to GCC markets.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">2) Apply confidence</div>
                  <div className="text-sm text-brand-700/90">Act fast when signal is strong.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">3) Roll out bands</div>
                  <div className="text-sm text-brand-700/90">Share consistently with stakeholders.</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-brand-900">What HR teams get</div>
          <div className="mt-4 space-y-3 text-sm text-brand-800/90">
            {[
              "Level-aware salary bands by role and location",
              "Confidence scoring to reduce decision friction",
              "Parity checks and consistent exports",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Link href="/contact" className="flex-1">
              <Button fullWidth>Talk to us</Button>
            </Link>
            <Link href="/analytics" className="flex-1">
              <Button variant="outline" fullWidth>
                Explore dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Create pay bands",
            body: "Define role/level bands with percentiles and confidence so teams stop reinventing offers.",
            link: { href: "/analytics", label: "Explore dashboard →" },
          },
          {
            title: "Offer review",
            body: "Sanity-check offers with a defensible range and export-ready summary for quick approval.",
            link: { href: "/search", label: "Try Benchmark Search →" },
          },
          {
            title: "Parity checks",
            body: "Spot inconsistencies early and keep frameworks fair as hiring velocity increases.",
            link: { href: "/contact", label: "Talk to us →" },
          },
        ].map((u) => (
          <Card key={u.title} className="p-6 transition-transform hover:-translate-y-0.5">
            <div className="text-sm font-semibold text-brand-900">{u.title}</div>
            <p className="mt-2 text-sm text-brand-700/90">{u.body}</p>
            <Link href={u.link.href} className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-900">
              {u.link.label}
            </Link>
          </Card>
        ))}
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-brand-50/80 via-white to-white px-6 py-12 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Ready to standardize?</div>
            <h2 className="text-3xl font-semibold text-brand-900">Let’s build your compensation framework</h2>
            <p className="text-sm text-brand-700/90">
              Tell us your hiring roles and markets. We’ll show how Qeemly supports bands, confidence, and approvals.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/contact">
                <Button>
                  Talk to us <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline">See pricing</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-white p-6">
            <div className="text-sm font-semibold text-brand-900">Common outcomes</div>
            <div className="mt-4 space-y-2 text-sm text-brand-800/90">
              {["Fewer offer exceptions", "Clearer leveling decisions", "Faster finance approvals"].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">FAQ</div>
          <h2 className="text-2xl font-semibold text-brand-900">Quick answers</h2>
          <p className="text-sm text-brand-700/90">We’ll happily tailor a walkthrough to your comp framework.</p>
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
    </div>
  );
}


