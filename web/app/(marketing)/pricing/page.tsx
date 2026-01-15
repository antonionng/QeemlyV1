"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, FileDown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Billing = "monthly" | "annual";

type Tier = {
  key: "early" | "team" | "enterprise";
  name: string;
  description: string;
  highlight?: boolean;
  badge?: string;
  monthlyPrice?: string; // per seat
  annualPrice?: string; // per seat
  priceNote?: string;
  ctaLabel: string;
  ctaHref: string;
  bullets: string[];
};

const tiers: Tier[] = [
  {
    key: "early",
    name: "Early access",
    badge: "Founding",
    description: "For teams validating comp decisions in GCC markets with guided onboarding.",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    priceNote: "Includes onboarding + early access pricing lock",
    ctaLabel: "Talk to us",
    ctaHref: "/contact",
    bullets: [
      "Benchmark Search + Analytics Dashboard access",
      "Confidence scoring + freshness indicators",
      "Exports designed for HR + Finance approvals",
      "Seats for up to 5 users (expandable)",
    ],
  },
  {
    key: "team",
    name: "Team",
    highlight: true,
    badge: "Most popular",
    description: "For growing teams that need repeatable benchmarks and planning workflows.",
    monthlyPrice: "$49",
    annualPrice: "$39",
    priceNote: "Per seat / month • billed monthly or annually",
    ctaLabel: "Talk to us",
    ctaHref: "/contact",
    bullets: [
      "Unlimited benchmark searches",
      "Role/level/location filters + currency flexibility",
      "Exports + saved reports and workflows",
      "Priority support and implementation guidance",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    badge: "Security",
    description: "For larger orgs that need governance, custom workflows, and dedicated support.",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    priceNote: "Custom terms • SSO and governance options",
    ctaLabel: "Talk to us",
    ctaHref: "/contact",
    bullets: [
      "Custom seats and org structure support",
      "Advanced exports and governance",
      "Dedicated success and rollout planning",
      "Security and compliance options",
    ],
  },
];

const included = [
  {
    title: "Benchmark Search",
    icon: Sparkles,
    body: "Percentiles (P25/P50/P75) by role, level, and location with confidence.",
  },
  {
    title: "Analytics Dashboard",
    icon: BarChart3,
    body: "Trendlines, deltas, and market movement insights to stay ahead.",
  },
  {
    title: "Exports & reporting",
    icon: FileDown,
    body: "Offer-ready outputs for HR and finance approvals, consistent every time.",
  },
  {
    title: "Confidence scoring",
    icon: ShieldCheck,
    body: "Explainable signal quality: freshness, sample size, and consistency.",
  },
];

const comparison = [
  { group: "Core", rows: [
    { feature: "Benchmark Search", early: true, team: true, enterprise: true },
    { feature: "Analytics Dashboard (suite modules)", early: true, team: true, enterprise: true },
    { feature: "Confidence scoring", early: true, team: true, enterprise: true },
    { feature: "Exports (offer-ready)", early: true, team: true, enterprise: true },
  ]},
  { group: "Workflow", rows: [
    { feature: "Saved searches & reports", early: true, team: true, enterprise: true },
    { feature: "Priority support", early: true, team: true, enterprise: true },
    { feature: "Implementation guidance", early: true, team: true, enterprise: true },
  ]},
  { group: "Governance", rows: [
    { feature: "Team permissions & governance", early: false, team: false, enterprise: true },
    { feature: "SSO / advanced security options", early: false, team: false, enterprise: true },
    { feature: "Custom workflows", early: false, team: false, enterprise: true },
  ]},
];

const faqs = [
  {
    q: "Do you offer a free trial?",
    a: "Right now, we run guided early access so teams get the right setup and workflows. You can still explore the product pages and request a walkthrough.",
  },
  {
    q: "What does “per seat” mean?",
    a: "A seat is a user who needs access to dashboards, exports, and saved workflows. We’ll help you right-size seats across HR, founders, and finance.",
  },
  {
    q: "Do you support GCC currencies and city-level differences?",
    a: "Yes. Qeemly is Gulf-first, with currency flexibility and location-aware benchmarking designed for GCC hiring realities.",
  },
  {
    q: "How does confidence scoring work?",
    a: "Confidence reflects freshness, sample size, and consistency. Higher confidence supports faster approvals; lower confidence signals where to validate further.",
  },
  {
    q: "Can you help us roll this out across teams?",
    a: "Yes. Early access and enterprise plans include implementation guidance so benchmarks become a repeatable process—not another spreadsheet.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");

  const displayTiers = useMemo(() => {
    return tiers.map((t) => {
      const price = billing === "annual" ? t.annualPrice : t.monthlyPrice;
      return { ...t, displayPrice: price ?? "Custom" };
    });
  }, [billing]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-14">
      {/* Hero */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-12 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="w-fit gap-2">
                <Zap size={14} />
                Pricing
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Gulf-first
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Exports for approvals
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
                Plans built for compensation decisions that move fast
              </h1>
              <p className="text-lg text-brand-700">
                Choose a plan that matches your hiring velocity. Start with early access onboarding, then scale seats across HR,
                founders, and finance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/contact">
                <Button>
                  Talk to us <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline">Try Benchmark Search</Button>
              </Link>
              <Link href="/analytics" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                Explore Analytics Dashboard →
              </Link>
            </div>
          </div>

          {/* Billing toggle + microcopy */}
          <div className="rounded-3xl border border-border/70 bg-brand-50/40 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-brand-900">Billing</div>
                <div className="text-xs text-brand-700/80">Annual pricing reduces effective monthly cost.</div>
              </div>
              <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-border">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  className={clsx(
                    "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                    billing === "monthly" ? "bg-brand-500 text-white" : "text-brand-700 hover:bg-muted",
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("annual")}
                  className={clsx(
                    "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                    billing === "annual" ? "bg-brand-500 text-white" : "text-brand-700 hover:bg-muted",
                  )}
                >
                  Annual
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-white px-4 py-3 text-sm text-brand-700/90">
              Prefer a rollout plan? We’ll recommend seats and workflows for HR, founders, and finance.
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Plans</div>
            <h2 className="text-2xl font-semibold text-brand-900">Pick the plan that fits your team</h2>
          </div>
          <div className="text-sm text-brand-700/80">Prices shown in USD. GCC currencies supported in-product.</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {displayTiers.map((tier) => (
            <Card
              key={tier.key}
              className={clsx(
                "flex flex-col gap-5 p-6",
                tier.highlight && "ring-2 ring-brand-200 shadow-[0_18px_55px_rgba(15,23,42,0.10)]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-brand-900">{tier.name}</h3>
                    {tier.badge ? <Badge variant={tier.highlight ? "brand" : "ghost"}>{tier.badge}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-brand-700/80">{tier.description}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-brand-900">{tier.displayPrice}</div>
                  {tier.displayPrice !== "Custom" ? (
                    <div className="text-sm font-semibold text-brand-700/80">/ seat</div>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-brand-700/70">{tier.priceNote}</div>
              </div>

              <ul className="space-y-2 text-sm text-brand-800/90">
                {tier.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <Link href={tier.ctaHref} className="mt-auto">
                <Button fullWidth>{tier.ctaLabel}</Button>
              </Link>
              <div className="text-center text-xs text-brand-700/70">
                Questions? <Link href="/contact" className="font-semibold text-brand-700 hover:text-brand-900">We’ll reply fast</Link>.
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="rounded-3xl border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">What you get</div>
          <h2 className="text-2xl font-semibold text-brand-900">A complete compensation workflow</h2>
          <p className="text-sm text-brand-700/90">
            Benchmark, explain, export, and plan—built for GCC hiring realities.
          </p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {included.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="p-6 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-900">{item.title}</div>
                    <p className="mt-2 text-sm text-brand-700/90">{item.body}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Compare */}
      <section className="space-y-5">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Compare plans</div>
          <h2 className="text-2xl font-semibold text-brand-900">See what’s included</h2>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
          <div className="grid grid-cols-4 gap-0 border-b border-border bg-muted/40 px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-500">
            <div>Feature</div>
            <div>Early access</div>
            <div>Team</div>
            <div>Enterprise</div>
          </div>

          {comparison.map((group) => (
            <div key={group.group} className="border-b border-border last:border-b-0">
              <div className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-brand-500">{group.group}</div>
              <div className="divide-y divide-border">
                {group.rows.map((row) => (
                  <div key={row.feature} className="grid grid-cols-4 gap-0 px-6 py-4 text-sm">
                    <div className="font-semibold text-brand-900">{row.feature}</div>
                    {[row.early, row.team, row.enterprise].map((val, i) => (
                      <div key={i} className="text-brand-800/90">
                        {val ? <CheckCircle2 className="h-5 w-5 text-brand-600" /> : <span className="text-brand-400">—</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-4 text-sm text-brand-700/80">
          Need a specific rollout? Tell us your roles, markets, and stakeholders—HR, founders, finance—and we’ll propose a plan.
        </div>
      </section>

      {/* FAQ */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">FAQ</div>
          <h2 className="text-2xl font-semibold text-brand-900">Pricing questions, answered</h2>
          <p className="text-sm text-brand-700/90">
            If you want to move fast, we’ll guide you to the right plan in one call.
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

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-brand-50/80 via-white to-white px-6 py-12 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Ready to decide?</div>
            <h2 className="text-3xl font-semibold text-brand-900">Get a recommended plan in 15 minutes</h2>
            <p className="text-sm text-brand-700/90">
              Tell us your roles, markets, and stakeholders. We’ll recommend seats, workflows, and the plan that fits.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/contact">
                <Button>
                  Talk to us <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline">Try Benchmark Search</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-white p-6">
            <div className="text-sm font-semibold text-brand-900">What we’ll cover</div>
            <div className="mt-4 space-y-2 text-sm text-brand-800/90">
              {["Your GCC hiring markets", "Roles and leveling approach", "Approval workflow (HR + finance)", "Exports and reporting needs"].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

