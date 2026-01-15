import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, FileDown, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SolutionsFinanceVisual } from "@/components/marketing/product-visuals";

const faqs = [
  {
    q: "Can we forecast headcount and raises using benchmarks?",
    a: "Yes. Use percentiles as defensible inputs for scenarios, then export board-ready summaries for leadership review.",
  },
  {
    q: "How do exports help with approvals?",
    a: "Exports keep ranges and confidence consistent, so variance discussions focus on the decision—not the spreadsheet format.",
  },
  {
    q: "Is this Gulf-first (currency + city variance)?",
    a: "Yes—built for GCC markets with currency flexibility and location-aware views.",
  },
];

export default function FinanceSolutionPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-white shadow-sm">
        <div className="grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-14">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="w-fit gap-2">
                <BarChart3 size={14} />
                For Finance
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Forecast accurately
              </Badge>
              <Badge variant="ghost" className="border-border/80 bg-white/70">
                Board-ready exports
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
                Forecast salary budgets with clarity and confidence
              </h1>
              <p className="text-lg text-brand-700">
                Use Gulf-first benchmarks and confidence scoring to build scenarios, estimate impact, and export clean summaries for
                leadership and boards.
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
              <Link href="/analytics" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                Explore dashboard
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Planning</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Scenario modeling</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Inputs</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Defensible benchmarks</div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Outputs</div>
                <div className="mt-1 text-sm font-semibold text-brand-900">Exports for boards</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-border/70">
            <SolutionsFinanceVisual />
          </div>
        </div>
      </section>

      {/* Finance pain -> value */}
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-500">The finance moment</div>
          <h2 className="text-2xl font-semibold text-brand-900">Comp budgets fail when inputs aren’t defensible</h2>
          <p className="text-sm text-brand-700/90">
            When planning season hits, finance needs assumptions that leadership can trust. Qeemly gives you percentiles, confidence,
            and exports that turn comp planning into a repeatable process.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Surprise variance", body: "Offers drift from plan because there’s no consistent benchmark anchor." },
            { title: "Approval friction", body: "Leadership asks for rationale; spreadsheets don’t tell the story." },
            { title: "Planning blind spots", body: "Headcount and raise scenarios lack market context and confidence." },
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
            <h2 className="text-2xl font-semibold text-brand-900">From spreadsheet debates to a board-ready narrative</h2>
          </div>
          <Link href="/analytics" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
            Explore dashboard →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Before</div>
            <div className="mt-2 text-lg font-semibold text-brand-900">Assumptions without confidence</div>
            <div className="mt-4 space-y-3 text-sm text-brand-800/90">
              {["Inputs vary by team", "Rationale lives in someone’s head", "Approvals are slow and repetitive"].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-400" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-brand-50/40">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">After</div>
            <div className="mt-2 text-lg font-semibold text-brand-900">Defensible inputs + clean exports</div>
            <div className="mt-4 space-y-3 text-sm text-brand-800/90">
              {["Percentiles as benchmark inputs", "Confidence indicators for approvals", "Exports formatted for leadership"].map((t) => (
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
          <h2 className="text-2xl font-semibold text-brand-900">Benchmarks → scenarios → board pack</h2>
          <p className="text-sm text-brand-700/90">
            Set inputs from percentiles, validate signal with confidence, model scenarios, and export a clean summary for leadership.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">1) Benchmark inputs</div>
                  <div className="text-sm text-brand-700/90">Use percentiles by role/level/city.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">2) Validate signal</div>
                  <div className="text-sm text-brand-700/90">Confidence scoring for defensibility.</div>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <FileDown className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-brand-900">3) Export</div>
                  <div className="text-sm text-brand-700/90">Board-ready summaries and reports.</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-brand-900">Finance-friendly benefits</div>
          <div className="mt-4 space-y-3 text-sm text-brand-800/90">
            {[
              "Scenario planning with defensible benchmark inputs",
              "Confidence indicators for approvals and audits",
              "Exports formatted for leadership and boards",
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
            <Link href="/pricing" className="flex-1">
              <Button variant="outline" fullWidth>
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Finance use cases */}
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Headcount planning",
            body: "Model hiring impact with percentiles as inputs and scenario visibility.",
            link: { href: "/analytics", label: "Explore dashboard →" },
          },
          {
            title: "Raise cycles",
            body: "Use market movement signals to plan raises with fewer surprises.",
            link: { href: "/contact", label: "Talk to us →" },
          },
          {
            title: "Board packs",
            body: "Export a clean narrative: ranges, confidence, and impact summary.",
            link: { href: "/pricing", label: "See pricing →" },
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
            <div className="text-xs font-bold uppercase tracking-wider text-brand-500">Ready to forecast?</div>
            <h2 className="text-3xl font-semibold text-brand-900">Build a board-ready comp plan</h2>
            <p className="text-sm text-brand-700/90">
              Share your hiring plan and markets. We’ll show how Qeemly supports budgeting, exports, and approvals.
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
              {["Fewer budget surprises", "Faster leadership approvals", "Clear variance narrative"].map((t) => (
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
          <p className="text-sm text-brand-700/90">We’ll tailor the budgeting workflow to your planning cycle.</p>
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


