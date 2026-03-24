import type { SalaryViewMode } from "@/components/ui/salary-view-toggle";
import type { PercentileData } from "@/lib/dashboard/dummy-data";

export type BenchmarkPayPeriod = "monthly" | "annual";

type BenchmarkPercentileLike = Partial<PercentileData>;

const ANNUAL_INFERENCE_THRESHOLD = 100_000;
const PAY_PERIODS: BenchmarkPayPeriod[] = ["monthly", "annual"];

export function isBenchmarkPayPeriod(value: unknown): value is BenchmarkPayPeriod {
  return typeof value === "string" && PAY_PERIODS.includes(value as BenchmarkPayPeriod);
}

export function inferBenchmarkPayPeriod(values: BenchmarkPercentileLike | number): BenchmarkPayPeriod {
  const anchorValue =
    typeof values === "number"
      ? values
      : Number(values.p50 ?? values.p75 ?? values.p25 ?? values.p90 ?? values.p10 ?? 0);

  return anchorValue >= ANNUAL_INFERENCE_THRESHOLD ? "annual" : "monthly";
}

export function resolveBenchmarkPayPeriod(
  explicitPayPeriod: unknown,
  values: BenchmarkPercentileLike | number,
): BenchmarkPayPeriod {
  return isBenchmarkPayPeriod(explicitPayPeriod)
    ? explicitPayPeriod
    : inferBenchmarkPayPeriod(values);
}

export function annualizeBenchmarkValue(
  value: number,
  payPeriod: BenchmarkPayPeriod,
): number {
  return payPeriod === "annual" ? value : value * 12;
}

export function applyBenchmarkViewMode(
  annualValue: number,
  salaryView: SalaryViewMode,
): number {
  return salaryView === "monthly" ? annualValue / 12 : annualValue;
}

export function normalizeBenchmarkPercentilesToAnnual(
  percentiles: PercentileData,
  explicitPayPeriod: unknown,
): {
  percentiles: PercentileData;
  payPeriod: "annual";
  sourcePayPeriod: BenchmarkPayPeriod;
} {
  const sourcePayPeriod = resolveBenchmarkPayPeriod(explicitPayPeriod, percentiles);

  return {
    percentiles: {
      p10: annualizeBenchmarkValue(percentiles.p10, sourcePayPeriod),
      p25: annualizeBenchmarkValue(percentiles.p25, sourcePayPeriod),
      p50: annualizeBenchmarkValue(percentiles.p50, sourcePayPeriod),
      p75: annualizeBenchmarkValue(percentiles.p75, sourcePayPeriod),
      p90: annualizeBenchmarkValue(percentiles.p90, sourcePayPeriod),
    },
    payPeriod: "annual",
    sourcePayPeriod,
  };
}
