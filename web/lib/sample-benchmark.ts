export type SampleBenchmark = {
  role: string;
  location: string;
  level: string;
  currency: string;
  /** Monthly amounts */
  p25: number;
  p50: number;
  p75: number;
  /** Simple “activity” placeholders */
  submissionsThisWeek: number;
  momDeltaP25: string;
  momDeltaP50: string;
  momDeltaP75: string;
  trendDelta: string;
};

// Marketing/demo-only values intended to look plausible for GCC tech hiring.
export const SAMPLE_BENCHMARK: SampleBenchmark = {
  role: "Backend Engineer",
  location: "Dubai, UAE",
  level: "IC3",
  currency: "AED",
  p25: 24_500,
  p50: 30_200,
  p75: 38_700,
  submissionsThisWeek: 18,
  momDeltaP25: "+1.4% MoM",
  momDeltaP50: "+2.1% MoM",
  momDeltaP75: "+2.8% MoM",
  trendDelta: "+1.9%",
} as const;

export function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

export function formatMoneyK(currency: string, amount: number) {
  const k = Math.round(amount / 100) / 10; // 30.2k
  const pretty = Number.isInteger(k) ? `${k.toFixed(0)}k` : `${k.toFixed(1)}k`;
  return `${currency} ${pretty}`;
}



