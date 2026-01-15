import Link from "next/link";
import { ArrowRight, CheckCircle2, Rocket, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SolutionsFoundersVisual } from "@/components/marketing/product-visuals";

const faqs = [
  {
    q: "How does this help us hire faster?",
    a: "Clear percentiles and confidence reduce debates. You can anchor offers quickly and share consistent outputs with stakeholders.",
  },
  {
    q: "Will this help us avoid overpaying?",
    a: "Yes. Use the range (P25/P50/P75) and market movement signals to choose an offer band that fits your runway and role urgency.",
  },
  {
    q: "Is this built for GCC markets?",
    a: "Yes—Gulf-first location and currency context, designed for the reality of hiring in GCC tech hubs.",
  },
];

export default function FoundersSolutionPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm">
        <div className="grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-14">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="w-fit gap-2">
                <Rocket size={14} />
                For Founders
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Hire confidently
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Protect runway
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
                Make confident offers without burning budget
              </h1>
              <p className="text-lg text-brand-700">
                Benchmark roles fast, understand market movement, and pick an offer band that helps you close candidates while
                protecting runway.
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
                Run a benchmark
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Speed</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Percentiles in minutes</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Clarity</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Confidence scoring</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Control</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Runway scenarios</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
            <SolutionsFoundersVisual />
          </div>
        </div>
      </section>

      {/* The moment founders feel it */}
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">The founder moment</div>
          <h2 className="text-2xl font-semibold text-brand-900">When speed matters, comp becomes a blocker</h2>
          <p className="text-sm text-brand-700/90">
            You need to move fast to close talent, but you can’t afford to set a precedent that breaks runway or fairness. Qeemly
            gives you ranges, confidence, and exports so you can decide quickly—and explain it later.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Negotiation whiplash", body: "Every offer feels like a new debate with a new anchor." },
            { title: "Overpay risk", body: "In a hot market, it’s easy to overshoot with no guardrails." },
            { title: "Approval latency", body: "Finance asks for rationale, and your offer timeline slips." },
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
            <h2 className="text-2xl font-semibold text-brand-900">From gut feel to a fast, defensible offer band</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
            Run a benchmark →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Before</div>
            <div className="mt-2 text-lg font-semibold text-brand-900">Slow decisions and expensive precedents</div>
            <div className="mt-4 space-y-3 text-sm text-brand-800/90">
              {["No consistent anchor", "Risk of overpaying", "Hard to explain internally"].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-400" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-brand-50/40">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">After</div>
            <div className="mt-2 text-lg font-semibold text-brand-900">A repeatable offer workflow</div>
            <div className="mt-4 space-y-3 text-sm text-brand-800/90">
              {["Percentiles for the role/market", "Confidence to move quickly", "Exports that reduce approval cycles"].map((t) => (
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
          <h2 className="text-2xl font-semibold text-brand-900">Offer decisions in a repeatable workflow</h2>
          <p className="text-sm text-brand-700/90">
            Benchmark, sanity-check with confidence, then align on an offer band and share exports with your team.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">1) Benchmark</div>
                  <div className="text-sm text-brand-700/90">P25/P50/P75 for your role + market.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">2) Validate</div>
                  <div className="text-sm text-brand-700/90">Confidence signal to move quickly.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">3) Align + export</div>
                  <div className="text-sm text-brand-700/90">Share outputs for quick approvals.</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-brand-900">Founder-friendly benefits</div>
          <div className="mt-4 space-y-3 text-sm text-brand-800/90">
            {[
              "Avoid overpaying with clear percentiles",
              "Spot market movement before it hits you",
              "Standardize decisions across hiring managers",
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

      {/* Founder use cases */}
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Close critical hires",
            body: "Anchor an offer fast with a defensible range and confidence.",
            link: { href: "/search", label: "Try Benchmark Search →" },
          },
          {
            title: "Align with finance",
            body: "Share consistent outputs so approvals don’t slip your timeline.",
            link: { href: "/analytics", label: "Explore dashboard →" },
          },
          {
            title: "Protect runway",
            body: "Model scenarios so hiring decisions match burn and plan.",
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
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Ready to hire?</div>
            <h2 className="text-3xl font-semibold text-brand-900">Let’s calibrate your next offers</h2>
            <p className="text-sm text-brand-700/90">
              We’ll walk through your roles and markets and show how Qeemly helps you move fast with confidence.
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
              {["Faster offer approvals", "Lower negotiation whiplash", "Better runway visibility"].map((t) => (
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
          <p className="text-sm text-brand-700/90">We’ll tailor a walkthrough to your hiring goals and runway.</p>
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


