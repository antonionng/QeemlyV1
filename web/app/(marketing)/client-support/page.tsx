import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Qeemly Post-Launch Support",
  description: "Private client support options for Qeemly after MVP delivery.",
  robots: {
    index: false,
    follow: false,
  },
};

type Tier = {
  name: string;
  price: string;
  strapline: string;
  description: string;
  badge?: string;
  highlight?: boolean;
  includes: string[];
  benefits: string[];
  bestFor: string;
};

const tiers: Tier[] = [
  {
    name: "Platform Care",
    price: "£500 / month",
    strapline: "Stability and maintenance",
    description:
      "A light-touch support plan designed to keep Qeemly secure, supported, and running smoothly once the MVP is live.",
    includes: [
      "Bug fixing and issue resolution",
      "Platform monitoring and routine maintenance",
      "Security and dependency updates",
      "Minor configuration changes",
      "Basic email support",
      "Monthly platform health check",
    ],
    benefits: [
      "Keeps the platform stable and secure",
      "Reduces technical drift after launch",
      "Provides continuity without active development spend",
    ],
    bestFor: "Teams that need reliable maintenance with minimal change requirements.",
  },
  {
    name: "Platform Support",
    price: "£2,600 / month",
    strapline: "Controlled momentum",
    description:
      "A light development retainer for teams that want Qeemly to improve gradually while keeping commitments measured.",
    includes: [
      "Everything in Platform Care",
      "Priority bug fixing and faster support turnaround",
      "Minor feature enhancements",
      "Workflow improvements and UX refinements",
      "Smaller customer-driven updates",
      "Limited integration support",
      "Monthly improvement planning",
    ],
    benefits: [
      "Keeps product momentum moving after launch",
      "Allows practical updates as users provide feedback",
      "Reduces the need to re-scope every small improvement",
    ],
    bestFor: "Teams making occasional product improvements while the platform matures in-market.",
  },
  {
    name: "Growth Retainer",
    price: "£4,200 / month",
    strapline: "Active product evolution",
    description:
      "Designed for companies that want Qeemly to evolve as new customers, integrations, and data requirements emerge.",
    includes: [
      "Everything in Platform Support",
      "Continuous product improvements",
      "UX and workflow optimisation",
      "Benchmark and data quality improvements",
      "Integration discovery and data mapping",
      "Customer-driven feature support",
      "Monthly release planning and delivery",
      "Data ingestion and pipeline enhancements",
    ],
    benefits: [
      "Maintains strong product momentum",
      "Supports faster response to customer feedback",
      "Expands integrations and benchmark coverage as the business grows",
    ],
    bestFor: "Teams actively developing the platform and expanding functionality post-launch.",
  },
  {
    name: "Founding Partner Retainer",
    price: "£5,200 / month",
    strapline: "Retained product and engineering partnership",
    description:
      "A deeper partnership tier where we effectively operate as an extension of your team across product, engineering, data, customer experience, and client delivery needs.",
    badge: "Preferred early-growth rate",
    highlight: true,
    includes: [
      "Everything in Growth Retainer",
      "Priority access across product and engineering work",
      "Continuous feature development and platform evolution",
      "Anytime client support for your clients where required",
      "Onboarding your clients onto Qeemly",
      "Client integration planning and implementation",
      "Data pipeline expansion and ingestion support",
      "Benchmark coverage expansion and data modelling improvements",
      "Product architecture and roadmap guidance",
      "Release planning and coordination",
      "Strategic input on platform growth and client onboarding",
      "A whole engineering and customer experience team behind you",
    ],
    benefits: [
      "Creates reliable engineering capacity without internal hiring overhead",
      "Enables faster response to new client requirements",
      "Supports the real integration and data work needed to scale",
      "Gives your clients a higher-touch onboarding and support experience",
    ],
    bestFor: "Teams onboarding customers quickly or treating Qeemly as an actively growing product rather than a static delivered build.",
  },
];

const valueCards = [
  {
    title: "Keep momentum after MVP",
    body: "The strongest value comes from carrying the same delivery context into post-launch improvements, releases, and customer feedback loops.",
    icon: TrendingUp,
  },
  {
    title: "Support your client growth with confidence",
    body: "As client requirements expand, the retained tiers support the operational work behind onboarding, integration mapping, ingestion, and pipeline expansion in a way that feels structured and dependable.",
    icon: Sparkles,
  },
  {
    title: "Protect platform quality",
    body: "Benchmark quality, data trust, and platform stability all improve faster when support is structured as ongoing stewardship rather than reactive fixes.",
    icon: ShieldCheck,
  },
];

const summaryRows = [
  {
    tier: "Platform Care",
    positioning: "Platform stability and maintenance",
  },
  {
    tier: "Platform Support",
    positioning: "Light development support and gradual improvements",
  },
  {
    tier: "Growth Retainer",
    positioning: "Active product development and ongoing platform evolution",
  },
  {
    tier: "Founding Partner Retainer",
    positioning: "A retained product, engineering, and data partner supporting both the platform and your growth",
  },
];

export default function ClientSupportPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-brand-50/80 via-white to-white px-6 py-12 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="w-fit gap-2">
                <Zap size={14} />
                Private client proposal
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/80">
                Post-launch support
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/80">
                Outcome-led options
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
                Qeemly Post-Launch Support
              </h1>
              <p className="text-lg text-brand-700">
                MVP delivery is the starting point. The real upside comes from keeping Qeemly stable, improving it in
                response to live use, and expanding the benchmark, integration, and data capabilities that make the
                platform more valuable over time.
              </p>
              <p className="text-sm text-brand-700/85">
                These support options are structured to give you a clear path from essential maintenance through to a
                retained product and engineering partnership as the business scales.
              </p>
            </div>

            <div className="text-sm text-brand-700/80">
              Shared privately for client review. Not part of the public site navigation.
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Why retain support</div>
            <h2 className="mt-2 text-2xl font-semibold text-brand-900">More than maintenance</h2>
            <div className="mt-5 space-y-4">
              {valueCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-900">{item.title}</div>
                      <p className="mt-1 text-sm text-brand-700/90">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Support tiers</div>
            <h2 className="text-2xl font-semibold text-brand-900">Choose the level of support that matches your growth</h2>
          </div>
          <div className="text-sm text-brand-700/80">
            Structured from stability and maintenance through to a retained growth partnership.
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={[
                "flex h-full flex-col gap-5 p-6",
                tier.highlight ? "ring-2 ring-brand-200 shadow-[0_18px_55px_rgba(15,23,42,0.10)]" : "",
              ].join(" ")}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-brand-900">{tier.name}</h3>
                      {tier.badge ? <Badge variant="brand">{tier.badge}</Badge> : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-brand-500">{tier.strapline}</div>
                  </div>
                  {tier.highlight ? <Badge variant="brand">Most comprehensive option</Badge> : null}
                </div>
                <p className="text-sm text-brand-700/90">{tier.description}</p>
              </div>

              <div className={tier.highlight ? "rounded-2xl border border-brand-200 bg-brand-50/70 p-4" : "rounded-2xl border border-border/70 bg-white p-4"}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-3xl font-bold text-brand-900">{tier.price}</div>
                    {tier.highlight ? (
                      <div className="mt-2 text-sm font-semibold text-brand-700">
                        Early-growth partner rate
                      </div>
                    ) : null}
                  </div>
                  {tier.highlight ? (
                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-brand-100">
                      <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Standard partnership value</div>
                      <div className="mt-1 text-lg font-semibold text-brand-900">£6,500 / month</div>
                      <div className="text-xs text-brand-700/80">Preferred rate for Qeemly at this stage</div>
                    </div>
                  ) : null}
                </div>
                {tier.highlight ? (
                  <div className="mt-3 rounded-2xl border border-dashed border-brand-200 bg-white/80 px-4 py-3 text-sm text-brand-800">
                    This tier is positioned as a full retained partnership, not just support. It is designed for active
                    client onboarding, integration delivery, platform evolution, and hands-on coverage as Qeemly scales.
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-brand-900">Includes</div>
                <ul className="space-y-2 text-sm text-brand-800/90">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-brand-900">Benefits</div>
                <ul className="space-y-2 text-sm text-brand-800/90">
                  {tier.benefits.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto rounded-2xl border border-dashed border-border/80 bg-muted/30 p-4">
                <div className="text-sm font-semibold text-brand-900">Best for</div>
                <p className="mt-1 text-sm text-brand-700/90">{tier.bestFor}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-white px-6 py-10 shadow-sm sm:px-10 lg:px-14">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Positioning summary</div>
          <h2 className="text-2xl font-semibold text-brand-900">A clear upgrade path as Qeemly scales</h2>
          <p className="text-sm text-brand-700/90">
            The tiers are designed to make the difference in value obvious at a glance, from basic platform care
            through to a fully retained partnership.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
          <div className="grid grid-cols-[1.1fr_1.9fr] gap-0 border-b border-border bg-muted/40 px-6 py-4 text-xs font-bold uppercase tracking-wider text-brand-500">
            <div>Tier</div>
            <div>Primary positioning</div>
          </div>
          <div className="divide-y divide-border">
            {summaryRows.map((row) => (
              <div key={row.tier} className="grid grid-cols-[1.1fr_1.9fr] gap-0 px-6 py-4 text-sm">
                <div className="font-semibold text-brand-900">{row.tier}</div>
                <div className="text-brand-700/90">{row.positioning}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-brand-50/80 via-white to-white px-6 py-12 shadow-sm sm:px-10 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Recommended fit</div>
            <h2 className="text-3xl font-semibold text-brand-900">If growth is the goal, the retained tiers create the most leverage</h2>
            <p className="text-sm text-brand-700/90">
              If the requirement is simply to keep the platform maintained, Platform Care may be enough. If the goal is
              to respond to real customer demand, expand integrations, and continue evolving the product after MVP, the
              higher tiers create materially more value and preserve delivery momentum.
            </p>
            <p className="text-sm text-brand-700/90">
              The Founding Partner Retainer is typically the strongest fit where new clients, bespoke integrations, and
              data pipeline work are expected, because it keeps speed, context, and engineering capacity close to the
              business as those opportunities emerge.
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-white p-6">
            <div className="text-sm font-semibold text-brand-900">What the top tiers unlock</div>
            <div className="mt-4 space-y-2 text-sm text-brand-800/90">
              {[
                "Faster response to new client requirements",
                "Integration-specific pipeline and data work",
                "Continuous product refinement after MVP",
                "Higher confidence in platform quality and delivery continuity",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
