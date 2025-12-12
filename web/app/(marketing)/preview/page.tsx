import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Logo } from "@/components/logo";
import { SAMPLE_BENCHMARK, formatMoney } from "@/lib/sample-benchmark";

type PreviewPageProps = {
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

function PreviewTeaser({
  role,
  location,
  level,
  currency,
}: {
  role: string;
  location: string;
  level: string;
  currency: string;
}) {
  const chips = [location, level, currency].filter(Boolean);
  const safeRole = role.trim() || "Backend Engineer";
  const demoCurrency = currency || SAMPLE_BENCHMARK.currency;

  return (
    <div className="relative">
      <div className="rounded-3xl border border-border/70 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-border/60">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="brand">Preview</Badge>
            <h1 className="mt-2 text-2xl font-semibold text-brand-900">Market snapshot</h1>
            <p className="text-sm text-brand-800/80">
              {safeRole} · {location}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="bg-white">
              Export
            </Button>
            <Button>
              New search <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Chip key={chip} active>
                {chip}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm font-semibold text-brand-800/80">Median (P50)</div>
          <div className="mt-3 text-2xl font-semibold text-brand-900">
            {formatMoney(demoCurrency, SAMPLE_BENCHMARK.p50)}
          </div>
          <div className="text-xs text-brand-700/80">{`High confidence · ${SAMPLE_BENCHMARK.momDeltaP50}`}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold text-brand-800/80">P25</div>
          <div className="mt-3 text-2xl font-semibold text-brand-900">
            {formatMoney(demoCurrency, SAMPLE_BENCHMARK.p25)}
          </div>
          <div className="text-xs text-brand-700/80">{`High confidence · ${SAMPLE_BENCHMARK.momDeltaP25}`}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold text-brand-800/80">P75</div>
          <div className="mt-3 text-2xl font-semibold text-brand-900">
            {formatMoney(demoCurrency, SAMPLE_BENCHMARK.p75)}
          </div>
          <div className="text-xs text-brand-700/80">{`High confidence · ${SAMPLE_BENCHMARK.momDeltaP75}`}</div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-brand-800/80">Percentiles</div>
              <div className="text-xl font-semibold text-brand-900">Trendline preview</div>
            </div>
            <Badge variant="ghost" className="border-border/80 bg-white/70">
              Sample output
            </Badge>
          </div>
          <div className="relative mt-4 aspect-[16/8] overflow-hidden rounded-2xl border border-border bg-muted">
            <Image src="/images/chart-percentiles.png" alt="Percentile chart" fill className="object-cover" />
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-brand-700/80">
            Full dashboard unlocks: level slices, expat vs local deltas, exports, and saved reports.
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold text-brand-800/80">Activity</div>
          <div className="mt-1 text-xl font-semibold text-brand-900">Confidence</div>
          <div className="mt-4 space-y-2 text-sm text-brand-800/90">
            <div className="flex items-center justify-between">
              <span>Freshness</span>
              <Badge variant="brand">High</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Coverage</span>
              <span className="font-semibold">UAE, KSA</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Submissions</span>
              <span className="font-semibold">{SAMPLE_BENCHMARK.submissionsThisWeek} this week</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const resolvedSearchParams = (await searchParams) as Record<string, string | string[] | undefined> | undefined;
  const role = firstParam(resolvedSearchParams, "role") ?? "";
  const location = firstParam(resolvedSearchParams, "location") ?? "Dubai, UAE";
  const level = firstParam(resolvedSearchParams, "level") ?? "IC3";
  const currency = firstParam(resolvedSearchParams, "currency") ?? "AED";

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ring-1 ring-border/60 backdrop-blur-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <Logo compact href="/home" />
          <Badge variant="ghost" className="border-border/80 bg-white/60">
            Public preview
          </Badge>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr] md:items-start">
          <div className="hidden md:block">
            <DashboardSidebar />
          </div>
          <div>
            <PreviewTeaser role={role} location={location} level={level} currency={currency} />
          </div>
        </div>
      </div>

      {/* Disable interactions + blur teaser */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl backdrop-blur-[8px]" />

      {/* Gate overlay */}
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-white/95 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.16)] ring-1 ring-border/70 backdrop-blur-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-border">
              <Lock className="h-5 w-5 text-brand-700" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Access required</p>
              <h2 className="text-2xl font-semibold text-brand-900">Unlock the full dashboard</h2>
              <p className="text-sm text-brand-700">
                Get role benchmarks, percentiles, and confidence scoring across GCC markets — plus exports for HR and Finance.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-muted p-4 text-sm text-brand-800/90">
            <div className="font-semibold text-brand-900">Your preview</div>
            <div className="mt-1">
              <span className="font-semibold">{role.trim() || "Backend Engineer"}</span> · {location} · {level} · {currency}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="sm:flex-1">
              <Button fullWidth>Request access</Button>
            </Link>
            <Link href="/login" className="sm:flex-1">
              <Button variant="outline" fullWidth>
                Log in
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-brand-700/70">
            No passwords: we’ll send a secure magic link to your work email.
          </p>
        </div>
      </div>
    </div>
  );
}


