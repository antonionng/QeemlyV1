import { ArrowUpRight, BarChart2, Globe2, LineChart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { SAMPLE_BENCHMARK, formatMoney } from "@/lib/sample-benchmark";

const ranges = [
  { label: "Median", value: formatMoney(SAMPLE_BENCHMARK.currency, SAMPLE_BENCHMARK.p50), delta: SAMPLE_BENCHMARK.momDeltaP50 },
  { label: "P25", value: formatMoney(SAMPLE_BENCHMARK.currency, SAMPLE_BENCHMARK.p25), delta: SAMPLE_BENCHMARK.momDeltaP25 },
  { label: "P75", value: formatMoney(SAMPLE_BENCHMARK.currency, SAMPLE_BENCHMARK.p75), delta: SAMPLE_BENCHMARK.momDeltaP75 },
];

const filters = ["UAE", "Expat", "Mid-level", "Engineering"];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-white px-5 py-5 shadow-sm sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="brand">Live</Badge>
            <h1 className="mt-2 text-2xl font-semibold text-brand-900">Market snapshot</h1>
            <p className="text-sm text-brand-800/80">
              Live Gulf benchmarks with confidence scoring across roles, levels, and cities.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="bg-white">
              Export
            </Button>
            <Button>
              New search <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Chip key={filter} active>
              {filter}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ranges.map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-center justify-between text-sm font-semibold text-brand-800/80">
              {item.label}
              <LineChart className="h-4 w-4 text-brand-600" />
            </div>
            <div className="mt-3 text-2xl font-semibold text-brand-900">{item.value}</div>
            <div className="text-xs text-brand-700/80">{item.delta}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-brand-800/80">Expat vs Local</div>
              <div className="text-xl font-semibold text-brand-900">Salary comparison</div>
            </div>
            <Globe2 className="h-5 w-5 text-brand-700" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-brand-50 px-4 py-3">
              <div className="text-sm font-semibold text-brand-800">Expat</div>
              <div className="text-2xl font-semibold text-brand-900">{formatMoney(SAMPLE_BENCHMARK.currency, 33_400)}</div>
              <div className="text-xs text-brand-700/80">+4.1% YoY</div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-border">
              <div className="text-sm font-semibold text-brand-800">Local</div>
              <div className="text-2xl font-semibold text-brand-900">{formatMoney(SAMPLE_BENCHMARK.currency, 29_800)}</div>
              <div className="text-xs text-brand-700/80">+3.4% YoY</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-brand-700/80">
            Compare profiles (e.g., expat vs local) to spot pay risk before offers go out.
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-brand-800/80">Activity</div>
              <div className="text-xl font-semibold text-brand-900">Confidence</div>
            </div>
            <BarChart2 className="h-5 w-5 text-brand-700" />
          </div>
          <div className="mt-4 space-y-2 text-sm text-brand-800/90">
            <div className="flex items-center justify-between">
              <span>Data freshness</span>
              <Badge variant="brand">High</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Submissions</span>
              <span className="font-semibold">{SAMPLE_BENCHMARK.submissionsThisWeek} this week</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Coverage</span>
              <span className="font-semibold">UAE, KSA</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-brand-800/80">Search feed</div>
            <div className="text-xl font-semibold text-brand-900">Recent lookups</div>
          </div>
          <Users className="h-5 w-5 text-brand-700" />
        </div>
        <div className="mt-3 rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-brand-700/80">
          No recent searches yet.
        </div>
      </Card>
    </div>
  );
}

